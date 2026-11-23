/**
 * Quanto costa davvero Elayra. Ogni chiamata al modello lascia i suoi token e il costo stimato:
 * così si conosce il costo reale per persona e per piano, invece di una stima.
 *
 * Chi ha fatto la richiesta si ricorda in un AsyncLocalStorage (come la lingua), così il servizio
 * dell'intelligenza artificiale non deve sapere nulla di utenti e database.
 */
import { AsyncLocalStorage } from 'node:async_hooks';
import type { NextFunction, Request, Response } from 'express';

type Ctx = { userId?: string; route: string };
const store = new AsyncLocalStorage<Ctx>();

export function meteringMiddleware(req: Request, _res: Response, next: NextFunction) {
  store.run({ route: `${req.method} ${req.path}` }, next);
}

/** Dopo l'accesso: da qui in poi le chiamate al modello sono di questa persona. */
export function setMeteredUser(userId: string) {
  const ctx = store.getStore();
  if (ctx) ctx.userId = userId;
}

/** Prezzi in dollari per milione di token (listino Anthropic, novembre 2026). */
type Price = { input: number; output: number; cacheRead: number; cacheWrite: number };
const PRICES: Array<[prefix: string, price: Price]> = [
  ['claude-haiku-5-5', { input: 0.1, output: 0.5, cacheRead: 0.01, cacheWrite: 0.125 }],
  ['claude-sonnet-5-5', { input: 2, output: 10, cacheRead: 0.1, cacheWrite: 2.5 }],
  ['claude-sonnet-5', { input: 2, output: 10, cacheRead: 0.2, cacheWrite: 2.5 }],
  ['claude-opus-5-5', { input: 4, output: 20, cacheRead: 0.4, cacheWrite: 5 }],
];
/** Per un modello sconosciuto si conta il prezzo di Sonnet: meglio sovrastimare. */
const FALLBACK: Price = { input: 2, output: 10, cacheRead: 0.2, cacheWrite: 2.5 };

export type TokenUsage = {
  input_tokens?: number | null;
  output_tokens?: number | null;
  cache_read_input_tokens?: number | null;
  cache_creation_input_tokens?: number | null;
};

export function costUsd(model: string, usage: TokenUsage): number {
  const p = PRICES.find(([prefix]) => model.startsWith(prefix))?.[1] ?? FALLBACK;
  const input = usage.input_tokens ?? 0;
  const read = usage.cache_read_input_tokens ?? 0;
  const write = usage.cache_creation_input_tokens ?? 0;
  // Haiku 5.5 costa cinque volte tanto quando il prompt supera i 100.000 token.
  const long = model.startsWith('claude-haiku-5-5') && input + read + write > 100_000 ? 5 : 1;
  return (
    ((input * p.input + (usage.output_tokens ?? 0) * p.output + read * p.cacheRead + write * p.cacheWrite) * long) / 1_000_000
  );
}

export type UsageRow = {
  user_id: string | null;
  route: string | null;
  model: string;
  input_tokens: number;
  output_tokens: number;
  cache_read_tokens: number;
  cache_write_tokens: number;
  cost_usd: number;
};

let sink: ((row: UsageRow) => Promise<unknown>) | null = null;
/** Dove finiscono i conteggi (il server li scrive nel database). */
export function setUsageSink(fn: typeof sink) {
  sink = fn;
}

/** Registra una chiamata. Non blocca mai la risposta e un errore qui non la rovina. */
export function reportUsage(model: string, usage: TokenUsage | null | undefined) {
  if (!usage || !sink) return;
  const ctx = store.getStore();
  const row: UsageRow = {
    user_id: ctx?.userId ?? null,
    route: ctx?.route ?? null,
    model,
    input_tokens: usage.input_tokens ?? 0,
    output_tokens: usage.output_tokens ?? 0,
    cache_read_tokens: usage.cache_read_input_tokens ?? 0,
    cache_write_tokens: usage.cache_creation_input_tokens ?? 0,
    cost_usd: Number(costUsd(model, usage).toFixed(6)),
  };
  sink(row).catch((e) => console.error('Usage metering error:', e instanceof Error ? e.message : e));
}
