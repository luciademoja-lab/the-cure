import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useJournalEntries } from '../hooks/useJournalEntries';
import { useTranslation } from '../i18n/I18nProvider';
import { JournalEntry } from '../types/journal';

const TURN_MS = 380;

/**
 * Il Diario: un quaderno che si sfoglia, una pagina per giorno, scritta a penna.
 * In alto le parole della persona così come le ha scritte, sotto ciò che è emerso secondo Elayra.
 */
export function DiaryPage() {
  const { t, locale } = useTranslation();
  const { user } = useAuth();
  const { entries, isLoading, error } = useJournalEntries(user?.id);
  // Dal giorno più vecchio al più recente, come in un quaderno; si apre sull'ultima pagina.
  const pages = [...entries].sort((a, b) => pageDate(a).localeCompare(pageDate(b)));
  const [index, setIndex] = useState<number | null>(null);
  const [turning, setTurning] = useState<'next' | 'prev' | null>(null);
  const [phase, setPhase] = useState<'out' | 'in' | null>(null);
  const touchX = useRef<number | null>(null);

  useEffect(() => {
    if (index === null && pages.length) setIndex(pages.length - 1);
  }, [pages.length, index]);

  const current = index === null ? null : pages[index];

  const turn = useCallback(
    (dir: 'next' | 'prev') => {
      if (index === null || turning) return;
      const target = dir === 'next' ? index + 1 : index - 1;
      if (target < 0 || target >= pages.length) return;
      const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      if (reduced) {
        setIndex(target);
        return;
      }
      // La pagina si piega sul dorso, si gira, e dall'altra parte c'è il nuovo giorno.
      setTurning(dir);
      setPhase('out');
      window.setTimeout(() => {
        setIndex(target);
        setPhase('in');
        window.setTimeout(() => {
          setTurning(null);
          setPhase(null);
        }, TURN_MS);
      }, TURN_MS);
    },
    [index, pages.length, turning]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') turn('next');
      if (e.key === 'ArrowLeft') turn('prev');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [turn]);

  const tag = locale === 'it' ? 'it-IT' : 'en-GB';
  const dateLabel = (e: JournalEntry) =>
    new Date(`${pageDate(e)}T12:00:00Z`).toLocaleDateString(tag, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    });

  return (
    <main className="page-shell diary-page">
      <h1>{t('nav.diary')}</h1>
      {error && (
        <p className="page-error" role="alert">
          {error}
        </p>
      )}
      {!isLoading && !error && pages.length === 0 && <p className="diary-empty">{t('diary.empty')}</p>}

      {current && (
        <div
          className="diary-book"
          onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchX.current === null) return;
            const dx = e.changedTouches[0].clientX - touchX.current;
            touchX.current = null;
            if (dx < -50) turn('next');
            if (dx > 50) turn('prev');
          }}
        >
          <article
            className={`diary-sheet ${turning ? `turn-${turning} phase-${phase}` : ''}`}
            aria-live="polite"
            aria-label={dateLabel(current)}
          >
            <header className="diary-date">{dateLabel(current)}</header>

            <div className="diary-words">
              {(current.userWords?.length ? current.userWords : [current.content]).map((w, i) => (
                <p key={i}>{w}</p>
              ))}
            </div>

            {current.userWords?.length && current.content ? (
              <section className="diary-emerged">
                <h2>{t('diary.emerged')}</h2>
                <p>{current.content}</p>
                <p className="diary-sign">— Elayra</p>
              </section>
            ) : null}

            <footer className="diary-meta">
              <span>{t('diary.mood', { mood: current.mood })}</span>
              <span>{t(`diary.energy.${current.energy}`)}</span>
              {current.lightPointsEarned ? <span>{t('diary.points', { points: current.lightPointsEarned })}</span> : null}
            </footer>
          </article>

          <nav className="diary-nav" aria-label={t('diary.navLabel')}>
            <button type="button" onClick={() => turn('prev')} disabled={index === 0} aria-label={t('diary.prev')}>
              ‹
            </button>
            <span>
              {(index ?? 0) + 1} / {pages.length}
            </span>
            <button type="button" onClick={() => turn('next')} disabled={index === pages.length - 1} aria-label={t('diary.next')}>
              ›
            </button>
          </nav>
        </div>
      )}
    </main>
  );
}

/** Il giorno della pagina: quello scritto dal server o, per le pagine vecchie, la data di salvataggio. */
function pageDate(e: JournalEntry): string {
  return e.day || new Date(e.timestamp).toISOString().slice(0, 10);
}
