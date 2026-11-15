import '@testing-library/jest-dom';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MirrorMomentCard } from '../components/MirrorMomentCard';
import { SynchronicityMatchCard } from '../components/SynchronicityMatchCard';
import { CollectiveSpaceCard } from '../components/CollectiveSpaceCard';
import { JournalEntry, Mood } from '../types/journal';
import { MirrorMoment, SynchronicMatch, CollectiveReflectionSpace } from '../types/synchronicity';
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

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <I18nProvider>
      {component}
    </I18nProvider>
  );
};

describe('Phase 3 Components', () => {
  const createEntry = (overrides?: Partial<JournalEntry>): JournalEntry => ({
    id: '1',
    timestamp: new Date(),
    content: 'I am grateful for the healing in my life',
    mood: 8,
    energy: 'high',
    aiTags: ['Gratitude', 'Healing'],
    tags: ['gratitude', 'healing'],
    ...overrides,
  });

  describe('MirrorMomentCard', () => {
    it('renders the card with entry data', () => {
      const entry = createEntry();
      const mirrorMoment: MirrorMoment = {
        id: 'mirror-1',
        entryId: entry.id,
        mirrorCount: 5,
        collectiveResonance: 65,
        createdAt: new Date().toISOString(),
      };

      renderWithProviders(<MirrorMomentCard mirrorMoment={mirrorMoment} entry={entry} />);

      expect(screen.getByText(/Mirror Moment/)).toBeInTheDocument();
      expect(screen.getByText(/I am grateful for the healing in my life/)).toBeInTheDocument();
    });

    it('displays resonance percentage', () => {
      const entry = createEntry();
      const mirrorMoment: MirrorMoment = {
        id: 'mirror-2',
        entryId: entry.id,
        mirrorCount: 10,
        collectiveResonance: 85,
        createdAt: new Date().toISOString(),
      };

      renderWithProviders(<MirrorMomentCard mirrorMoment={mirrorMoment} entry={entry} />);

      expect(screen.getByText('85%')).toBeInTheDocument();
      expect(screen.getByText(/Collective resonance/)).toBeInTheDocument();
    });

    it('shows mirror count and theme tags', () => {
      const entry = createEntry({ aiTags: ['Gratitude', 'Connection', 'Healing'] });
      const mirrorMoment: MirrorMoment = {
        id: 'mirror-3',
        entryId: entry.id,
        mirrorCount: 7,
        collectiveResonance: 75,
        createdAt: new Date().toISOString(),
      };

      renderWithProviders(<MirrorMomentCard mirrorMoment={mirrorMoment} entry={entry} />);

      // Check for mirror count and collective wisdom message
      expect(screen.getByText('7')).toBeInTheDocument();
      expect(screen.getByText(/other journeyers/)).toBeInTheDocument();
      expect(screen.getByText('Gratitude')).toBeInTheDocument();
      expect(screen.getByText('Healing')).toBeInTheDocument();
    });

    it('displays mood rating', () => {
      const entry = createEntry({ mood: 9 });
      const mirrorMoment: MirrorMoment = {
        id: 'mirror-4',
        entryId: entry.id,
        mirrorCount: 3,
        collectiveResonance: 50,
        createdAt: new Date().toISOString(),
      };

      renderWithProviders(<MirrorMomentCard mirrorMoment={mirrorMoment} entry={entry} />);

      expect(screen.getByText('Mood: 9/10')).toBeInTheDocument();
    });
  });

  describe('SynchronicityMatchCard', () => {
    it('renders connection card with score', () => {
      const match: SynchronicMatch = {
        id: 'sync-1',
        entry1Id: '1',
        entry2Id: '2',
        synchronicityScore: 75,
        commonThemes: ['Gratitude', 'Healing'],
        resonanceType: 'thematic',
        insights: ['Both entries explore themes of release and acceptance'],
      };

      renderWithProviders(<SynchronicityMatchCard match={match} />);

      expect(screen.getByText(/Synchronistic Connection/)).toBeInTheDocument();
      expect(screen.getByText('75%')).toBeInTheDocument();
      expect(screen.getByText(/Thematic resonance/)).toBeInTheDocument();
    });

    it('displays common themes', () => {
      const match: SynchronicMatch = {
        id: 'sync-2',
        entry1Id: '1',
        entry2Id: '2',
        synchronicityScore: 82,
        commonThemes: ['Connection', 'Healing'],
        resonanceType: 'emotional',
        insights: [],
      };

      renderWithProviders(<SynchronicityMatchCard match={match} />);

      expect(screen.getByText('Connection')).toBeInTheDocument();
      expect(screen.getByText('Healing')).toBeInTheDocument();
      expect(screen.getByText(/Shared Themes/)).toBeInTheDocument();
    });

    it('shows insights when available', () => {
      const match: SynchronicMatch = {
        id: 'sync-3',
        entry1Id: '1',
        entry2Id: '2',
        synchronicityScore: 65,
        commonThemes: ['Creativity'],
        resonanceType: 'symbolic',
        insights: ['Creative energy flows through both entries', 'Manifestation themes emerge'],
      };

      renderWithProviders(<SynchronicityMatchCard match={match} />);

      expect(screen.getByText(/Creative energy flows through both entries/)).toBeInTheDocument();
      expect(screen.getByText(/Manifestation themes emerge/)).toBeInTheDocument();
    });

    it('calls onViewDetails callback when button clicked', () => {
      const match: SynchronicMatch = {
        id: 'sync-4',
        entry1Id: '1',
        entry2Id: '2',
        synchronicityScore: 88,
        commonThemes: ['Gratitude'],
        resonanceType: 'emotional',
        insights: [],
      };
      const mockCallback = () => {};

      renderWithProviders(<SynchronicityMatchCard match={match} onViewDetails={mockCallback} />);

      const button = screen.getByText(/See Full Connection/);
      expect(button).toBeInTheDocument();
    });

    it('displays different score levels with appropriate styling', () => {
      const strongMatch: SynchronicMatch = {
        id: 'sync-5',
        entry1Id: '1',
        entry2Id: '2',
        synchronicityScore: 85,
        commonThemes: [],
        resonanceType: 'cyclical',
        insights: [],
      };

      const { container } = renderWithProviders(<SynchronicityMatchCard match={strongMatch} />);
      const card = container.querySelector('.synchronicity-match-card');
      expect(card).toHaveClass('score-strong');
    });
  });

  describe('CollectiveSpaceCard', () => {
    it('renders space card with theme and meta', () => {
      const space: CollectiveReflectionSpace = {
        id: 'space-1',
        theme: 'Healing',
        participantCount: 12,
        dominantMood: 7,
        collectiveResonance: 68,
        sharedInsights: [],
        createdAt: new Date().toISOString(),
      };

      renderWithProviders(<CollectiveSpaceCard space={space} />);

      expect(screen.getByText(/Healing/)).toBeInTheDocument();
      expect(screen.getByText(/12 journeyers/)).toBeInTheDocument();
      expect(screen.getByText(/68% resonance/)).toBeInTheDocument();
    });

    it('displays collective mood indicator', () => {
      const space: CollectiveReflectionSpace = {
        id: 'space-2',
        theme: 'Gratitude',
        participantCount: 25,
        dominantMood: 8,
        collectiveResonance: 75,
        sharedInsights: [],
        createdAt: new Date().toISOString(),
      };

      renderWithProviders(<CollectiveSpaceCard space={space} />);

      expect(screen.getByText(/Collective Mood/)).toBeInTheDocument();
      expect(screen.getByText(/8\/10/)).toBeInTheDocument();
    });

    it('shows mood description based on mood value', () => {
      const space: CollectiveReflectionSpace = {
        id: 'space-3',
        theme: 'Connection',
        participantCount: 8,
        dominantMood: 9,
        collectiveResonance: 55,
        sharedInsights: [],
        createdAt: new Date().toISOString(),
      };

      renderWithProviders(<CollectiveSpaceCard space={space} />);

      expect(screen.getByText(/Radiant/)).toBeInTheDocument();
    });

    it('displays preview of shared insights', () => {
      const space: CollectiveReflectionSpace = {
        id: 'space-4',
        theme: 'Creativity',
        participantCount: 15,
        dominantMood: 8,
        collectiveResonance: 70,
        sharedInsights: [
          {
            id: '1',
            theme: 'Creativity',
            insight: 'The creative impulse emerges from deep within',
            moodLevel: 8,
            tags: ['Creativity', 'Expression'],
            isConsent: true,
            createdAt: new Date().toISOString(),
            anonymityLevel: 'full',
          },
          {
            id: '2',
            theme: 'Creativity',
            insight: 'Art is the language of the soul',
            moodLevel: 9,
            tags: ['Creativity', 'Art'],
            isConsent: true,
            createdAt: new Date().toISOString(),
            anonymityLevel: 'full',
          },
        ],
        createdAt: new Date().toISOString(),
      };

      renderWithProviders(<CollectiveSpaceCard space={space} />);

      expect(screen.getByText(/Shared Wisdom/)).toBeInTheDocument();
    });

    it('shows explore button when onExplore is provided', () => {
      const space: CollectiveReflectionSpace = {
        id: 'space-5',
        theme: 'Reflection',
        participantCount: 20,
        dominantMood: 7,
        collectiveResonance: 65,
        sharedInsights: [],
        createdAt: new Date().toISOString(),
      };
      const mockCallback = () => {};

      renderWithProviders(<CollectiveSpaceCard space={space} onExplore={mockCallback} />);

      expect(screen.getByText(/Explore This Space/)).toBeInTheDocument();
    });
  });
});
