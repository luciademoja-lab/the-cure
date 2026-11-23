import { supabase } from './supabase';

/**
 * Il secondo passaggio è fatto? Con l'app di autenticazione lo dice Supabase (aal2);
 * con il codice via email lo sa il server, e la porta d'ingresso (SecurityGate) lo segna qui.
 */
let emailVerified = false;

export function setEmailVerified(value: boolean) {
  emailVerified = value;
}

export async function secondFactorDone(): Promise<boolean> {
  if (emailVerified) return true;
  try {
    const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    return data?.currentLevel === 'aal2';
  } catch {
    return false;
  }
}
