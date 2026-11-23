import { useLocation, useNavigate } from 'react-router-dom';
import { NavLink } from '../atoms/NavLink';
import { SacredSymbol } from '../atoms/SacredSymbol';
import { useTranslation } from '../../i18n/I18nProvider';
import { useAuth } from '../../contexts/AuthContext';
import { LanguageSelector } from '../molecules/LanguageSelector';
import { SuccessModal } from '../atoms/SuccessModal';
import { useEffect, useState } from 'react';
import { secondFactorDone } from '../../lib/secondFactor';
import { apiGet } from '../../lib/api';
import type { AvatarKind, PlanId } from '../../contexts/AccountContext';
import { UserAvatar } from '../atoms/UserAvatar';

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isAuthenticated, logout, user } = useAuth();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [me, setMe] = useState<{ plan: PlanId; nickname: string; avatarKind: AvatarKind | null; avatarPath: string | null } | null>(
    null
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);
  const plan = me?.plan ?? null;

  // Il profilo avvisa quando nome o immagine cambiano.
  useEffect(() => {
    const onChange = () => setRefreshTick((n) => n + 1);
    window.addEventListener('elayra:account-changed', onChange);
    return () => window.removeEventListener('elayra:account-changed', onChange);
  }, []);

  useEffect(() => setMenuOpen(false), [location.pathname]);

  // Il piano attuale, solo dopo la 2FA (prima il server non risponde). Si ricarica cambiando pagina,
  // così dopo un acquisto il pulsante sparisce.
  useEffect(() => {
    if (!isAuthenticated) {
      setMe(null);
      return;
    }
    let alive = true;
    void (async () => {
      try {
        if (!(await secondFactorDone())) return;
        const data = await apiGet<{ plan: PlanId; nickname: string; avatarKind: AvatarKind | null; avatarPath: string | null }>(
          '/api/me'
        );
        if (alive) setMe(data);
      } catch {
        /* il pulsante resta nascosto */
      }
    })();
    return () => {
      alive = false;
    };
  }, [isAuthenticated, user?.id, location.pathname, refreshTick]);

  const displayName = me?.nickname || user?.nickname || '';
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
            <SacredSymbol kind="all" size={26} className="brand-symbol" />
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
          {canUpgrade && (
            <button type="button" className="upgrade-button" onClick={() => navigate('/plans')}>
              {t('nav.upgrade')}
            </button>
          )}
          {/* Computer: nome e immagine portano al profilo. */}
          <div className="navbar-account-inline">
            {isAuthenticated ? (
              <>
                <button type="button" className="navbar-profile-link" onClick={() => navigate('/profile')}>
                  <UserAvatar kind={me?.avatarKind ?? null} path={me?.avatarPath ?? null} name={displayName} size={30} />
                  <span className="user-email">{displayName}</span>
                </button>
                <button onClick={handleLogout} className="logout-button">
                  {t('nav.logout')}
                </button>
              </>
            ) : (
              <div className="auth-links">
                <NavLink to="/login" isActive={location.pathname === '/login'}>
                  {t('nav.login')}
                </NavLink>
                <NavLink to="/register" isActive={location.pathname === '/register'}>
                  {t('nav.signup')}
                </NavLink>
              </div>
            )}
          </div>
          <LanguageSelector />
          {/* Telefono: tutto nella tendina che si apre dall'icona utente. */}
          <div className="navbar-account-menu">
            <button
              type="button"
              className="navbar-user-button"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label={t('nav.account')}
              onClick={() => setMenuOpen((v) => !v)}
            >
              {isAuthenticated ? (
                <UserAvatar kind={me?.avatarKind ?? null} path={me?.avatarPath ?? null} name={displayName} size={30} />
              ) : (
                <UserIcon />
              )}
            </button>
            {menuOpen && (
              <div className="navbar-user-dropdown" role="menu">
                {isAuthenticated ? (
                  <>
                    <button type="button" role="menuitem" onClick={() => navigate('/profile')}>
                      {displayName}
                      <span className="navbar-user-sub">{t('nav.profile')}</span>
                    </button>
                    <button type="button" role="menuitem" onClick={handleLogout}>
                      {t('nav.logout')}
                    </button>
                  </>
                ) : (
                  <>
                    <button type="button" role="menuitem" onClick={() => navigate('/login')}>
                      {t('nav.login')}
                    </button>
                    <button type="button" role="menuitem" onClick={() => navigate('/register')}>
                      {t('nav.signup')}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
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

function UserIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="8.5" r="3.6" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path d="M4.5 20c1.4-3.6 4.3-5.3 7.5-5.3s6.1 1.7 7.5 5.3" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
