import '@testing-library/jest-dom';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WeeklyInsights } from '../components/organisms/WeeklyInsights';
import { JournalEntry } from '../types/journal';
import { I18nProvider } from '../i18n/I18nProvider';

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

describe('WeeklyInsights', () => {
  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <I18nProvider>
        {component}
      </I18nProvider>
    );
  };

  it('renders nothing with empty entries', () => {
    const { container } = renderWithProviders(<WeeklyInsights entries={[]} />);
    expect(container.querySelector('.weekly-insights')).not.toBeInTheDocument();
  });

  it('renders weekly insights heading when there are entries', () => {
    const entries: JournalEntry[] = [
      {
        id: '1',
        content: 'Entry 1',
        mood: 8,
        energy: 'moderate',
        timestamp: new Date(),
        tags: ['personal'],
        aiTags: ['Gratitude'],
        lightPointsEarned: 10,
      },
    ];
    renderWithProviders(<WeeklyInsights entries={entries} />);
    expect(screen.getByText(/this week/i)).toBeInTheDocument();
  });

  it('displays stat labels', () => {
    const entries: JournalEntry[] = [
      {
        id: '1',
        content: 'Entry 1',
        mood: 8,
        energy: 'moderate',
        timestamp: new Date(),
        tags: ['personal'],
        aiTags: ['Gratitude'],
        lightPointsEarned: 10,
      },
    ];
    renderWithProviders(<WeeklyInsights entries={entries} />);
    expect(screen.getByText(/entries/i)).toBeInTheDocument();
    expect(screen.getByText(/average mood/i)).toBeInTheDocument();
    expect(screen.getByText(/light points/i)).toBeInTheDocument();
  });

  it('displays entry count', () => {
    const entries: JournalEntry[] = [
      {
        id: '1',
        content: 'Entry 1',
        mood: 8,
        energy: 'moderate',
        timestamp: new Date(),
        tags: ['personal'],
        aiTags: ['Gratitude'],
        lightPointsEarned: 10,
      },
      {
        id: '2',
        content: 'Entry 2',
        mood: 6,
        energy: 'low',
        timestamp: new Date(),
        tags: ['personal'],
        aiTags: ['Healing'],
        lightPointsEarned: 8,
      },
    ];
    renderWithProviders(<WeeklyInsights entries={entries} />);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('renders stats grid container', () => {
    const entries: JournalEntry[] = [
      {
        id: '1',
        content: 'Entry 1',
        mood: 8,
        energy: 'moderate',
        timestamp: new Date(),
        tags: ['personal'],
        aiTags: ['Gratitude'],
        lightPointsEarned: 10,
      },
    ];
    const { container } = renderWithProviders(<WeeklyInsights entries={entries} />);
    expect(container.querySelector('.insights-grid')).toBeInTheDocument();
  });

  it('displays trending themes section when there are tags', () => {
    const entries: JournalEntry[] = [
      {
        id: '1',
        content: 'Entry 1',
        mood: 8,
        energy: 'moderate',
        timestamp: new Date(),
        tags: ['personal'],
        aiTags: ['Gratitude', 'Healing'],
        lightPointsEarned: 10,
      },
    ];
    renderWithProviders(<WeeklyInsights entries={entries} />);
    expect(screen.getByText(/gratitude/i)).toBeInTheDocument();
  });
});
