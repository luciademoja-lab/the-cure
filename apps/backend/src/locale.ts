/**
 * Lingua della richiesta: l'app manda Accept-Language con la lingua scelta dall'utente.
 * La teniamo in un AsyncLocalStorage così prompt, livelli e messaggi d'errore la leggono senza passarla a mano.
 */
import { AsyncLocalStorage } from 'node:async_hooks';
import type { NextFunction, Request, Response } from 'express';

export type Locale = 'it' | 'en';

const store = new AsyncLocalStorage<Locale>();

/** Senza intestazione (client vecchi, test) resta l'italiano, la lingua di partenza del server. */
export function localeFromHeader(header: string | undefined): Locale {
  if (!header || !header.trim()) return 'it';
  return /^\s*it\b/i.test(header) ? 'it' : 'en';
}

export function currentLocale(): Locale {
  return store.getStore() ?? 'it';
}

/** Messaggi d'errore del server: scritti in italiano, tradotti qui per chi usa l'app in inglese. */
const EN: Record<string, string> = {
  'Accesso richiesto': 'Please sign in',
  'Avatar non valido': 'Invalid avatar',
  'Azione non valida': 'Invalid action',
  'Costellazione non valida': 'Invalid constellation',
  'Data non valida': 'Invalid date',
  'Elayra non è ancora collegata: manca ANTHROPIC_API_KEY sul server': 'Elayra is not connected yet: ANTHROPIC_API_KEY is missing on the server',
  'Errore del database': 'Database error',
  'Errore interno': 'Something went wrong on our side',
  'Firma Stripe non valida': 'Invalid Stripe signature',
  'Hai già un abbonamento: puoi cambiarlo da “Gestisci abbonamento”.': 'You already have a subscription: you can change it from “Manage subscription”.',
  'I pagamenti non sono ancora attivi: manca STRIPE_SECRET_KEY sul server': 'Payments are not active yet: STRIPE_SECRET_KEY is missing on the server',
  'Identificativo non valido': 'Invalid identifier',
  'Il brief per Liria è incluso dal piano Part time in su.': 'The brief for Liria is included from the Part time plan up.',
  'Il brief è troppo lungo': 'The brief is too long',
  'Il brief è vuoto': 'The brief is empty',
  'Il messaggio è troppo lungo': 'The message is too long',
  'Il messaggio è vuoto': 'The message is empty',
  'Il nome deve avere tra 2 e 40 caratteri': 'Your name must be between 2 and 40 characters',
  'Il testo è troppo lungo': 'The text is too long',
  'Immagine non valida': 'Invalid image',
  'La richiesta è troppo lunga': 'The request is too long',
  'Livello non valido': 'Invalid level',
  'L’altra persona ha già un abbonamento.': 'The other person already has a subscription.',
  'Manca STRIPE_WEBHOOK_SECRET sul server': 'STRIPE_WEBHOOK_SECRET is missing on the server',
  'Manca SUPABASE_SECRET_KEY sul server': 'SUPABASE_SECRET_KEY is missing on the server',
  'Nelle nostre conversazioni non ho ancora trovato un progetto. Raccontamelo in chat.': 'I haven’t found a project in our conversations yet. Tell me about it in the chat.',
  'Nessun messaggio da inviare': 'No message to send',
  'Niente da cambiare': 'Nothing to change',
  'Non c’è ancora niente da salvare': 'There’s nothing to save yet',
  'Non c’è ancora un invito alla Forgia': 'There’s no invitation to the Forge yet',
  'Non hai ancora abbastanza stelle per questa costellazione': 'You don’t have enough stars for this constellation yet',
  'Non hai ancora un abbonamento': 'You don’t have a subscription yet',
  'Non trovato': 'Not found',
  'Parla ancora un po’ con Elayra: non ho abbastanza per capire a cosa stai lavorando.': 'Talk with Elayra a little longer: I don’t have enough yet to understand what you’re working on.',
  'Per avere Elayra nelle stanze serve il piano Part time o superiore.': 'To have Elayra in the rooms you need the Part time plan or higher.',
  'Per continuare serve il tuo consenso a termini e privacy': 'To continue we need your consent to the terms and privacy policy',
  'Per oggi questo rituale è già fatto': 'You’ve already done this ritual today',
  'Per scrivere nelle stanze della Forgia serve almeno il piano Forgia (2,99 €/mese).': 'To write in the Forge rooms you need at least the Forge plan (€2.99/month).',
  'Per usare Elayra devi avere almeno 18 anni': 'You must be at least 18 to use Elayra',
  'Piano non valido': 'Invalid plan',
  'Puoi scrivere fino a 6000 caratteri': 'You can write up to 6000 characters',
  'Questa costellazione l’hai già reclamata': 'You’ve already claimed this constellation',
  'Questa stanza non è aperta': 'This room is not open',
  'Questo livello non è ancora aperto': 'This level is not open yet',
  'Questo piano non si acquista': 'This plan can’t be purchased',
  'Risposta non valida': 'Invalid answer',
  'Rituale non valido': 'Invalid ritual',
  'Scrivi almeno una parola': 'Write at least one word',
  'Scrivi come vuoi essere chiamata o chiamato': 'Tell us what you’d like to be called',
  'Scrivi cosa chiedere a Elayra': 'Write what you want to ask Elayra',
  'Serve il codice dell’app di autenticazione': 'Enter the code from your authenticator app',
  'Servono un titolo, una descrizione e almeno un’area': 'Add a title, a description and at least one area',
  'Sessione non valida': 'Invalid session',
  'Stripe non ha restituito la pagina di pagamento': 'Stripe did not return the payment page',
  'Supabase non configurato sul server': 'Supabase is not configured on the server',
  'Testo non valido': 'Invalid text',
  'La lettura si apre quando completi entrambe le pratiche del giorno': 'The reading opens when you complete both practices of the day',
  'Questo report è già tuo': 'This report is already yours',
  'Il report di questo mese si sblocca con 0,99 € o con un piano a pagamento': 'This month’s report unlocks for €0.99 or with a paid plan',
  'In questo mese non c’è ancora niente da raccontare: scrivi nel diario o fai le pratiche, poi torna qui': 'There is nothing to tell for this month yet: write in your journal or do the practices, then come back',
  'In questo momento non riesco a risponderti. Riprova tra poco.': 'I can’t answer you right now. Please try again in a moment.',
};

const PLAN_EN: Record<string, string> = { Seme: 'Seed', Forgia: 'Forge' };

export function translateError(message: string, locale: Locale = currentLocale()): string {
  if (locale === 'it') return message;
  if (EN[message]) return EN[message];
  const quota = message.match(/^Questo mese hai usato tutte le (\d+) risposte di Elayra del piano (.+?)\. /);
  if (quota) {
    const plan = PLAN_EN[quota[2]] || quota[2];
    return `This month you’ve used all ${quota[1]} Elayra replies included in the ${plan} plan. You can move to a bigger plan from the Plans page, or meet me again next month.`;
  }
  return message;
}

/** Middleware: fissa la lingua della richiesta e traduce `{ error }` nelle risposte JSON. */
export function localeMiddleware(req: Request, res: Response, next: NextFunction) {
  const locale = localeFromHeader(req.headers['accept-language']);
  const json = res.json.bind(res);
  res.json = (body: unknown) => {
    if (body && typeof body === 'object' && typeof (body as { error?: unknown }).error === 'string') {
      body = { ...(body as object), error: translateError((body as { error: string }).error, locale) };
    }
    return json(body);
  };
  store.run(locale, next);
}
