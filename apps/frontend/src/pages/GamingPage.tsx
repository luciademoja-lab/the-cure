import { useEffect, useState } from 'react';
import { useTranslation } from '../i18n/I18nProvider';
import { apiGet, apiPost } from '../lib/api';
import { SacredSymbol, symbolForLevel } from '../components/atoms/SacredSymbol';

type Level = {
  level: number;
  symbol: string;
  name: string;
  threshold: number;
  unlocked: boolean;
  question: string | null;
  response: string;
};

type Progress = {
  lightPoints: number;
  level: number;
  levelName: string;
  nextLevelAt: number | null;
  levels: Level[];
};

/** Il Percorso: i punti luce aprono i livelli, ogni livello consegna una domanda. */
export function GamingPage() {
  const { t } = useTranslation();
  const [progress, setProgress] = useState<Progress | null>(null);
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [savingLevel, setSavingLevel] = useState<number | null>(null);
  const [savedLevel, setSavedLevel] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [hintOpen, setHintOpen] = useState<number | null>(null);

  // Si ricarica anche quando si torna su questa scheda: i punti arrivano da diario e rituali.
  useEffect(() => {
    let active = true;
    const load = () =>
      apiGet<Progress>('/api/progress')
        .then((data) => {
          if (!active) return;
          setProgress(data);
          // Non sovrascrive ciò che si sta scrivendo.
          setDrafts((prev) => ({ ...Object.fromEntries(data.levels.map((l) => [l.level, l.response])), ...prev }));
        })
        .catch((e) => {
          if (active) setError(e instanceof Error ? e.message : t('chat.error.generic'));
        });
    void load();
    const onVisible = () => {
      if (document.visibilityState === 'visible') void load();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return () => {
      active = false;
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async (level: number) => {
    const response = (drafts[level] || '').trim();
    if (!response) return;
    setSavingLevel(level);
    setSavedLevel(null);
    setError('');
    try {
      await apiPost('/api/progress/reflections', { level, response });
      setSavedLevel(level);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('chat.error.generic'));
    } finally {
      setSavingLevel(null);
    }
  };

  const current = progress?.levels.find((l) => l.level === progress.level);
  const span = progress && progress.nextLevelAt !== null && current ? progress.nextLevelAt - current.threshold : 0;
  const percent =
    progress && current && span > 0 ? Math.min(100, Math.round(((progress.lightPoints - current.threshold) / span) * 100)) : 100;

  return (
    <main className="page-shell path-page">
      <h1>{t('gaming.title')}</h1>
      <p className="path-intro">{t('gaming.description')}</p>

      {error && (
        <p className="page-error" role="alert">
          {error}
        </p>
      )}

      {!progress && !error && <p className="path-intro">{t('path.loading')}</p>}

      {progress && (
        <>
          <section className="card path-summary" aria-label={t('path.summaryLabel')}>
            <div className="path-summary-row">
              <span className="path-points">{progress.lightPoints}</span>
              <span className="path-points-label">{t('path.lightPoints')}</span>
            </div>
            <div
              className="path-bar"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={percent}
              aria-label={t('path.progressLabel')}
            >
              <div className="path-bar-fill" style={{ width: `${percent}%` }} />
            </div>
            <p className="path-next">
              {progress.nextLevelAt === null
                ? t('path.allOpen')
                : t('path.next', { points: progress.nextLevelAt - progress.lightPoints })}
            </p>
            <details className="path-guide">
              <summary>{t('path.guide.title')}</summary>
              <ul>
                <li>{t('path.guide.journal')}</li>
                <li>{t('path.guide.rituals')}</li>
                <li>{t('path.guide.levels')}</li>
                <li>{t('path.guide.answers')}</li>
              </ul>
            </details>
          </section>

          <ol className="path-levels">
            {progress.levels.map((l) => (
              <li key={l.level} className={`card path-level ${l.unlocked ? 'unlocked' : 'locked'}`}>
                <div className="path-level-header">
                  <span className="path-symbol">
                    <SacredSymbol kind={symbolForLevel(l.level)} size={30} />
                  </span>
                  <h3>
                    {l.level}. {l.name}
                  </h3>
                  {!l.unlocked && (
                    <span className="path-threshold">
                      {t('path.missing', { points: l.threshold - progress.lightPoints })}
                    </span>
                  )}
                  <button
                    type="button"
                    className={`path-hint-button ${hintOpen === l.level ? 'is-open' : ''}`}
                    aria-expanded={hintOpen === l.level}
                    aria-controls={`path-hint-${l.level}`}
                    aria-label={t('path.hintLabel', { name: l.name })}
                    onClick={() => setHintOpen((v) => (v === l.level ? null : l.level))}
                  >
                    ?
                  </button>
                </div>
                {hintOpen === l.level && (
                  <div className="path-hint" id={`path-hint-${l.level}`}>
                    <p>{t(`path.hint.${l.level}`)}</p>
                    <p className="path-hint-points">
                      {l.unlocked
                        ? t('path.hintOpen')
                        : t('path.hintMissing', { points: l.threshold - progress.lightPoints })}
                    </p>
                  </div>
                )}
                {l.unlocked && l.question && (
                  <>
                    <blockquote className="path-question">{l.question}</blockquote>
                    <textarea
                      className="journal-textarea"
                      rows={3}
                      maxLength={4000}
                      aria-label={l.question}
                      placeholder={t('path.placeholder')}
                      value={drafts[l.level] || ''}
                      onChange={(e) => setDrafts((prev) => ({ ...prev, [l.level]: e.target.value }))}
                    />
                    <div className="path-actions">
                      <button
                        type="button"
                        className="cta-button secondary"
                        onClick={() => save(l.level)}
                        disabled={savingLevel === l.level || !(drafts[l.level] || '').trim()}
                      >
                        {t('path.save')}
                      </button>
                      {savedLevel === l.level && (
                        <span className="path-saved" role="status">
                          {t('path.saved')}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </li>
            ))}
          </ol>
        </>
      )}
    </main>
  );
}
