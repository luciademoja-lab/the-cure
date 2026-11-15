import { ElaborationSuggestion } from '../../types/journal';
import { useTranslation } from '../../i18n/I18nProvider';

type ElaborationCardProps = {
  suggestion: ElaborationSuggestion;
  onApply?: () => void;
};

export function ElaborationCard({ suggestion, onApply }: ElaborationCardProps) {
  const { t } = useTranslation();

  return (
    <div className="elaboration-card" role="region" aria-label={t('elaboration.aiSuggestion')}>
      <div className="elaboration-header">
        <span className="elaboration-label">{t('elaboration.suggestion')}</span>
        <span className="elaboration-confidence">{Math.round(suggestion.confidence * 100)}{t('elaboration.relevant')}</span>
      </div>
      <p className="elaboration-text">{suggestion.suggestion}</p>
      {onApply && (
        <button type="button" onClick={onApply} className="elaboration-apply">
          {t('elaboration.useThought')}
        </button>
      )}
    </div>
  );
}
