import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from '../../i18n/I18nProvider';
import { apiPost, streamEvents } from '../../lib/api';
import { SpeechQueue, speechSupported } from '../../lib/speech';
import { SacredSymbol } from '../atoms/SacredSymbol';
import { TarotSpread, TarotText } from './TarotSpread';
import type { TarotCardData, TarotReading } from './tarotTypes';

/** Velocità della scrittura sullo schermo, in caratteri al secondo. */
const TYPE_SPEED = 38;

/**
 * La lettura dei tarocchi: le carte si girano una alla volta, Elayra racconta
 * e il testo si scrive sullo schermo mentre arriva.
 */
export function TarotModal({
  day,
  onClose,
  onOptOut,
}: {
  day: string;
  onClose: (reading: TarotReading | null) => void;
  onOptOut?: (optOut: boolean) => void;
}) {
  const { t, locale } = useTranslation();
  const [cards, setCards] = useState<TarotCardData[]>([]);
  const [revealed, setRevealed] = useState(0);
  const [shown, setShown] = useState('');
  const [finished, setFinished] = useState(false);
  const [error, setError] = useState('');
  const [optOut, setOptOut] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const target = useRef('');
  const result = useRef<TarotReading | null>(null);
  const speech = useRef<SpeechQueue | null>(null);
  const started = useRef(false);

  // La lettura arriva dal server; le carte si girano una alla volta.
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const abort = new AbortController();
    streamEvents(
      '/api/tarot/reading',
      { day },
      {
        cards: (p: { cards: TarotCardData[] }) => {
          setCards(p.cards);
          p.cards.forEach((_, i) => window.setTimeout(() => setRevealed((r) => Math.max(r, i + 1)), 700 + i * 900));
        },
        delta: (p: { text: string }) => {
          target.current += p.text;
        },
        done: (p: TarotReading) => {
          target.current = p.reading;
          result.current = p;
          setCards(p.cards);
          setFinished(true);
        },
      },
      abort.signal
    ).catch((e) => {
      if (!abort.signal.aborted) setError(e instanceof Error ? e.message : t('chat.error.generic'));
    });
    return () => abort.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day]);

  // Il testo si scrive a mano a mano, dopo che le carte sono girate.
  useEffect(() => {
    if (revealed < 3 && !finished) return;
    const timer = window.setInterval(() => {
      setShown((prev) => {
        const all = target.current;
        if (prev.length >= all.length) return prev;
        const behind = all.length - prev.length;
        const step = Math.max(1, Math.round((TYPE_SPEED / 20) * (behind > 400 ? 3 : 1)));
        return all.slice(0, prev.length + step);
      });
    }, 50);
    return () => window.clearInterval(timer);
  }, [revealed, finished]);

  useEffect(() => () => speech.current?.stop(), []);

  const writing = !error && (!finished || shown.length < target.current.length);

  const toggleVoice = useCallback(() => {
    if (speaking) {
      speech.current?.stop();
      setSpeaking(false);
      return;
    }
    const q = new SpeechQueue(locale, () => setSpeaking(false));
    speech.current = q;
    setSpeaking(true);
    q.push(target.current + '\n');
    q.flush();
  }, [speaking, locale]);

  const changeOptOut = async (value: boolean) => {
    setOptOut(value);
    try {
      await apiPost('/api/tarot/settings', { optOut: value });
      onOptOut?.(value);
    } catch (e) {
      setOptOut(!value);
      setError(e instanceof Error ? e.message : t('chat.error.generic'));
    }
  };

  return (
    <div className="tarot-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="tarot-title">
      <div className="tarot-modal">
        <button type="button" className="tarot-close" aria-label={t('common.close')} onClick={() => onClose(result.current)}>
          ×
        </button>
        <h2 id="tarot-title">{t('tarot.title')}</h2>
        <p className="tarot-lead">{t('tarot.lead')}</p>

        <TarotSpread cards={cards} revealed={revealed} />

        <div className="tarot-narrator">
          <div className={`tarot-narrator-sign ${writing ? 'is-speaking' : ''}`}>
            <SacredSymbol kind="all" size={40} />
            <span>Elayra</span>
          </div>
          <div className="tarot-narration" aria-live="polite">
            {error ? (
              <p className="page-error" role="alert">
                {error}
              </p>
            ) : shown ? (
              <>
                <TarotText text={shown} />
                {writing && <span className="tarot-caret" aria-hidden="true" />}
              </>
            ) : (
              <p className="tarot-waiting">{revealed < 3 ? t('tarot.shuffling') : t('tarot.listening')}</p>
            )}
          </div>
        </div>

        <div className="tarot-modal-footer">
          {speechSupported() && finished && !error && (
            <button type="button" className="cta-button secondary" onClick={toggleVoice}>
              {speaking ? t('tarot.stopVoice') : t('tarot.readAloud')}
            </button>
          )}
          <label className="tarot-optout">
            <input type="checkbox" checked={optOut} onChange={(e) => void changeOptOut(e.target.checked)} />
            {t('tarot.optOut')}
          </label>
          <p className="tarot-disclaimer">{t('tarot.disclaimer')}</p>
        </div>
      </div>
    </div>
  );
}
