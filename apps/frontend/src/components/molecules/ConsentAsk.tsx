import { useEffect, useState } from 'react';
import { useTranslation } from '../../i18n/I18nProvider';
import { apiGet, apiPost } from '../../lib/api';

/**
 * I due pulsanti con cui si risponde, in chat, alla domanda di Elayra sul consenso a crescere.
 * Se la scelta è già stata fatta, invece dei pulsanti si vede la scelta.
 */
export function ConsentAsk() {
  const { t } = useTranslation();
  const [consent, setConsent] = useState<boolean | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    apiGet<{ consent: boolean | null }>('/api/consent/training')
      .then((r) => active && setConsent(r.consent))
      .catch(() => active && setConsent(null));
    return () => {
      active = false;
    };
  }, []);

  const choose = async (allow: boolean) => {
    setBusy(true);
    setError('');
    try {
      const r = await apiPost<{ consent: boolean }>('/api/consent/training', { allow, source: 'chat' });
      setConsent(r.consent);
      window.dispatchEvent(new Event('elayra:account-changed'));
    } catch (e) {
      setError(e instanceof Error ? e.message : t('chat.error.generic'));
    } finally {
      setBusy(false);
    }
  };

  if (consent === undefined) return null;
  if (consent !== null) {
    return (
      <p className="chat-consent-done" role="status">
        {t(consent ? 'consent.chatYes' : 'consent.chatNo')}
      </p>
    );
  }
  return (
    <div className="chat-page-buttons chat-consent">
      <button type="button" className="chat-page-button" disabled={busy} onClick={() => void choose(true)}>
        {t('consent.allow')}
      </button>
      <button type="button" className="chat-page-button is-quiet" disabled={busy} onClick={() => void choose(false)}>
        {t('consent.decline')}
      </button>
      {error && <span className="error-message">{error}</span>}
    </div>
  );
}
