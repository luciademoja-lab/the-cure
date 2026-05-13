import React from 'react';
import { SynchronicMatch } from '../types/synchronicity';
import { useTranslation } from '../i18n/I18nProvider';
import '../styles/SynchronicityMatchCard.css';

interface SynchronicityMatchCardProps {
  match: SynchronicMatch;
  onViewDetails?: () => void;
}

export function SynchronicityMatchCard({ match, onViewDetails }: SynchronicityMatchCardProps) {
  const { t } = useTranslation();
  const scorePercentage = Math.round(match.synchronicityScore);
  const scoreLevel =
    scorePercentage >= 80 ? 'strong' : scorePercentage >= 60 ? 'moderate' : 'subtle';

  const resonanceColor =
    match.resonanceType === 'emotional'
      ? '#FF6B9D'
      : match.resonanceType === 'thematic'
        ? '#4ECDC4'
        : match.resonanceType === 'symbolic'
          ? '#FFE66D'
          : '#95E1D3';

  return (
    <div className={`synchronicity-match-card score-${scoreLevel}`}>
      <div className="match-header">
        <h3>{t('synchronicity.card.title')}</h3>
        <div className="score-badge">
          <span className="score-value">{scorePercentage}%</span>
          <span className="score-label">
            {t('synchronicity.scoreLabel', { type: t(`synchronicities.${match.resonanceType}`) })}
          </span>
        </div>
      </div>

      <div className="match-body">
        <div className="common-themes">
          <h4>{t('synchronicity.sharedThemes')}</h4>
          <div className="themes-display">
            {match.commonThemes.length > 0 ? (
              match.commonThemes.map((theme) => (
                <span key={theme} className="theme-chip" style={{ borderColor: resonanceColor }}>
                  {theme}
                </span>
              ))
            ) : (
              <span className="no-themes">{t('synchronicity.noCommonThemes')}</span>
            )}
          </div>
        </div>

        <div className="insights-section">
          <h4>{t('synchronicity.insightTitle')}</h4>
          <div className="insights-list">
            {match.insights.length > 0 ? (
              match.insights.map((insight, idx) => (
                <p key={idx} className="insight-text">
                  ✨ {insight}
                </p>
              ))
            ) : (
              <p className="no-insights">{t('synchronicity.exploreConnection')}</p>
            )}
          </div>
        </div>

        {onViewDetails && (
          <button className="view-details-btn" onClick={onViewDetails}>
            {t('synchronicity.viewDetails')}
          </button>
        )}
      </div>

      <div className="match-footer">
        <span className="resonance-indicator" style={{ backgroundColor: resonanceColor }} />
        <span className="score-text">{t('synchronicity.synchronizedText', { score: scorePercentage })}</span>
      </div>
    </div>
  );
}
