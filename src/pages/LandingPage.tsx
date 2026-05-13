import { Link } from 'react-router-dom';
import { useTranslation } from '../i18n/I18nProvider';
import { useAuth } from '../contexts/AuthContext';

export function LandingPage() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();

  return (
    <main className="landing-page">
      <div className="landing-content">
        <h1>{t('landing.title')}</h1>
        {isAuthenticated ? (
          <Link to="/journal" className="cta-button primary">
            {t('landing.start')}
          </Link>
        ) : (
          <div className="landing-actions">
            <Link to="/register" className="cta-button primary">
              Get Started
            </Link>
            <Link to="/login" className="cta-button secondary">
              Sign In
            </Link>
          </div>
        )}
        <p className="subtitle">{t('landing.subtitle')}</p>
      </div>
    </main>
  );
}
