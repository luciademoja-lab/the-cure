import { useState } from 'react';
import { useTranslation } from '../../i18n/I18nProvider';
import type { GameProps } from './PathGame';

/** Porte in prospettiva su un lato del corridoio: `depth` 0 = vicino, 1 = in fondo. */
function Door({ side, depth, onOpen, open }: { side: -1 | 1; depth: number; onOpen: () => void; open: boolean }) {
  // Le porte stanno sulle pareti: più sono lontane, più si avvicinano al punto di fuga.
  const s = 0.12 + (1 - depth) * 0.88;
  const floorY = 6 + 124 * s;
  const ceilY = -10 - 120 * s;
  const h = (floorY - ceilY) * 0.68;
  const w = h * 0.42;
  const x = side * (12 + 188 * s * 0.8);
  const y = floorY - h;
  return (
    <g className={`door ${open ? 'is-open' : ''}`} onClick={onOpen} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onOpen()}>
      <rect x={x - w / 2} y={y} width={w} height={h} className="door-frame" style={{ opacity: 0.2 + s * 0.8 }} />
      {open && <rect x={x - w / 2 + 2} y={y + 2} width={w - 4} height={h - 4} className="door-dark" />}
      <circle cx={x - side * w * 0.3} cy={y + h * 0.55} r={1.8 * s + 0.4} className="door-knob" />
    </g>
  );
}

/**
 * La Soglia: un corridoio di porte infinite. Nessuna è quella giusta.
 * Quando ci si volta, la porta è dentro di sé.
 */
export function ThresholdGame({ onDone }: GameProps) {
  const { t } = useTranslation();
  const [offset, setOffset] = useState(0);
  const [opened, setOpened] = useState<string | null>(null);
  const [tries, setTries] = useState(0);
  const [turned, setTurned] = useState(false);
  const [inside, setInside] = useState(false);

  const walk = () => {
    setOpened(null);
    setOffset((o) => o + 1);
  };
  const openDoor = (key: string) => {
    setOpened(key);
    setTries((n) => n + 1);
  };
  const enter = () => {
    setInside(true);
    window.setTimeout(onDone, 2600);
  };

  const doors = Array.from({ length: 6 }, (_, i) => (i + 1) / 7);

  return (
    <div className={`threshold ${turned ? 'is-turned' : ''}`}>
      <div className="threshold-scene">
        <svg viewBox="-200 -130 400 260" className="game-svg threshold-front" aria-hidden={turned}>
          {/* pavimento e soffitto in fuga */}
          <path d="M-200 130 L-12 6 M200 130 L12 6 M-200 -130 L-12 -10 M200 -130 L12 -10" className="corridor-line" />
          <rect x="-12" y="-10" width="24" height="16" className="corridor-end" />
          {doors
            .map((d, i) => ({ i, depth: (((d - offset / 7) % 1) + 1) % 1 }))
            .sort((a, b) => b.depth - a.depth)
            .map(({ i, depth }) => {
            return (
              <g key={i}>
                <Door side={-1} depth={depth} open={opened === `l${i}`} onOpen={() => openDoor(`l${i}`)} />
                <Door side={1} depth={depth} open={opened === `r${i}`} onOpen={() => openDoor(`r${i}`)} />
              </g>
            );
          })}
        </svg>
        <svg viewBox="-200 -130 400 260" className="game-svg threshold-back" aria-hidden={!turned}>
          <path d="M-200 130 L-12 6 M200 130 L12 6 M-200 -130 L-12 -10 M200 -130 L12 -10" className="corridor-line" />
          {/* una figura di luce, con una porta nel petto */}
          <g className={`self ${inside ? 'is-open' : ''}`} role="button" tabIndex={0} onClick={enter} onKeyDown={(e) => e.key === 'Enter' && enter()} aria-label={t('games.5.selfDoor')}>
            <circle cx="0" cy="-78" r="18" className="self-line" />
            <path d="M-34 110 C-40 40, -38 -20, -22 -50 Q0 -60 22 -50 C38 -20, 40 40, 34 110" className="self-line" />
            <rect x="-11" y="-30" width="22" height="36" rx="11" className="self-door" />
            <circle cx="0" cy="-12" r="40" className="self-glow" />
          </g>
        </svg>
      </div>
      <p className="game-note" aria-live="polite">
        {turned ? t('games.5.found') : opened ? (tries >= 3 ? t('games.5.turnHint') : t('games.5.notHere')) : ''}
      </p>
      <div className="threshold-controls">
        {!turned && (
          <button type="button" className="cta-button secondary" onClick={walk}>
            {t('games.5.walk')}
          </button>
        )}
        <button type="button" className={`cta-button ${tries >= 3 ? 'primary' : 'secondary'}`} onClick={() => setTurned((v) => !v)}>
          {turned ? t('games.5.back') : t('games.5.turn')}
        </button>
      </div>
    </div>
  );
}
