import { Energy } from '../../types/journal';
import { useTranslation } from '../../i18n/I18nProvider';

type EnergySelectorProps = {
  value: Energy;
  onChange: (energy: Energy) => void;
};

export function EnergySelector({ value, onChange }: EnergySelectorProps) {
  const { t } = useTranslation();

  return (
    <div className="energy-selector">
      <label>{t('energy.label')}</label>
      <div className="energy-buttons">
        {(['low', 'moderate', 'high'] as const).map((level) => (
          <button
            key={level}
            className={`energy-btn ${value === level ? 'active' : ''}`}
            onClick={() => onChange(level)}
            type="button"
          >
            {t(`energy.${level}`)}
          </button>
        ))}
      </div>
    </div>
  );
}
