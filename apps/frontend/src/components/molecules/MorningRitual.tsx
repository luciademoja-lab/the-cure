import { DailyRitual } from '../../types/dailyPractice';
import { useState } from 'react';
import { useTranslation } from '../../i18n/I18nProvider';
import { DictationButton } from '../atoms/DictationButton';
import { appendDictated } from '../../hooks/useDictation';

type MorningRitualProps = {
  ritual?: DailyRitual;
  onComplete?: (response: string) => void;
};

export function MorningRitual({ ritual, onComplete }: MorningRitualProps) {
  const { t } = useTranslation();
  const [text, setText] = useState('');

  const handleTextSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onComplete?.(text);
  };

  return (
    <section className="ritual-card morning-ritual">
      <div className="ritual-header">
        <span className="ritual-emoji">🌅</span>
        <h3>{t('morning.header')}</h3>
      </div>

      <div className="ritual-content">
        <p className="ritual-subtitle">{t('morning.subtitle')}</p>

        <div className="ritual-prompt-box">
          <p className="ritual-prompt-label">{t('morning.promptLabel')}</p>
          <blockquote className="ritual-prompt">{ritual?.prompt || t('morning.promptDefault')}</blockquote>
        </div>

        <form onSubmit={handleTextSubmit} className="ritual-form">
          <textarea
            name="response"
            placeholder={t('morning.textareaPlaceholder')}
            className="ritual-textarea"
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <DictationButton onText={(piece) => setText((prev) => appendDictated(prev, piece))} />

          <p className="ritual-hint">{t('morning.voiceHint')}</p>

          <button type="submit" className="ritual-btn">
            {t('morning.activateButton')}
          </button>
        </form>
      </div>
    </section>
  );
}
