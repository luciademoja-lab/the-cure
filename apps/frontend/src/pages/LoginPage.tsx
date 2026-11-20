import { Link } from 'react-router-dom';
import { useTranslation } from '../i18n/I18nProvider';
import { GoogleButton } from '../components/auth/GoogleButton';

/** Si entra solo con Google: un unico modo, che funziona sempre con la verifica in due passaggi. */
export function LoginPage() {
  const { t } = useTranslation();

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1>{t('auth.login.title')}</h1>
          <p>{t('auth.login.subtitle')}</p>
        </div>

        <GoogleButton divider={false} />
        <p className="auth-google-note">{t('auth.googleOnly')}</p>

        <div className="auth-links">
          <p>
            {t('auth.login.noAccount')}{' '}
            <Link to="/register" className="auth-link">
              {t('auth.login.signup')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
