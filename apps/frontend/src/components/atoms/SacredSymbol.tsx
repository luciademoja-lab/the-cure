/**
 * I tre segni di Elayra: punto, cerchio, triangolo.
 * "all" è il segno completo: un cerchio che contiene un triangolo più piccolo che contiene un punto.
 */
export type SymbolKind = 'point' | 'circle' | 'triangle' | 'all';

export function SacredSymbol({ kind, size = 28, className = '' }: { kind: SymbolKind; size?: number; className?: string }) {
  const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 2.2, strokeLinejoin: 'round' as const };
  return (
    <svg
      className={`sacred-symbol ${className}`}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      aria-hidden="true"
      focusable="false"
    >
      {kind === 'point' && <circle cx="24" cy="24" r="6" fill="currentColor" />}
      {kind === 'circle' && <circle cx="24" cy="24" r="17" {...stroke} />}
      {kind === 'triangle' && <path d="M24 7 L41 37 L7 37 Z" {...stroke} />}
      {kind === 'all' && (
        <>
          <circle cx="24" cy="24" r="21" {...stroke} />
          {/* triangolo inscritto, centrato sul baricentro */}
          <path d="M24 9.5 L36.5 31.25 L11.5 31.25 Z" {...stroke} />
          <circle cx="24" cy="24" r="3.2" fill="currentColor" />
        </>
      )}
    </svg>
  );
}

export function symbolForLevel(level: number): SymbolKind {
  if (level >= 7) return 'all';
  if (level >= 5) return 'triangle';
  if (level >= 3) return 'circle';
  return 'point';
}
