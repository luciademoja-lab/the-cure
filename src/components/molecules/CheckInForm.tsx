import { CheckInData, Mood, Energy } from '../../types/journal';
import { MoodSlider } from '../atoms/MoodSlider';
import { EnergySelector } from '../atoms/EnergySelector';
import { Button } from '../atoms/Button';
import { useTranslation } from '../../i18n/I18nProvider';

type CheckInFormProps = {
  checkIn: CheckInData;
  onChange: (data: CheckInData) => void;
  onComplete: () => void;
};

export function CheckInForm({ checkIn, onChange, onComplete }: CheckInFormProps) {
  const { t } = useTranslation();

  return (
    <div className="check-in-form" role="region" aria-labelledby="check-in-title">
      <h3 id="check-in-title">{t('checkin.title')}</h3>

      <MoodSlider
        value={checkIn.mood}
        onChange={(mood: Mood) => onChange({ ...checkIn, mood })}
      />

      <EnergySelector
        value={checkIn.energy}
        onChange={(energy: Energy) => onChange({ ...checkIn, energy })}
      />

      <div className="body-focus">
        <label htmlFor="body-focus">{t('checkin.bodyLabel')}</label>
        <input
          id="body-focus"
          type="text"
          placeholder={t('checkin.bodyPlaceholder')}
          value={checkIn.bodySensation || ''}
          onChange={(e) => onChange({ ...checkIn, bodySensation: e.target.value })}
          className="body-input"
        />
      </div>

      <Button label={t('checkin.continue')} onClick={onComplete} variant="primary" />
    </div>
  );
}
