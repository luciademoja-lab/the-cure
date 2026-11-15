import { Mood } from '../../types/journal';
import { useTranslation } from '../../i18n/I18nProvider';

type MoodSliderProps = {
  value: Mood;
  onChange: (mood: Mood) => void;
};

export function MoodSlider({ value, onChange }: MoodSliderProps) {
  const { t } = useTranslation();

  const getMoodLabel = (m: Mood): string => {
    if (m <= 3) return t('mood.heavy');
    if (m <= 5) return t('mood.tender');
    if (m <= 7) return t('mood.neutral');
    return t('mood.light');
  };

  const getMoodSymbol = (m: Mood): string => {
    if (m <= 3) return '•';
    if (m <= 5) return '◯';
    if (m <= 7) return '•◯';
    return '△';
  };

  return (
    <div className="mood-slider-container">
      <label htmlFor="mood-slider">{t('mood.question')}</label>
      <div className="mood-display">
        <span className="mood-symbol">{getMoodSymbol(value)}</span>
        <span className="mood-label">{getMoodLabel(value)}</span>
        <span className="mood-number">{value}/10</span>
      </div>
      <input
        id="mood-slider"
        type="range"
        min="1"
        max="10"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value) as Mood)}
        className="mood-slider"
      />
      <div className="mood-scale">
        <span>{t('mood.heavy')}</span>
        <span>{t('mood.neutral')}</span>
        <span>{t('mood.light')}</span>
      </div>
    </div>
  );
}
