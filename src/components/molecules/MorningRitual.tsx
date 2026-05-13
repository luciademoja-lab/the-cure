import { DailyRitual } from '../../types/dailyPractice';
import { VoiceRecorder } from '../atoms/VoiceRecorder';
import { useTranslation } from '../../i18n/I18nProvider';

type MorningRitualProps = {
  ritual?: DailyRitual;
  onComplete?: (response: string) => void;
};

export function MorningRitual({ ritual, onComplete }: MorningRitualProps) {
  const { t } = useTranslation();

  const handleTextSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const response = formData.get('response') as string;
    onComplete?.(response);
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
          />

          <p className="ritual-hint">{t('morning.voiceHint')}</p>
          <VoiceRecorder
            onTranscription={(text) => {
              const textarea = document.querySelector('.ritual-textarea') as HTMLTextAreaElement;
              if (textarea) textarea.value = text;
            }}
          />

          <button type="submit" className="ritual-btn">
            {t('morning.activateButton')}
          </button>
        </form>
      </div>
    </section>
  );
}
