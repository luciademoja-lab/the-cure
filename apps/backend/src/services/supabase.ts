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
  /** Livello di autenticazione: 'aal2' solo dopo il codice dell'autenticatore. */
  aal: string;
  /** La sessione di Supabase a cui appartiene il token (serve al codice via email). */
  sessionId?: string;
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

/** Legge i dati del token. Va usato solo dopo che Supabase ha confermato che il token è valido. */
function jwtClaims(token: string): Record<string, unknown> {
  try {
    const part = token.split('.')[1] || '';
    return JSON.parse(Buffer.from(part.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'));
  } catch {
    return {};
  }
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
  const claims = jwtClaims(token);
  return {
    id: data.id,
    email: data.email,
    nickname: data.user_metadata?.nickname,
    aal: typeof claims.aal === 'string' ? claims.aal : 'aal1',
    sessionId: typeof claims.session_id === 'string' ? claims.session_id : undefined,
    token,
  };
}

type DbInit = { method?: string; body?: unknown; prefer?: string };

async function rest<T>(hdrs: Record<string, string>, path: string, init: DbInit): Promise<{ data: T; count: number | null }> {
  const res = await fetch(`${config.supabaseUrl}/rest/v1/${path}`, {
    method: init.method || 'GET',
    headers: init.prefer ? { ...hdrs, Prefer: init.prefer } : hdrs,
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.error('Supabase REST error', res.status, path.split('?')[0], text.slice(0, 300));
    const err = new HttpError(502, 'Errore del database') as HttpError & { detail?: string };
    err.detail = text;
    throw err;
  }
  const range = res.headers.get('content-range');
  const count = range && range.includes('/') ? Number(range.split('/')[1]) : null;
  const text = await res.text();
  return { data: (text ? JSON.parse(text) : null) as T, count: Number.isNaN(count as number) ? null : count };
}

/**
 * Chiamata REST al database con il token dell'utente: valgono le regole RLS,
 * quindi ognuno vede e scrive solo le proprie righe.
 */
export function db<T = any>(user: AuthedUser, path: string, init: DbInit = {}) {
  return rest<T>(headers(user.token), path, init);
}

/** Chiamata con la chiave segreta del server: salta le regole RLS. Da usare solo dopo aver verificato i permessi. */
export function adminDb<T = any>(path: string, init: DbInit = {}) {
  if (!config.supabaseSecretKey) throw new HttpError(503, 'Manca SUPABASE_SECRET_KEY sul server');
  const key = config.supabaseSecretKey;
  // Le chiavi nuove (sb_secret_...) vanno solo in "apikey"; quelle vecchie (JWT) anche in Authorization.
  const hdrs: Record<string, string> = { apikey: key, 'Content-Type': 'application/json' };
  if (key.startsWith('eyJ')) hdrs.Authorization = `Bearer ${key}`;
  return rest<T>(hdrs, path, init);
}

/** Messaggio d'errore del database (es. dalle funzioni con "raise exception"). */
export function dbErrorText(e: unknown): string {
  return String((e as { detail?: string })?.detail || '');
}
