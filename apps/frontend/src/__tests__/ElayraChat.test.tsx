import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EntryEditor } from '../components/organisms/EntryEditor';
import { fakeSupabase } from '../test/setup';
import { I18nProvider } from '../i18n/I18nProvider';
import { MemoryRouter } from 'react-router-dom';
import { ElayraBubbles, splitElayra } from '../components/molecules/ElayraBubbles';

const renderChat = (onFinish: () => Promise<unknown> = vi.fn()) =>
  render(
    <MemoryRouter>
      <I18nProvider>
        <EntryEditor onFinish={onFinish} />
      </I18nProvider>
    </MemoryRouter>
  );

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

function sse(events: Array<[string, unknown]>) {
  const text = events.map(([e, d]) => `event: ${e}\ndata: ${JSON.stringify(d)}\n\n`).join('');
  // Spezzato a metà per verificare che il parser regga blocchi incompleti.
  const mid = Math.floor(text.length / 2);
  const enc = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(enc.encode(text.slice(0, mid)));
      controller.enqueue(enc.encode(text.slice(mid)));
      controller.close();
    },
  });
  return new Response(stream, { status: 200, headers: { 'Content-Type': 'text/event-stream' } });
}

describe('Chat con Elayra', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fakeSupabase.signInAs();
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('mostra un saluto quando non c’è ancora una storia', async () => {
    fetchMock.mockResolvedValueOnce(json({ messages: [] }));
    renderChat();
    expect(await screen.findByText("I'm here. How are you, right now?")).toBeInTheDocument();
  });

  it('riprende la conversazione salvata', async () => {
    fetchMock.mockResolvedValueOnce(
      json({ messages: [{ id: '1', role: 'user', content: 'ieri ero giù' }, { id: '2', role: 'assistant', content: 'Raccontami.' }] })
    );
    renderChat();
    expect(await screen.findByText('ieri ero giù')).toBeInTheDocument();
    expect(screen.getByText('Raccontami.')).toBeInTheDocument();
  });

  it('invia il messaggio e mostra la risposta di Elayra arrivata in streaming', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce(json({ messages: [] }));
    renderChat();
    await screen.findByText("I'm here. How are you, right now?");

    fetchMock.mockResolvedValueOnce(
      sse([['user', { id: 'u1' }], ['delta', { text: 'Sono ' }], ['delta', { text: 'qui.' }], ['done', { id: 'a1', content: 'Sono qui.' }]])
    );
    await user.type(screen.getByLabelText('Write to Elayra'), 'mi sento sola{Enter}');

    expect(await screen.findByText('Sono qui.')).toBeInTheDocument();
    expect(screen.getByText('mi sento sola')).toBeInTheDocument();
    const [url, init] = fetchMock.mock.calls[1];
    expect(url).toBe('/api/chat');
    expect(JSON.parse(init.body)).toEqual({ content: 'mi sento sola' });
    expect(init.headers.Authorization).toBe('Bearer test-token');
    expect(screen.getByLabelText('Write to Elayra')).toHaveValue('');
  });

  it('mostra l’errore del server invece di una risposta finta', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce(json({ messages: [] }));
    renderChat();
    await screen.findByText("I'm here. How are you, right now?");

    fetchMock.mockResolvedValueOnce(json({ error: 'Per oggi ci siamo dette tanto. Torniamo a parlarci domani.' }, 429));
    await user.type(screen.getByLabelText('Write to Elayra'), 'ciao');
    await user.click(screen.getByRole('button', { name: 'Send' }));
    expect(await screen.findByText('Per oggi ci siamo dette tanto. Torniamo a parlarci domani.')).toBeInTheDocument();
  });

  it('non c’è più “Finish and save”: a mezzanotte la conversazione diventa una pagina del Diario', async () => {
    fetchMock.mockResolvedValueOnce(json({ messages: [{ id: '1', role: 'user', content: 'oggi bene' }] }));
    renderChat();
    await screen.findByText('oggi bene');
    expect(screen.queryByRole('button', { name: 'Finish and save' })).not.toBeInTheDocument();
    expect(screen.getByText(/At midnight this conversation becomes a page of your Diary/)).toBeInTheDocument();
  });
});

