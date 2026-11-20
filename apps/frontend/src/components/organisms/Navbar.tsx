import { useLocation, useNavigate } from 'react-router-dom';
import { NavLink } from '../atoms/NavLink';
import { useTranslation } from '../../i18n/I18nProvider';
import { useAuth } from '../../contexts/AuthContext';
import { LanguageSelector } from '../molecules/LanguageSelector';
import { SuccessModal } from '../atoms/SuccessModal';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { apiGet } from '../../lib/api';
import type { PlanId } from '../../contexts/AccountContext';

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isAuthenticated, logout, user } = useAuth();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [plan, setPlan] = useState<PlanId | null>(null);

  // Il piano attuale, solo dopo la 2FA (prima il server non risponde). Si ricarica cambiando pagina,
  // così dopo un acquisto il pulsante sparisce.
  useEffect(() => {
    if (!isAuthenticated) {
      setPlan(null);
      return;
    }
    let alive = true;
    void (async () => {
      try {
        const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (data?.currentLevel !== 'aal2') return;
        const me = await apiGet<{ plan: PlanId }>('/api/me');
        if (alive) setPlan(me.plan);
      } catch {
        /* il pulsante resta nascosto */
      }
    })();
    return () => {
      alive = false;
    };
  }, [isAuthenticated, user?.id, location.pathname]);

  const canUpgrade = isAuthenticated && plan !== null && plan !== 'h24';

  const publicLinks: { path: string; label: string }[] = [];

  const authenticatedLinks = [
    { path: '/journal', label: t('nav.journal') },
    { path: '/daily-light', label: t('nav.dailyLight') },
    { path: '/gaming', label: t('nav.path') },
    { path: '/synchronicities', label: t('nav.synchronicities') },
    { path: '/forge', label: t('nav.forge') },
    { path: '/collective', label: t('nav.collective') },
    { path: '/plans', label: t('nav.plans') },
  ];

  const links = isAuthenticated ? authenticatedLinks : publicLinks;

  const handleLogout = () => {
    logout();
    setShowSuccessModal(true);
    // Redirect to home page after 3 seconds
    setTimeout(() => {
      navigate('/');
    }, 3000);
  };

  return (
    <nav className="navbar" role="navigation" aria-label={t('nav.home')}>
      <div className="navbar-container">
        <div className="navbar-brand">
          <a href="/" className="brand-link">
            <span className="brand-symbol">✦</span>
            <span className="brand-name">{t('nav.home')}</span>
          </a>
        </div>
        <ul className="navbar-links">
          {links.map(({ path, label }) => (
            <li key={path}>
              <NavLink to={path} isActive={location.pathname === path}>
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
        <div className="navbar-actions">
          {isAuthenticated ? (
            <div className="user-menu">
              {canUpgrade && (
                <button type="button" className="upgrade-button" onClick={() => navigate('/plans')}>
                  {t('nav.upgrade')}
                </button>
              )}
              <span className="user-email">{user?.nickname}</span>
              <button onClick={handleLogout} className="logout-button">
                Logout
              </button>
            </div>
          ) : (
            <div className="auth-links">
              <NavLink to="/login" isActive={location.pathname === '/login'}>
                Login
              </NavLink>
              <NavLink to="/register" isActive={location.pathname === '/register'}>
                Sign Up
              </NavLink>
            </div>
          )}
          <LanguageSelector />
        </div>
      </div>
      {showSuccessModal && (
        <SuccessModal
          message={t('auth.logout.success')}
          onClose={() => setShowSuccessModal(false)}
        />
      )}
    </nav>
  );
}
