import { useState, useEffect } from 'react';
import { JournalEntry } from '../types/journal';

const STORAGE_KEY = 'the-cure-journal-entries';

export function useJournalEntries() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setEntries(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load journal entries:', e);
      }
    }
    setIsLoading(false);
  }, []);

  const addEntry = (entryData: Omit<JournalEntry, 'id' | 'timestamp'>) => {
    const newEntry: JournalEntry = {
      ...entryData,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };

    const updated = [newEntry, ...entries];
    setEntries(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return newEntry;
  };

  const deleteEntry = (id: string) => {
    const updated = entries.filter((e) => e.id !== id);
    setEntries(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const getTotalLightPoints = () => {
    return entries.reduce((sum, e) => sum + (e.lightPointsEarned || 0), 0);
  };

  return { entries, isLoading, addEntry, deleteEntry, getTotalLightPoints };
}