describe('Elayra in più messaggi', () => {
  it('divide il testo in bolle e trasforma il marcatore della pagina in un pulsante', () => {
    const parts = splitElayra('Caspita.\n[[pausa]]\nTi va di provare?\n[[pagina:daily-light]]');
    expect(parts).toEqual([
      { text: 'Caspita.', pages: [] },
      { text: 'Ti va di provare?', pages: ['daily-light'] },
    ]);
    expect(splitElayra('Ciao [[pa')).toEqual([{ text: 'Ciao', pages: [] }]);
    expect(splitElayra('x\n[[pagina:admin]]')).toEqual([{ text: 'x', pages: [] }]);
  });

  it('riconosce il pulsante anche se Elayra scrive il nome della pagina in italiano', () => {
    const parts = splitElayra('Eccolo.\n[[pagina:diario]]\n[[pausa]]\nE qui.\n[[Pagina: Daily Light]]');
    expect(parts).toEqual([
      { text: 'Eccolo.', pages: ['diary'] },
      { text: 'E qui.', pages: ['daily-light'] },
    ]);
  });

  it('mostra tutte le bolle di un messaggio già salvato, con il pulsante', () => {
    render(
      <MemoryRouter>
        <I18nProvider>
          <ElayraBubbles content={'Caspita.\n[[pausa]]\nProva qui.\n[[pagina:daily-light]]'} />
        </I18nProvider>
      </MemoryRouter>
    );
    expect(screen.getByText('Caspita.')).toBeInTheDocument();
    expect(screen.getByText('Prova qui.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Go to Daily Light' })).toBeInTheDocument();
  });
});

import { DiaryPage } from '../pages/DiaryPage';
import { AuthProvider } from '../contexts/AuthContext';

describe('Diario', () => {
  it('mostra la pagina più recente con le parole della persona e ciò che è emerso', async () => {
    fakeSupabase.signInAs();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        json({
          entries: [
            { id: 'b', day: '2026-11-22', userWords: ['ho litigato con mia sorella'], content: 'È emerso il bisogno di essere capita.', mood: 5, energy: 'low', lightPointsEarned: 5, timestamp: '2026-11-22T20:00:00Z' },
            { id: 'a', day: '2026-11-21', userWords: ['giornata tranquilla'], content: 'Calma.', mood: 7, energy: 'moderate', lightPointsEarned: 5, timestamp: '2026-11-21T20:00:00Z' },
          ],
        })
      )
    );
    render(
      <MemoryRouter>
        <I18nProvider>
          <AuthProvider>
            <DiaryPage />
          </AuthProvider>
        </I18nProvider>
      </MemoryRouter>
    );
    expect(await screen.findByText('ho litigato con mia sorella')).toBeInTheDocument();
    expect(screen.getByText('È emerso il bisogno di essere capita.')).toBeInTheDocument();
    expect(screen.getByText('2 / 2')).toBeInTheDocument();
    vi.unstubAllGlobals();
  });
});

import { canDictate } from '../components/atoms/UpgradeVoiceButton';

describe('voce e piani', () => {
  it('le note vocali sono incluse da Part time in su', () => {
    expect(canDictate('free')).toBe(false);
    expect(canDictate('forgia')).toBe(false);
    expect(canDictate('part')).toBe(true);
    expect(canDictate('h24')).toBe(true);
  });

  it('al posto della voce di Elayra c’è l’invito a H24', async () => {
    const fetchMock = vi.fn().mockResolvedValue(json({ messages: [] }));
    vi.stubGlobal('fetch', fetchMock);
    fakeSupabase.signInAs();
    renderChat();
    expect(await screen.findByRole('button', { name: /Upgrade to H24 to hear my voice/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Talk with Elayra/ })).not.toBeInTheDocument();
    vi.unstubAllGlobals();
  });
});
