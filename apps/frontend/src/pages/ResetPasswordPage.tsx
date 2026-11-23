import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../i18n/I18nProvider';

/** Pagina a cui porta il link "reimposta password" ricevuto via email. */
export function ResetPasswordPage() {
  const { t } = useTranslation();
  const { updatePassword, isAuthenticated, isInitializing: isLoading } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) return setError(t('auth.reset.errors.tooShort'));
    if (password !== confirm) return setError(t('auth.register.errors.passwordMismatch'));
    setIsSubmitting(true);
    try {
      await updatePassword(password);
      navigate('/journal');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('chat.error.generic'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1>{t('auth.reset.title')}</h1>
          <p>{!isLoading && !isAuthenticated ? t('auth.reset.invalidLink') : t('auth.reset.subtitle')}</p>
        </div>
        {(isLoading || isAuthenticated) && (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="new-password">{t('auth.reset.newPassword')}</label>
              <input type="password" id="new-password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
            </div>
            <div className="form-group">
              <label htmlFor="confirm-password">{t('auth.reset.confirmPassword')}</label>
              <input type="password" id="confirm-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
            </div>
            {error && <div className="error-message submit-error">{error}</div>}
            <button type="submit" className="auth-button primary" disabled={isSubmitting}>
              {t('auth.reset.submit')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
