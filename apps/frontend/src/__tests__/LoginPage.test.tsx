import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { I18nProvider } from '../i18n/I18nProvider';
import { LoginPage } from '../pages/LoginPage';

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ signInWithGoogle: vi.fn() }),
}));

describe('LoginPage', () => {
  it('offre solo l\'accesso con Google', () => {
    render(
      <MemoryRouter>
        <I18nProvider>
          <LoginPage />
        </I18nProvider>
      </MemoryRouter>
    );
    expect(screen.getByRole('button', { name: /google/i })).toBeInTheDocument();
    expect(screen.queryByLabelText(/password/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument();
  });
});
