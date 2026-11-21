import { useEffect, useRef, useState } from 'react';
import { useTranslation } from '../../i18n/I18nProvider';
import type { GameProps } from './PathGame';

const BEAT = 1000;
const NEED = 7;

/** La Forgia: si batte a tempo sul lingotto incandescente finché diventa il segno di Elayra. */
export function ForgeGame({ onDone }: GameProps) {
  const { t } = useTranslation();
  const [hits, setHits] = useState(0);
  const [flash, setFlash] = useState<'good' | 'miss' | null>(null);
  const start = useRef(performance.now());
  const finished = useRef(false);

  const strike = () => {
    if (finished.current) return;
    const phase = ((performance.now() - start.current) % BEAT) / BEAT;
    const onBeat = phase < 0.2 || phase > 0.8;
    setFlash(onBeat ? 'good' : 'miss');
    window.setTimeout(() => setFlash(null), 220);
    if (onBeat) {
      setHits((h) => {
        const next = h + 1;
        if (next >= NEED) {
          finished.current = true;
          window.setTimeout(onDone, 2200);
        }
        return next;
      });
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        strike();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const p = Math.min(1, hits / NEED);
  return (
    <div className="forge-game">
      <button type="button" className={`forge-anvil ${flash ? `is-${flash}` : ''}`} onClick={strike} aria-label={t('games.7.strike')}>
        <svg viewBox="-110 -110 220 220" className="game-svg" aria-hidden="true">
          <circle r="96" className="forge-beat" style={{ animationDuration: `${BEAT}ms` }} />
          {/* il lingotto che a ogni colpo diventa il segno */}
          <g style={{ opacity: 1 - p }}>
            <rect x="-56" y="-18" width="112" height="36" rx="6" className="ingot" />
          </g>
          <g style={{ opacity: p }} className="forge-sign">
            <circle r={62} />
            <path d="M0 -42 L36.4 21 L-36.4 21 Z" />
            <circle r={5} className="forge-sign-point" />
          </g>
        </svg>
      </button>
      <p className="game-note" aria-live="polite">
        {hits >= NEED ? t('games.7.done') : flash === 'miss' ? t('games.7.miss') : t('games.7.count', { n: hits, total: NEED })}
      </p>
    </div>
  );
}
