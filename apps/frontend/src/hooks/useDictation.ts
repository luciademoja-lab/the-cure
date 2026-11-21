import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Dettatura con il riconoscimento vocale del browser (Chrome, Edge, Safari).
 * Restituisce il testo man mano: `onFinal` riceve i pezzi definitivi, `interim` è quello ancora in corso.
 * In Firefox e nei browser senza supporto `supported` è falso e il pulsante non si mostra.
 */

type RecognitionResult = { isFinal: boolean; 0: { transcript: string } };
type RecognitionEvent = { resultIndex: number; results: ArrayLike<RecognitionResult> };
interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: RecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
}
type RecognitionCtor = new () => Recognition;

function recognitionCtor(): RecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export const speechLang = (locale: string) => (locale === 'it' ? 'it-IT' : 'en-US');

export function useDictation(opts: {
  locale: string;
  onFinal: (text: string) => void;
  onInterim?: (text: string) => void;
  onSilence?: () => void;
}) {
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState('');
  const [error, setError] = useState('');
  const recRef = useRef<Recognition | null>(null);
  const wantRef = useRef(false);
  const optsRef = useRef(opts);
  optsRef.current = opts;
  const supported = recognitionCtor() !== null;

  const stop = useCallback(() => {
    wantRef.current = false;
    recRef.current?.stop();
  }, []);

  const start = useCallback(() => {
    const Ctor = recognitionCtor();
    if (!Ctor) return;
    setError('');
    const rec = new Ctor();
    rec.lang = speechLang(optsRef.current.locale);
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e) => {
      let pending = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        const text = r[0].transcript;
        if (r.isFinal) {
          const clean = text.trim();
          if (clean) optsRef.current.onFinal(clean);
        } else {
          pending += text;
        }
      }
      setInterim(pending);
      if (pending) optsRef.current.onInterim?.(pending);
    };
    rec.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        wantRef.current = false;
        setError('mic');
      } else if (e.error === 'no-speech') {
        optsRef.current.onSilence?.();
      }
    };
    rec.onend = () => {
      setInterim('');
      // Il browser chiude la sessione dopo una pausa: se la persona sta ancora dettando, riparte.
      if (wantRef.current) {
        try {
          rec.start();
          return;
        } catch {
          /* già avviato */
        }
      }
      setListening(false);
      recRef.current = null;
    };
    recRef.current = rec;
    wantRef.current = true;
    try {
      rec.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  }, []);

  useEffect(
    () => () => {
      wantRef.current = false;
      recRef.current?.abort();
    },
    []
  );

  return { supported, listening, interim, error, start, stop };
}

/** Aggiunge un pezzo dettato al testo, con lo spazio giusto. */
export function appendDictated(current: string, piece: string): string {
  if (!current.trim()) return piece.charAt(0).toUpperCase() + piece.slice(1);
  return /\s$/.test(current) ? current + piece : `${current} ${piece}`;
}
