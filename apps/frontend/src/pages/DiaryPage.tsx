import { AnimationEvent, ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useJournalEntries } from '../hooks/useJournalEntries';
import { useTranslation } from '../i18n/I18nProvider';
import { playPageTurn } from '../lib/pageTurnSound';
import { JournalEntry } from '../types/journal';

/** Quanto dura il gesto di girare pagina: lento, come con un quaderno vero. */
export const TURN_MS = 1300;
const NARROW = '(max-width: 760px)';

type Turn = { dir: 'next' | 'prev'; from: number; to: number };

/**
 * Il Diario: un quaderno aperto, un giorno per ogni doppia pagina, scritto a penna.
 * A sinistra le parole della persona così come le ha scritte, a destra ciò che è emerso secondo Elayra.
 * Sul telefono le due pagine diventano una sola.
 */
export function DiaryPage() {
  const { t, locale } = useTranslation();
  const { user } = useAuth();
  const { entries, isLoading, error } = useJournalEntries(user?.id);
  // Dal giorno più vecchio al più recente, come in un quaderno; si apre sull'ultima pagina.
  const pages = [...entries].sort((a, b) => pageDate(a).localeCompare(pageDate(b)));
  const [index, setIndex] = useState<number | null>(null);
  const [turn, setTurn] = useState<Turn | null>(null);
  const narrow = useMedia(NARROW);
  const touchX = useRef<number | null>(null);
  const doneTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (index === null && pages.length) setIndex(pages.length - 1);
  }, [pages.length, index]);

  useEffect(() => () => window.clearTimeout(doneTimer.current), []);

  const finish = useCallback(() => {
    window.clearTimeout(doneTimer.current);
    setTurn((current) => {
      if (current) setIndex(current.to);
      return null;
    });
  }, []);

  const go = useCallback(
    (dir: 'next' | 'prev') => {
      if (index === null || turn) return;
      const to = dir === 'next' ? index + 1 : index - 1;
      if (to < 0 || to >= pages.length) return;
      const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      if (reduced) {
        setIndex(to);
        return;
      }
      playPageTurn(TURN_MS);
      setTurn({ dir, from: index, to });
      // Se l'animazione non avvisa della fine (scheda in background), la pagina si posa comunque.
      doneTimer.current = window.setTimeout(finish, TURN_MS + 200);
    },
    [index, pages.length, turn, finish]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go('next');
      if (e.key === 'ArrowLeft') go('prev');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go]);

  const tag = locale === 'it' ? 'it-IT' : 'en-GB';
  const dateLabel = (e: JournalEntry) =>
    new Date(`${pageDate(e)}T12:00:00Z`).toLocaleDateString(tag, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    });

  const words = (e: JournalEntry) => (
    <>
      <header className="diary-date">{dateLabel(e)}</header>
      <div className="diary-words">
        {(e.userWords?.length ? e.userWords : [e.content]).map((w, i) => (
          <p key={i}>{w}</p>
        ))}
      </div>
    </>
  );

  const emerged = (e: JournalEntry) => (
    <>
      {e.userWords?.length && e.content ? (
        <section className="diary-emerged">
          <h2>{t('diary.emerged')}</h2>
          <p>{e.content}</p>
          <p className="diary-sign">— Elayra</p>
        </section>
      ) : null}
      <footer className="diary-meta">
        <span>{t('diary.mood', { mood: e.mood })}</span>
        <span>{t(`diary.energy.${e.energy}`)}</span>
        {e.lightPointsEarned ? <span>{t('diary.points', { points: e.lightPointsEarned })}</span> : null}
      </footer>
    </>
  );

  const page = (side: 'left' | 'right' | 'single', content: ReactNode, key?: string) => (
    <div key={key} className={`diary-sheet diary-sheet--${side}`}>
      <div className="diary-sheet-inner">{content}</div>
    </div>
  );

  const at = (i: number) => pages[i];
  const onLeafEnd = (e: AnimationEvent) => {
    if (e.target === e.currentTarget) finish();
  };

  let spread: ReactNode = null;
  if (index !== null && pages[index]) {
    if (narrow) {
      // Una pagina sola: avanti, la pagina se ne va a sinistra; indietro, la precedente torna sopra.
      const base = turn ? (turn.dir === 'next' ? at(turn.to) : at(turn.from)) : at(index);
      const leafFront = turn ? (turn.dir === 'next' ? at(turn.from) : at(turn.to)) : null;
      spread = (
        <div className="diary-spread is-single">
          {page('single', <>{words(base)}{emerged(base)}</>, 'base')}
          {turn && leafFront && (
            <div className={`diary-leaf diary-leaf--single diary-leaf--${turn.dir}`} onAnimationEnd={onLeafEnd}>
              <div className="diary-leaf-face is-front">{page('single', <>{words(leafFront)}{emerged(leafFront)}</>)}</div>
              <div className="diary-leaf-face is-back">{page('single', null)}</div>
            </div>
          )}
        </div>
      );
    } else {
      // Due pagine: la pagina che gira ha davanti il giorno di adesso e sul retro quello nuovo.
      const leftEntry = turn ? at(turn.dir === 'next' ? turn.from : turn.to) : at(index);
      const rightEntry = turn ? at(turn.dir === 'next' ? turn.to : turn.from) : at(index);
      spread = (
        <div className="diary-spread">
          {page('left', words(leftEntry), 'left')}
          {page('right', emerged(rightEntry), 'right')}
          {turn && (
            <div className={`diary-leaf diary-leaf--${turn.dir}`} onAnimationEnd={onLeafEnd}>
              <div className="diary-leaf-face is-front">
                {turn.dir === 'next' ? page('right', emerged(at(turn.from))) : page('left', words(at(turn.from)))}
              </div>
              <div className="diary-leaf-face is-back">
                {turn.dir === 'next' ? page('left', words(at(turn.to))) : page('right', emerged(at(turn.to)))}
              </div>
            </div>
          )}
        </div>
      );
    }
  }

  const shownIndex = turn ? turn.to : index ?? 0;

  return (
    <main className="page-shell diary-page">
      <h1>{t('nav.diary')}</h1>
      {error && (
        <p className="page-error" role="alert">
          {error}
        </p>
      )}
      {!isLoading && !error && pages.length === 0 && <p className="diary-empty">{t('diary.empty')}</p>}

      {spread && (
        <div
          className="diary-book"
          aria-live="polite"
          aria-label={index !== null && pages[index] ? dateLabel(pages[index]) : undefined}
          onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchX.current === null) return;
            const dx = e.changedTouches[0].clientX - touchX.current;
            touchX.current = null;
            if (dx < -50) go('next');
            if (dx > 50) go('prev');
          }}
        >
          {spread}

          <nav className="diary-nav" aria-label={t('diary.navLabel')}>
            <button type="button" onClick={() => go('prev')} disabled={index === 0 || !!turn} aria-label={t('diary.prev')}>
              ‹
            </button>
            <span>
              {shownIndex + 1} / {pages.length}
            </span>
            <button
              type="button"
              onClick={() => go('next')}
              disabled={index === pages.length - 1 || !!turn}
              aria-label={t('diary.next')}
            >
              ›
            </button>
          </nav>
        </div>
      )}
    </main>
  );
}

function useMedia(query: string): boolean {
  const get = () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(query).matches : false);
  const [matches, setMatches] = useState(get);
  useEffect(() => {
    if (!window.matchMedia) return;
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    onChange();
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, [query]);
  return matches;
}

/** Il giorno della pagina: quello scritto dal server o, per le pagine vecchie, la data di salvataggio. */
function pageDate(e: JournalEntry): string {
  return e.day || new Date(e.timestamp).toISOString().slice(0, 10);
}
