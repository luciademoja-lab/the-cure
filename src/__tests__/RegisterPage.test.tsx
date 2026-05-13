import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { I18nProvider } from '../i18n/I18nProvider';
import { RegisterPage } from '../pages/RegisterPage';

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

// Mock the register function to prevent actual registration during tests
vi.mock('../contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({
    register: vi.fn(() => Promise.resolve()), // Mock register to resolve immediately
    isLoading: false,
    user: null,
    login: vi.fn(),
    logout: vi.fn()
  })
}));

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

describe('RegisterPage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders registration form with all fields', () => {
    renderWithProviders(<RegisterPage />);
    
    expect(screen.getByText(/Join The Cure/i)).toBeInTheDocument();
    expect(screen.getByText(/Create your account to begin your journey/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Nickname \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Age \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Gender \(Optional\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Password \*$/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Confirm Password \*/i)).toBeInTheDocument();
  });

  it('renders create account button', () => {
    renderWithProviders(<RegisterPage />);
    
    expect(screen.getByRole('button', { name: /Create Account/i })).toBeInTheDocument();
  });

  it('renders sign in link for existing users', () => {
    renderWithProviders(<RegisterPage />);
    
    expect(screen.getByText(/Already have an account/i)).toBeInTheDocument();
    expect(screen.getByText(/Sign in/i)).toBeInTheDocument();
  });

  it('validates nickname field', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />);
    
    const nicknameInput = screen.getByLabelText(/Nickname \*/i);
    const submitButton = screen.getByRole('button', { name: /Create Account/i });
    
    await user.type(nicknameInput, 'A');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Nickname must be at least 2 characters/i)).toBeInTheDocument();
    });
  });

  it('validates age is at least 13', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />);
    
    const ageInput = screen.getByLabelText(/Age \*/i);
    const submitButton = screen.getByRole('button', { name: /Create Account/i });
    
    await user.type(ageInput, '10');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/You must be at least 13 years old/i)).toBeInTheDocument();
    });
  });

  it('validates age is not greater than 120', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />);
    
    const ageInput = screen.getByLabelText(/Age \*/i);
    const submitButton = screen.getByRole('button', { name: /Create Account/i });
    
    await user.type(ageInput, '150');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Please enter a valid age/i)).toBeInTheDocument();
    });
  });

  it('validates password length', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />);
    
    const passwordInput = screen.getByLabelText(/^Password \*$/);
    const submitButton = screen.getByRole('button', { name: /Create Account/i });
    
    await user.type(passwordInput, 'abc');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Password must be at least 6 characters/i)).toBeInTheDocument();
    });
  });

  it('validates password confirmation matches', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />);
    
    const emailInput = screen.getByLabelText(/Email \*/i);
    const ageInput = screen.getByLabelText(/Age \*/i);
    const passwordInput = screen.getByLabelText(/^Password \*/i);
    const confirmPasswordInput = screen.getByLabelText(/Confirm Password \*/i);
    const submitButton = screen.getByRole('button', { name: /Create Account/i });
    
    await user.type(emailInput, 'test@example.com');
    await user.type(ageInput, '25');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password456');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Passwords do not match/i)).toBeInTheDocument();
    });
  });

  it('accepts valid gender selection', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />);
    
    const genderSelect = screen.getByLabelText(/Gender \(Optional\)/i);
    
    await user.selectOptions(genderSelect, 'female');
    
    expect((genderSelect as HTMLSelectElement).value).toBe('female');
  });

  it('accepts valid form input', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />);
    
    const emailInput = screen.getByLabelText(/Email \*/i);
    const nicknameInput = screen.getByLabelText(/Nickname \*/i);
    const ageInput = screen.getByLabelText(/Age \*/i);
    const passwordInput = screen.getByLabelText(/^Password \*/i);
    const confirmPasswordInput = screen.getByLabelText(/Confirm Password \*/i);
    
    await user.type(emailInput, 'test@example.com');
    await user.type(nicknameInput, 'TestUser');
    await user.type(ageInput, '25');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');
    
    // Should have no validation errors
    expect(screen.queryByText(/required/i)).not.toBeInTheDocument();
  });

  it('requires all mandatory fields', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />);
    
    const submitButton = screen.getByRole('button', { name: /Create Account/i });
    
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/Nickname is required/i)).toBeInTheDocument();
      expect(screen.getByText(/You must be at least 13 years old/i)).toBeInTheDocument();
      expect(screen.getByText(/Password is required/i)).toBeInTheDocument();
    });
  });
});
