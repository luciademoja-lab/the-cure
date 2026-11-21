import { useEffect, useRef, useState } from 'react';
import { useTranslation } from '../../i18n/I18nProvider';
import type { GameProps } from './PathGame';

/** Lo Specchio: si toglie la nebbia con il dito; sotto c'è la propria risposta, prima rovesciata. */
export function MirrorGame({ onDone, response }: GameProps) {
  const { t } = useTranslation();
  const canvas = useRef<HTMLCanvasElement>(null);
  const [clear, setClear] = useState(false);
  const drawing = useRef(false);
  const text = response.trim() || t('games.4.fallback');

  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const ratio = window.devicePixelRatio || 1;
    const rect = c.getBoundingClientRect();
    c.width = rect.width * ratio;
    c.height = rect.height * ratio;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.scale(ratio, ratio);
    const g = ctx.createLinearGradient(0, 0, rect.width, rect.height);
    g.addColorStop(0, 'rgba(200, 190, 170, 0.92)');
    g.addColorStop(1, 'rgba(150, 140, 125, 0.92)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, rect.width, rect.height);
  }, []);

  const wipe = (x: number, y: number) => {
    const c = canvas.current;
    const ctx = c?.getContext('2d');
    if (!c || !ctx || clear) return;
    const rect = c.getBoundingClientRect();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x - rect.left, y - rect.top, 26, 0, Math.PI * 2);
    ctx.fill();
    // Quanto è pulito lo specchio? Si campiona una griglia di punti.
    const data = ctx.getImageData(0, 0, c.width, c.height).data;
    let empty = 0;
    let total = 0;
    for (let i = 3; i < data.length; i += 4 * 97) {
      total++;
      if (data[i] < 40) empty++;
    }
    if (empty / total > 0.55) {
      setClear(true);
      window.setTimeout(onDone, 3200);
    }
  };

  return (
    <div className="mirror">
      <div className="mirror-frame">
        <p className={`mirror-text ${clear ? 'is-true' : ''}`}>{text}</p>
        <canvas
          ref={canvas}
          className={`mirror-fog ${clear ? 'is-gone' : ''}`}
          aria-label={t('games.4.hint')}
          onPointerDown={(e) => {
            drawing.current = true;
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
            wipe(e.clientX, e.clientY);
          }}
          onPointerMove={(e) => drawing.current && wipe(e.clientX, e.clientY)}
          onPointerUp={() => (drawing.current = false)}
        />
      </div>
    </div>
  );
}
