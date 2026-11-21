import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { I18nProvider } from '../i18n/I18nProvider';
import { Navbar } from '../components/organisms/Navbar';

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

describe('Navbar', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders the brand name', () => {
    renderWithProviders(<Navbar />);
    expect(screen.getByRole('link', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('renders all navigation links', () => {
    renderWithProviders(<Navbar />);
    expect(screen.getByRole('link', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sign up' })).toBeInTheDocument();
  });

  it('marks the home link as active on landing page', () => {
    renderWithProviders(<Navbar />);
    const brandLink = screen.getByRole('link', { name: 'The Cure' });
    expect(brandLink).toBeInTheDocument();
  });
});
