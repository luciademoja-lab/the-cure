import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '../../i18n/I18nProvider';
import { PathGame } from './PathGame';
import { ListeningGame } from './ListeningGame';
import { CircleGame } from './CircleGame';

const wrap = (ui: React.ReactNode) =>
  render(
    <MemoryRouter>
      <I18nProvider>{ui}</I18nProvider>
    </MemoryRouter>
  );

describe('giochini del Percorso', () => {
  it('La Soglia: saltando si arriva alla rivelazione con il nome', () => {
    wrap(<PathGame level={5} levelName="The Threshold" name="Lumira" response="x" onClose={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Skip' }));
    expect(screen.getByText('The Cure is you, Lumira.')).toBeInTheDocument();
  });

  it('Lo Specchio: la rivelazione mostra la risposta della persona', () => {
    wrap(<PathGame level={4} levelName="The Mirror" name="Lumira" response="La mia impazienza" onClose={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Skip' }));
    expect(screen.getByText('La mia impazienza')).toBeInTheDocument();
  });

  it('La Forgia: alla fine c’è il link alla Forgia', () => {
    wrap(<PathGame level={7} levelName="The Forge" name="Lumira" response="" onClose={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Skip' }));
    expect(screen.getByRole('link', { name: 'Go to the Forge' })).toHaveAttribute('href', '/forge');
  });

  it('L’Ascolto: solo la luce lenta conclude il gioco', () => {
    vi.useFakeTimers();
    const onDone = vi.fn();
    wrap(<ListeningGame onDone={onDone} name="L" response="" />);
    const lights = screen.getAllByRole('button');
    const heart = lights.find((b) => (b as HTMLElement).style.animationDuration === '2.6s')!;
    const other = lights.find((b) => b !== heart)!;
    fireEvent.click(other);
    vi.advanceTimersByTime(3000);
    expect(onDone).not.toHaveBeenCalled();
    fireEvent.click(heart);
    vi.advanceTimersByTime(3000);
    expect(onDone).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('Il Cerchio: spostando i frammenti il cerchio si chiude', () => {
    vi.useFakeTimers();
    const onDone = vi.fn();
    wrap(<CircleGame onDone={onDone} name="Lumira" response="" />);
    // Al massimo 6×6 tocchi bastano: si prova finché ogni posto è occupato.
    for (let round = 0; round < 40 && !screen.queryByText('Lumira'); round++) {
      const pieces = screen.getAllByRole('button');
      const crowded = pieces.find((p) => p.getAttribute('class')?.includes('is-crowded'));
      fireEvent.click(crowded || pieces[0]);
    }
    expect(screen.getByText('Lumira')).toBeInTheDocument();
    vi.advanceTimersByTime(3000);
    expect(onDone).toHaveBeenCalled();
    vi.useRealTimers();
  });
});
