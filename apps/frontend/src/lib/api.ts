import { supabase } from './supabase';

const API_URL = ((import.meta.env.VITE_API_URL as string | undefined) || '').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** Lingua scelta nell'app (la stessa che salva I18nProvider): il server risponde in questa lingua. */
function appLocale(): 'it' | 'en' {
  try {
    return window.localStorage.getItem('locale') === 'it' ? 'it' : 'en';
  } catch {
    return 'en';
  }
}

const MESSAGES = {
  it: {
    session: 'Sessione scaduta. Accedi di nuovo.',
    offline: 'Non riesco a raggiungere il server. Controlla la connessione.',
    generic: 'Qualcosa non ha funzionato. Riprova tra poco.',
    interrupted: 'La risposta si è interrotta. Riprova.',
    empty: 'Risposta vuota dal server.',
    elayraDown: 'Elayra non riesce a rispondere in questo momento.',
  },
  en: {
    session: 'Your session has expired. Please sign in again.',
    offline: 'I can’t reach the server. Please check your connection.',
    generic: 'Something didn’t work. Please try again in a moment.',
    interrupted: 'The reply was interrupted. Please try again.',
    empty: 'Empty reply from the server.',
    elayraDown: 'Elayra can’t reply right now.',
  },
};
const msg = (key: keyof (typeof MESSAGES)['en']) => MESSAGES[appLocale()][key];

async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new ApiError(401, msg('session'));
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Accept-Language': appLocale(),
    // Il diario chiude i giorni a mezzanotte nell'ora della persona.
    'X-Timezone': Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Rome',
  };
}

async function request(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = await authHeaders();
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...init, headers: { ...headers, ...(init.headers || {}) } });
  } catch {
    throw new ApiError(0, msg('offline'));
  }
  if (!res.ok) {
    let message = msg('generic');
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      /* risposta senza corpo JSON */
    }
    throw new ApiError(res.status, message);
  }
  return res;
}

export async function apiGet<T>(path: string): Promise<T> {
  return (await request(path)).json();
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const res = await request(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) });
  // Alcune risposte (es. 204) non hanno corpo.
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export async function apiDelete(path: string): Promise<void> {
  await request(path, { method: 'DELETE' });
}

export type ChatMessage = { id?: string; role: 'user' | 'assistant'; content: string };

/**
 * Manda un messaggio a Elayra e riceve la risposta a pezzi (Server-Sent Events).
 * Restituisce il testo completo quando la risposta è finita.
 */
/** La risposta si è interrotta per la rete, non per un errore di Elayra: conviene ricontrollare la cronologia. */
export class StreamInterrupted extends ApiError {
  constructor(message: string) {
    super(0, message);
    this.name = 'StreamInterrupted';
  }
}

export async function streamChat(
  content: string,
  opts: {
    onDelta: (text: string) => void;
    onReset?: () => void;
    onNote?: (content: string) => void;
    signal?: AbortSignal;
  }
): Promise<string> {
  const res = await request('/api/chat', { method: 'POST', body: JSON.stringify({ content }), signal: opts.signal });
  if (!res.body) throw new ApiError(0, msg('empty'));

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let full = '';
  let finished = false;

  const handle = (block: string) => {
    let event = 'message';
    let data = '';
    for (const line of block.split('\n')) {
      if (line.startsWith('event:')) event = line.slice(6).trim();
      else if (line.startsWith('data:')) data += line.slice(5).trim();
    }
    if (!data) return;
    const payload = JSON.parse(data);
    if (event === 'delta') {
      full += payload.text;
      opts.onDelta(payload.text);
    } else if (event === 'reset') {
      // Il server riprova da capo: il testo arrivato finora si butta.
      full = '';
      opts.onReset?.();
    } else if (event === 'done') {
      if (typeof payload.content === 'string') full = payload.content;
      finished = true;
    } else if (event === 'elayra') {
      // Un messaggio in più di Elayra, fuori dalla risposta (es. l'invito alla Forgia).
      if (typeof payload.content === 'string') opts.onNote?.(payload.content);
    } else if (event === 'error') {
      throw new ApiError(502, payload.message || msg('elayraDown'));
    }
  };

  for (;;) {
    let chunk: ReadableStreamReadResult<Uint8Array>;
    try {
      chunk = await reader.read();
    } catch (e) {
      // La connessione è caduta a metà (telefono, rete che cambia): la risposta può essere già salvata.
      if (opts.signal?.aborted) throw e;
      throw new StreamInterrupted(msg('interrupted'));
    }
    const { value, done } = chunk;
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx: number;
    while ((idx = buffer.indexOf('\n\n')) !== -1) {
      const block = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      handle(block);
    }
  }
  if (buffer.trim()) handle(buffer);
  if (!finished) throw new StreamInterrupted(msg('interrupted'));
  return full;
}

/**
 * Risposta in streaming generica (Server-Sent Events): chiama `on[evento]` per ogni evento.
 * L'evento "error" diventa un'eccezione.
 */
export async function streamEvents(
  path: string,
  body: unknown,
  on: Record<string, (payload: any) => void>,
  signal?: AbortSignal
): Promise<void> {
  const res = await request(path, { method: 'POST', body: JSON.stringify(body), signal });
  if (!res.body) throw new ApiError(0, msg('empty'));
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let finished = false;
  const handle = (block: string) => {
    let event = 'message';
    let data = '';
    for (const line of block.split('\n')) {
      if (line.startsWith('event:')) event = line.slice(6).trim();
      else if (line.startsWith('data:')) data += line.slice(5).trim();
    }
    if (!data) return;
    const payload = JSON.parse(data);
    if (event === 'error') throw new ApiError(502, payload.message || msg('elayraDown'));
    if (event === 'done') finished = true;
    on[event]?.(payload);
  };
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx: number;
    while ((idx = buffer.indexOf('\n\n')) !== -1) {
      const block = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      handle(block);
    }
  }
  if (buffer.trim()) handle(buffer);
  if (!finished) throw new ApiError(0, msg('interrupted'));
}
