import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../i18n/I18nProvider';

export function ForgotPasswordPage() {
  const { t } = useTranslation();
  const { resetPassword, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const validateEmail = (email: string) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!email) {
      setError(t('auth.forgotPassword.errors.emailRequired'));
      return;
    }

    if (!validateEmail(email)) {
      setError(t('auth.forgotPassword.errors.emailInvalid'));
      return;
    }

    try {
      await resetPassword(email);
      setSuccess(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to send reset email');
    }
  };

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-header">
            <h1>{t('auth.forgotPassword.success.title')}</h1>
            <p>{t('auth.forgotPassword.success.message', { email })}</p>
          </div>

          <div className="auth-links">
            <Link to="/login" className="auth-link">
              {t('auth.forgotPassword.backToSignIn')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1>{t('auth.forgotPassword.title')}</h1>
          <p>{t('auth.forgotPassword.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">{t('auth.forgotPassword.email')}</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={error ? 'error' : ''}
              disabled={isLoading}
              required
            />
            {error && <span className="error-message">{error}</span>}
          </div>

          <button
            type="submit"
            className="auth-button primary"
            disabled={isLoading}
          >
            {isLoading ? t('auth.forgotPassword.submitLoading') : t('auth.forgotPassword.submit')}
          </button>
        </form>

        <div className="auth-links">
          <Link to="/login" className="auth-link">
            {t('auth.forgotPassword.backToSignIn')}
          </Link>
        </div>
      </div>
    </div>
  );
}