import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SecurityGate } from '../components/auth/SecurityGate';
import { AuthProvider } from '../contexts/AuthContext';
import { I18nProvider } from '../i18n/I18nProvider';
import { fakeSupabase } from '../test/setup';
import { supabase } from '../lib/supabase';

const json = (body: unknown, status = 200) =>
  new Response(status === 204 ? null : JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const me = (onboarded: boolean) => ({
  nickname: 'Ada', onboarded, referralCode: 'abc', plan: 'free', usage: { used: 0, limit: 300 },
  subscription: null, grants: [], plans: [],
});

const renderGate = () =>
  render(
    <I18nProvider>
      <AuthProvider>
        <SecurityGate>
          <p>contenuto protetto</p>
        </SecurityGate>
      </AuthProvider>
    </I18nProvider>
  );

describe('SecurityGate — 2FA obbligatoria e primo accesso', () => {
  const fetchMock = vi.fn();
  const mfa = supabase.auth.mfa as unknown as Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(() => {
    fakeSupabase.signInAs();
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('senza autenticatore configurato mostra il QR da inquadrare e non il contenuto', async () => {
    vi.spyOn(supabase.auth.mfa, 'getAuthenticatorAssuranceLevel').mockResolvedValue({ data: { currentLevel: 'aal1', nextLevel: 'aal1' }, error: null } as never);
    const enroll = vi.spyOn(supabase.auth.mfa, 'enroll');
    renderGate();
    expect(await screen.findByText('Protect your account')).toBeInTheDocument();
    expect(screen.getByText('SECRET')).toBeInTheDocument();
    expect(enroll).toHaveBeenCalledWith(expect.objectContaining({ factorType: 'totp' }));
    expect(screen.queryByText('contenuto protetto')).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
    void mfa;
  });

  it('con autenticatore già configurato chiede il codice e accetta solo 6 cifre', async () => {
    const user = userEvent.setup();
    const aal = vi
      .spyOn(supabase.auth.mfa, 'getAuthenticatorAssuranceLevel')
      .mockResolvedValue({ data: { currentLevel: 'aal1', nextLevel: 'aal2' }, error: null } as never);
    vi.spyOn(supabase.auth.mfa, 'listFactors').mockResolvedValue({
      data: { all: [{ id: 'f9', status: 'verified' }], totp: [{ id: 'f9', status: 'verified' }] },
      error: null,
    } as never);
    const verify = vi.spyOn(supabase.auth.mfa, 'challengeAndVerify');
    renderGate();
    expect(await screen.findByText('Verification code')).toBeInTheDocument();

    await user.type(screen.getByLabelText('6-digit code'), '12ab');
    await user.click(screen.getByRole('button', { name: 'Verify' }));
    expect(await screen.findByText('The code has 6 digits.')).toBeInTheDocument();
    expect(verify).not.toHaveBeenCalled();

    aal.mockResolvedValue({ data: { currentLevel: 'aal2', nextLevel: 'aal2' }, error: null } as never);
    fetchMock.mockResolvedValueOnce(json(me(true)));
    await user.clear(screen.getByLabelText('6-digit code'));
    await user.type(screen.getByLabelText('6-digit code'), '123456');
    await user.click(screen.getByRole('button', { name: 'Verify' }));
    expect(verify).toHaveBeenCalledWith({ factorId: 'f9', code: '123456' });
    expect(await screen.findByText('contenuto protetto')).toBeInTheDocument();
  });

  it('al primo accesso chiede nome ed età e blocca i minorenni', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce(json(me(false)));
    renderGate();
    expect(await screen.findByText('Welcome')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Age'), '16');
    await user.click(screen.getByRole('button', { name: 'Start' }));
    expect(await screen.findByText('You need to be at least 18 to use Elayra.')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    fetchMock.mockResolvedValueOnce(json(null, 204));
    fetchMock.mockResolvedValueOnce(json(me(true)));
    await user.clear(screen.getByLabelText('Age'));
    await user.type(screen.getByLabelText('Age'), '34');
    await user.click(screen.getByRole('button', { name: 'Start' }));
    await waitFor(() => expect(screen.getByText('contenuto protetto')).toBeInTheDocument());
    const call = fetchMock.mock.calls.find(([url]) => url === '/api/onboarding');
    expect(JSON.parse(call![1].body)).toMatchObject({ nickname: 'Ada', age: 34 });
  });
});
