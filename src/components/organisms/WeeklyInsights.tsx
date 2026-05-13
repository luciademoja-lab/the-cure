import { JournalEntry } from '../../types/journal';
import { useTranslation } from '../../i18n/I18nProvider';

type WeeklyInsightsProps = {
  entries: JournalEntry[];
};

export function WeeklyInsights({ entries }: WeeklyInsightsProps) {
  const { t } = useTranslation();

  if (entries.length === 0) {
    return null;
  }

  const averageMood = entries.length > 0 ? Math.round(entries.reduce((sum, e) => sum + e.mood, 0) / entries.length) : 0;

  const allTags = entries.flatMap((e) => e.aiTags);
  const tagCounts = allTags.reduce(
    (acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const topTags = Object.entries(tagCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  const totalLightPoints = entries.reduce((sum, e) => sum + (e.lightPointsEarned || 0), 0);

  return (
    <section className="weekly-insights card">
      <h3>{t('weekly.header')}</h3>

      <div className="insights-grid">
        <div className="insight-stat">
          <div className="stat-label">{t('weekly.entries')}</div>
          <div className="stat-value">{entries.length}</div>
        </div>

        <div className="insight-stat">
          <div className="stat-label">{t('weekly.averageMood')}</div>
          <div className="stat-value">{averageMood}/10</div>
        </div>

        <div className="insight-stat">
          <div className="stat-label">{t('weekly.lightPoints')}</div>
          <div className="stat-value">✦ {totalLightPoints}</div>
        </div>
      </div>

      {topTags.length > 0 && (
        <div className="themes-section">
          <p className="themes-label">{t('weekly.themesLabel')}</p>
          <div className="themes-list">
            {topTags.map(([tag, count]) => (
              <span key={tag} className="theme-tag">
                {tag} <span className="theme-count">×{count}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
