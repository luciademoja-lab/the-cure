import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useJournalEntries } from '../hooks/useJournalEntries';
import { fakeSupabase } from '../test/setup';

const entry = (id: string, points = 5) => ({
  id,
  content: `Pagina ${id}`,
  mood: 6,
  energy: 'moderate',
  tags: [],
  aiTags: [],
  lightPointsEarned: points,
  timestamp: new Date().toISOString(),
});

const ok = (body: unknown, status = 200) =>
  new Response(body === null ? null : JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

describe('useJournalEntries', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fakeSupabase.signInAs();
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('senza utente non chiama il server e non ha pagine', async () => {
    const { result } = renderHook(() => useJournalEntries(undefined));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.entries).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('carica le pagine dal backend con il token della sessione', async () => {
    fetchMock.mockResolvedValueOnce(ok({ entries: [entry('a', 8), entry('b', 5)] }));
    const { result } = renderHook(() => useJournalEntries('user-test'));
    await waitFor(() => expect(result.current.entries).toHaveLength(2));
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/journal');
    expect(init.headers.Authorization).toBe('Bearer test-token');
    expect(result.current.getTotalLightPoints()).toBe(13);
  });

  it('espone un errore leggibile se il server risponde male', async () => {
    fetchMock.mockResolvedValueOnce(ok({ error: 'Errore del database' }, 502));
    const { result } = renderHook(() => useJournalEntries('user-test'));
    await waitFor(() => expect(result.current.error).toBe('Errore del database'));
    expect(result.current.entries).toEqual([]);
  });

  it('salva la conversazione come nuova pagina in cima alla lista', async () => {
    fetchMock.mockResolvedValueOnce(ok({ entries: [entry('a')] }));
    const { result } = renderHook(() => useJournalEntries('user-test'));
    await waitFor(() => expect(result.current.entries).toHaveLength(1));
    fetchMock.mockResolvedValueOnce(ok({ entry: entry('nuova') }, 201));
    await act(async () => {
      await result.current.saveChatAsEntry();
    });
    expect(fetchMock.mock.calls[1][0]).toBe('/api/journal/from-chat');
    expect(result.current.entries.map((e) => e.id)).toEqual(['nuova', 'a']);
  });

  it('cancella una pagina', async () => {
    fetchMock.mockResolvedValueOnce(ok({ entries: [entry('a'), entry('b')] }));
    const { result } = renderHook(() => useJournalEntries('user-test'));
    await waitFor(() => expect(result.current.entries).toHaveLength(2));
    fetchMock.mockResolvedValueOnce(ok(null, 204));
    await act(async () => {
      await result.current.deleteEntry('a');
    });
    expect(fetchMock.mock.calls[1][1].method).toBe('DELETE');
    expect(result.current.entries.map((e) => e.id)).toEqual(['b']);
  });
});
