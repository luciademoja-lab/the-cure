import { useMemo, useState } from 'react';
import { useTranslation } from '../../i18n/I18nProvider';
import type { GameProps } from './PathGame';

/** L'Ascolto: tante luci pulsano veloci, una sola batte lenta come un cuore. */
export function ListeningGame({ onDone }: GameProps) {
  const { t } = useTranslation();
  const lights = useMemo(() => {
    const heart = Math.floor(Math.random() * 12);
    return Array.from({ length: 12 }, (_, i) => ({
      x: 12 + (i % 4) * 25 + (Math.random() * 8 - 4),
      y: 18 + Math.floor(i / 4) * 30 + (Math.random() * 8 - 4),
      period: i === heart ? 2.6 : 0.55 + Math.random() * 0.7,
      delay: Math.random(),
      heart: i === heart,
    }));
  }, []);
  const [faded, setFaded] = useState<Set<number>>(new Set());
  const [found, setFound] = useState(false);
  const [note, setNote] = useState('');

  const pick = (i: number) => {
    if (found) return;
    if (lights[i].heart) {
      setFound(true);
      window.setTimeout(onDone, 1600);
    } else {
      setFaded((prev) => new Set(prev).add(i));
      setNote(t('games.2.slower'));
    }
  };

  return (
    <div className="listening">
      <div className="listening-field">
        {lights.map((l, i) => (
          <button
            key={i}
            type="button"
            aria-label={t('games.2.light', { n: i + 1 })}
            className={`listening-light ${faded.has(i) ? 'is-faded' : ''} ${found && l.heart ? 'is-found' : ''}`}
            style={{ left: `${l.x}%`, top: `${l.y}%`, animationDuration: `${l.period}s`, animationDelay: `${l.delay}s` }}
            onClick={() => pick(i)}
          />
        ))}
      </div>
      <p className="game-note" aria-live="polite">{note}</p>
    </div>
  );
}
