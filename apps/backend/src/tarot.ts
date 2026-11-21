/**
 * Il mazzo di Elayra: i 22 Arcani Maggiori.
 * Le carte sono specchi su cui riflettere, non previsioni: così le presenta Elayra.
 */
import { randomInt } from 'node:crypto';

export interface TarotCard {
  id: number;
  it: string;
  en: string;
  /** Parole chiave per Elayra (dritta / capovolta). */
  upright: string;
  reversed: string;
}

export const MAJOR_ARCANA: TarotCard[] = [
  { id: 0, it: 'Il Matto', en: 'The Fool', upright: 'inizio, fiducia, salto nel vuoto, leggerezza', reversed: 'imprudenza, paura di cominciare, esitazione' },
  { id: 1, it: 'Il Mago', en: 'The Magician', upright: 'volontà, talento, avere già gli strumenti', reversed: 'dispersione, potenziale non usato, manipolazione' },
  { id: 2, it: 'La Papessa', en: 'The High Priestess', upright: 'intuizione, silenzio, sapere interiore', reversed: 'voce interiore ignorata, segreti, confusione' },
  { id: 3, it: "L'Imperatrice", en: 'The Empress', upright: 'abbondanza, cura, creatività, corpo', reversed: 'trascurarsi, blocco creativo, dipendenza' },
  { id: 4, it: "L'Imperatore", en: 'The Emperor', upright: 'struttura, confini, responsabilità', reversed: 'rigidità, controllo, mancanza di disciplina' },
  { id: 5, it: 'Il Papa', en: 'The Hierophant', upright: 'tradizione, insegnamento, appartenenza', reversed: 'ribellione, regole strette, cercare la propria via' },
  { id: 6, it: 'Gli Amanti', en: 'The Lovers', upright: 'scelta, unione, valori', reversed: 'disarmonia, scelta rimandata, valori in conflitto' },
  { id: 7, it: 'Il Carro', en: 'The Chariot', upright: 'direzione, determinazione, avanzare', reversed: 'forze opposte, perdere la rotta, impazienza' },
  { id: 8, it: 'La Forza', en: 'Strength', upright: 'coraggio gentile, pazienza, compassione', reversed: 'dubbio di sé, energia spenta, durezza' },
  { id: 9, it: "L'Eremita", en: 'The Hermit', upright: 'introspezione, solitudine scelta, guida interiore', reversed: 'isolamento, chiusura, ritiro eccessivo' },
  { id: 10, it: 'La Ruota della Fortuna', en: 'Wheel of Fortune', upright: 'cicli, cambiamento, ciò che gira', reversed: 'resistenza al cambiamento, sentirsi fermi' },
  { id: 11, it: 'La Giustizia', en: 'Justice', upright: 'verità, equilibrio, conseguenze', reversed: 'squilibrio, evitare la verità, ingiustizia' },
  { id: 12, it: "L'Appeso", en: 'The Hanged Man', upright: 'pausa, nuova prospettiva, lasciare andare', reversed: 'stallo, sacrificio inutile, resistenza' },
  { id: 13, it: 'La Morte', en: 'Death', upright: 'fine di un ciclo, trasformazione, spazio al nuovo', reversed: 'aggrapparsi, paura del cambiamento' },
  { id: 14, it: 'La Temperanza', en: 'Temperance', upright: 'misura, armonia, pazienza, integrare', reversed: 'eccesso, squilibrio, fretta' },
  { id: 15, it: 'Il Diavolo', en: 'The Devil', upright: 'attaccamenti, abitudini che legano, ombra', reversed: 'liberarsi, riconoscere il legame' },
  { id: 16, it: 'La Torre', en: 'The Tower', upright: 'crollo di ciò che non regge, rivelazione improvvisa', reversed: 'evitare il cambiamento, crollo rimandato' },
  { id: 17, it: 'La Stella', en: 'The Star', upright: 'speranza, guarigione, ispirazione', reversed: 'sfiducia, scoraggiamento, luce dimenticata' },
  { id: 18, it: 'La Luna', en: 'The Moon', upright: 'sogni, paure, intuizione, ciò che non è chiaro', reversed: 'nebbia che si dirada, paure che perdono forza' },
  { id: 19, it: 'Il Sole', en: 'The Sun', upright: 'gioia, vitalità, chiarezza', reversed: 'gioia offuscata, ottimismo eccessivo' },
  { id: 20, it: 'Il Giudizio', en: 'Judgement', upright: 'risveglio, chiamata, rinascita', reversed: 'autocritica, non ascoltare la chiamata' },
  { id: 21, it: 'Il Mondo', en: 'The World', upright: 'compimento, integrazione, viaggio concluso', reversed: 'qualcosa da chiudere, mancare l’ultimo passo' },
];

