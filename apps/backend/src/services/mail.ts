import { config } from '../config';
import { HttpError } from './supabase';

/** Manda un'email con Resend. Senza chiave sul server l'invio non è attivo. */
export async function sendMail(to: string, subject: string, text: string, html: string): Promise<void> {
  if (!config.resendApiKey) {
    throw new HttpError(503, 'L’invio del codice via email non è ancora attivo. Usa l’app di autenticazione.');
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${config.resendApiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: config.mailFrom, to: [to], subject, text, html }),
  });
  if (!res.ok) {
    console.error('Resend error', res.status, (await res.text().catch(() => '')).slice(0, 300));
    throw new HttpError(502, 'Non sono riuscita a mandare l’email. Riprova tra un momento.');
  }
}
