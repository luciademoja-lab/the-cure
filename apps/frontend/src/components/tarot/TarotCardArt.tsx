/**
 * Le carte di Elayra: Arcani Maggiori disegnati a linee d'oro su fondo scuro.
 * Ogni carta ha il suo segno; il retro porta il segno completo (cerchio, triangolo, punto).
 */
import type { ReactNode } from 'react';

const ROMAN = ['0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI'];

/** Punti di una stella a `n` punte centrata in (cx, cy). */
const star = (cx: number, cy: number, r: number, inner: number, n: number) =>
  Array.from({ length: n * 2 }, (_, i) => {
    const a = (Math.PI * i) / n - Math.PI / 2;
    const rad = i % 2 === 0 ? r : inner;
    return `${(cx + rad * Math.cos(a)).toFixed(1)},${(cy + rad * Math.sin(a)).toFixed(1)}`;
  }).join(' ');

/** I segni delle 22 carte, in un riquadro 120×120 centrato su (60, 60). */
const GLYPHS: Record<number, ReactNode> = {
  0: (
    <>
      <circle cx="46" cy="34" r="9" />
      <path d="M22 98 L72 98 L88 70" />
      <path d="M52 44 L60 72 L48 98" />
      <path d="M60 58 L80 48" />
      <polygon points={star(92, 30, 7, 3, 4)} />
    </>
  ),
  1: (
    <>
      <path d="M40 28 C30 18, 30 38, 40 28 C50 18, 70 38, 80 28 C90 18, 90 38, 80 28 C70 18, 50 38, 40 28 Z" />
      <path d="M60 46 L60 100" />
      <circle cx="60" cy="46" r="4" />
      <path d="M36 100 L84 100" />
      <path d="M44 70 L76 70" />
    </>
  ),
  2: (
    <>
      <path d="M30 24 L30 100 M90 24 L90 100" />
      <path d="M70 38 A22 22 0 1 0 70 82 A30 30 0 0 1 70 38 Z" />
      <circle cx="60" cy="96" r="3" />
    </>
  ),
  3: (
    <>
      <circle cx="60" cy="50" r="22" />
      <path d="M60 72 L60 104 M46 90 L74 90" />
      <polygon points={star(60, 50, 8, 3.5, 6)} />
    </>
  ),
  4: (
    <>
      <rect x="34" y="46" width="52" height="52" />
      <path d="M36 36 L44 22 L52 34 L60 18 L68 34 L76 22 L84 36 Z" />
      <path d="M60 46 L60 98 M34 72 L86 72" />
    </>
  ),
  5: (
    <>
      <path d="M60 18 L60 104" />
      <path d="M48 34 L72 34 M44 48 L76 48 M40 62 L80 62" />
      <circle cx="60" cy="86" r="10" />
    </>
  ),
  6: (
    <>
      <circle cx="48" cy="62" r="22" />
      <circle cx="72" cy="62" r="22" />
      <polygon points={star(60, 24, 8, 3.5, 8)} />
    </>
  ),
  7: (
    <>
      <path d="M30 52 L90 52 L84 84 L36 84 Z" />
      <circle cx="40" cy="94" r="9" />
      <circle cx="80" cy="94" r="9" />
      <polygon points={star(60, 30, 12, 5, 8)} />
    </>
  ),
  8: (
    <>
      <path d="M40 30 C30 20, 30 40, 40 30 C50 20, 70 40, 80 30 C90 20, 90 40, 80 30 C70 20, 50 40, 40 30 Z" />
      <circle cx="60" cy="74" r="14" />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (Math.PI * i) / 6;
        return <path key={i} d={`M${60 + 18 * Math.cos(a)} ${74 + 18 * Math.sin(a)} Q${60 + 24 * Math.cos(a + 0.2)} ${74 + 24 * Math.sin(a + 0.2)} ${60 + 26 * Math.cos(a)} ${74 + 26 * Math.sin(a)}`} />;
      })}
      <path d="M54 78 Q60 82 66 78" />
    </>
  ),
  9: (
    <>
      <path d="M50 40 L70 40 L74 78 L46 78 Z" />
      <path d="M60 28 L60 40 M56 78 L56 88 L64 88 L64 78" />
      <polygon points={star(60, 60, 9, 4, 6)} />
      <path d="M86 20 L86 106" />
    </>
  ),
  10: (
    <>
      <circle cx="60" cy="60" r="34" />
      <circle cx="60" cy="60" r="10" />
      {Array.from({ length: 8 }, (_, i) => {
        const a = (Math.PI * i) / 4;
        return <path key={i} d={`M${60 + 10 * Math.cos(a)} ${60 + 10 * Math.sin(a)} L${60 + 34 * Math.cos(a)} ${60 + 34 * Math.sin(a)}`} />;
      })}
    </>
  ),
  11: (
    <>
      <path d="M60 22 L60 100 M44 100 L76 100 M28 40 L92 40" />
      <path d="M28 40 L18 68 L38 68 Z M92 40 L82 68 L102 68 Z" />
      <circle cx="60" cy="22" r="4" />
    </>
  ),
  12: (
    <>
      <path d="M26 22 L94 22 M60 22 L60 44" />
      <path d="M60 104 L40 64 L80 64 Z" />
      <circle cx="60" cy="54" r="8" />
    </>
  ),
  13: (
    <>
      <path d="M18 84 L102 84" />
      <path d="M34 84 A26 26 0 0 1 86 84" />
      <path d="M60 44 L60 30 M36 56 L28 48 M84 56 L92 48 M46 48 L42 38 M74 48 L78 38" />
      <path d="M40 98 L80 98" />
    </>
  ),
  14: (
    <>
      <path d="M30 34 L50 34 L46 54 L34 54 Z M70 66 L90 66 L86 86 L74 86 Z" />
      <path d="M48 46 C64 48, 60 70, 76 72" />
      <polygon points="60,98 50,108 70,108" />
    </>
  ),
  15: (
    <>
      <circle cx="46" cy="60" r="16" />
      <circle cx="74" cy="60" r="16" />
      <path d="M30 26 L42 40 M90 26 L78 40 M60 86 L60 106" />
    </>
  ),
  16: (
    <>
      <path d="M44 104 L48 44 L72 44 L76 104 Z" />
      <path d="M44 44 L44 34 L52 34 L52 40 L58 40 L58 34 L62 34 L62 40 L68 40 L68 34 L76 34 L76 44" />
      <path d="M88 12 L72 34 L82 34 L66 56" />
      <rect x="55" y="62" width="10" height="14" />
    </>
  ),
  17: (
    <>
      <polygon points={star(60, 46, 26, 9, 8)} />
      <polygon points={star(26, 24, 6, 2.5, 4)} />
      <polygon points={star(94, 26, 6, 2.5, 4)} />
      <polygon points={star(24, 76, 5, 2, 4)} />
      <polygon points={star(96, 80, 5, 2, 4)} />
      <path d="M30 100 Q60 88 90 100" />
    </>
  ),
  18: (
    <>
      <path d="M74 24 A30 30 0 1 0 74 84 A40 40 0 0 1 74 24 Z" />
      <path d="M40 92 L40 100 M60 96 L60 106 M80 92 L80 100" />
    </>
  ),
  19: (
    <>
      <circle cx="60" cy="58" r="20" />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (Math.PI * i) / 6;
        return <path key={i} d={`M${60 + 26 * Math.cos(a)} ${58 + 26 * Math.sin(a)} L${60 + 38 * Math.cos(a)} ${58 + 38 * Math.sin(a)}`} />;
      })}
    </>
  ),
  20: (
    <>
      <path d="M30 34 L74 24 L74 50 L30 40 Z" />
      <path d="M74 24 L90 14 L90 60 L74 50" />
      <path d="M30 104 L30 78 M60 104 L60 70 M90 104 L90 78" />
      <path d="M22 104 L98 104" />
    </>
  ),
  21: (
    <>
      <ellipse cx="60" cy="60" rx="28" ry="40" />
      <circle cx="60" cy="60" r="16" />
      <path d="M60 46 L72 66 L48 66 Z" />
      <circle cx="60" cy="60" r="2.5" fill="currentColor" />
    </>
  ),
};

