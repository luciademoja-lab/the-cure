import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EntryEditor } from '../components/organisms/EntryEditor';
import { fakeSupabase } from '../test/setup';
import { I18nProvider } from '../i18n/I18nProvider';

const renderChat = (onFinish: () => Promise<unknown> = vi.fn()) =>
  render(
    <I18nProvider>
      <EntryEditor onFinish={onFinish} />
    </I18nProvider>
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

  it('“Finish and save” è attivo solo dopo che l’utente ha scritto, e chiama onFinish', async () => {
    const user = userEvent.setup();
    const onFinish = vi.fn().mockResolvedValue({});
    fetchMock.mockResolvedValueOnce(json({ messages: [{ id: '1', role: 'user', content: 'oggi bene' }] }));
    renderChat(onFinish);
    await screen.findByText('oggi bene');
    const finish = screen.getByRole('button', { name: 'Finish and save' });
    await waitFor(() => expect(finish).toBeEnabled());
    await user.click(finish);
    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(await screen.findByText(/Saved in your journal/)).toBeInTheDocument();
  });
});
