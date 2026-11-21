import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { I18nProvider } from '../../i18n/I18nProvider';
import { TarotSpread } from './TarotSpread';
import type { TarotCardData } from './tarotTypes';

const cards: TarotCardData[] = [
  { id: 17, reversed: false, position: 'past', name: { it: 'La Stella', en: 'The Star' } },
  { id: 9, reversed: true, position: 'present', name: { it: "L'Eremita", en: 'The Hermit' } },
  { id: 21, reversed: false, position: 'path', name: { it: 'Il Mondo', en: 'The World' } },
];

describe('TarotSpread', () => {
  it('mostra i nomi solo delle carte già girate', () => {
    render(
      <I18nProvider>
        <TarotSpread cards={cards} revealed={2} />
      </I18nProvider>
    );
    expect(screen.getAllByText('The Star').length).toBeGreaterThan(0);
    expect(screen.getByText(/The Hermit · reversed/)).toBeInTheDocument();
    expect(screen.queryByText('The World')).not.toBeInTheDocument();
    expect(screen.getByText('Where you are heading')).toBeInTheDocument();
  });
});
