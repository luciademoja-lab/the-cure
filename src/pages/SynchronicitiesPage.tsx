import React, { useState, useEffect } from 'react';
import { useJournalEntries } from '../hooks/useJournalEntries';
import { findSynchronicMatches } from '../services/synchronicityService';
import { SynchronicityMatchCard } from '../components/SynchronicityMatchCard';
import { SynchronicMatch } from '../types/synchronicity';
import { useTranslation } from '../i18n/I18nProvider';
import '../styles/pages/SynchronicitiesPage.css';

export function SynchronicitiesPage() {
  const { t } = useTranslation();
  const { entries } = useJournalEntries();
  const [matches, setMatches] = useState<SynchronicMatch[]>([]);
  const [filteredMatches, setFilteredMatches] = useState<SynchronicMatch[]>([]);
  const [minScore, setMinScore] = useState(60);
  const [selectedResonance, setSelectedResonance] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (entries.length > 0) {
      const syncMatches = findSynchronicMatches(entries, 40);
      setMatches(syncMatches);
      setLoading(false);
    }
  }, [entries]);

  useEffect(() => {
    let filtered = matches.filter((match) => match.synchronicityScore >= minScore);

    if (selectedResonance !== 'all') {
      filtered = filtered.filter((match) => match.resonanceType === selectedResonance);
    }

    setFilteredMatches(filtered);
  }, [matches, minScore, selectedResonance]);

  const resonanceTypes = ['emotional', 'thematic', 'symbolic', 'cyclical'];
  const highScoreMatches = filteredMatches.filter((m) => m.synchronicityScore >= 80);
  const moderateMatches = filteredMatches.filter((m) => m.synchronicityScore >= 60 && m.synchronicityScore < 80);
  const subtleMatches = filteredMatches.filter((m) => m.synchronicityScore < 60);

  return (
    <div className="synchronicities-page">
      <div className="page-header">
        <h1>{t('synchronicities.title')}</h1>
        <p className="subtitle">{t('synchronicities.subtitle')}</p>
      </div>

      <div className="page-content">
        <div className="filters-section">
          <div className="filter-group">
            <label htmlFor="score-slider">{t('synchronicities.minScore', { score: minScore })}</label>
            <input
              id="score-slider"
              type="range"
              min="0"
              max="100"
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              className="score-slider"
            />
          </div>

          <div className="filter-group">
            <label htmlFor="resonance-select">{t('synchronicities.resonanceType')}</label>
            <select
              id="resonance-select"
              value={selectedResonance}
              onChange={(e) => setSelectedResonance(e.target.value)}
              className="resonance-select"
            >
              <option value="all">{t('synchronicities.allTypes')}</option>
              {resonanceTypes.map((type) => (
                <option key={type} value={type}>
                  {t(`synchronicities.${type}`)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="results-section">
          {loading ? (
            <div className="loading-state">
              <p>{t('synchronicities.loading')}</p>
            </div>
          ) : filteredMatches.length === 0 ? (
            <div className="empty-state">
              <p>{t('synchronicities.noMatches')}</p>
              <p className="subtitle">{t('synchronicities.tryAdjusting')}</p>
            </div>
          ) : (
            <div className="matches-container">
              {highScoreMatches.length > 0 && (
                <div className="matches-group">
                  <h2 className="group-title">{t('synchronicities.strongConnections', { count: highScoreMatches.length })}</h2>
                  <div className="matches-grid">
                    {highScoreMatches.map((match) => (
                      <SynchronicityMatchCard
                        key={match.id}
                        match={match}
                        onViewDetails={() => console.log('View details:', match)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {moderateMatches.length > 0 && (
                <div className="matches-group">
                  <h2 className="group-title">{t('synchronicities.moderateResonance', { count: moderateMatches.length })}</h2>
                  <div className="matches-grid">
                    {moderateMatches.map((match) => (
                      <SynchronicityMatchCard
                        key={match.id}
                        match={match}
                        onViewDetails={() => console.log('View details:', match)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {subtleMatches.length > 0 && (
                <div className="matches-group">
                  <h2 className="group-title">{t('synchronicities.subtlePatterns', { count: subtleMatches.length })}</h2>
                  <div className="matches-grid">
                    {subtleMatches.map((match) => (
                      <SynchronicityMatchCard
                        key={match.id}
                        match={match}
                        onViewDetails={() => console.log('View details:', match)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="stats-section">
          <div className="stat-card">
            <span className="stat-label">{t('synchronicities.totalFound')}</span>
            <span className="stat-value">{filteredMatches.length}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">{t('synchronicities.averageScore')}</span>
            <span className="stat-value">
              {filteredMatches.length > 0
                ? Math.round(
                    filteredMatches.reduce((sum, m) => sum + m.synchronicityScore, 0) /
                      filteredMatches.length
                  )
                : 0}
              %
            </span>
          </div>
          <div className="stat-card">
            <span className="stat-label">{t('synchronicities.resonanceTypes')}</span>
            <span className="stat-value">
              {new Set(filteredMatches.map((m) => m.resonanceType)).size}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
