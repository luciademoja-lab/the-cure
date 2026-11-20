import '@testing-library/jest-dom/vitest';
import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nProvider } from '../../i18n/I18nProvider';
import { LiriaPopup } from './LiriaPopup';

const show = () =>
  render(
    <I18nProvider>
      <LiriaPopup />
    </I18nProvider>
  );

describe('popup di Secretary Liria', () => {
  beforeEach(() => window.localStorage.clear());

  it('compare a ogni visita, con il pulsante verso il sito di Liria', async () => {
    const { unmount } = show();
    expect(screen.getByRole('dialog', { name: 'Secretary Liria' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Hire your Secretary Now' })).toHaveAttribute('href', 'https://secretaryliria.com/');
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    unmount();
    show();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('con "non mostrare più" non ricompare', async () => {
    const { unmount } = show();
    await userEvent.click(screen.getByRole('button', { name: 'Don’t show again' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    unmount();
    show();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
