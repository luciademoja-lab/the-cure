import { config } from '../config';

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export interface AuthedUser {
  id: string;
  email?: string;
  nickname?: string;
  token: string;
}

function headers(token: string, extra: Record<string, string> = {}) {
  return {
    apikey: config.supabaseKey,
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

/** Verifica il token di sessione chiedendo a Supabase chi è l'utente. */
export async function getUserFromToken(token: string): Promise<AuthedUser> {
  if (!config.supabaseUrl || !config.supabaseKey) {
    throw new HttpError(503, 'Supabase non configurato sul server');
  }
  const res = await fetch(`${config.supabaseUrl}/auth/v1/user`, { headers: headers(token) });
  if (!res.ok) throw new HttpError(401, 'Sessione non valida');
  const data: any = await res.json();
  if (!data?.id) throw new HttpError(401, 'Sessione non valida');
  return {
    id: data.id,
    email: data.email,
    nickname: data.user_metadata?.nickname,
    token,
  };
}

/**
 * Chiamata REST al database con il token dell'utente: valgono le regole RLS,
 * quindi ognuno vede e scrive solo le proprie righe.
 */
export async function db<T = any>(
  user: AuthedUser,
  path: string,
  init: { method?: string; body?: unknown; prefer?: string } = {}
): Promise<{ data: T; count: number | null }> {
  const res = await fetch(`${config.supabaseUrl}/rest/v1/${path}`, {
    method: init.method || 'GET',
    headers: headers(user.token, init.prefer ? { Prefer: init.prefer } : {}),
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.error('Supabase REST error', res.status, path.split('?')[0], text.slice(0, 300));
    throw new HttpError(502, 'Errore del database');
  }
  const range = res.headers.get('content-range');
  const count = range && range.includes('/') ? Number(range.split('/')[1]) : null;
  const text = await res.text();
  return { data: (text ? JSON.parse(text) : null) as T, count: Number.isNaN(count as number) ? null : count };
}
