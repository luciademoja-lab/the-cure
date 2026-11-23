/**
 * Il secondo passaggio via email: un codice di 6 cifre, valido 10 minuti, con pochi tentativi.
 * È l'alternativa meno sicura all'app di autenticazione (chi entra nella tua email avrebbe entrambi i passaggi).
 */
import { createHash, randomInt, timingSafeEqual } from 'node:crypto';

export const CODE_TTL_MS = 10 * 60 * 1000;
export const MAX_ATTEMPTS = 5;
/** Tra un invio e l'altro almeno un minuto, e al massimo 5 invii in un'ora. */
export const RESEND_GAP_MS = 60 * 1000;
export const MAX_SENDS_PER_HOUR = 5;
export const SESSION_DAYS = 30;

export const newCode = () => String(randomInt(0, 1_000_000)).padStart(6, '0');

export function hashCode(userId: string, code: string, secret: string): string {
  return createHash('sha256').update(`${userId}:${code}:${secret}`).digest('hex');
}

export function sameHash(a: string, b: string): boolean {
  const x = Buffer.from(a, 'hex');
  const y = Buffer.from(b, 'hex');
  return x.length === y.length && timingSafeEqual(x, y);
}

export type CodeRow = {
  user_id: string;
  code_hash: string;
  expires_at: string;
  attempts: number;
  sent_at: string;
  window_start: string;
  sends_in_window: number;
};

/** Si può mandare un nuovo codice adesso? Restituisce i contatori aggiornati, o il motivo del no. */
export function canSend(row: CodeRow | undefined, now: number): { ok: true; windowStart: string; sends: number } | { ok: false; reason: 'gap' | 'hour' } {
  if (!row) return { ok: true, windowStart: new Date(now).toISOString(), sends: 1 };
  if (now - Date.parse(row.sent_at) < RESEND_GAP_MS) return { ok: false, reason: 'gap' };
  const windowOpen = now - Date.parse(row.window_start) < 60 * 60 * 1000;
  if (windowOpen && row.sends_in_window >= MAX_SENDS_PER_HOUR) return { ok: false, reason: 'hour' };
  return windowOpen
    ? { ok: true, windowStart: row.window_start, sends: row.sends_in_window + 1 }
    : { ok: true, windowStart: new Date(now).toISOString(), sends: 1 };
}

export function codeEmail(code: string, locale: 'it' | 'en') {
  if (locale === 'en') {
    return {
      subject: `Your Elayra code: ${code}`,
      text: `Your code to enter Elayra is ${code}. It is valid for 10 minutes.\n\nIf you did not try to sign in, someone may know your password: change it and turn on the authenticator app.`,
      html: `<p>Your code to enter Elayra:</p><p style="font-size:28px;letter-spacing:6px"><strong>${code}</strong></p><p>It is valid for 10 minutes.</p><p style="color:#777">If you did not try to sign in, someone may know your password: change it and turn on the authenticator app.</p>`,
    };
  }
  return {
    subject: `Il tuo codice Elayra: ${code}`,
    text: `Il tuo codice per entrare in Elayra è ${code}. Vale 10 minuti.\n\nSe non stavi entrando tu, qualcuno potrebbe conoscere la tua password: cambiala e attiva l'app di autenticazione.`,
    html: `<p>Il tuo codice per entrare in Elayra:</p><p style="font-size:28px;letter-spacing:6px"><strong>${code}</strong></p><p>Vale 10 minuti.</p><p style="color:#777">Se non stavi entrando tu, qualcuno potrebbe conoscere la tua password: cambiala e attiva l'app di autenticazione.</p>`,
  };
}
