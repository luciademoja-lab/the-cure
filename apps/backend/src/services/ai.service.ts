import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config';
import { buildElayraSystemPrompt } from '../elayra.prompt';
import { HttpError } from './supabase';

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

function textOf(message: Anthropic.Message): string {
  return message.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('')
    .trim();
}

export const aiService = {
  /** Risposta di Elayra in streaming: onDelta riceve i pezzi di testo man mano. */
  async streamElayraReply(
    turns: ChatTurn[],
    opts: { nickname?: string | null; hasHistory?: boolean; onDelta: (text: string) => void; signal?: AbortSignal }
  ): Promise<string> {
    const messages = normalizeTurns(turns);
    if (messages.length === 0) throw new HttpError(400, 'Nessun messaggio da inviare');
    const stream = anthropic().messages.stream(
      {
        model: config.model,
        max_tokens: 600,
        system: buildElayraSystemPrompt({ nickname: opts.nickname, hasHistory: opts.hasHistory }),
        messages,
      },
      { signal: opts.signal }
    );
    stream.on('text', (delta) => opts.onDelta(delta));
    const final = await stream.finalMessage();
    return textOf(final);
  },

  /** Trasforma una conversazione in una pagina di diario strutturata. */
  async analyzeChatToEntry(
    turns: ChatTurn[]
  ): Promise<{ mood: number; energy: 'low' | 'moderate' | 'high'; sensation: string; contentSummary: string }> {
    const transcript = turns
      .map((t) => `${t.role === 'user' ? 'UTENTE' : 'ELAYRA'}: ${t.content}`)
      .join('\n')
      .slice(-24000);
    const message = await anthropic().messages.create({
      model: config.model,
      max_tokens: 800,
      system:
        "Estrai una pagina di diario da una conversazione. Basati solo su ciò che l'utente ha scritto, senza interpretare né aggiungere. Scrivi in italiano.",
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
    });
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
};
