import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../../i18n/I18nProvider';
import { SacredSymbol, symbolForLevel } from '../atoms/SacredSymbol';
import { PointGame } from './PointGame';
import { ListeningGame } from './ListeningGame';
import { CircleGame } from './CircleGame';
import { MirrorGame } from './MirrorGame';
import { ThresholdGame } from './ThresholdGame';
import { FlameGame } from './FlameGame';
import { ForgeGame } from './ForgeGame';
import './pathGames.css';

export type GameProps = { onDone: () => void; name: string; response: string };

const GAMES: Record<number, (p: GameProps) => JSX.Element> = {
  1: PointGame,
  2: ListeningGame,
  3: CircleGame,
  4: MirrorGame,
  5: ThresholdGame,
  6: FlameGame,
  7: ForgeGame,
};

/**
 * Il giochino di un livello del Percorso: si apre dopo aver salvato la risposta.
 * Si può saltare; alla fine c'è una rivelazione.
 */
export function PathGame({
  level,
  levelName,
  name,
  response,
  onClose,
}: {
  level: number;
  levelName: string;
  name: string;
  response: string;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [done, setDone] = useState(false);
  const Game = GAMES[level];
  const who = name || t('games.friend');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  if (!Game) return null;

  const revelation = t(`games.${level}.reveal`, { name: who });
  const showResponse = [2, 4, 6].includes(level) && response.trim();

  return (
    <div className="path-game" role="dialog" aria-modal="true" aria-label={levelName}>
      <header className="path-game-head">
        <span className="path-game-title">
          <SacredSymbol kind={symbolForLevel(level)} size={22} /> {levelName}
        </span>
        <button type="button" className="path-game-close" aria-label={t('common.close')} onClick={onClose}>
          ×
        </button>
      </header>

      {!done ? (
        <>
          <p className="path-game-hint">{t(`games.${level}.hint`)}</p>
          <div className="path-game-stage">
            <Game onDone={() => setDone(true)} name={who} response={response} />
          </div>
          <button type="button" className="path-game-skip" onClick={() => setDone(true)}>
            {t('games.skip')}
          </button>
        </>
      ) : (
        <div className="path-game-reveal" aria-live="polite">
          <div className="path-game-reveal-sign">
            <SacredSymbol kind={symbolForLevel(level)} size={64} />
          </div>
          <p className="path-game-reveal-text">{revelation}</p>
          {showResponse && <blockquote className="path-game-reveal-quote">{response}</blockquote>}
          <div className="path-game-reveal-actions">
            {level === 7 && (
              <Link to="/forge" className="cta-button primary" onClick={onClose}>
                {t('games.7.toForge')}
              </Link>
            )}
            <button type="button" className="cta-button secondary" onClick={onClose}>
              {t('games.back')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
