import { ElayraMessage } from '../../services/elayraService';
import { useTranslation } from '../../i18n/I18nProvider';

type ElayraMessageCardProps = {
  message: ElayraMessage;
};

export function ElayraMessageCard({ message }: ElayraMessageCardProps) {
  const { t } = useTranslation();

  const getTypeEmoji = (type: string) => {
    switch (type) {
      case 'wisdom':
        return '✨';
      case 'encouragement':
        return '💫';
      case 'reflection':
        return '🔮';
      case 'prompt':
        return '✦';
      default:
        return '•';
    }
  };

  return (
    <div className="elayra-message-card" role="article" aria-label={`${t('elayra.says')} ${message.type}`}>
      <div className="elayra-header">
        <span className="elayra-emoji">{getTypeEmoji(message.type)}</span>
        <span className="elayra-type">{t('elayra.says')}</span>
      </div>
      <p className="elayra-text">{message.text}</p>
    </div>
  );
}
