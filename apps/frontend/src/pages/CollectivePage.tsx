import React, { useState, useEffect } from 'react';
import { useJournalEntries } from '../hooks/useJournalEntries';
import { aggregateThemesFromEntries, buildCollectiveReflectionSpace } from '../services/collectiveService';
import { CollectiveSpaceCard } from '../components/CollectiveSpaceCard';
import { CollectiveReflectionSpace } from '../types/synchronicity';
import { useTranslation } from '../i18n/I18nProvider';
import '../styles/pages/CollectivePage.css';

export function CollectivePage() {
  const { t } = useTranslation();
  const { entries } = useJournalEntries();
  const [spaces, setSpaces] = useState<CollectiveReflectionSpace[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'resonance' | 'participants' | 'mood'>('resonance');

  useEffect(() => {
    if (entries.length > 0) {
      const themes = aggregateThemesFromEntries(entries);
      const reflectionSpaces = themes.map((theme) =>
        buildCollectiveReflectionSpace(entries, theme)
      );

      const sorted = [...reflectionSpaces].sort((a, b) => {
        if (sortBy === 'resonance') {
          return b.collectiveResonance - a.collectiveResonance;
        } else if (sortBy === 'participants') {
          return b.participantCount - a.participantCount;
        } else {
          return b.dominantMood - a.dominantMood;
        }
      });

      setSpaces(sorted);
      if (sorted.length > 0 && !selectedTheme) {
        setSelectedTheme(sorted[0].theme);
      }
      setLoading(false);
    }
  }, [entries, sortBy]);

  const selectedSpace = spaces.find((s) => s.theme === selectedTheme);

  const averageResonance = spaces.length > 0 
    ? Math.round(spaces.reduce((sum, s) => sum + s.collectiveResonance, 0) / spaces.length)
    : 0;

  return (
    <div className="collective-page">
      <div className="page-header">
        <h1>{t('collective.title')}</h1>
        <p className="subtitle">{t('collective.subtitle')}</p>
      </div>

      <div className="page-content">
        {loading ? (
          <div className="loading-state">
            <p>{t('collective.loading')}</p>
          </div>
        ) : spaces.length === 0 ? (
          <div className="empty-state">
            <p>{t('collective.noThemes')}</p>
            <p className="subtitle">{t('collective.addEntries')}</p>
          </div>
        ) : (
          <div className="collective-container">
            <div className="themes-sidebar">
              <div className="sidebar-header">
                <h2>{t('collective.themes')}</h2>
                <span className="theme-count">{spaces.length}</span>
              </div>

              <div className="sort-controls">
                <button
                  className={`sort-btn ${sortBy === 'resonance' ? 'active' : ''}`}
                  onClick={() => setSortBy('resonance')}
                >
                  {t('collective.resonance')}
                </button>
                <button
                  className={`sort-btn ${sortBy === 'participants' ? 'active' : ''}`}
                  onClick={() => setSortBy('participants')}
                >
                  {t('collective.participants')}
                </button>
                <button
                  className={`sort-btn ${sortBy === 'mood' ? 'active' : ''}`}
                  onClick={() => setSortBy('mood')}
                >
                  {t('collective.mood')}
                </button>
              </div>

              <div className="themes-list">
                {spaces.map((space) => (
                  <button
                    key={space.theme}
                    className={`theme-button ${selectedTheme === space.theme ? 'active' : ''}`}
                    onClick={() => setSelectedTheme(space.theme)}
                  >
                    <span className="theme-name">{space.theme}</span>
                    <span className="theme-badge">{space.participantCount}</span>
                  </button>
                ))}
              </div>

              <div className="consent-notice">
                <p>{t('collective.anonymizedNotice')}</p>
              </div>
            </div>

            <div className="space-main">
              {selectedSpace && (
                <div className="space-detail">
                  <div className="space-header">
                    <h2>{selectedSpace.theme}</h2>
                    <div className="space-stats">
                      <div className="stat">
                        <span className="label">{t('collective.participants')}</span>
                        <span className="value">{selectedSpace.participantCount}</span>
                      </div>
                      <div className="stat">
                        <span className="label">{t('collective.resonance')}</span>
                        <span className="value">{Math.round(selectedSpace.collectiveResonance)}%</span>
                      </div>
                      <div className="stat">
                        <span className="label">{t('collective.mood')}</span>
                        <span className="value">{selectedSpace.dominantMood}/10</span>
                      </div>
                    </div>
                  </div>

                  <div className="shared-insights">
                    <h3>{t('collective.sharedWisdom')}</h3>
                    <div className="insights-cards">
                      {selectedSpace.sharedInsights.length > 0 ? (
                        selectedSpace.sharedInsights.map((insight, idx) => (
                          <div key={idx} className="insight-card">
                            <div className="insight-content">
                              <p className="insight-text">{insight.insight}</p>
                            </div>
                            <div className="insight-footer">
                              <span className="mood-indicator">
                                💭 {insight.moodLevel}/10
                              </span>
                              <span className="anonymity">🔒 {insight.anonymityLevel}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="no-insights">{t('collective.noInsights')}</p>
                      )}
                    </div>
                  </div>

                  <div className="invitation-section">
                    <h3>{t('collective.shareVoice')}</h3>
                    <p>
                      {t('collective.shareQuestion', { theme: selectedSpace.theme })}
                    </p>
                    <button className="share-btn">{t('collective.contributeButton')}</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="stats-section">
          <div className="stat-card">
            <span className="stat-label">{t('collective.totalThemes')}</span>
            <span className="stat-value">{spaces.length}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">{t('collective.averageResonance')}</span>
            <span className="stat-value">{averageResonance}%</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">{t('collective.totalInsights')}</span>
            <span className="stat-value">
              {spaces.reduce((sum, s) => sum + s.sharedInsights.length, 0)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
