import { useTranslation } from '../../i18n/I18nProvider';
import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { SecurityGate } from './SecurityGate';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isInitializing } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();

  if (isInitializing) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">{t('common.loading')}</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login page with return url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <SecurityGate>{children}</SecurityGate>;
}
