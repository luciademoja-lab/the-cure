import { useEffect, useRef, useState } from 'react';
import { useTranslation } from '../../i18n/I18nProvider';
import type { GameProps } from './PathGame';

/** La Fiamma: il vento la piega; tenendo la mano (il dito) vicino la si protegge e cresce. */
export function FlameGame({ onDone }: GameProps) {
  const { t } = useTranslation();
  const [size, setSize] = useState(0.35);
  const [gust, setGust] = useState(false);
  const shield = useRef(false);
  const box = useRef<HTMLDivElement>(null);
  const finished = useRef(false);

  useEffect(() => {
    let raf = 0;
    let wind = false;
    const gusts = window.setInterval(() => {
      wind = true;
      setGust(true);
      window.setTimeout(() => {
        wind = false;
        setGust(false);
      }, 1100);
    }, 2600);
    const tick = () => {
      setSize((s) => {
        let next = s + (shield.current ? 0.0028 : 0.0004) - (wind && !shield.current ? 0.006 : 0);
        next = Math.max(0.25, Math.min(1, next));
        if (next >= 1 && !finished.current) {
          finished.current = true;
          window.setTimeout(onDone, 1500);
        }
        return next;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.clearInterval(gusts);
    };
  }, [onDone]);

  const near = (x: number, y: number) => {
    const r = box.current?.getBoundingClientRect();
    if (!r) return false;
    const dx = x - (r.left + r.width / 2);
    const dy = y - (r.top + r.height * 0.6);
    return Math.hypot(dx, dy) < Math.min(r.width, r.height) * 0.45;
  };

  return (
    <div
      ref={box}
      className="flame-box"
      onPointerMove={(e) => (shield.current = near(e.clientX, e.clientY))}
      onPointerDown={(e) => (shield.current = near(e.clientX, e.clientY))}
      onPointerUp={(e) => e.pointerType !== 'mouse' && (shield.current = false)}
      onPointerLeave={() => (shield.current = false)}
    >
      <svg viewBox="-100 -160 200 200" className="game-svg" aria-label={t('games.6.hint')}>
        <ellipse cx="0" cy="20" rx={60 * size} ry={14 * size} className="game-glow" style={{ opacity: size * 0.6 }} />
        <g className={`flame ${gust ? 'is-bent' : ''}`} style={{ transform: `scale(${size})` }}>
          <path d="M0 -130 C 30 -80, 48 -40, 30 0 C 22 18, -22 18, -30 0 C -48 -40, -30 -80, 0 -130 Z" className="flame-outer" />
          <path d="M0 -80 C 14 -52, 22 -28, 12 -6 C 8 4, -8 4, -12 -6 C -22 -28, -14 -52, 0 -80 Z" className="flame-inner" />
        </g>
        <path d="M-30 20 L30 20" className="corridor-line" />
        {size > 0.9 &&
          Array.from({ length: 10 }, (_, i) => (
            <circle key={i} cx={(i - 4.5) * 16} cy={-140 - (i % 3) * 8} r="2" className="game-dot spark" style={{ animationDelay: `${i * 0.08}s` }} />
          ))}
      </svg>
    </div>
  );
}
