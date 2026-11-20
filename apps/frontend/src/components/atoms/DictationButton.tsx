import { useTranslation } from '../../i18n/I18nProvider';
import { useDictation } from '../../hooks/useDictation';

/** Pulsante microfono: detta e trascrive nel campo di testo accanto. */
export function DictationButton({ onText, disabled }: { onText: (piece: string) => void; disabled?: boolean }) {
  const { t, locale } = useTranslation();
  const { supported, listening, interim, error, start, stop } = useDictation({ locale, onFinal: onText });

  if (!supported) {
    return <p className="dictation-unsupported">{t('voice.unsupported')}</p>;
  }

  return (
    <div className="dictation">
      <button
        type="button"
        className={`dictation-button ${listening ? 'is-listening' : ''}`}
        onClick={listening ? stop : start}
        disabled={disabled}
        aria-pressed={listening}
        aria-label={listening ? t('voice.stop') : t('voice.dictate')}
        title={listening ? t('voice.stop') : t('voice.dictate')}
      >
        <MicIcon />
      </button>
      <span className="dictation-status" aria-live="polite">
        {error === 'mic' ? t('voice.micDenied') : listening ? interim || t('voice.listening') : ''}
      </span>
    </div>
  );
}

export function MicIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor" />
      <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
