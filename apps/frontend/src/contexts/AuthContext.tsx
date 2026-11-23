import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { AuthContextType, User, LoginCredentials, RegisterData, RegisterResult, MIN_AGE } from '../types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const REFERRAL_KEY = 'elayra-referral';

export function rememberReferral(code: string) {
  try {
    window.localStorage.setItem(REFERRAL_KEY, code);
  } catch {
    /* archiviazione non disponibile */
  }
}

export function pendingReferral(): string {
  try {
    return window.localStorage.getItem(REFERRAL_KEY) || '';
  } catch {
    return '';
  }
}

export function clearReferral() {
  try {
    window.localStorage.removeItem(REFERRAL_KEY);
  } catch {
    /* archiviazione non disponibile */
  }
}

interface AuthProviderProps {
  children: ReactNode;
}

function toUser(u: SupabaseUser): User {
  const email = u.email || '';
  return {
    id: u.id,
    email,
    nickname: (u.user_metadata?.nickname as string | undefined) || email.split('@')[0] || '',
    createdAt: new Date(u.created_at),
    lastLoginAt: new Date(u.last_sign_in_at || u.created_at),
  };
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  // isInitializing: si sta recuperando la sessione salvata. isLoading: è in corso un login/registrazione.
  const [isInitializing, setIsInitializing] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let active = true;
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (active) setUser(data.session?.user ? toUser(data.session.user) : null);
      })
      .catch((error) => console.error('Errore nel recupero della sessione:', error))
      .finally(() => {
        if (active) setIsInitializing(false);
      });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? toUser(session.user) : null);
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const login = async (credentials: LoginCredentials): Promise<void> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });
      if (error || !data.user) throw new Error('Invalid email or password');
      setUser(toUser(data.user));
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData): Promise<RegisterResult> => {
    setIsLoading(true);
    try {
      if (data.age !== undefined && data.age < MIN_AGE) {
        throw new Error(`You must be at least ${MIN_AGE} years old to register`);
      }
      const { data: result, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            ...(data.nickname ? { nickname: data.nickname } : {}),
            ...(data.age !== undefined ? { adult_confirmed: 'true' } : {}),
            ...(data.referralCode ? { referral_code: data.referralCode } : {}),
          },
          emailRedirectTo: `${window.location.origin}/journal`,
        },
      });
      if (error) {
        throw new Error(/already/i.test(error.message) ? 'Email already registered' : error.message);
      }
      if (result.session?.user) {
        setUser(toUser(result.session.user));
        return { needsEmailConfirmation: false };
      }
      return { needsEmailConfirmation: true };
    } finally {
      setIsLoading(false);
    }
  };

  /** Accesso o registrazione con Google. Il codice di invito resta da parte e si usa al primo accesso. */
  const signInWithGoogle = async (referralCode?: string): Promise<void> => {
    if (referralCode) rememberReferral(referralCode);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/journal` },
    });
    if (error) throw new Error(error.message);
  };

  const logout = () => {
    setUser(null);
    supabase.auth.signOut().catch((error) => console.error('Errore in uscita:', error));
  };

  const resetPassword = async (email: string): Promise<void> => {
    setIsLoading(true);
    try {
      // Supabase risponde allo stesso modo anche se l'email non esiste: così non si rivela chi è iscritto.
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw new Error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePassword = async (password: string): Promise<void> => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw new Error(error.message);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    isInitializing,
    login,
    register,
    logout,
    resetPassword,
    updatePassword,
    signInWithGoogle,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
