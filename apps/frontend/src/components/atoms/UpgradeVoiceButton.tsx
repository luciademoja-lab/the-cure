import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../i18n/I18nProvider';
import { useAccount } from '../../contexts/AccountContext';
import { MicIcon } from './DictationButton';

/**
 * La voce di Elayra arriverà con il piano H24 (ElevenLabs). Per ora, dove lei potrebbe parlare,
 * c'è questo invito: porta ai piani con H24 illuminato. Chi ha già H24 legge che arriva presto.
 */
export function UpgradeVoiceButton() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { account } = useAccount();
  if (account?.plan === 'h24') {
    return (
      <span className="voice-upgrade is-soon">
        <span className="voice-mode-orb" aria-hidden="true" />
        {t('voice.elayraSoon')}
      </span>
    );
  }
  return (
    <button type="button" className="voice-upgrade" onClick={() => navigate('/plans?highlight=h24')}>
      <span className="voice-mode-orb" aria-hidden="true" />
      {t('voice.upgradeListen')}
    </button>
  );
}

/** Le note vocali (dettare invece di scrivere) sono incluse da Part time in su. */
export const canDictate = (plan: string | undefined) => !plan || !['free', 'forgia'].includes(plan);

export function UpgradeDictationButton() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <div className="dictation">
      <button
        type="button"
        className="dictation-button is-locked"
        onClick={() => navigate('/plans?highlight=part')}
        aria-label={t('voice.upgradeDictate')}
        title={t('voice.upgradeDictate')}
      >
        <MicIcon />
      </button>
      <span className="dictation-status">{t('voice.upgradeDictate')}</span>
    </div>
  );
}
