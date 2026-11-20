import { useCallback, useEffect, useRef, useState } from 'react';
import { areaLabel } from '../lib/forgeLabels';
import { useTranslation } from '../i18n/I18nProvider';
import { apiGet, apiPost } from '../lib/api';
import { supabase } from '../lib/supabase';
import { PlanId, planOf, useAccount } from '../contexts/AccountContext';
import { LiriaPopup } from '../components/organisms/LiriaPopup';

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
  const { t, locale } = useTranslation();
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
  const { account } = useAccount();
  const hasForge = Boolean(planOf(account)?.forgeRooms);
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
      <LiriaPopup />
      <h1>{t('forge.title')}</h1>
      {!hasForge && <ForgeMission />}
      {hasForge && <ProjectFolderGuide />}
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
                {areaLabel(locale, area)}
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
            <p className="forge-tags">{profile.areas.map((a) => areaLabel(locale, a)).join(' · ')}</p>
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
      <ProjectFolderGuide />

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
      <LiriaPanel matchId={match.id} />
    </>
  );
}

/** Cosa si può fare nella cartella del progetto: spiegazione che si apre e si chiude. */
function ProjectFolderGuide({ open = false }: { open?: boolean }) {
  const { t } = useTranslation();
  return (
    <details className="card forge-folder-guide" open={open}>
      <summary>{t('forge.folder.title')}</summary>
      <ul>
        <li>{t('forge.folder.room')}</li>
        <li>{t('forge.folder.archive')}</li>
        <li>{t('forge.folder.elayra')}</li>
        <li>{t('forge.folder.liria')}</li>
        <li>{t('forge.folder.sponsor')}</li>
      </ul>
    </details>
  );
}

type LiriaInfo = { eligible: boolean; email: string; discountCode: string | null };

/**
 * Secretary Liria, la softwarehouse della Forgia: Elayra mette in ordine la stanza in un brief,
 * la persona lo legge e lo corregge, poi lo conferma e lo manda a Liria per email.
 */
