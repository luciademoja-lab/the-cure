import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { EntryList } from '../components/organisms/EntryList';
import { JournalEntry, Mood } from '../types/journal';

describe('EntryList', () => {
  const mockEntry: JournalEntry = {
    id: '1',
    content: 'Today I felt grateful for the small moments. I am learning to appreciate the journey.',
    mood: 8 as Mood,
    energy: 'high',
    timestamp: new Date('2026-04-09'),
    tags: ['personal'],
    aiTags: ['Gratitude', 'Reflection'],
    lightPointsEarned: 15,
  };

  it('shows empty state when no entries', () => {
    render(<EntryList entries={[]} />);
    expect(screen.getByText(/No entries yet/i)).toBeInTheDocument();
  });

  it('displays entry list', () => {
    render(<EntryList entries={[mockEntry]} />);
    expect(screen.getByText(/Today I felt grateful/i)).toBeInTheDocument();
  });

  it('shows AI tags', () => {
    render(<EntryList entries={[mockEntry]} />);
    expect(screen.getByText('Gratitude')).toBeInTheDocument();
    expect(screen.getByText('Reflection')).toBeInTheDocument();
  });

  it('displays Light Points earned', () => {
    render(<EntryList entries={[mockEntry]} />);
    expect(screen.getByText('+15 Light Points')).toBeInTheDocument();
  });
});
