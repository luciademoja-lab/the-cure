import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from '../i18n/I18nProvider';
import { apiGet, apiPost } from '../lib/api';
import { supabase } from '../lib/supabase';
import { PlanId, planOf, useAccount } from '../contexts/AccountContext';

type ForgeProfile = {
  topic: string;
  summary: string;
  areas: string[];
  project_type: string;
  style: string;
  status: 'draft' | 'active' | 'declined';
};

type ForgeMatch = {
  id: string;
  topic: string;
  my_status: 'pending' | 'accepted' | 'declined';
  their_status: 'pending' | 'accepted' | 'declined';
  is_open: boolean;
  other_nickname: string | null;
  other_summary: string | null;
};

type ForgeState = { profile: ForgeProfile | null; matches: ForgeMatch[]; areas: string[] };
type RoomMessage = { id: string; from: 'me' | 'them' | 'elayra'; content: string };

/**
 * La Forgia. Elayra propone l'invito, la persona vede e corregge ciò che verrà mostrato,
 * e solo dopo il suo sì si cercano incontri. La stanza privata si apre quando accettano entrambi.
 */
export function TheForge() {
  const { t } = useTranslation();
  const [state, setState] = useState<ForgeState | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [topic, setTopic] = useState('');
  const [summary, setSummary] = useState('');
  const [areas, setAreas] = useState<string[]>([]);
  const [roomId, setRoomId] = useState<string | null>(null);

  const apply = useCallback((next: ForgeState) => {
    setState(next);
    if (next.profile) {
      setTopic(next.profile.topic);
      setSummary(next.profile.summary);
      setAreas(next.profile.areas);
    }
  }, []);

  const run = useCallback(
    async (action: () => Promise<ForgeState>) => {
      setBusy(true);
      setError('');
      try {
        apply(await action());
      } catch (e) {
        setError(e instanceof Error ? e.message : t('chat.error.generic'));
      } finally {
        setBusy(false);
      }
    },
    [apply, t]
  );

  useEffect(() => {
    void run(() => apiGet<ForgeState>('/api/forge'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleArea = (area: string) =>
    setAreas((prev) => (prev.includes(area) ? prev.filter((a) => a !== area) : prev.length < 4 ? [...prev, area] : prev));

  const respond = (id: string, accept: boolean) =>
    run(() => apiPost<ForgeState>(`/api/forge/matches/${id}/respond`, { accept }));

  const profile = state?.profile || null;
  const room = state?.matches.find((m) => m.id === roomId && m.is_open) || null;

  if (room) {
    return (
      <main className="page-shell forge-page">
        <ForgeRoom
          match={room}
          onBack={() => setRoomId(null)}
          onLeave={async () => {
            await respond(room.id, false);
            setRoomId(null);
          }}
        />
      </main>
    );
  }

  return (
    <main className="page-shell forge-page">
      <h1>{t('forge.title')}</h1>
      <p className="forge-lead">{t('forge.intro')}</p>

      {error && (
        <p className="page-error" role="alert">
          {error}
        </p>
      )}

      {state && (!profile || profile.status === 'declined') && (
        <section className="card forge-card">
          <p>{profile ? t('forge.declined') : t('forge.none')}</p>
          <button
            type="button"
            className="cta-button primary"
            disabled={busy}
            onClick={() => run(() => apiPost<ForgeState>('/api/forge/draft'))}
          >
            {busy ? t('forge.preparing') : t('forge.askDraft')}
          </button>
        </section>
      )}

      {profile && profile.status === 'draft' && (
        <section className="card forge-card">
          <h2>{t('forge.draftTitle')}</h2>
          <p>{t('forge.draftLead')}</p>
          <div className="form-group">
            <label htmlFor="forge-topic">{t('forge.field.topic')}</label>
            <input id="forge-topic" type="text" maxLength={160} value={topic} onChange={(e) => setTopic(e.target.value)} />
          </div>
          <div className="form-group">
            <label htmlFor="forge-summary">{t('forge.field.summary')}</label>
            <textarea
              id="forge-summary"
              className="journal-textarea"
              rows={4}
              maxLength={1200}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
            />
          </div>
          <fieldset className="forge-areas">
            <legend>{t('forge.field.areas')}</legend>
            {state?.areas.map((area) => (
              <button
                key={area}
                type="button"
                className={`forge-chip ${areas.includes(area) ? 'selected' : ''}`}
                aria-pressed={areas.includes(area)}
                onClick={() => toggleArea(area)}
              >
                {area}
              </button>
            ))}
          </fieldset>
          <p className="forge-privacy">{t('forge.privacy')}</p>
          <div className="forge-actions">
            <button
              type="button"
              className="cta-button primary"
              disabled={busy || !topic.trim() || !summary.trim() || areas.length === 0}
              onClick={() => run(() => apiPost<ForgeState>('/api/forge/profile', { action: 'accept', topic, summary, areas }))}
            >
              {t('forge.accept')}
            </button>
            <button
              type="button"
              className="cta-button secondary"
              disabled={busy}
              onClick={() => run(() => apiPost<ForgeState>('/api/forge/profile', { action: 'decline' }))}
            >
              {t('forge.decline')}
            </button>
          </div>
        </section>
      )}

      {profile && profile.status === 'active' && (
        <>
          <section className="card forge-card">
            <h2>{t('forge.activeTitle')}</h2>
            <h3>{profile.topic}</h3>
            <p>{profile.summary}</p>
            <p className="forge-tags">{profile.areas.join(' · ')}</p>
            <div className="forge-actions">
              <button
                type="button"
                className="cta-button secondary"
                disabled={busy}
                onClick={() => run(() => apiPost<ForgeState>('/api/forge/matches/search'))}
              >
                {t('forge.search')}
              </button>
              <button
                type="button"
                className="forge-link"
                disabled={busy}
                onClick={() => run(() => apiPost<ForgeState>('/api/forge/profile', { action: 'decline' }))}
              >
                {t('forge.leave')}
              </button>
            </div>
          </section>

          <h2 className="forge-section-title">{t('forge.matchesTitle')}</h2>
          {state?.matches.length === 0 && <p className="forge-lead">{t('forge.noMatches')}</p>}
          <ul className="forge-matches">
            {state?.matches.map((m) => {
              const closed = m.my_status === 'declined' || m.their_status === 'declined';
              return (
                <li key={m.id} className={`card forge-card forge-match ${closed ? 'closed' : ''}`}>
                  <p className="forge-tags">{t('forge.match.common', { topic: m.topic })}</p>
                  {closed && <p>{t('forge.match.closed')}</p>}
                  {!closed && m.my_status === 'pending' && (
                    <>
                      <p>{t('forge.match.question')}</p>
                      <div className="forge-actions">
                        <button type="button" className="cta-button primary" disabled={busy} onClick={() => respond(m.id, true)}>
                          {t('forge.match.yes')}
                        </button>
                        <button type="button" className="cta-button secondary" disabled={busy} onClick={() => respond(m.id, false)}>
                          {t('forge.match.no')}
                        </button>
                      </div>
                    </>
                  )}
                  {!closed && m.my_status === 'accepted' && !m.is_open && <p>{t('forge.match.waiting')}</p>}
                  {m.is_open && (
                    <>
                      <h3>{t('forge.match.with', { name: m.other_nickname || '…' })}</h3>
                      {m.other_summary && <p>{m.other_summary}</p>}
                      <button type="button" className="cta-button primary" onClick={() => setRoomId(m.id)}>
                        {t('forge.match.open')}
                      </button>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </main>
  );
}

function ForgeRoom({ match, onBack, onLeave }: { match: ForgeMatch; onBack: () => void; onLeave: () => Promise<void> }) {
  const { t } = useTranslation();
  const { account, refresh } = useAccount();
  const plan = planOf(account);
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState<'none' | 'message' | 'elayra'>('none');
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let active = true;
    const load = () =>
      apiGet<{ messages: RoomMessage[] }>(`/api/forge/matches/${match.id}/messages`)
        .then((data) => {
          if (active) setMessages(data.messages);
        })
        .catch((e) => {
          if (active) setError(e instanceof Error ? e.message : t('chat.error.generic'));
        });
    void load();
    // La stanza si aggiorna da sola ogni pochi secondi.
    const timer = window.setInterval(load, 5000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match.id]);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  const send = async (toElayra: boolean) => {
    const content = text.trim();
    if (!content || sending !== 'none') return;
    setSending(toElayra ? 'elayra' : 'message');
    setError('');
    try {
      if (toElayra) {
        await apiPost(`/api/forge/matches/${match.id}/elayra`, { request: content });
        const data = await apiGet<{ messages: RoomMessage[] }>(`/api/forge/matches/${match.id}/messages`);
        setMessages(data.messages);
        void refresh();
      } else {
        const { message } = await apiPost<{ message: RoomMessage }>(`/api/forge/matches/${match.id}/messages`, { content });
        setMessages((prev) => [...prev, message]);
      }
      setText('');
    } catch (e) {
      setError(e instanceof Error ? e.message : t('chat.error.generic'));
    } finally {
      setSending('none');
    }
  };

  const label = (from: RoomMessage['from']) =>
    from === 'elayra' ? t('forge.room.elayra') : from === 'me' ? t('forge.room.you') : match.other_nickname || '…';

  const canWrite = Boolean(plan?.forgeRooms);

  return (
    <>
      <button type="button" className="forge-link" onClick={onBack}>
        ← {t('forge.room.back')}
      </button>
      <h1>{t('forge.match.with', { name: match.other_nickname || '…' })}</h1>
      <p className="forge-tags forge-center">{t('forge.match.common', { topic: match.topic })}</p>
      {error && (
        <p className="page-error" role="alert">
          {error}
        </p>
      )}

      {!canWrite && <RoomPaywall matchId={match.id} partner={match.other_nickname || '…'} />}

      <div className="entry-editor chat-editor">
        <div className="chat-window" ref={listRef} role="log" aria-live="polite">
          {messages.map((m) => (
            <div key={m.id} className={`chat-message ${m.from === 'me' ? 'user' : 'assistant'} ${m.from === 'elayra' ? 'room-elayra' : ''}`}>
              <span className="forge-author">{label(m.from)}</span>
              <p>{m.content}</p>
            </div>
          ))}
          {sending === 'elayra' && (
            <div className="chat-message assistant thinking">
              <div className="typing-indicator" aria-label={t('journal.chat.thinking')}>
                <span />
                <span />
                <span />
              </div>
            </div>
          )}
        </div>
        {canWrite && (
          <div className="chat-input">
            <textarea
              className="journal-textarea"
              rows={3}
              maxLength={4000}
              aria-label={t('forge.room.placeholder')}
              placeholder={t('forge.room.placeholder')}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  void send(false);
                }
              }}
            />
            <div className="chat-actions">
              <button type="button" className="cta-button primary" disabled={sending !== 'none' || !text.trim()} onClick={() => send(false)}>
                {t('forge.room.send')}
              </button>
              <button
                type="button"
                className="cta-button secondary"
                disabled={sending !== 'none' || !text.trim() || !plan?.forgeElayra}
                title={plan?.forgeElayra ? undefined : t('forge.room.elayraLocked')}
                onClick={() => send(true)}
              >
                {t('forge.room.askElayra')}
              </button>
              <button type="button" className="forge-link" onClick={() => void onLeave()}>
                {t('forge.room.close')}
              </button>
            </div>
            {!plan?.forgeElayra && <p className="chat-disclaimer">{t('forge.room.elayraLocked')}</p>}
          </div>
        )}
      </div>

      <RoomArchive matchId={match.id} canUpload={canWrite} />
    </>
  );
}

/** Chi non ha ancora il piano Forgia può leggere ma non scrivere: può attivarlo per sé o per entrambi con lo sconto. */
function RoomPaywall({ matchId, partner }: { matchId: string; partner: string }) {
  const { t } = useTranslation();
  const { account } = useAccount();
  const [duoPlan, setDuoPlan] = useState<PlanId>('forgia');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const paid = (account?.plans || []).filter((p) => p.priceCents > 0);

  const checkout = async (body: Record<string, unknown>) => {
    setBusy(true);
    setError('');
    try {
      const { url } = await apiPost<{ url: string }>('/api/billing/checkout', body);
      window.location.assign(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('chat.error.generic'));
      setBusy(false);
    }
  };

  const chosen = paid.find((p) => p.id === duoPlan);
  const duoTotal = chosen ? (chosen.priceCents * 2 * 0.8) / 100 : 0;

  return (
    <section className="card forge-card room-paywall">
      <p>{t('forge.paywall.lead')}</p>
      <div className="forge-actions">
        <button type="button" className="cta-button primary" disabled={busy} onClick={() => checkout({ plan: 'forgia' })}>
          {t('forge.paywall.self')}
        </button>
      </div>
      <div className="room-duo">
        <label htmlFor="duo-plan">{t('forge.paywall.duoLabel', { name: partner })}</label>
        <div className="constellation-link">
          <select id="duo-plan" value={duoPlan} onChange={(e) => setDuoPlan(e.target.value as PlanId)}>
            {paid.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {(p.priceCents / 100).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}
              </option>
            ))}
          </select>
          <button type="button" className="cta-button secondary" disabled={busy} onClick={() => checkout({ plan: duoPlan, sponsorMatchId: matchId })}>
            {t('forge.paywall.duo', { total: duoTotal.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' }) })}
          </button>
        </div>
      </div>
      {error && (
        <p className="page-error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}

type StoredFile = { name: string; size: number };

/** Archivio dei documenti della stanza (max 10 MB a file), visibile solo alle due persone. */
function RoomArchive({ matchId, canUpload }: { matchId: string; canUpload: boolean }) {
  const { t } = useTranslation();
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const bucket = supabase.storage.from('forge-docs');

  const load = useCallback(async () => {
    const { data, error: listError } = await bucket.list(matchId, { limit: 100, sortBy: { column: 'created_at', order: 'desc' } });
    if (listError) {
      setError(listError.message);
      return;
    }
    setFiles((data || []).filter((f) => f.id).map((f) => ({ name: f.name, size: Number(f.metadata?.size || 0) })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  useEffect(() => {
    void load();
  }, [load]);

  const upload = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      setError(t('forge.archive.tooBig'));
      return;
    }
    setBusy(true);
    setError('');
    const safe = file.name.normalize('NFKD').replace(/[^\w.\-]+/g, '_').slice(-80) || 'file';
    const { error: upError } = await bucket.upload(`${matchId}/${Date.now()}-${safe}`, file, { upsert: false });
    if (upError) setError(upError.message);
    await load();
    setBusy(false);
  };

  const open = async (name: string) => {
    const { data, error: urlError } = await bucket.createSignedUrl(`${matchId}/${name}`, 60);
    if (urlError || !data) return setError(urlError?.message || t('chat.error.generic'));
    window.open(data.signedUrl, '_blank', 'noopener');
  };

  const remove = async (name: string) => {
    const { data, error: delError } = await bucket.remove([`${matchId}/${name}`]);
    if (delError || !data?.length) setError(t('forge.archive.cannotDelete'));
    await load();
  };

  const display = (name: string) => name.replace(/^\d+-/, '');

  return (
    <section className="card forge-card room-archive">
      <h2>{t('forge.archive.title')}</h2>
      {files.length === 0 && <p className="forge-lead">{t('forge.archive.empty')}</p>}
      <ul className="archive-list">
        {files.map((f) => (
          <li key={f.name}>
            <button type="button" className="forge-link" onClick={() => open(f.name)}>
              {display(f.name)}
            </button>
            <span className="archive-size">{Math.max(1, Math.round(f.size / 1024))} KB</span>
            <button type="button" className="forge-link" onClick={() => remove(f.name)} aria-label={t('forge.archive.delete', { name: display(f.name) })}>
              ✕
            </button>
          </li>
        ))}
      </ul>
      {canUpload ? (
        <label className="cta-button secondary archive-upload">
          {busy ? t('forge.archive.uploading') : t('forge.archive.upload')}
          <input
            type="file"
            hidden
            disabled={busy}
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (file) void upload(file);
            }}
          />
        </label>
      ) : (
        <p className="chat-disclaimer">{t('forge.archive.locked')}</p>
      )}
      {error && (
        <p className="page-error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
