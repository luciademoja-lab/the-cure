import { currentLocale } from '../locale';
import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config';
import { buildElayraSystemPrompt } from '../elayra.prompt';
import { stripMarks } from '../discovery';
import { HttpError } from './supabase';
import { FORGE_AREAS, FORGE_PROJECT_TYPES, FORGE_STYLES, ForgeDraft, sanitizeDraft } from '../forge';

export type ChatTurn = { role: 'user' | 'assistant'; content: string };

let client: Anthropic | null = null;
function anthropic(): Anthropic {
  if (!config.anthropicApiKey) {
    throw new HttpError(503, 'Elayra non è ancora collegata: manca ANTHROPIC_API_KEY sul server');
  }
  if (!client) client = new Anthropic({ apiKey: config.anthropicApiKey });
  return client;
}

/**
 * L'API di Claude vuole che la conversazione inizi con l'utente e alterni i ruoli.
 * Qui si puliscono i turni: via i vuoti, via gli assistant iniziali, unione dei doppioni.
 */
export function normalizeTurns(turns: ChatTurn[]): ChatTurn[] {
  const out: ChatTurn[] = [];
  for (const t of turns) {
    const content = (t.content || '').trim().slice(0, config.maxMessageChars);
    if (!content) continue;
    if (t.role !== 'user' && t.role !== 'assistant') continue;
    if (out.length === 0 && t.role === 'assistant') continue;
    const last = out[out.length - 1];
    if (last && last.role === t.role) last.content += `\n\n${content}`;
    else out.push({ role: t.role, content });
  }
  while (out.length && out[out.length - 1].role === 'assistant') out.pop();
  return out;
}

/** Segna l'ultimo messaggio come punto di cache: al turno successivo tutto ciò che precede costa molto meno. */
function withCacheBreakpoint(turns: ChatTurn[]): Anthropic.MessageParam[] {
  return turns.map((t, i) =>
    i === turns.length - 1
      ? { role: t.role, content: [{ type: 'text' as const, text: t.content, cache_control: { type: 'ephemeral' as const } }] }
      : { role: t.role, content: t.content }
  );
}

/**
 * I modelli 5.5 pensano prima di scrivere, e il pensiero consuma max_tokens: con limiti bassi
 * la risposta arrivava vuota o tagliata (stop_reason "max_tokens"). Qui si spegne il pensiero iniziale:
 * Haiku 5.5 accetta "disabled", Sonnet 5.5 vuole "between_tools" (stesso effetto senza strumenti).
 */
export function thinkingFor(model: string): Record<string, unknown> {
  if (model.startsWith('claude-haiku-5')) return { thinking: { type: 'disabled' } };
  if (model.startsWith('claude-sonnet-5-5')) return { thinking: { type: 'between_tools' } };
  return {};
}

function tuned<T extends { model: string }>(params: T): T {
  return { ...params, ...thinkingFor(params.model) } as T;
}

/** Una risposta è utilizzabile se ha testo e non è stata interrotta (filtro di sicurezza o limite di lunghezza). */
export function isComplete(text: string, stopReason: string | null | undefined): boolean {
  return text.length > 0 && stopReason !== 'refusal' && stopReason !== 'max_tokens';
}

/**
 * Streaming con un secondo tentativo. A volte il modello si ferma a metà (stop_reason "refusal")
 * o non scrive niente: in quel caso si avvisa il client con onReset, si riprova una volta con l'altro modello
 * e, se va male di nuovo, si lancia un errore invece di restituire testo vuoto o tronco.
 */
async function streamComplete(
  params: Anthropic.MessageCreateParamsNonStreaming,
  opts: { onDelta: (text: string) => void; onReset?: () => void; signal?: AbortSignal }
): Promise<string> {
  const first = params.model;
  const second = first === config.model ? config.lightModel : config.model;
  for (const model of [first, second]) {
    const stream = anthropic().messages.stream(tuned({ ...params, model }), { signal: opts.signal });
    stream.on('text', (delta) => opts.onDelta(delta));
    const final = await stream.finalMessage();
    const text = textOf(final);
    if (isComplete(text, final.stop_reason)) return text;
    console.warn('Incomplete reply', { model, stop_reason: final.stop_reason, chars: text.length });
    if (model === first) opts.onReset?.();
  }
  throw new HttpError(503, 'Elayra ha perso il filo a metà frase. Riprova tra un momento.');
}

