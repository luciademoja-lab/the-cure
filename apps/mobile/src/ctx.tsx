import type { Session } from '@supabase/supabase-js';
import { createContext, use, useEffect, useState, type PropsWithChildren } from 'react';

import { supabase } from '@/lib/supabase';

export const MIN_AGE = 18;

type SessionContextValue = {
  session: Session | null;
  nickname: string;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  /** Restituisce true se serve confermare l'email prima di entrare. */
  signUp: (email: string, password: string, nickname: string) => Promise<boolean>;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function useSession() {
  const value = use(SessionContext);
  if (!value) throw new Error('useSession va usato dentro <SessionProvider />');
  return value;
}

export function SessionProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) => setSession(data.session))
      .catch(() => setSession(null))
      .finally(() => setIsLoading(false));
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);

  const value: SessionContextValue = {
    session,
    isLoading,
    nickname: (session?.user.user_metadata?.nickname as string | undefined) || '',
    async signIn(email, password) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error('Email o password non corrette.');
    },
    async signUp(email, password, nickname) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { nickname } },
      });
      if (error) {
        throw new Error(/already/i.test(error.message) ? 'Questa email è già registrata.' : error.message);
      }
      return !data.session;
    },
    async signOut() {
      await supabase.auth.signOut();
    },
  };

  return <SessionContext value={value}>{children}</SessionContext>;
}
