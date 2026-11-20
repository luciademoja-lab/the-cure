/**
 * Piani di Elayra.
 *
 * I limiti sono calcolati sui costi reali (vedi docs/costi-piani.md):
 * - una risposta di Elayra con Sonnet costa al massimo circa 1 centesimo (≈4.000 token letti, ≈200 scritti);
 * - con la cache dei prompt il costo tipico scende a circa un terzo;
 * - il limite mensile tiene il caso peggiore sotto il 60% dell'incasso netto (dopo IVA e commissioni Stripe).
 */
export type PlanId = 'free' | 'forgia' | 'part' | 'full' | 'h24';

export interface PlanDefinition {
  id: PlanId;
  name: string;
  priceCents: number;
  /** Risposte di Elayra al mese (chat personale + stanze della Forgia). */
  monthlyMessages: number;
  /** Modello usato per le risposte. */
  tier: 'light' | 'full';
  /** Può scrivere nelle stanze e usare l'archivio documenti. */
  forgeRooms: boolean;
  /** Può chiamare Elayra dentro le stanze della Forgia. */
  forgeElayra: boolean;
  /** Chiave del prezzo su Stripe (creato da `npm run stripe:setup`). */
  stripeLookupKey: string | null;
}

export const PLANS: Record<PlanId, PlanDefinition> = {
  free: { id: 'free', name: 'Seme', priceCents: 0, monthlyMessages: 300, tier: 'light', forgeRooms: false, forgeElayra: false, stripeLookupKey: null },
  forgia: { id: 'forgia', name: 'Forgia', priceCents: 299, monthlyMessages: 300, tier: 'light', forgeRooms: true, forgeElayra: false, stripeLookupKey: 'elayra_forgia_monthly' },
  part: { id: 'part', name: 'Part time', priceCents: 999, monthlyMessages: 450, tier: 'full', forgeRooms: true, forgeElayra: true, stripeLookupKey: 'elayra_part_monthly' },
  full: { id: 'full', name: 'Full time', priceCents: 2499, monthlyMessages: 1200, tier: 'full', forgeRooms: true, forgeElayra: true, stripeLookupKey: 'elayra_full_monthly' },
  h24: { id: 'h24', name: 'H24', priceCents: 9999, monthlyMessages: 4800, tier: 'full', forgeRooms: true, forgeElayra: true, stripeLookupKey: 'elayra_h24_monthly' },
};

export const PAID_PLANS: PlanId[] = ['forgia', 'part', 'full', 'h24'];

/** Sconto quando si paga anche l'abbonamento di un'altra persona della Forgia: 20% sul totale dei due. */
export const DUO_COUPON_ID = 'elayra_duo_20';
export const DUO_PERCENT_OFF = 20;

export const isPlanId = (v: unknown): v is PlanId => typeof v === 'string' && v in PLANS;

export function startOfMonthUtc(now = new Date()): string {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}
