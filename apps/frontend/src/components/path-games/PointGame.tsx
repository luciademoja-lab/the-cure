import { useEffect, useRef, useState } from 'react';
import type { GameProps } from './PathGame';

/** Il Punto: ogni movimento lo disperde; restando fermi qualche secondo, cresce. */
export function PointGame({ onDone }: GameProps) {
  const NEED = 5000;
  const [still, setStill] = useState(0);
  const [scatter, setScatter] = useState(0);
  const last = useRef(performance.now());
  const finished = useRef(false);

  useEffect(() => {
    const disturb = () => {
      last.current = performance.now();
      setScatter(1);
    };
    const events = ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart'] as const;
    events.forEach((e) => window.addEventListener(e, disturb, { passive: true }));
    let raf = 0;
    const tick = () => {
      const s = Math.min(NEED, performance.now() - last.current);
      setStill(s);
      setScatter((v) => Math.max(0, v - 0.03));
      if (s >= NEED && !finished.current) {
        finished.current = true;
        window.setTimeout(onDone, 1400);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      events.forEach((e) => window.removeEventListener(e, disturb));
    };
  }, [onDone]);

  const p = still / NEED;
  const parts = Array.from({ length: 10 }, (_, i) => {
    const a = (i / 10) * Math.PI * 2;
    const d = 6 + scatter * 70;
    return { x: Math.cos(a) * d, y: Math.sin(a) * d };
  });
  return (
    <svg viewBox="-150 -150 300 300" className="game-svg" aria-hidden="true">
      <circle r={40 + p * 90} className="game-glow" style={{ opacity: 0.15 + p * 0.6 }} />
      {parts.map((pt, i) => (
        <circle key={i} cx={pt.x} cy={pt.y} r={2.2} className="game-dot" style={{ opacity: scatter }} />
      ))}
      <circle r={4 + p * 22} className="game-dot" />
    </svg>
  );
}
