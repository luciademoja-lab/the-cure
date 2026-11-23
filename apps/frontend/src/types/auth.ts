/** Età minima per iscriversi. */
export const MIN_AGE = 18;

export interface User {
  id: string;
  email: string;
  nickname: string;
  createdAt: Date;
  lastLoginAt: Date;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  /** true finché non si sa se esiste una sessione salvata. */
  isInitializing: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  /** Nome ed età si chiedono al primo accesso (come con Google): qui sono facoltativi. */
  nickname?: string;
  /** Serve solo a verificare la maggiore età: non viene salvata. */
  age?: number;
  gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  /** Codice di chi ha invitato questa persona (dal link ?ref=...). */
  referralCode?: string;
}

export interface RegisterResult {
  /** true quando Supabase ha mandato una mail di conferma e non c'è ancora una sessione. */
  needsEmailConfirmation: boolean;
}

export interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<RegisterResult>;
  logout: () => void;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  signInWithGoogle: (referralCode?: string) => Promise<void>;
}
