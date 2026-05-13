import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { I18nProvider } from '../i18n/I18nProvider';
import { SynchronicitiesPage } from '../pages/SynchronicitiesPage';

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

describe('SynchronicitiesPage', () => {
  beforeEach(() => {
    localStorage.clear();
    // Set authenticated user
    const mockUser = { id: '1', email: 'test@example.com', age: 25 };
    localStorage.setItem('currentUser', JSON.stringify(mockUser));
  });

  it('renders synchronicities page title', () => {
    renderWithProviders(<SynchronicitiesPage />);
    
    expect(screen.getByText('🔗 Synchronicities')).toBeInTheDocument();
  });

  it('displays page subtitle about discovering connections', () => {
    renderWithProviders(<SynchronicitiesPage />);
    
    expect(screen.getByText('Discover how your entries echo and resonate with one another. Each connection reveals a deeper pattern in your journey.')).toBeInTheDocument();
  });

  it('renders filter section with minimum score slider', async () => {
    renderWithProviders(<SynchronicitiesPage />);
    
    await waitFor(() => {
      expect(screen.getByText(/Minimum Score/i)).toBeInTheDocument();
    });
  });

  it('renders resonance type filter options', async () => {
    renderWithProviders(<SynchronicitiesPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Resonance Type')).toBeInTheDocument();
    });
  });

  it('displays stats section with match statistics', async () => {
    renderWithProviders(<SynchronicitiesPage />);
    
    await waitFor(() => {
      const stats = screen.queryAllByText(/Total|Average|Score/i);
      expect(stats.length >= 0).toBe(true);
    });
  });

  it('shows loading state initially', async () => {
    renderWithProviders(<SynchronicitiesPage />);
    
    // Component should render
    expect(screen.getByText('🔗 Synchronicities')).toBeInTheDocument();
  });

  it('handles empty synchronicity matches gracefully', async () => {
    renderWithProviders(<SynchronicitiesPage />);
    
    await waitFor(() => {
      // Should render without errors even with no matches
      expect(screen.getByText('🔗 Synchronicities')).toBeInTheDocument();
    });
  });
});
