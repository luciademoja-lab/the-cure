import { DailyRitual } from '../../types/dailyPractice';
import { useState } from 'react';
import { useTranslation } from '../../i18n/I18nProvider';
import { DictationButton } from '../atoms/DictationButton';
import { appendDictated } from '../../hooks/useDictation';

type EveningRitualProps = {
  ritual?: DailyRitual;
  onComplete?: (response: string) => void;
};

export function EveningRitual({ ritual, onComplete }: EveningRitualProps) {
  const { t } = useTranslation();
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onComplete?.(text);
  };

  return (
    <section className="ritual-card evening-ritual">
      <div className="ritual-header">
        <span className="ritual-emoji">🌙</span>
        <h3>{t('evening.header')}</h3>
      </div>

      <div className="ritual-content">
        <p className="ritual-subtitle">{t('evening.subtitle')}</p>

        <div className="ritual-prompt-box">
          <p className="ritual-prompt-label">{t('evening.promptLabel')}</p>
          <blockquote className="ritual-prompt">{ritual?.prompt || t('evening.promptDefault')}</blockquote>
        </div>

        <form onSubmit={handleSubmit} className="ritual-form">
          <textarea
            name="response"
            placeholder={t('evening.textareaPlaceholder')}
            className="ritual-textarea"
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <DictationButton onText={(piece) => setText((prev) => appendDictated(prev, piece))} />

          <div className="soothing-words">
            <p className="soothing-text">
              {t('evening.soothing')}
            </p>
          </div>

          <button type="submit" className="ritual-btn evening">
            {t('evening.restButton')}
          </button>
        </form>
      </div>
    </section>
  );
}
