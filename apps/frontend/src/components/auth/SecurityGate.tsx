import { ReactNode, useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { apiGet, apiPost } from '../../lib/api';
import { loadDiscovery } from '../../lib/discovery';
import { useTranslation } from '../../i18n/I18nProvider';
import { useAuth, pendingReferral, clearReferral } from '../../contexts/AuthContext';
import { Account, AccountContext } from '../../contexts/AccountContext';

type Step =
  | { kind: 'checking' }
  | { kind: 'enroll'; factorId: string; qr: string; secret: string }
  | { kind: 'challenge'; factorId: string }
  | { kind: 'onboarding' }
  | { kind: 'ready' }
  | { kind: 'error'; message: string };

/**
 * Tutto ciò che sta dietro l'accesso passa da qui:
 * 1) 2FA obbligatoria con un'app di autenticazione (Google Authenticator o simili);
 * 2) primo accesso: nome, conferma dei 18 anni, codice di invito.
 */
export function SecurityGate({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const { logout, user } = useAuth();
  const [step, setStep] = useState<Step>({ kind: 'checking' });
  const [account, setAccount] = useState<Account | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const loadAccount = useCallback(async () => {
    const data = await apiGet<Account>('/api/me');
    setAccount(data);
    return data;
  }, []);

  const check = useCallback(async () => {
    setError('');
    try {
      const { data: aal, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aalError) throw aalError;
      if (aal?.currentLevel === 'aal2') {
        const me = await loadAccount();
        // Il menu si carica solo dopo la 2FA: appena si entra, le pagine scoperte si accendono.
        if (me.onboarded) void loadDiscovery();
        setStep(me.onboarded ? { kind: 'ready' } : { kind: 'onboarding' });
        return;
      }
      const { data: factors, error: listError } = await supabase.auth.mfa.listFactors();
      if (listError) throw listError;
      const verified = factors?.totp?.find((f) => f.status === 'verified');
      if (verified) {
        setStep({ kind: 'challenge', factorId: verified.id });
        return;
      }
      // Toglie eventuali iscrizioni lasciate a metà, poi ne crea una nuova.
      for (const f of factors?.all || []) {
        if (f.status !== 'verified') await supabase.auth.mfa.unenroll({ factorId: f.id });
      }
      const { data: enrolled, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: `Elayra ${new Date().toISOString().slice(0, 10)}`,
      });
      if (enrollError || !enrolled) throw enrollError || new Error('enroll failed');
      setStep({ kind: 'enroll', factorId: enrolled.id, qr: enrolled.totp.qr_code, secret: enrolled.totp.secret });
    } catch (e) {
      setStep({ kind: 'error', message: e instanceof Error ? e.message : t('chat.error.generic') });
    }
  }, [loadAccount, t]);

  useEffect(() => {
    // Si controlla una volta per persona collegata (la sessione arriva un attimo dopo il primo disegno).
    if (user?.id) void check();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const verify = async (factorId: string) => {
    if (!/^\d{6}$/.test(code.trim())) {
      setError(t('mfa.errors.format'));
      return;
    }
    setBusy(true);
    setError('');
    try {
      const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({ factorId, code: code.trim() });
      if (verifyError) throw new Error(t('mfa.errors.wrong'));
      setCode('');
      await check();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('mfa.errors.wrong'));
    } finally {
      setBusy(false);
    }
  };

  if (step.kind === 'ready') {
    return (
      <AccountContext.Provider value={{ account, refresh: async () => void (await loadAccount()) }}>
        {children}
      </AccountContext.Provider>
    );
  }

  if (step.kind === 'checking') {
    return (
      <div className="loading-container">
        <div className="loading-spinner">{t('mfa.checking')}</div>
      </div>
    );
  }

  if (step.kind === 'onboarding') {
    return <Onboarding defaultNickname={account?.nickname || user?.nickname || ''} onDone={check} />;
  }

  return (
    <div className="auth-page">
      <div className="auth-container gate">
        {step.kind === 'error' && (
          <>
            <div className="auth-header">
              <h1>{t('mfa.title')}</h1>
              <p className="page-error" role="alert">
                {step.message}
              </p>
            </div>
            <button type="button" className="auth-button primary" onClick={() => void check()}>
              {t('mfa.retry')}
            </button>
          </>
        )}

        {step.kind === 'enroll' && (
          <>
            <div className="auth-header">
              <h1>{t('mfa.enrollTitle')}</h1>
              <p>{t('mfa.enrollLead')}</p>
            </div>
            <ol className="gate-steps">
              <li>{t('mfa.step1')}</li>
              <li>{t('mfa.step2')}</li>
              <li>{t('mfa.step3')}</li>
            </ol>
            <img className="gate-qr" src={step.qr} alt={t('mfa.qrAlt')} width={200} height={200} />
            <p className="gate-secret">
              {t('mfa.manual')} <code>{step.secret}</code>
            </p>
          </>
        )}

        {step.kind === 'challenge' && (
          <div className="auth-header">
            <h1>{t('mfa.challengeTitle')}</h1>
            <p>{t('mfa.challengeLead')}</p>
          </div>
        )}

        {(step.kind === 'enroll' || step.kind === 'challenge') && (
          <form
            className="auth-form"
            onSubmit={(e) => {
              e.preventDefault();
              void verify(step.factorId);
            }}
          >
            <div className="form-group">
              <label htmlFor="mfa-code">{t('mfa.codeLabel')}</label>
              <input
                id="mfa-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                autoFocus
              />
            </div>
            {error && <div className="error-message submit-error">{error}</div>}
            <button type="submit" className="auth-button primary" disabled={busy}>
              {t('mfa.verify')}
            </button>
          </form>
        )}

        <button type="button" className="forge-link gate-logout" onClick={logout}>
          {t('mfa.logout')}
        </button>
        <p className="gate-note">{t('mfa.lostPhone')}</p>
      </div>
    </div>
  );
}

function Onboarding({ defaultNickname, onDone }: { defaultNickname: string; onDone: () => Promise<void> }) {
  const { t } = useTranslation();
  const [nickname, setNickname] = useState(defaultNickname);
  const [age, setAge] = useState('');
  const [consent, setConsent] = useState(false);
  const [referral, setReferral] = useState(() => pendingReferral());
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const years = Number(age);
    if (nickname.trim().length < 2) return setError(t('onboarding.errors.nickname'));
    if (!Number.isInteger(years) || years < 18 || years > 120) return setError(t('onboarding.errors.age'));
    if (!consent) return setError(t('onboarding.errors.consent'));
    setBusy(true);
    try {
      await apiPost('/api/onboarding', { nickname: nickname.trim(), age: years, referralCode: referral.trim() || undefined, consent: true });
      clearReferral();
      await onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('chat.error.generic'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container gate">
        <div className="auth-header">
          <h1>{t('onboarding.title')}</h1>
          <p>{t('onboarding.lead')}</p>
        </div>
        <form className="auth-form" onSubmit={submit}>
          <div className="form-group">
            <label htmlFor="ob-nickname">{t('onboarding.nickname')}</label>
            <input id="ob-nickname" maxLength={60} value={nickname} onChange={(e) => setNickname(e.target.value)} />
          </div>
          <div className="form-group">
            <label htmlFor="ob-age">{t('onboarding.age')}</label>
            <input id="ob-age" inputMode="numeric" maxLength={3} value={age} onChange={(e) => setAge(e.target.value.replace(/\D/g, ''))} />
          </div>
          <div className="form-group">
            <label htmlFor="ob-ref">{t('onboarding.referral')}</label>
            <input id="ob-ref" maxLength={16} value={referral} onChange={(e) => setReferral(e.target.value)} />
          </div>
          <label className="consent-check">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            <span>
              {t('onboarding.consentBefore')}{' '}
              <a href="/termini" target="_blank" rel="noreferrer">
                {t('footer.terms')}
              </a>{' '}
              {t('onboarding.consentAnd')}{' '}
              <a href="/privacy" target="_blank" rel="noreferrer">
                {t('footer.privacy')}
              </a>
              {t('onboarding.consentAfter')}
            </span>
          </label>
          {error && <div className="error-message submit-error">{error}</div>}
          <button type="submit" className="auth-button primary" disabled={busy}>
            {t('onboarding.submit')}
          </button>
        </form>
      </div>
    </div>
  );
}