export const SPREAD_POSITIONS = ['past', 'present', 'path'] as const;
export type SpreadPosition = (typeof SPREAD_POSITIONS)[number];

export const POSITION_LABEL: Record<'it' | 'en', Record<SpreadPosition, string>> = {
  it: { past: 'Da dove vieni', present: 'Dove sei', path: 'Verso dove vai' },
  en: { past: 'Where you come from', present: 'Where you are', path: 'Where you are heading' },
};

export interface DrawnCard {
  id: number;
  reversed: boolean;
  position: SpreadPosition;
}

/** Tre carte diverse, mescolate con un generatore crittografico; una carta su quattro esce capovolta. */
export function drawSpread(rand: (max: number) => number = randomInt): DrawnCard[] {
  const pool = MAJOR_ARCANA.map((c) => c.id);
  return SPREAD_POSITIONS.map((position) => {
    const id = pool.splice(rand(pool.length), 1)[0];
    return { id, reversed: rand(4) === 0, position };
  });
}

/** Per l'app: aggiunge nomi nelle due lingue. Scarta ciò che non è una carta valida. */
export function describeCards(raw: unknown): (DrawnCard & { name: { it: string; en: string } })[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (c): c is DrawnCard =>
        !!c &&
        typeof c === 'object' &&
        Number.isInteger((c as DrawnCard).id) &&
        MAJOR_ARCANA[(c as DrawnCard).id] !== undefined &&
        SPREAD_POSITIONS.includes((c as DrawnCard).position)
    )
    .map((c) => ({ id: c.id, reversed: Boolean(c.reversed), position: c.position, name: { it: MAJOR_ARCANA[c.id].it, en: MAJOR_ARCANA[c.id].en } }));
}

/** Le carte come le legge Elayra nel prompt. */
export function cardsForPrompt(cards: DrawnCard[]): string {
  return cards
    .map((c) => {
      const card = MAJOR_ARCANA[c.id];
      const pos = POSITION_LABEL.it[c.position];
      return `- ${pos}: ${card.it}${c.reversed ? ' (capovolta)' : ''}. Temi: ${c.reversed ? card.reversed : card.upright}.`;
    })
    .join('\n');
}

/** "2026-11" → primo giorno del mese, se è un mese valido tra 12 mesi fa e il mese corrente. */
export function parseMonth(value: unknown, now = new Date()): string | null {
  if (typeof value !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) return null;
  const [y, m] = value.split('-').map(Number);
  const months = (now.getUTCFullYear() - y) * 12 + (now.getUTCMonth() + 1 - m);
  if (months < 0 || months > 12) return null;
  return `${value}-01`;
}

/** Il primo giorno del mese successivo, per filtrare le date. */
export function nextMonth(monthStart: string): string {
  const [y, m] = monthStart.split('-').map(Number);
  return m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, '0')}-01`;
}

/** Ultimi `count` mesi, dal corrente all'indietro, come "AAAA-MM". */
export function recentMonths(count: number, now = new Date()): string[] {
  const out: string[] = [];
  let y = now.getUTCFullYear();
  let m = now.getUTCMonth() + 1;
  for (let i = 0; i < count; i++) {
    out.push(`${y}-${String(m).padStart(2, '0')}`);
    m -= 1;
    if (m === 0) {
      m = 12;
      y -= 1;
    }
  }
  return out;
}
