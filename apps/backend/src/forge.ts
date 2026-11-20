/**
 * La Forgia: vocabolari chiusi usati per far incontrare le persone.
 * L'incontro si basa su aree in comune, tipo di progetto e stile comunicativo.
 */
export const FORGE_AREAS = [
  'scrittura', 'musica', 'arti visive', 'cinema e video', 'giochi', 'software e app',
  'intelligenza artificiale', 'educazione', 'benessere', 'spiritualità', 'natura e agricoltura',
  'animali', 'cibo', 'moda e artigianato', 'impresa sociale', 'comunità ed eventi',
  'ricerca scientifica', 'salute', 'viaggi', 'casa e architettura', 'podcast e media',
  'finanza', 'sport e movimento', 'altro',
] as const;

export const FORGE_PROJECT_TYPES = [
  'libro', 'app', 'impresa', 'ricerca', 'opera artistica', 'comunità', 'evento', 'prodotto fisico', 'contenuti', 'altro',
] as const;

export const FORGE_STYLES = ['diretto', 'riflessivo', 'entusiasta', 'analitico', 'pratico'] as const;

export interface ForgeDraft {
  topic: string;
  summary: string;
  areas: string[];
  project_type: string;
  style: string;
}

/** Ogni quanti messaggi dell'utente Elayra valuta se proporre la Forgia, e da quando. */
export const FORGE_CHECK_FROM = 8;
export const FORGE_CHECK_EVERY = 6;

export function shouldCheckForge(totalUserMessages: number): boolean {
  return totalUserMessages >= FORGE_CHECK_FROM && totalUserMessages % FORGE_CHECK_EVERY === 0;
}

export function sanitizeDraft(input: Record<string, unknown>): ForgeDraft | null {
  const topic = typeof input.topic === 'string' ? input.topic.trim().slice(0, 160) : '';
  const summary = typeof input.summary === 'string' ? input.summary.trim().slice(0, 1200) : '';
  const areas = Array.isArray(input.areas)
    ? [...new Set(input.areas.filter((a): a is string => (FORGE_AREAS as readonly string[]).includes(a as string)))].slice(0, 4)
    : [];
  if (!topic || !summary || areas.length === 0) return null;
  return {
    topic,
    summary,
    areas,
    project_type: (FORGE_PROJECT_TYPES as readonly string[]).includes(input.project_type as string)
      ? (input.project_type as string)
      : 'altro',
    style: (FORGE_STYLES as readonly string[]).includes(input.style as string) ? (input.style as string) : 'riflessivo',
  };
}

export const forgeInvitation = (topic: string) =>
  `Da quello che mi racconti, stai dando forma a qualcosa: ${topic}.\n\n` +
  'Esiste uno spazio, la Forgia, dove posso farti incontrare chi sta lavorando su cose vicine alle tue. ' +
  'Se ti va, trovi il mio invito nella pagina Forgia: lì vedi cosa mostrerei di te e decidi tu se e cosa condividere.';
