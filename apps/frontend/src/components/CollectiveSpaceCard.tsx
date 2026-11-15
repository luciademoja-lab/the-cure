import React from 'react';
import { CollectiveReflectionSpace } from '../types/synchronicity';
import { useTranslation } from '../i18n/I18nProvider';
import '../styles/CollectiveSpaceCard.css';

interface CollectiveSpaceCardProps {
  space: CollectiveReflectionSpace;
  onExplore?: () => void;
}

export function CollectiveSpaceCard({ space, onExplore }: CollectiveSpaceCardProps) {
  const { t } = useTranslation();
  const moodDescriptions: Record<number, string> = {
    1: t('collectiveMoodDescriptions.1'),
    2: t('collectiveMoodDescriptions.2'),
    3: t('collectiveMoodDescriptions.3'),
    4: t('collectiveMoodDescriptions.4'),
    5: t('collectiveMoodDescriptions.5'),
    6: t('collectiveMoodDescriptions.6'),
    7: t('collectiveMoodDescriptions.7'),
    8: t('collectiveMoodDescriptions.8'),
    9: t('collectiveMoodDescriptions.9'),
    10: t('collectiveMoodDescriptions.10'),
  };

  const moodDescription = moodDescriptions[space.dominantMood] || t('collectiveMoodDescriptions.default');

  return (
    <div className="collective-space-card">
      <div className="space-header">
        <h3>🌀 {space.theme}</h3>
        <div className="space-meta">
          <span className="participant-count">
            {t('collective.card.participants', { count: space.participantCount })}
          </span>
          <span className="resonance-score">
            {t('collective.card.resonanceScore', { score: Math.round(space.collectiveResonance) })}
          </span>
        </div>
      </div>

      <div className="space-body">
        <div className="mood-indicator">
          <h4>{t('collective.card.moodHeader')}</h4>
          <div className="mood-display">
            <div className="mood-bar">
              <div
                className="mood-fill"
                style={{ width: `${(space.dominantMood / 10) * 100}%` }}
              />
            </div>
            <span className="mood-description">
              {space.dominantMood}/10 - {moodDescription}
            </span>
          </div>
        </div>

        <div className="insights-preview">
          <h4>{t('collective.card.sharedWisdom')}</h4>
          <div className="insights-grid">
            {space.sharedInsights.slice(0, 3).map((insight, idx) => (
              <div key={idx} className="insight-preview">
                <p className="insight-text">{insight.insight.substring(0, 80)}...</p>
                <span className="insight-tags">
                  {insight.tags.slice(0, 2).join(', ')}
                </span>
              </div>
            ))}
          </div>
          {space.sharedInsights.length > 3 && (
            <p className="more-insights">
              {t('collective.card.moreInsights', { count: space.sharedInsights.length - 3 })}
            </p>
          )}
        </div>

        {onExplore && (
          <button className="explore-btn" onClick={onExplore}>
            {t('collective.card.exploreButton')}
          </button>
        )}
      </div>
    </div>
  );
}
