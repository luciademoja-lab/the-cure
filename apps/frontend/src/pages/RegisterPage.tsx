import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from '../i18n/I18nProvider';
import { GoogleButton } from '../components/auth/GoogleButton';

/** Ci si registra solo con Google. Età e consenso si chiedono al primo accesso. */
export function RegisterPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const referralCode = (searchParams.get('ref') || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 16);

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1>{t('auth.register.title')}</h1>
          <p>{t('auth.register.subtitle')}</p>
        </div>

        <GoogleButton referralCode={referralCode || undefined} divider={false} />
        <p className="auth-google-note">{t('auth.googleOnly')}</p>

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
