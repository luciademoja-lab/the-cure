import { Link } from 'react-router-dom';
import { useTranslation } from '../i18n/I18nProvider';
import { useAuth } from '../contexts/AuthContext';

/**
 * Home: dentro il cerchio del menu c'è solo il titolo.
 * Il pulsante per iniziare sta in alto a sinistra, sotto il marchio; il sottotitolo sotto il cerchio.
 */
export function LandingPage() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();

  return (
    <main className="landing-page">
      <div className="landing-cta">
        <Link to={isAuthenticated ? '/journal' : '/register'} className="cta-button primary">
          {isAuthenticated ? t('landing.start') : t('landing.getStarted')}
        </Link>
      </div>
      <div className="landing-content">
        <h1>{t('landing.title')}</h1>
      </div>
      <p className="subtitle landing-subtitle">{t('landing.subtitle')}</p>
    </main>
  );
}
