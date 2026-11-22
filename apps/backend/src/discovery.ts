/**
 * La scoperta dell'app. All'inizio nel menu c'è solo il diario: Elayra presenta le altre pagine
 * una alla volta, e ognuna entra nel menu quando la persona la visita.
 */

export const PAGE_KEYS = ['journal', 'daily-light', 'path', 'tarot', 'synchronicities', 'forge', 'collective', 'plans'] as const;
export type PageKey = (typeof PAGE_KEYS)[number];

export const isPageKey = (v: unknown): v is PageKey => typeof v === 'string' && (PAGE_KEYS as readonly string[]).includes(v);

/** Pagine di diario necessarie perché la Sincronicità abbia qualcosa da mostrare. */
export const SYNC_MIN_ENTRIES = 3;
/** Giorni di uso (anche non di fila) per il primo report. */
export const FIRST_REPORT_DAYS = 30;
/** Giorni di uso in un mese perché quel mese abbia il suo report. */
export const MONTH_REPORT_DAYS = 25;

export type DiscoveryFacts = {
  discovered: PageKey[];
  journalEntries: number;
  hasTarotReading: boolean;
  activeDays: number;
};

/** Le pagine visibili nel menu: quelle visitate, più i Tarocchi appena arriva la prima lettura. */
export function visiblePages(facts: Pick<DiscoveryFacts, 'discovered' | 'hasTarotReading'>): PageKey[] {
  const set = new Set<PageKey>(['journal', ...facts.discovered]);
  if (facts.hasTarotReading) set.add('tarot');
  return PAGE_KEYS.filter((k) => set.has(k));
}

/** Ordina e ripulisce un elenco salvato nel database. */
export function cleanDiscovered(value: unknown): PageKey[] {
  const list = Array.isArray(value) ? value.filter(isPageKey) : [];
  return PAGE_KEYS.filter((k) => k === 'journal' || list.includes(k));
}

const LABEL: Record<PageKey, string> = {
  journal: 'Journal (questa conversazione)',
  'daily-light': 'Daily Light',
  path: 'Il Percorso',
  tarot: 'Tarocchi',
  synchronicities: 'Sincronicità',
  forge: 'La Forgia',
  collective: 'Collettivo',
  plans: 'Piani',
};

/**
 * Ciò che Elayra sa di dove si trova la persona nella scoperta dell'app.
 * Lo legge solo lei: decide se e quando proporre una pagina, una alla volta.
 */
export function discoveryContext(facts: DiscoveryFacts): string {
  const visible = visiblePages(facts);
  const hidden = PAGE_KEYS.filter((k) => !visible.includes(k));
  const lines: string[] = [];
  lines.push(`Pagine che la persona ha già scoperto: ${visible.map((k) => LABEL[k]).join(', ')}.`);
  if (hidden.length === 0) {
    lines.push('Ha già scoperto tutte le pagine: non serve proporne altre, a meno che non te lo chieda.');
  } else {
    lines.push(`Pagine che non ha ancora scoperto: ${hidden.map((k) => `${LABEL[k]} [${k}]`).join(', ')}.`);
  }
  lines.push(`Pagine di diario salvate: ${facts.journalEntries}. Giorni in cui ha usato l'app: ${facts.activeDays}.`);

  const ready: string[] = [];
  if (!visible.includes('daily-light')) ready.push('daily-light: è la prima da proporre, appena c’è stato un primo scambio vero');
  if (visible.includes('daily-light') && !visible.includes('path')) ready.push('path: quando ha fatto almeno una pratica o salvato una pagina');
  if (!visible.includes('synchronicities')) {
    ready.push(
      facts.journalEntries >= SYNC_MIN_ENTRIES
        ? 'synchronicities: PRONTA, ci sono abbastanza pagine; puoi dire che inizi a notare dei ritorni e invitarla a guardare'
        : `synchronicities: NON ancora (servono ${SYNC_MIN_ENTRIES} pagine di diario); non proporla`
    );
  }
  if (!visible.includes('collective') && facts.activeDays >= 3) ready.push('collective: quando parla delle persone che ha intorno o di condividere');
  if (!visible.includes('forge')) ready.push('forge: solo se nelle sue parole c’è un progetto da costruire; altrimenti mai');
  if (!visible.includes('tarot')) ready.push('tarot: si apre da sola con la prima lettura, quando completa le due pratiche dello stesso giorno; puoi accennarlo, non serve il pulsante');
  if (!visible.includes('plans')) ready.push('plans: solo se chiede dei piani o finisce le risposte del mese');
  if (ready.length) lines.push(`Quando ha senso proporle:\n- ${ready.join('\n- ')}`);
  return lines.join('\n');
}

/** I marcatori che Elayra può scrivere nella risposta: la pausa tra due messaggi e il pulsante di una pagina. */
export const PAUSE_MARK = '[[pausa]]';
export const pageMark = (k: PageKey) => `[[pagina:${k}]]`;

/** Toglie i marcatori, per i riassunti e per ciò che non è la chat (diario, Forgia). */
export function stripMarks(text: string): string {
  return text
    .replace(/\[\[pagina:[a-z-]+\]\]/g, '')
    .replace(/\[\[pausa\]\]/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
