import { fetch } from 'expo/fetch';

import { supabase } from '@/lib/supabase';
import { createSseParser } from '@/utils/sse';

// Sul telefono "localhost" è il telefono stesso: qui serve l'indirizzo del backend
// (quello pubblico dopo il deploy, oppure l'IP del computer in rete locale).
const API_URL = (process.env.EXPO_PUBLIC_API_URL || '').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

export type ChatMessage = { id?: string; role: 'user' | 'assistant'; content: string };

export type JournalEntry = {
  id: string;
  content: string;
  mood: number;
  energy: 'low' | 'moderate' | 'high';
  sensation?: string;
  lightPointsEarned?: number;
  timestamp: string;
};

async function request(path: string, init: { method?: string; body?: unknown } = {}) {
  if (!API_URL) throw new ApiError(0, 'Manca EXPO_PUBLIC_API_URL nel file .env.');
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new ApiError(401, 'Sessione scaduta. Accedi di nuovo.');

  let res: Awaited<ReturnType<typeof fetch>>;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: init.method || 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
  } catch {
    throw new ApiError(0, 'Non riesco a raggiungere il server. Controlla la connessione.');
  }
  if (!res.ok) {
    let message = 'Qualcosa non ha funzionato. Riprova tra poco.';
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

export async function getChatHistory(): Promise<ChatMessage[]> {
  const res = await request('/api/chat/history');
  return (await res.json()).messages;
}

export async function getJournal(): Promise<JournalEntry[]> {
  const res = await request('/api/journal');
  return (await res.json()).entries;
}

export async function saveChatAsEntry(): Promise<JournalEntry> {
  const res = await request('/api/journal/from-chat', { method: 'POST' });
  return (await res.json()).entry;
}

/** Manda un messaggio a Elayra; onDelta riceve la risposta a pezzi mentre arriva. */
export async function streamChat(content: string, onDelta: (text: string) => void): Promise<string> {
  const res = await request('/api/chat', { method: 'POST', body: { content } });
  if (!res.body) throw new ApiError(0, 'Risposta vuota dal server.');

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  const parser = createSseParser();
  let full = '';
  let finished = false;

  const handle = (events: ReturnType<typeof parser.push>) => {
    for (const { event, data } of events) {
      const payload = JSON.parse(data);
      if (event === 'delta') {
        full += payload.text;
        onDelta(payload.text);
      } else if (event === 'done') {
        if (typeof payload.content === 'string') full = payload.content;
        finished = true;
      } else if (event === 'error') {
        throw new ApiError(502, payload.message || 'Elayra non riesce a rispondere in questo momento.');
      }
    }
  };

  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    handle(parser.push(decoder.decode(value, { stream: true })));
  }
  handle(parser.flush());
  if (!finished) throw new ApiError(0, 'La risposta si è interrotta. Riprova.');
  return full;
}
