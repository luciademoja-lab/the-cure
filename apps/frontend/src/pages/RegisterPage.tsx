import { FormEvent, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { rememberReferral, useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../i18n/I18nProvider';
import { GoogleButton } from '../components/auth/GoogleButton';

/**
 * Ci si iscrive con Google oppure con email e password.
 * Nome, età, consenso e codice di invito si chiedono dopo, al primo accesso, uguale per tutti.
 */
export function RegisterPage() {
  const { t } = useTranslation();
  const { register, isLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const referralCode = (searchParams.get('ref') || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 16);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');
  const [sent, setSent] = useState(false);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!email) next.email = t('auth.register.errors.emailRequired');
    else if (!/\S+@\S+\.\S+/.test(email)) next.email = t('auth.register.errors.emailInvalid');
    if (!password) next.password = t('auth.register.errors.passwordRequired');
    else if (password.length < 8) next.password = t('auth.register.errors.passwordTooShort');
    if (confirm !== password) next.confirm = t('auth.register.errors.passwordMismatch');
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    if (!validate()) return;
    try {
      if (referralCode) rememberReferral(referralCode);
      const result = await register({ email: email.trim(), password, referralCode: referralCode || undefined });
      if (result.needsEmailConfirmation) setSent(true);
      else navigate('/journal');
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Registration failed');
    }
  };

  if (sent) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-header">
            <h1>{t('auth.register.title')}</h1>
            <p role="status">{t('auth.register.confirmEmail')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1>{t('auth.register.title')}</h1>
          <p>{t('auth.register.subtitle')}</p>
        </div>

        <form onSubmit={submit} className="auth-form" noValidate>
          <div className="form-group">
            <label htmlFor="email">{t('auth.register.email')}</label>
            <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="password">{t('auth.register.password')}</label>
            <input id="password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} />
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">{t('auth.register.confirmPassword')}</label>
            <input id="confirmPassword" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} disabled={isLoading} />
            {errors.confirm && <span className="error-message">{errors.confirm}</span>}
          </div>
          {submitError && <div className="error-message submit-error">{submitError}</div>}
          <button type="submit" className="auth-button primary" disabled={isLoading}>
            {isLoading ? t('auth.register.submitLoading') : t('auth.register.submit')}
          </button>
        </form>

        <GoogleButton referralCode={referralCode || undefined} />

        <div className="auth-links">
          <p>
            {t('auth.register.haveAccount')}{' '}
            <Link to="/login" className="auth-link">
              {t('auth.register.signin')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