type Locale = 'it' | 'en';

/** Fronte della carta. Le carte capovolte si disegnano ruotate, come sul tavolo. */
export function TarotCardFront({
  id,
  name,
  reversed = false,
}: {
  id: number;
  name: string;
  reversed?: boolean;
}) {
  return (
    <svg viewBox="0 0 120 200" className="tarot-card-svg" role="img" aria-label={name}>
      <g transform={reversed ? 'rotate(180 60 100)' : undefined}>
        <rect x="2" y="2" width="116" height="196" rx="10" className="tarot-card-bg" />
        <rect x="8" y="8" width="104" height="184" rx="6" className="tarot-card-frame" />
        <text x="60" y="26" textAnchor="middle" className="tarot-card-number">
          {ROMAN[id]}
        </text>
        <g className="tarot-card-glyph" transform="translate(0 40)">
          {GLYPHS[id]}
        </g>
        <path d="M20 166 L100 166" className="tarot-card-frame" />
        <text x="60" y="182" textAnchor="middle" className="tarot-card-name" style={name.length > 16 ? { fontSize: '8px' } : undefined}>
          {name}
        </text>
      </g>
    </svg>
  );
}

/** Retro della carta: il segno di Elayra. */
export function TarotCardBack() {
  return (
    <svg viewBox="0 0 120 200" className="tarot-card-svg" aria-hidden="true">
      <rect x="2" y="2" width="116" height="196" rx="10" className="tarot-card-bg" />
      <rect x="8" y="8" width="104" height="184" rx="6" className="tarot-card-frame" />
      <rect x="14" y="14" width="92" height="172" rx="4" className="tarot-card-frame tarot-card-frame--thin" />
      <g className="tarot-card-glyph">
        <circle cx="60" cy="100" r="30" />
        <path d="M60 78.5 L77.9 109.5 L42.1 109.5 Z" />
        <circle cx="60" cy="100" r="3" fill="currentColor" />
      </g>
      {[30, 170].map((y) => (
        <polygon key={y} points={star(60, y, 6, 2.5, 4)} className="tarot-card-glyph" />
      ))}
    </svg>
  );
}

export const cardName = (card: { name: { it: string; en: string } }, locale: Locale | string) =>
  locale === 'it' ? card.name.it : card.name.en;
