import { useEffect, useState } from 'react';

type Props = {
  text: string;
  /** Attesa prima che inizi a scrivere, in millisecondi. */
  delay?: number;
  className?: string;
};

/**
 * Poche righe di Elayra che compaiono come scritte in quel momento, nei colori della pagina.
 * Servono a indicare il prossimo passo senza popup né frecce.
 */
export function ElayraWhisper({ text, delay = 600, className = '' }: Props) {
  const reduced =
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const [shown, setShown] = useState(reduced ? text.length : 0);

  useEffect(() => {
    if (reduced) {
      setShown(text.length);
      return;
    }
    setShown(0);
    let i = 0;
    let timer = window.setTimeout(function tick() {
      i += 1;
      setShown(i);
      if (i < text.length) {
        // Un respiro più lungo dopo la punteggiatura, come chi scrive pensando.
        const pause = /[.,;:!?…]/.test(text[i - 1]) ? 220 : 28;
        timer = window.setTimeout(tick, pause);
      }
    }, delay);
    return () => window.clearTimeout(timer);
  }, [text, delay, reduced]);

  return (
    <span className={`elayra-whisper ${className}`}>
      <span className="elayra-whisper-text" aria-hidden="true">{text.slice(0, shown)}</span>
      <span className="visually-hidden">{text}</span>
    </span>
  );
}
