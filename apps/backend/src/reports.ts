import { FIRST_REPORT_DAYS, MONTH_REPORT_DAYS } from './discovery';
import { nextMonth, recentMonths } from './tarot';

/**
 * Quali report esistono per una persona.
 * - Il primo arriva dopo 30 giorni di uso, anche sparsi su più mesi, e racconta quei 30 giorni.
 * - Poi un mese ha il suo report se è finito e la persona ha usato l'app almeno 25 giorni.
 */
export type ReportPeriod = {
  /** 'first30' oppure 'AAAA-MM'. */
  id: string;
  kind: 'first30' | 'month';
  /** Primo del mese: la chiave nel database. */
  monthStart: string;
  /** Giorni inclusi, AAAA-MM-GG. */
  from: string;
  to: string;
};

const dayAfter = (day: string) => {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
};
const dayBefore = (day: string) => {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
};

export function firstThirtyPeriod(days: string[]): ReportPeriod | null {
  const sorted = [...new Set(days)].sort();
  if (sorted.length < FIRST_REPORT_DAYS) return null;
  const from = sorted[0];
  return { id: 'first30', kind: 'first30', monthStart: `${from.slice(0, 7)}-01`, from, to: sorted[FIRST_REPORT_DAYS - 1] };
}

export function monthPeriod(month: string): ReportPeriod {
  const monthStart = `${month}-01`;
  return { id: month, kind: 'month', monthStart, from: monthStart, to: dayBefore(nextMonth(monthStart)) };
}

/** I periodi da mostrare: il primo report, poi i mesi finiti con abbastanza giorni o con un report già scritto. */
export function availablePeriods(days: string[], withReport: Set<string>, now = new Date()): ReportPeriod[] {
  const out: ReportPeriod[] = [];
  const first = firstThirtyPeriod(days);
  const current = recentMonths(1, now)[0];
  for (const m of recentMonths(13, now)) {
    if (m === current && !withReport.has(m)) continue;
    const count = days.filter((d) => d.startsWith(m)).length;
    if (withReport.has(m) || (first && count >= MONTH_REPORT_DAYS)) out.push(monthPeriod(m));
  }
  if (first) out.push(first);
  return out;
}

/** Il periodo chiesto dal client, se esiste davvero per questa persona. */
export function resolvePeriod(id: unknown, days: string[], withReport: Set<string>, now = new Date()): ReportPeriod | null {
  if (typeof id !== 'string') return null;
  return availablePeriods(days, withReport, now).find((p) => p.id === id) || null;
}

/** Il giorno dopo l'ultimo incluso, per filtrare con "minore di". */
export const periodEndExclusive = (p: ReportPeriod) => dayAfter(p.to);
