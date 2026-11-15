import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { I18nProvider } from '../i18n/I18nProvider';
import { LandingPage } from '../pages/LandingPage';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

const renderWithProviders = (component: React.ReactNode) => {
  return render(
    <BrowserRouter>
      <I18nProvider>
        <AuthProvider>
          {component}
        </AuthProvider>
      </I18nProvider>
    </BrowserRouter>
  );
};

describe('LandingPage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('shows the strategic partner call to action', () => {
    renderWithProviders(<LandingPage />);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/You do not need to know what to write/i)).toBeInTheDocument();
  });

  it('displays hero title and copy', () => {
    renderWithProviders(<LandingPage />);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/1 minute. No judgement./i)).toBeInTheDocument();
  });
});
