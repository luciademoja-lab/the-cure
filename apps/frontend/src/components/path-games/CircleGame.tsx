import { useState } from 'react';
import { useTranslation } from '../../i18n/I18nProvider';
import type { GameProps } from './PathGame';

const N = 6;
/** Arco di 60° centrato sul posto `slot`. */
const arc = (slot: number, r = 90) => {
  const a0 = ((slot * 60 - 90 + 4) * Math.PI) / 180;
  const a1 = ((slot * 60 - 30 - 4) * Math.PI) / 180;
  return `M${(r * Math.cos(a0)).toFixed(1)} ${(r * Math.sin(a0)).toFixed(1)} A${r} ${r} 0 0 1 ${(r * Math.cos(a1)).toFixed(1)} ${(r * Math.sin(a1)).toFixed(1)}`;
};

function startSlots() {
  // Partenza con sovrapposizioni: alcuni frammenti sullo stesso posto, alcuni posti vuoti.
  for (;;) {
    const s = Array.from({ length: N }, () => Math.floor(Math.random() * N));
    if (new Set(s).size <= N - 2) return s;
  }
}

/** Il Cerchio: i frammenti si spostano toccandoli finché ogni posto ha il suo e il cerchio si chiude. */
export function CircleGame({ onDone, name }: GameProps) {
  const { t } = useTranslation();
  const [slots, setSlots] = useState(startSlots);
  const [closed, setClosed] = useState(false);
  const counts = slots.reduce<Record<number, number>>((m, s) => ({ ...m, [s]: (m[s] || 0) + 1 }), {});

  const move = (i: number) => {
    if (closed) return;
    const next = slots.map((s, k) => (k === i ? (s + 1) % N : s));
    setSlots(next);
    if (new Set(next).size === N) {
      setClosed(true);
      window.setTimeout(onDone, 2200);
    }
  };

  return (
    <svg viewBox="-130 -130 260 260" className="game-svg" role="group" aria-label={t('games.3.hint')}>
      {Array.from({ length: N }, (_, s) => (
        <path key={`g${s}`} d={arc(s)} className="circle-ghost" />
      ))}
      {slots.map((s, i) => (
        <path
          key={i}
          d={arc(s, 90 + (counts[s] > 1 ? (i % 3) * 7 - 7 : 0))}
          className={`circle-piece ${counts[s] > 1 ? 'is-crowded' : ''} ${closed ? 'is-closed' : ''}`}
          role="button"
          tabIndex={0}
          aria-label={t('games.3.piece', { n: i + 1 })}
          onClick={() => move(i)}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && move(i)}
        />
      ))}
      {closed && (
        <text textAnchor="middle" dy="0.35em" className="circle-name">
          {name}
        </text>
      )}
    </svg>
  );
}
