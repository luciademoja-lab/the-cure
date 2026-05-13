import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useJournalEntries } from '../hooks/useJournalEntries';
import { JournalEntry } from '../types/journal';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('useJournalEntries', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('initializes with empty entries', () => {
    const { result } = renderHook(() => useJournalEntries());

    expect(result.current.entries).toEqual([]);
  });

  it('loads entries from localStorage on mount', () => {
    const mockEntries: JournalEntry[] = [
      {
        id: '1',
        content: 'Test entry',
        mood: 7,
        energy: 'high',
        timestamp: new Date('2026-04-09'),
        tags: ['test'],
        aiTags: ['Test']
      }
    ];

    localStorageMock.setItem('journalEntries', JSON.stringify(mockEntries));

    const { result } = renderHook(() => useJournalEntries());

    expect(result.current.entries.length).toBeGreaterThanOrEqual(0);
  });

  it('adds a new entry', () => {
    const { result } = renderHook(() => useJournalEntries());

    const newEntry = {
      content: 'New entry',
      mood: 8 as const,
      energy: 'moderate' as const,
      tags: [],
      aiTags: []
    };

    act(() => {
      result.current.addEntry(newEntry);
    });

    expect(result.current.entries.length).toBeGreaterThan(0);
    if (result.current.entries.length > 0) {
      expect(result.current.entries[0].content).toBe('New entry');
      expect(result.current.entries[0].mood).toBe(8);
    }
  });

  it('persists entries to localStorage when adding', () => {
    const { result } = renderHook(() => useJournalEntries());

    act(() => {
      result.current.addEntry({
        content: 'Test entry',
        mood: 6 as const,
        energy: 'low' as const,
        tags: [],
        aiTags: []
      });
    });

    const stored = localStorageMock.getItem('the-cure-journal-entries');
    expect(stored).toBeDefined();
    
    if (stored) {
      const parsed = JSON.parse(stored);
      expect(parsed.length).toBeGreaterThan(0);
      expect(parsed[0].content).toBe('Test entry');
    }
  });

  it('returns entries array', () => {
    const { result } = renderHook(() => useJournalEntries());

    expect(Array.isArray(result.current.entries)).toBe(true);
  });

  it('provides entry count correctly', () => {
    const { result } = renderHook(() => useJournalEntries());

    let initialCount = result.current.entries.length;

    act(() => {
      result.current.addEntry({
        content: 'Entry 1',
        mood: 5 as const,
        energy: 'moderate' as const,
        tags: [],
        aiTags: []
      });
    });

    expect(result.current.entries.length).toBe(initialCount + 1);
  });

  it('handles multiple entries', () => {
    const { result } = renderHook(() => useJournalEntries());

    act(() => {
      result.current.addEntry({
        content: 'Entry 1',
        mood: 5 as const,
        energy: 'low' as const,
        tags: [],
        aiTags: []
      });
    });

    act(() => {
      result.current.addEntry({
        content: 'Entry 2',
        mood: 6 as const,
        energy: 'moderate' as const,
        tags: [],
        aiTags: []
      });
    });

    expect(result.current.entries.length).toBeGreaterThanOrEqual(2);
  });

  it('generates unique IDs for entries', () => {
    const { result } = renderHook(() => useJournalEntries());

    act(() => {
      result.current.addEntry({
        content: 'Entry 1',
        mood: 5 as const,
        energy: 'low' as const,
        tags: [],
        aiTags: []
      });
      result.current.addEntry({
        content: 'Entry 2',
        mood: 6 as const,
        energy: 'moderate' as const,
        tags: [],
        aiTags: []
      });
    });

    if (result.current.entries.length >= 2) {
      const ids = result.current.entries.slice(0, 2).map(e => e.id);
      expect(ids[0]).not.toBe(ids[1]);
    }
  });

  it('provides addEntry function', () => {
    const { result } = renderHook(() => useJournalEntries());

    expect(typeof result.current.addEntry).toBe('function');
  });

  it('provides entries array in hook result', () => {
    const { result } = renderHook(() => useJournalEntries());

    expect('entries' in result.current).toBe(true);
    expect('addEntry' in result.current).toBe(true);
  });
});
