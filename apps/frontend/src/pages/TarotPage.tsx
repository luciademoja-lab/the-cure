import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from '../i18n/I18nProvider';
import { apiGet, apiPost, streamEvents } from '../lib/api';
import { TarotSpread, TarotText } from '../components/tarot/TarotSpread';
import type { TarotReading } from '../components/tarot/tarotTypes';

type MonthInfo = { month: string; unlocked: boolean; report: { content: string; createdAt: string } | null };
type ReportsState = { included: boolean; priceCents: number; months: MonthInfo[] };

const tag = (locale: string) => (locale === 'it' ? 'it-IT' : 'en-GB');

/** Il report arriva come testo con i titoli in maiuscolo su righe da sole: li trasformiamo in titoli. */
function ReportText({ text }: { text: string }) {
  const blocks = text.split(/\n+/).filter((l) => l.trim());
  return (
    <div className="report-text">
      {blocks.map((line, i) => {
        const clean = line.trim().replace(/:$/, '');
        const isTitle = clean.length < 70 && clean === clean.toUpperCase() && /[A-ZÀ-Ý]/.test(clean);
        return isTitle ? <h3 key={i}>{clean}</h3> : <p key={i}>{line}</p>;
      })}
    </div>
  );
}

/** Le letture dei tarocchi, la spunta per non riceverle e il report mensile di Elayra. */
export function TarotPage() {
  const { t, locale } = useTranslation();
  const [params, setParams] = useSearchParams();
  const [readings, setReadings] = useState<TarotReading[] | null>(null);
  const [optOut, setOptOut] = useState(false);
  const [reports, setReports] = useState<ReportsState | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [live, setLive] = useState<{ month: string; text: string } | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const polls = useRef(0);

  const loadReports = useCallback(async () => {
    const data = await apiGet<ReportsState>('/api/reports');
    setReports(data);
    return data;
  }, []);

  useEffect(() => {
    apiGet<{ readings: TarotReading[]; optOut: boolean }>('/api/tarot/readings')
      .then((d) => {
        setReadings(d.readings);
        setOptOut(d.optOut);
      })
      .catch((e) => setError(e instanceof Error ? e.message : t('chat.error.generic')));
    loadReports().catch((e) => setError(e instanceof Error ? e.message : t('chat.error.generic')));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ritorno da Stripe: il pagamento arriva al server in pochi secondi, ricontrolliamo un paio di volte.
  useEffect(() => {
    const paidMonth = params.get('report');
    if (params.get('checkout') === 'success' && paidMonth) {
      setNotice(t('reports.paid'));
      const tick = async () => {
        const data = await loadReports().catch(() => null);
        const m = data?.months.find((x) => x.month === paidMonth);
        if (m?.unlocked || polls.current >= 6) {
          setParams({}, { replace: true });
          return;
        }
        polls.current += 1;
        window.setTimeout(tick, 2500);
      };
      void tick();
    } else if (params.get('checkout') === 'cancel') {
      setNotice(t('reports.cancelled'));
      setParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const changeOptOut = async (value: boolean) => {
    setOptOut(value);
    try {
      await apiPost('/api/tarot/settings', { optOut: value });
    } catch (e) {
      setOptOut(!value);
      setError(e instanceof Error ? e.message : t('chat.error.generic'));
    }
  };

  const buy = async (month: string) => {
    setBusy(month);
    setError('');
    try {
      const { url } = await apiPost<{ url: string }>('/api/reports/checkout', { month });
      window.location.href = url;
    } catch (e) {
      setError(e instanceof Error ? e.message : t('chat.error.generic'));
      setBusy(null);
    }
  };

  const generate = async (month: string) => {
    setBusy(month);
    setError('');
    setLive({ month, text: '' });
    try {
      await streamEvents('/api/reports/generate', { month }, {
        delta: (p: { text: string }) => setLive((prev) => (prev ? { ...prev, text: prev.text + p.text } : prev)),
        reset: () => setLive((prev) => (prev ? { ...prev, text: '' } : prev)),
        done: () => undefined,
      });
      await loadReports();
      setOpen(month);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('chat.error.generic'));
    } finally {
      setLive(null);
      setBusy(null);
    }
  };

  const monthName = (m: string) =>
    new Date(`${m}-15T12:00:00Z`).toLocaleDateString(tag(locale), { month: 'long', year: 'numeric', timeZone: 'UTC' });
  const price = reports ? (reports.priceCents / 100).toLocaleString(tag(locale), { style: 'currency', currency: 'EUR' }) : '';
  const dayName = (d: string) =>
    new Date(`${d}T12:00:00Z`).toLocaleDateString(tag(locale), { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });

  return (
    <main className="page-shell tarot-page">
      <section className="card">
        <h1>{t('tarot.pageTitle')}</h1>
        <p className="forge-lead">{t('tarot.pageLead')}</p>
        <label className="tarot-optout">
          <input type="checkbox" checked={optOut} onChange={(e) => void changeOptOut(e.target.checked)} />
          {t('tarot.optOut')}
        </label>
      </section>

      {error && (
        <p className="page-error" role="alert">
          {error}
        </p>
      )}
      {notice && <p className="page-notice">{notice}</p>}

      <section className="card">
        <h2>{t('reports.title')}</h2>
        <p>{reports?.included ? t('reports.leadIncluded') : t('reports.leadFree', { price })}</p>
        <ul className="report-months">
          {reports?.months.map((m) => (
            <li key={m.month} className="report-month">
              <div className="report-month-head">
                <strong>{monthName(m.month)}</strong>
                {m.report ? (
                  <button type="button" className="cta-button secondary" onClick={() => setOpen(open === m.month ? null : m.month)}>
                    {open === m.month ? t('reports.hide') : t('reports.read')}
                  </button>
                ) : m.unlocked ? (
                  <button type="button" className="cta-button primary" disabled={busy !== null} onClick={() => void generate(m.month)}>
                    {busy === m.month ? t('reports.writing') : t('reports.ask')}
                  </button>
                ) : (
                  <button type="button" className="cta-button primary" disabled={busy !== null} onClick={() => void buy(m.month)}>
                    {t('reports.unlock', { price })}
                  </button>
                )}
              </div>
              {live?.month === m.month && (
                <div className="report-live" aria-live="polite">
                  {live.text ? <ReportText text={live.text} /> : <p className="tarot-waiting">{t('reports.gathering')}</p>}
                </div>
              )}
              {open === m.month && m.report && <ReportText text={m.report.content} />}
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2>{t('tarot.history')}</h2>
        {readings && readings.length === 0 && <p className="profile-muted">{t('tarot.noReadings')}</p>}
        <ul className="tarot-history">
          {readings?.map((r) => (
            <li key={r.day} className="tarot-history-item">
              <h3>{dayName(r.day)}</h3>
              <TarotSpread cards={r.cards} revealed={3} small />
              <TarotText text={r.reading} />
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