function textOf(message: Anthropic.Message): string {
  return message.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('')
    .trim();
}

/**
 * Ciò che Elayra sa della piattaforma quando lavora nelle stanze della Forgia:
 * dove si trova, cosa possono fare le persone e chi è Secretary Liria.
 */
export const FORGE_CONTEXT = [
  'DOVE SEI',
  'Sei dentro Elayra (elayra.app), una piattaforma di crescita personale: le persone scrivono un diario conversando con te, ' +
    'fanno due rituali al giorno (Daily Light), avanzano in un Percorso di sette livelli con i punti luce, vedono i temi che ritornano ' +
    '(Sincronicità) e un cielo di costellazioni create con gli inviti (Collettivo). La Forgia è lo spazio dove persone con progetti affini ' +
    'si incontrano: se entrambe dicono sì si apre questa stanza privata, con un archivio di documenti condiviso.',
  '',
  'SECRETARY LIRIA',
  'Secretary Liria (secretaryliria.com) è la softwarehouse partner della Forgia: costruisce, pubblica e aggiorna siti e piccole app ' +
    'a partire da richieste scritte, e lavora con un abbonamento mensile. Riceve le richieste per email (Liria@SecretaryLiria.com), ' +
    'su Telegram o dalla sua app. Dal piano Part time le persone della Forgia hanno il 5% di sconto sul suo abbonamento.',
  'Come si lavora con lei: nella sezione Liria di questa stanza c\'è il pulsante "Chiedi a Elayra di preparare il brief". ' +
    'Tu prepari un brief ordinato (progetto, obiettivo, per chi, cosa costruire, contenuti pronti, stile, domande aperte) usando solo ' +
    'ciò che è stato deciso nella stanza; la persona lo legge, lo corregge e solo dopo la sua conferma il brief resta nella stanza e parte per email a Liria. ' +
    'Non invii mai nulla da sola.',
  'Se ti chiedono di Liria o di un brief, rispondi con queste informazioni senza dire che non la conosci, e ricorda il pulsante nella sezione Liria.',
].join('\n');

/** Lingua in cui scrivere, presa dalla richiesta in corso. */
const lang = () => (currentLocale() === 'en' ? 'in inglese' : 'in italiano');

