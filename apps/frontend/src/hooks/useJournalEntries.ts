import { useCallback, useEffect, useState } from 'react';
import { JournalEntry } from '../types/journal';
import { apiDelete, apiGet, apiPost } from '../lib/api';

/** Le pagine di diario dell'utente, lette e scritte tramite il backend. */
export function useJournalEntries(userId?: string) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setEntries([]);
      setIsLoading(false);
      return;
    }
    let active = true;
    setIsLoading(true);
    apiGet<{ entries: JournalEntry[] }>('/api/journal')
      .then((data) => {
        if (active) {
          setEntries(data.entries);
          setError(null);
        }
      })
      .catch((e) => {
        if (active) setError(e instanceof Error ? e.message : '…');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [userId]);

  /** Chiude la conversazione in corso e la salva come pagina di diario. */
  const saveChatAsEntry = useCallback(async (): Promise<JournalEntry> => {
    const { entry } = await apiPost<{ entry: JournalEntry }>('/api/journal/from-chat');
    setEntries((prev) => [entry, ...prev]);
    return entry;
  }, []);

  const deleteEntry = useCallback(async (id: string) => {
    await apiDelete(`/api/journal/${id}`);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const getTotalLightPoints = () => entries.reduce((sum, e) => sum + (e.lightPointsEarned || 0), 0);

  return { entries, isLoading, error, saveChatAsEntry, deleteEntry, getTotalLightPoints };
}
