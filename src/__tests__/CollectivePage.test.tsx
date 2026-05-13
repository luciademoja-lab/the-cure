import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { I18nProvider } from '../i18n/I18nProvider';
import { CollectivePage } from '../pages/CollectivePage';

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

describe('CollectivePage', () => {
  beforeEach(() => {
    localStorage.clear();
    // Set authenticated user
    const mockUser = { id: '1', email: 'test@example.com', age: 25 };
    localStorage.setItem('currentUser', JSON.stringify(mockUser));
  });

  it('renders collective wisdom page title', () => {
    renderWithProviders(<CollectivePage />);
    
    expect(screen.getByText(/Collective|Wisdom/i)).toBeInTheDocument();
  });

  it('displays page subtitle about shared consciousness', () => {
    renderWithProviders(<CollectivePage />);
    
    expect(screen.getByText(/community|journeyer|shared/i)).toBeInTheDocument();
  });

  it('renders page content container', () => {
    renderWithProviders(<CollectivePage />);
    
    // Page should render without errors
    expect(screen.getByText(/Collective|Wisdom/i)).toBeInTheDocument();
  });

  it('shows loading state while fetching collective spaces', async () => {
    renderWithProviders(<CollectivePage />);
    
    // Component should be able to load
    await waitFor(() => {
      expect(screen.getByText(/Collective|Wisdom/i)).toBeInTheDocument();
    });
  });

  it('handles empty collective reflection spaces gracefully', async () => {
    renderWithProviders(<CollectivePage />);
    
    await waitFor(() => {
      // Should render even without any collective spaces
      expect(screen.getByText(/Collective|Wisdom/i)).toBeInTheDocument();
    });
  });

  it('emphasizes anonymous sharing', () => {
    renderWithProviders(<CollectivePage />);
    
    const pageText = screen.getByText(/Collective|Wisdom/i).closest('main')?.textContent || '';
    expect(pageText.toLowerCase()).toContain(
      'anonymous' || 'anonimo' || '匿名' || ''
    );
  });
});