export const aiService = {
  /** Risposta di Elayra in streaming: onDelta riceve i pezzi di testo man mano. */
  async streamElayraReply(
    turns: ChatTurn[],
    opts: {
      nickname?: string | null;
      hasHistory?: boolean;
      personalNotes?: string | null;
      discovery?: string;
      onDelta: (text: string) => void;
      onReset?: () => void;
      signal?: AbortSignal;
      model?: string;
    }
  ): Promise<string> {
    const messages = normalizeTurns(turns);
    if (messages.length === 0) throw new HttpError(400, 'Nessun messaggio da inviare');
    return streamComplete(
      {
        model: opts.model || config.model,
        max_tokens: 1600,
        // La cache dei prompt fa pagare un decimo (o meno) le parti già lette: istruzioni e conversazione precedente.
        system: [
          {
            type: 'text',
            text: buildElayraSystemPrompt({
              nickname: opts.nickname,
              hasHistory: opts.hasHistory,
              personalNotes: opts.personalNotes,
              discovery: opts.discovery,
            }),
            cache_control: { type: 'ephemeral' },
          },
        ],
        messages: withCacheBreakpoint(messages),
      },
      opts
    );
  },

  /** Trasforma una conversazione in una pagina di diario strutturata. */
  async analyzeChatToEntry(
    turns: ChatTurn[]
  ): Promise<{ mood: number; energy: 'low' | 'moderate' | 'high'; sensation: string; contentSummary: string }> {
    const transcript = turns
      .map((t) => `${t.role === 'user' ? 'UTENTE' : 'ELAYRA'}: ${stripMarks(t.content)}`)
      .join('\n')
      .slice(-24000);
    const message = await anthropic().messages.create(tuned({
      model: config.lightModel,
      max_tokens: 2000,
      system:
        `Estrai una pagina di diario da una conversazione. Basati solo su ciò che l'utente ha scritto, senza interpretare né aggiungere. Scrivi ${lang()}.`,
      tools: [
        {
          name: 'salva_pagina',
          description: 'Salva la pagina di diario ricavata dalla conversazione.',
          input_schema: {
            type: 'object',
            properties: {
              mood: { type: 'integer', minimum: 1, maximum: 10, description: "Umore dell'utente da 1 (molto basso) a 10 (ottimo)" },
              energy: { type: 'string', enum: ['low', 'moderate', 'high'] },
              sensation: { type: 'string', description: 'Sensazione fisica o focus corporeo, massimo 5 parole' },
              contentSummary: { type: 'string', description: "Un paragrafo in prima persona con le parole dell'utente (es. \"Oggi mi sento...\")" },
            },
            required: ['mood', 'energy', 'sensation', 'contentSummary'],
          },
        },
      ],
      tool_choice: { type: 'tool', name: 'salva_pagina' },
      messages: [{ role: 'user', content: `Conversazione:\n\n${transcript}` }],
    }));
    const block = message.content.find((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use');
    const input = (block?.input || {}) as Record<string, unknown>;
    const mood = typeof input.mood === 'number' ? Math.min(10, Math.max(1, Math.round(input.mood))) : 5;
    const energy = ['low', 'moderate', 'high'].includes(input.energy as string)
      ? (input.energy as 'low' | 'moderate' | 'high')
      : 'moderate';
    const fallback = turns.filter((t) => t.role === 'user').map((t) => t.content).join('\n\n');
    return {
      mood,
      energy,
      sensation: typeof input.sensation === 'string' && input.sensation.trim() ? input.sensation.trim().slice(0, 80) : '',
      contentSummary:
        typeof input.contentSummary === 'string' && input.contentSummary.trim() ? input.contentSummary.trim() : fallback,
    };
  },
  /**
   * Valuta se nella conversazione c'è un progetto o un'idea creativa che la persona sta sviluppando.
   * Restituisce una bozza di profilo per la Forgia, oppure null se non c'è (ancora) niente del genere.
   */
  async assessForge(turns: ChatTurn[]): Promise<ForgeDraft | null> {
    const transcript = turns
      .filter((t) => t.role === 'user')
      .map((t) => `UTENTE: ${t.content}`)
      .join('\n')
      .slice(-16000);
    if (!transcript.trim()) return null;
    const message = await anthropic().messages.create(tuned({
      model: config.lightModel,
      max_tokens: 2000,
      system:
        "Leggi i messaggi di una persona e stabilisci se sta sviluppando un progetto o un'idea creativa concreta (qualcosa che vuole costruire, scrivere, avviare). " +
        `Non basta un desiderio vago o uno sfogo. Se il progetto c'è, descrivilo ${lang()} usando solo ciò che la persona ha detto del progetto. ` +
        'Nel riassunto non mettere MAI dettagli intimi: niente salute, famiglia, relazioni, soldi, stati d\'animo, luoghi o nomi di persone.',
      tools: [
        {
          name: 'valuta_forgia',
          description: 'Registra la valutazione.',
          input_schema: {
            type: 'object',
            properties: {
              has_project: { type: 'boolean', description: 'true solo se c\'è un progetto o un\'idea creativa concreta' },
              topic: { type: 'string', description: 'Il progetto in poche parole, massimo 12' },
              summary: { type: 'string', description: 'Due o tre frasi sul progetto, in terza persona neutra, senza dettagli personali' },
              areas: { type: 'array', items: { type: 'string', enum: [...FORGE_AREAS] }, minItems: 1, maxItems: 3 },
              project_type: { type: 'string', enum: [...FORGE_PROJECT_TYPES] },
              style: { type: 'string', enum: [...FORGE_STYLES], description: 'Come comunica la persona' },
            },
            required: ['has_project'],
          },
        },
      ],
      tool_choice: { type: 'tool', name: 'valuta_forgia' },
      messages: [{ role: 'user', content: transcript }],
    }));
    const block = message.content.find((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use');
    const input = (block?.input || {}) as Record<string, unknown>;
    if (input.has_project !== true) return null;
    return sanitizeDraft(input);
  },
  /**
   * Elayra dentro una stanza della Forgia: aiuta due persone a organizzare il progetto comune.
   * Riceve gli ultimi messaggi della stanza e la richiesta di chi l'ha chiamata.
   */
  async forgeRoomAssist(opts: {
    topic: string;
    transcript: { from: string; content: string }[];
    request: string;
    caller: string;
  }): Promise<string> {
    const lines = opts.transcript
      .map((m) => `${m.from}: ${m.content}`)
      .join('\n')
      .slice(-20000);
    const message = await anthropic().messages.create(tuned({
      model: config.model,
      max_tokens: 2400,
      system: [
        {
          type: 'text',
          text:
            'Sei Elayra, dentro uno spazio di lavoro condiviso da due persone che stanno costruendo un progetto insieme. ' +
            'Qui non fai da presenza emotiva: aiuti in modo pratico a organizzare il lavoro, tenere traccia di decisioni e compiti, ' +
            'riassumere, raccogliere e ordinare informazioni, proporre i prossimi passi. ' +
            `Rispondi ${lang()}, in modo chiaro e breve. Puoi usare elenchi semplici con il trattino. ` +
            'Usa solo ciò che è scritto nella stanza: non inventare fatti, numeri o fonti; se manca un dato, dillo. ' +
            'Non hai accesso a internet né ai file caricati nell\'archivio.\n\n' +
            FORGE_CONTEXT,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [
        {
          role: 'user',
          content:
            `Progetto in comune: ${opts.topic}\n\nUltimi messaggi della stanza:\n${lines || '(ancora nessun messaggio)'}\n\n` +
            `${opts.caller} ti chiede: ${opts.request}`,
        },
      ],
    }));
    return textOf(message);
  },

  /**
   * Il brief per Secretary Liria: Elayra mette in ordine ciò che le due persone hanno deciso nella stanza,
   * così Liria può costruire e pubblicare il sito o l'app. Solo fatti presenti nella stanza.
   */
  async liriaBrief(opts: { topic: string; transcript: { from: string; content: string }[]; notes: string }): Promise<string> {
    const lines = opts.transcript
      .map((m) => `${m.from}: ${m.content}`)
      .join('\n')
      .slice(-24000);
    const message = await anthropic().messages.create(tuned({
      model: config.model,
      max_tokens: 3000,
      system: [
        {
          type: 'text',
          text:
            "Sei Elayra. Prepari un brief per Secretary Liria, che costruisce, pubblica e aggiorna siti e piccole app a partire da richieste scritte. " +
            `Scrivi ${lang()}, in testo semplice, con queste sezioni nell'ordine, ognuna con un titolo in maiuscolo seguito da due punti: ` +
            'PROGETTO, OBIETTIVO, PER CHI, COSA COSTRUIRE (pagine e funzioni, con il trattino), CONTENUTI GIÀ PRONTI, STILE E TONO, DOMANDE APERTE. ' +
            'Usa solo ciò che è scritto nella stanza e nelle note: non inventare nomi, prezzi, dati o contenuti. ' +
            'Se un\'informazione manca, scrivilo in DOMANDE APERTE. Niente saluti, niente firma: solo il brief.',
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [
        {
          role: 'user',
          content:
            `Progetto in comune: ${opts.topic}\n\nMessaggi della stanza:\n${lines || '(ancora nessun messaggio)'}\n\n` +
            `Note aggiunte da chi chiede il brief: ${opts.notes || '(nessuna)'}`,
        },
      ],
    }));
    return textOf(message);
  },
  /**
   * Lettura dei tarocchi in streaming: Elayra fa da narratrice delle tre carte,
   * le collega a ciò che la persona ha scritto nelle pratiche di oggi.
   */
  async streamTarotReading(opts: {
    cards: string;
    nickname?: string | null;
    morning?: string;
    evening?: string;
    onDelta: (text: string) => void;
    onReset?: () => void;
    signal?: AbortSignal;
    model?: string;
  }): Promise<string> {
    return streamComplete(
      {
        model: opts.model || config.model,
        max_tokens: 2400,
        system: [
          {
            type: 'text',
            text:
              'Sei Elayra e stai facendo da narratrice a una lettura dei tarocchi, un dono per chi oggi ha completato le due pratiche della Luce del giorno. ' +
              'Le carte sono specchi e immagini su cui riflettere, non previsioni: non annunciare eventi futuri e non dire mai che qualcosa accadrà di sicuro. ' +
              'Non parlare di salute, malattie, morte di persone, gravidanze, soldi, investimenti o decisioni legali: se una carta sembra toccarli, resta sul piano interiore. ' +
              'La Morte e la Torre parlano di trasformazione, mai di pericolo. ' +
              `Scrivi ${lang()}, in testo semplice, senza markdown, con frasi brevi e un tono caldo, misterioso ma chiaro. ` +
              'Struttura: una frase di apertura che accoglie la persona; poi un paragrafo per ogni carta, che inizia con il nome della carta e la sua posizione seguiti da due punti; ' +
              'collega ogni carta, quando ha senso, a parole che la persona ha scritto oggi, senza citarle per intero; ' +
              "chiudi con una sola domanda da portare con sé fino a domani. In tutto tra 180 e 260 parole. Non firmarti.",
            cache_control: { type: 'ephemeral' },
          },
        ],
        messages: [
          {
            role: 'user',
            content:
              `${opts.nickname ? `Nome: ${opts.nickname}\n` : ''}` +
              `Le carte uscite:\n${opts.cards}\n\n` +
              `Pratica del mattino, parole della persona: ${(opts.morning || '(niente)').slice(0, 1500)}\n` +
              `Pratica della sera, parole della persona: ${(opts.evening || '(niente)').slice(0, 1500)}`,
          },
        ],
      },
      opts
    );
  },

  /**
   * Il report mensile: Elayra rilegge diario, pratiche e letture del mese e racconta l'andamento,
   * confrontando con onestà ciò che dicevano le carte con ciò che la persona ha vissuto.
   */
  async streamMonthlyReport(opts: {
    monthLabel: string;
    /** 'first30': i primi trenta giorni di uso, anche sparsi su più mesi. */
    period?: 'month' | 'first30';
    nickname?: string | null;
    entries: string;
    rituals: string;
    readings: string;
    onDelta: (text: string) => void;
    onReset?: () => void;
    signal?: AbortSignal;
  }): Promise<string> {
    return streamComplete(
      {
        model: config.model,
        max_tokens: 6000,
        system: [
          {
            type: 'text',
            text:
              (opts.period === 'first30'
                ? 'Sei Elayra. Scrivi il report dei primi trenta giorni in cui una persona ha usato la tua app (anche se sparsi su più mesi): lo rilegge lei, per vedere il cammino fatto finora. ' +
                  'Alla fine, in una frase, dille che se vuole un report per ogni mese le basta tornare quasi ogni giorno. '
                : 'Sei Elayra. Scrivi il report mensile di una persona che usa la tua app: lo rilegge lei, per vedere il cammino del mese. ') +
              'Usa solo ciò che c’è nei dati: pagine di diario (con umore da 1 a 10 ed energia), pratiche del mattino e della sera, letture dei tarocchi. ' +
              'Non inventare eventi, persone o numeri. Se i dati sono pochi, dillo con semplicità e scrivi un report più breve. ' +
              'Non fare diagnosi e non usare linguaggio clinico. ' +
              'Sulle carte sii onesta: non sono previsioni. Racconta dove le immagini delle letture hanno trovato un’eco in ciò che la persona ha scritto e dove no, ' +
              'senza sostenere che le carte avessero previsto qualcosa. ' +
              `Scrivi ${lang()}, in testo semplice, con queste sezioni nell'ordine, ognuna con il titolo in maiuscolo su una riga da sola: ` +
              (opts.period === 'first30' ? 'I PRIMI TRENTA GIORNI IN BREVE' : 'IL MESE IN BREVE') +
              ', COME TI SEI SENTITA O SENTITO (andamento di umore ed energia, con i numeri che ci sono), CIÒ CHE RITORNA (temi e parole ricorrenti), ' +
              'LE CARTE E IL CAMMINO (il confronto), CIÒ CHE È CRESCIUTO, ' +
              (opts.period === 'first30' ? 'UN PASSO PER I GIORNI CHE VENGONO' : 'UN PASSO PER IL MESE CHE VIENE') +
              ' (uno solo, concreto e gentile). ' +
              'Rivolgiti alla persona con il tu. Tono caldo e chiaro, frasi brevi. Non firmarti.',
            cache_control: { type: 'ephemeral' },
          },
        ],
        messages: [
          {
            role: 'user',
            content:
              `${opts.period === 'first30' ? 'Periodo' : 'Mese'}: ${opts.monthLabel}\n${opts.nickname ? `Nome: ${opts.nickname}\n` : ''}\n` +
              `PAGINE DI DIARIO:\n${opts.entries || '(nessuna)'}\n\n` +
              `PRATICHE DELLA LUCE DEL GIORNO:\n${opts.rituals || '(nessuna)'}\n\n` +
              `LETTURE DEI TAROCCHI:\n${opts.readings || '(nessuna)'}`,
          },
        ],
      },
      opts
    );
  },
};
