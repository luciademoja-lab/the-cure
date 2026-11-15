import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(url && key);

if (!isSupabaseConfigured) {
  console.warn('Supabase non configurato: imposta VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY in .env');
}

// Con valori segnaposto il client si crea comunque, ma ogni chiamata fallisce in modo esplicito.
export const supabase = createClient(url || 'https://not-configured.supabase.co', key || 'not-configured');
