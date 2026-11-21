/**
 * Le carte di Elayra: Arcani Maggiori con i gatti, a pennellate d'oro su fondo scuro
 * (ispirati al gatto a linee disegnato da Lumira). Il retro porta il segno completo.
 */
import { CAT_ART } from './catArt';

const ROMAN = ['0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI'];

/** Punti di una stella a `n` punte centrata in (cx, cy). */
const star = (cx: number, cy: number, r: number, inner: number, n: number) =>
  Array.from({ length: n * 2 }, (_, i) => {
    const a = (Math.PI * i) / n - Math.PI / 2;
    const rad = i % 2 === 0 ? r : inner;
    return `${(cx + rad * Math.cos(a)).toFixed(1)},${(cy + rad * Math.sin(a)).toFixed(1)}`;
  }).join(' ');

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
        {/* Disegni generati da noi (catArt.ts), non contenuti dell'utente. */}
        <g className="tarot-cat" dangerouslySetInnerHTML={{ __html: CAT_ART[id]?.cat || '' }} />
        <g className="tarot-card-glyph tarot-card-glyph--thin" dangerouslySetInnerHTML={{ __html: CAT_ART[id]?.lines || '' }} />
        <path d="M20 170 L100 170" className="tarot-card-frame" />
        <text x="60" y="184" textAnchor="middle" className="tarot-card-name" style={name.length > 16 ? { fontSize: '8px' } : undefined}>
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
