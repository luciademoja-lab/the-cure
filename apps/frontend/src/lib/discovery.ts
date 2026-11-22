import { useEffect, useState } from 'react';
import { apiGet, apiPost } from './api';
import { supabase } from './supabase';

/**
 * La scoperta dell'app: nel menu si vedono solo le pagine già visitate.
 * Le altre restano posti vuoti finché Elayra non le presenta e la persona non ci entra.
 */
export const PAGES = [
  { key: 'journal', path: '/journal', label: 'nav.journal' },
  { key: 'daily-light', path: '/daily-light', label: 'nav.dailyLight' },
  { key: 'tarot', path: '/tarot', label: 'nav.tarot' },
  { key: 'path', path: '/gaming', label: 'nav.path' },
  { key: 'synchronicities', path: '/synchronicities', label: 'nav.synchronicities' },
  { key: 'forge', path: '/forge', label: 'nav.forge' },
  { key: 'collective', path: '/collective', label: 'nav.collective' },
  { key: 'plans', path: '/plans', label: 'nav.plans' },
] as const;

export type PageKey = (typeof PAGES)[number]['key'];

export const pageByKey = (key: string) => PAGES.find((p) => p.key === key);
export const pageByPath = (path: string) => PAGES.find((p) => p.path === path);

type State = { visible: PageKey[] | null };
let state: State = { visible: null };
const listeners = new Set<(s: State) => void>();
const emit = (next: State) => {
  state = next;
  listeners.forEach((l) => l(state));
};

const isAal2 = async () => {
  try {
    const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    return data?.currentLevel === 'aal2';
  } catch {
    return false;
  }
};

/** Carica le pagine scoperte (dopo la 2FA: prima il server non risponde). */
export async function loadDiscovery(): Promise<void> {
  if (!(await isAal2())) return;
  try {
    const data = await apiGet<{ visible: PageKey[] }>('/api/discovery');
    emit({ visible: data.visible });
  } catch {
    /* il menu resta com'è */
  }
}

/** La persona è entrata in una pagina: se è nuova, si accende nel menu. */
export async function markDiscovered(key: PageKey): Promise<void> {
  if (state.visible?.includes(key)) return;
  if (!(await isAal2())) return;
  try {
    const data = await apiPost<{ visible: PageKey[] }>('/api/discovery', { page: key });
    emit({ visible: data.visible });
  } catch {
    /* riproverà alla prossima visita */
  }
}

export function resetDiscovery() {
  emit({ visible: null });
}

/** Le pagine visibili; null finché non si sa (o per chi non è entrato). */
export function useDiscovery(): PageKey[] | null {
  const [s, setS] = useState(state);
  useEffect(() => {
    listeners.add(setS);
    setS(state);
    return () => {
      listeners.delete(setS);
    };
  }, []);
  return s.visible;
}
