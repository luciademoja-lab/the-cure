import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../i18n/I18nProvider';
import { pageByKey } from '../../lib/discovery';

/** Pausa tra due messaggi di Elayra, mentre si vedono i puntini di "sta scrivendo". */
const PAUSE_MS = 1100;

export type ElayraPart = { text: string; pages: string[] };

/**
 * Elayra può mandare più messaggi di fila (separati da [[pausa]]) e mettere sotto un messaggio
 * il pulsante di una pagina ([[pagina:chiave]]). Qui il testo grezzo diventa bolle e pulsanti.
 */
export function splitElayra(content: string): ElayraPart[] {
  return content
    .split(/\s*\[\[pausa\]\]\s*/)
    .map((piece) => {
      const pages: string[] = [];
      const text = piece
        .replace(/\[\[pagina:([a-z-]+)\]\]/g, (_m, key: string) => {
          if (pageByKey(key) && !pages.includes(key)) pages.push(key);
          return '';
        })
        // Un marcatore ancora a metà mentre arriva il testo non si mostra.
        .replace(/\[\[[a-z:-]*$/, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
      return { text, pages };
    })
    .filter((p) => p.text || p.pages.length);
}

/** Testo leggibile, senza marcatori (per la voce e per copiare). */
export const plainElayra = (content: string) =>
  splitElayra(content)
    .map((p) => p.text)
    .join('\n\n');

type Props = {
  content: string;
  /** true mentre il messaggio arriva: le bolle compaiono una alla volta. */
  live?: boolean;
  className?: string;
};

export function ElayraBubbles({ content, live = false, className = '' }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const parts = splitElayra(content);
  // Un messaggio della cronologia si mostra tutto; uno nuovo una bolla alla volta.
  const [shown, setShown] = useState(live ? 1 : parts.length);
  const wasLive = useRef(live);
  if (live) wasLive.current = true;

  useEffect(() => {
    if (!wasLive.current) {
      setShown(parts.length);
      return;
    }
    if (shown >= parts.length) return;
    const timer = window.setTimeout(() => setShown((n) => n + 1), PAUSE_MS);
    return () => window.clearTimeout(timer);
  }, [parts.length, shown]);

  const visible = parts.slice(0, Math.max(1, shown));
  const waiting = shown < parts.length;

  return (
    <>
      {visible.map((part, i) => (
        <div key={i} className={`chat-message assistant ${className} ${wasLive.current && i > 0 ? 'is-arriving' : ''}`}>
          {part.text && <p>{part.text}</p>}
          {part.pages.length > 0 && (
            <div className="chat-page-buttons">
              {part.pages.map((key) => {
                const page = pageByKey(key);
                if (!page) return null;
                return (
                  <button key={key} type="button" className="chat-page-button" onClick={() => navigate(page.path)}>
                    {t('guide.open', { page: t(page.label) })}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ))}
      {waiting && (
        <div className="chat-message assistant thinking">
          <div className="typing-indicator" aria-label={t('journal.chat.thinking')}>
            <span />
            <span />
            <span />
          </div>
        </div>
      )}
    </>
  );
}
