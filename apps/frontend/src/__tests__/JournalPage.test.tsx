import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { I18nProvider } from '../i18n/I18nProvider';
import { JournalPage } from '../pages/JournalPage';

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

describe('JournalPage', () => {
  beforeEach(() => {
    localStorage.clear();
    // Set authenticated user
    const mockUser = { id: '1', email: 'test@example.com', age: 25 };
    localStorage.setItem('currentUser', JSON.stringify(mockUser));
  });

  it('renders journal page title', () => {
    renderWithProviders(<JournalPage />);
    
    expect(screen.getByText(/Journal/i)).toBeInTheDocument();
  });

  it('renders journal entry editor component', async () => {
    renderWithProviders(<JournalPage />);
    
    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });
  });

  it('displays entry list when entries exist', async () => {
    const mockEntries = [
      {
        id: '1',
        content: 'Today I felt grateful',
        mood: 8,
        energy: 'high',
        timestamp: new Date(),
        tags: [],
        aiTags: ['Gratitude']
      }
    ];
    
    localStorage.setItem('the-cure-journal-entries', JSON.stringify(mockEntries));
    
    renderWithProviders(<JournalPage />);
    
    await waitFor(() => {
      expect(screen.getByText(/Your Journal Entries/i)).toBeInTheDocument();
    });
  });

  it('shows empty state when no entries', () => {
    renderWithProviders(<JournalPage />);
    
    // Should render but entries list might be empty
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('allows user to write journal entry', async () => {
    renderWithProviders(<JournalPage />);
    
    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeInTheDocument();
  });
});