function LiriaPanel({ matchId }: { matchId: string }) {
  const { t } = useTranslation();
  const { refresh } = useAccount();
  const [info, setInfo] = useState<LiriaInfo | null>(null);
  const [notes, setNotes] = useState('');
  const [brief, setBrief] = useState('');
  const [subject, setSubject] = useState('');
  const [busy, setBusy] = useState<'none' | 'brief' | 'send'>('none');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    apiGet<LiriaInfo>('/api/forge/liria')
      .then(setInfo)
      .catch(() => setInfo(null));
  }, []);

  if (!info) return null;

  const prepare = async () => {
    setBusy('brief');
    setError('');
    setSent(false);
    try {
      const data = await apiPost<{ brief: string; subject: string }>(`/api/forge/matches/${matchId}/liria/brief`, { notes });
      setBrief(data.brief);
      setSubject(data.subject);
      void refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('chat.error.generic'));
    } finally {
      setBusy('none');
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(brief);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      /* il testo resta selezionabile nel riquadro */
    }
  };

  const confirmAndSend = async () => {
    if (!brief.trim()) return;
    setBusy('send');
    setError('');
    try {
      await apiPost(`/api/forge/matches/${matchId}/liria/confirm`, { brief });
      const intro = t('forge.liria.mailIntro');
      const signoff = info.discountCode ? `\n\n${t('forge.liria.mailCode', { code: info.discountCode })}` : '';
      let body = `${intro}\n\n${brief}${signoff}`;
      // Alcuni programmi di posta tagliano i link troppo lunghi: in quel caso il brief si incolla a mano.
      if (body.length > 1800) {
        await copy();
        body = `${intro}\n\n${t('forge.liria.pasteHere')}${signoff}`;
      }
      window.location.href = `mailto:${info.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('chat.error.generic'));
    } finally {
      setBusy('none');
    }
  };

  return (
    <section className="card liria-panel" aria-labelledby="liria-title">
      <p className="forge-mission-kicker">Secretary Liria</p>
      <h2 id="liria-title">{t('forge.liria.title')}</h2>
      <p>{t('forge.liria.lead')}</p>
      <ol className="liria-steps">
        <li>{t('forge.liria.step1')}</li>
        <li>{t('forge.liria.step2')}</li>
        <li>{t('forge.liria.step3')}</li>
      </ol>

      {!info.eligible ? (
        <p className="liria-locked">
          {t('forge.liria.locked')}{' '}
          <a href="/plans">{t('profile.changePlan')}</a>
        </p>
      ) : (
        <>
          <p className="liria-discount">
            {info.discountCode ? t('forge.liria.discount', { code: info.discountCode }) : t('forge.liria.discountSoon')}
          </p>
          {!brief && (
            <div className="form-group">
              <label htmlFor="liria-notes">{t('forge.liria.notesLabel')}</label>
              <textarea
                id="liria-notes"
                className="journal-textarea"
                rows={3}
                maxLength={2000}
                placeholder={t('forge.liria.notesPlaceholder')}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          )}
          {brief && (
            <div className="form-group">
              <label htmlFor="liria-brief">{t('forge.liria.reviewLabel')}</label>
              <textarea
                id="liria-brief"
                className="journal-textarea liria-brief"
                rows={14}
                maxLength={8000}
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
              />
            </div>
          )}
          <div className="profile-actions">
            <button type="button" className={`cta-button ${brief ? 'secondary' : 'primary'}`} disabled={busy !== 'none'} onClick={() => void prepare()}>
              {busy === 'brief' ? t('forge.liria.preparing') : brief ? t('forge.liria.redo') : t('forge.liria.prepare')}
            </button>
            {brief && (
              <>
                <button type="button" className="cta-button primary" disabled={busy !== 'none' || !brief.trim()} onClick={() => void confirmAndSend()}>
                  {t('forge.liria.send')}
                </button>
                <button type="button" className="forge-link" onClick={() => void copy()}>
                  {copied ? t('forge.liria.copied') : t('forge.liria.copy')}
                </button>
              </>
            )}
          </div>
          {sent && (
            <p className="profile-ok" role="status">
              {t('forge.liria.sent', { email: info.email })}
            </p>
          )}
        </>
      )}
      {error && (
        <p className="page-error" role="alert">
          {error}
        </p>
      )}
      <p className="profile-muted profile-small">
        {t('forge.liria.more')}{' '}
        <a href="https://secretaryliria.com/" target="_blank" rel="noreferrer">
          secretaryliria.com
        </a>
      </p>
    </section>
  );
}

/** Chi non ha ancora il piano Forgia può leggere ma non scrivere: può attivarlo per sé o per entrambi con lo sconto. */
/** Per chi non ha ancora un piano con la Forgia: la sua missione, e come aiutarsi a vicenda. */
function ForgeMission() {
  const { t } = useTranslation();
  return (
    <section className="card forge-mission" aria-labelledby="forge-mission-title">
      <p className="forge-mission-kicker">{t('forge.mission.kicker')}</p>
      <h2 id="forge-mission-title">{t('forge.mission.title')}</h2>
      <p>{t('forge.mission.p1')}</p>
      <p>{t('forge.mission.p2')}</p>
      <p className="forge-mission-gift">{t('forge.mission.p3')}</p>
      <p>{t('forge.mission.p4')}</p>
      <a className="cta-button primary" href="/plans">
        {t('forge.mission.cta')}
      </a>
    </section>
  );
}

function RoomPaywall({ matchId, partner }: { matchId: string; partner: string }) {
  const { t, locale } = useTranslation();
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
                {t(`plan.name.${p.id}`)} — {(p.priceCents / 100).toLocaleString(locale === 'it' ? 'it-IT' : 'en-GB', { style: 'currency', currency: 'EUR' })}
              </option>
            ))}
          </select>
          <button type="button" className="cta-button secondary" disabled={busy} onClick={() => checkout({ plan: duoPlan, sponsorMatchId: matchId })}>
            {t('forge.paywall.duo', { total: duoTotal.toLocaleString(locale === 'it' ? 'it-IT' : 'en-GB', { style: 'currency', currency: 'EUR' }) })}
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
