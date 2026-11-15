import { vi, beforeEach } from 'vitest';

/**
 * Nei test non si parla con Supabase vero: questo finto client tiene gli utenti in memoria
 * e si comporta come l'autenticazione reale (login, registrazione, uscita).
 */
type FakeUser = { id: string; email: string; password: string; user_metadata: Record<string, unknown>; created_at: string; last_sign_in_at: string };

const state = {
  users: new Map<string, FakeUser>(),
  session: null as null | { access_token: string; user: FakeUser },
  listeners: new Set<(event: string, session: unknown) => void>(),
};

const emit = (event: string) => state.listeners.forEach((l) => l(event, state.session));

export const fakeSupabase = {
  state,
  reset() {
    state.users.clear();
    state.session = null;
  },
  signInAs(email = 'test@example.com', nickname = 'Test') {
    const now = new Date().toISOString();
    const user: FakeUser = { id: 'user-test', email, password: 'password123', user_metadata: { nickname }, created_at: now, last_sign_in_at: now };
    state.users.set(email, user);
    state.session = { access_token: 'test-token', user };
  },
};

vi.mock('/src/lib/supabase.ts', () => ({
  isSupabaseConfigured: true,
  supabase: {
    auth: {
      getSession: async () => ({ data: { session: state.session }, error: null }),
      onAuthStateChange: (cb: (event: string, session: unknown) => void) => {
        state.listeners.add(cb);
        return { data: { subscription: { unsubscribe: () => state.listeners.delete(cb) } } };
      },
      signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
        const user = state.users.get(email);
        if (!user || user.password !== password) {
          return { data: { user: null, session: null }, error: { message: 'Invalid login credentials' } };
        }
        state.session = { access_token: 'test-token', user };
        emit('SIGNED_IN');
        return { data: { user, session: state.session }, error: null };
      },
      signUp: async ({ email, password, options }: { email: string; password: string; options?: { data?: Record<string, unknown> } }) => {
        if (state.users.has(email)) {
          return { data: { user: null, session: null }, error: { message: 'User already registered' } };
        }
        const now = new Date().toISOString();
        const user: FakeUser = { id: `user-${state.users.size + 1}`, email, password, user_metadata: options?.data || {}, created_at: now, last_sign_in_at: now };
        state.users.set(email, user);
        state.session = { access_token: 'test-token', user };
        emit('SIGNED_IN');
        return { data: { user, session: state.session }, error: null };
      },
      signOut: async () => {
        state.session = null;
        emit('SIGNED_OUT');
        return { error: null };
      },
      resetPasswordForEmail: async () => ({ data: {}, error: null }),
      updateUser: async () => ({ data: {}, error: null }),
    },
  },
}));

beforeEach(() => {
  fakeSupabase.reset();
});
