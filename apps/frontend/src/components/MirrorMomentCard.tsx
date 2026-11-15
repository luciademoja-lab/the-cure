import React from 'react';
import { MirrorMoment } from '../types/synchronicity';
import { JournalEntry } from '../types/journal';
import { useTranslation } from '../i18n/I18nProvider';
import '../styles/MirrorMomentCard.css';

interface MirrorMomentCardProps {
  mirrorMoment: MirrorMoment;
  entry: JournalEntry;
}

export function MirrorMomentCard({ mirrorMoment, entry }: MirrorMomentCardProps) {
  const { t } = useTranslation();
  const resonancePercentage = Math.round(mirrorMoment.collectiveResonance);
  const resonanceLevel =
    resonancePercentage >= 75
      ? 'strong'
      : resonancePercentage >= 50
        ? 'moderate'
        : 'subtle';

  return (
    <div className={`mirror-moment-card resonance-${resonanceLevel}`}>
      <div className="mirror-header">
        <h3>{t('mirror.header')}</h3>
        <div className="resonance-badge">
          <span className="resonance-value">{resonancePercentage}%</span>
          <span className="resonance-label">{t('mirror.collectiveResonance')}</span>
        </div>
      </div>

      <div className="mirror-body">
        <div className="entry-preview">
          <p className="entry-text">{entry.content.substring(0, 150)}...</p>
          <div className="entry-metadata">
            <span className="mood-tag">{t('mirror.moodLabel', { mood: entry.mood })}</span>
            <span className="date-tag">{new Date(entry.timestamp).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="themes-container">
          <h4>{t('mirror.collectiveThemes')}</h4>
          <div className="themes-list">
            {entry.aiTags.map((tag) => (
              <span key={tag} className="theme-badge">
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="resonance-message">
          <p>
            <strong>{mirrorMoment.mirrorCount}</strong> {t('mirror.mirrorCountMessage', { count: mirrorMoment.mirrorCount })}
          </p>
          <p>{t('mirror.addsWisdom')}</p>
        </div>
      </div>
    </div>
  );
}
