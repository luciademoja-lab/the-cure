/**
 * Il diario si scrive da solo: la conversazione con Elayra di ogni giorno, a mezzanotte
 * (nel fuso orario della persona), diventa una pagina con le sue parole e ciò che è emerso.
 * Non serve un orologio sul server: i giorni passati si chiudono alla prima richiesta utile.
 */

/** Il fuso della persona, mandato dal browser; se manca o non è valido, l'ora italiana. */
export function safeTimeZone(value: unknown): string {
  if (typeof value === 'string' && value.length < 64) {
    try {
      new Intl.DateTimeFormat('en-CA', { timeZone: value });
      return value;
    } catch {
      /* fuso non valido */
    }
  }
  return 'Europe/Rome';
}

/** Il giorno di calendario (AAAA-MM-GG) di un istante, nel fuso dato. */
export function localDay(at: string | Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(
    typeof at === 'string' ? new Date(at) : at
  );
}

export type DayMessage = { id: string; role: 'user' | 'assistant'; content: string; created_at: string };

/** Raggruppa i messaggi per giorno e tiene solo i giorni già finiti, dal più vecchio. */
export function pastDays(messages: DayMessage[], timeZone: string, now = new Date()): { day: string; messages: DayMessage[] }[] {
  const today = localDay(now, timeZone);
  const byDay = new Map<string, DayMessage[]>();
  for (const m of messages) {
    const day = localDay(m.created_at, timeZone);
    if (day >= today) continue;
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day)!.push(m);
  }
  return [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([day, list]) => ({ day, messages: list }));
}

/** Punti luce di una pagina, secondo quanto ha scritto la persona: 5, 8 o 13. */
export function pagePoints(userText: string): number {
  let points = 5;
  if (userText.length > 200) points += 3;
  if (userText.length > 500) points += 5;
  return points;
}
