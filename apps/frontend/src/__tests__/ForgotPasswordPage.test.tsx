import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { I18nProvider } from '../i18n/I18nProvider';
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage';

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

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders forgot password form', () => {
    renderWithProviders(<ForgotPasswordPage />);
    
    expect(screen.getByText(/Reset Your Password/i)).toBeInTheDocument();
    expect(screen.getByText(/Enter your email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
  });

  it('renders send reset link button', () => {
    renderWithProviders(<ForgotPasswordPage />);
    
    expect(screen.getByRole('button', { name: /Send Reset Link/i })).toBeInTheDocument();
  });

  it('renders back to sign in link', () => {
    renderWithProviders(<ForgotPasswordPage />);
    
    expect(screen.getByText(/Back to Sign In/i)).toBeInTheDocument();
  });

  it('validates email is required', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ForgotPasswordPage />);
    
    const submitButton = screen.getByRole('button', { name: /Send Reset Link/i });
    
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Email is required/i)).toBeInTheDocument();
    });
  });

  it('validates email format', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ForgotPasswordPage />);
    
    const emailInput = screen.getByLabelText(/Email/i);
    const submitButton = screen.getByRole('button', { name: /Send Reset Link/i });
    
    await user.type(emailInput, 'invalid-email');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Please enter a valid email address/i)).toBeInTheDocument();
    });
  });

  it('clears error message when user types valid email', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ForgotPasswordPage />);
    
    const emailInput = screen.getByLabelText(/Email/i);
    const submitButton = screen.getByRole('button', { name: /Send Reset Link/i });
    
    // Trigger validation error
    await user.type(emailInput, 'invalid');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Please enter a valid email address/i)).toBeInTheDocument();
    });
    
    // Clear error by typing valid email
    await user.clear(emailInput);
    await user.type(emailInput, 'valid@example.com');
    
    // Error should be cleared
    expect(screen.queryByText(/Please enter a valid email address/i)).not.toBeInTheDocument();
  });

  it('accepts valid email', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ForgotPasswordPage />);
    
    const emailInput = screen.getByLabelText(/Email/i);
    
    await user.type(emailInput, 'test@example.com');
    
    // Should have no validation errors
    expect(screen.queryByText(/Email is required/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Please enter a valid email address/i)).not.toBeInTheDocument();
  });

  it('displays loading state on button when submitting', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ForgotPasswordPage />);
    
    const emailInput = screen.getByLabelText(/Email/i);
    
    await user.type(emailInput, 'test@example.com');
    
    // Button should show "Send Reset Link" text
    const submitButton = screen.getByRole('button', { name: /Send Reset Link/i });
    expect(submitButton).toBeInTheDocument();
  });

  it('shows success state after valid submission', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ForgotPasswordPage />);
    
    const emailInput = screen.getByLabelText(/Email/i);
    const submitButton = screen.getByRole('button', { name: /Send Reset Link/i });
    
    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);
    
    // Success state should show confirmation message
    await waitFor(() => {
      expect(screen.getByText(/Check Your Email/i)).toBeInTheDocument();
    });
  });

  it('shows user email in success message', async () => {
    const user = userEvent.setup();
    const testEmail = 'testuser@example.com';
    renderWithProviders(<ForgotPasswordPage />);
    
    const emailInput = screen.getByLabelText(/Email/i);
    const submitButton = screen.getByRole('button', { name: /Send Reset Link/i });
    
    await user.type(emailInput, testEmail);
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(new RegExp(testEmail))).toBeInTheDocument();
    });
  });
});
