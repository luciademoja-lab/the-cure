import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { I18nProvider } from '../i18n/I18nProvider';
import { RegisterPage } from '../pages/RegisterPage';

const register = vi.fn();
const remembered: string[] = [];

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ register, isLoading: false, signInWithGoogle: vi.fn() }),
  rememberReferral: (code: string) => remembered.push(code),
}));

const renderPage = (path = '/register') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <I18nProvider>
        <RegisterPage />
      </I18nProvider>
    </MemoryRouter>
  );

describe('RegisterPage', () => {
  beforeEach(() => {
    register.mockReset();
    remembered.length = 0;
  });

  it('si iscrive con email e password, oppure con Google', () => {
    renderPage();
    expect(screen.getByLabelText(/Email/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Password/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Confirm Password/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Google/ })).toBeInTheDocument();
  });

  it('controlla email, lunghezza della password e conferma', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByLabelText(/Email/), 'non-una-email');
    await user.type(screen.getByLabelText(/^Password/), 'corta');
    await user.type(screen.getByLabelText(/Confirm Password/), 'diversa');
    await user.click(screen.getByRole('button', { name: 'Create Account' }));
    expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
    expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    expect(register).not.toHaveBeenCalled();
  });

  it('dopo l’iscrizione chiede di confermare l’email e conserva il codice di invito', async () => {
    register.mockResolvedValue({ needsEmailConfirmation: true });
    const user = userEvent.setup();
    renderPage('/register?ref=abc123');
    await user.type(screen.getByLabelText(/Email/), 'nuova@example.com');
    await user.type(screen.getByLabelText(/^Password/), 'password-lunga');
    await user.type(screen.getByLabelText(/Confirm Password/), 'password-lunga');
    await user.click(screen.getByRole('button', { name: 'Create Account' }));
    await waitFor(() => expect(register).toHaveBeenCalledWith({ email: 'nuova@example.com', password: 'password-lunga', referralCode: 'abc123' }));
    expect(remembered).toEqual(['abc123']);
    expect(await screen.findByRole('status')).toHaveTextContent(/We sent you an email/);
  });
});
