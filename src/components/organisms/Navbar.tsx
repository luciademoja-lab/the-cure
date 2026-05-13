import { useLocation, useNavigate } from 'react-router-dom';
import { NavLink } from '../atoms/NavLink';
import { useTranslation } from '../../i18n/I18nProvider';
import { useAuth } from '../../contexts/AuthContext';
import { LanguageSelector } from '../molecules/LanguageSelector';
import { SuccessModal } from '../atoms/SuccessModal';
import { useState } from 'react';

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isAuthenticated, logout, user } = useAuth();
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const publicLinks = [];

  const authenticatedLinks = [
    { path: '/journal', label: t('nav.journal') },
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
