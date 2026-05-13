import { JournalEntry } from '../types/journal';
import { SharedInsight, CollectiveReflectionSpace } from '../types/synchronicity';
import { suggestElaborations } from './journalAIService';

export type AnonymityLevel = 'full' | 'partial' | 'identified';

/**
 * Creates a shared insight from a journal entry for collective sharing
 * Generates AI-driven wisdom from the entry that can be anonymously shared
 */
export function createSharedInsight(
  entry: JournalEntry,
  theme: string,
  isConsent: boolean
): SharedInsight {
  // Generate insight text using AI service
  const elaborations = suggestElaborations(entry.content);
  const insightText = elaborations.length > 0 
    ? elaborations[0].suggestion 
    : `Reflecting on the theme of ${theme}...`;

  return {
    id: `insight-${entry.id}-${theme}`,
    theme,
    insight: insightText,
    moodLevel: entry.mood,
    tags: entry.aiTags,
    isConsent,
    originalEntryId: entry.id,
    createdAt: new Date().toISOString(),
    anonymityLevel: 'full',
  };
}

/**
 * Anonymizes an insight based on the requested level
 * - 'full': Removes all entry identifiers
 * - 'partial': Removes entry ID but keeps theme and mood
 * - 'identified': Keeps all information (for author's own reflections)
 */
export function anonymizeInsight(
  insight: SharedInsight,
  level: AnonymityLevel
): SharedInsight {
  if (level === 'full') {
    return {
      ...insight,
      originalEntryId: undefined,
      anonymityLevel: 'full',
    };
  }

  if (level === 'partial') {
    return {
      ...insight,
      originalEntryId: undefined,
      anonymityLevel: 'partial',
    };
  }

  // 'identified'
  return {
    ...insight,
    anonymityLevel: 'identified',
  };
}

/**
 * Aggregates all unique themes from a collection of entries
 * Used to build the collective theme landscape
 */
export function aggregateThemesFromEntries(entries: JournalEntry[]): string[] {
  const themeSet = new Set<string>();

  for (const entry of entries) {
    for (const tag of entry.aiTags) {
      themeSet.add(tag);
    }
  }

  return Array.from(themeSet).sort();
}

/**
 * Builds a collective reflection space around a specific theme
 * Aggregates anonymized insights from all entries containing this theme
 */
export function buildCollectiveReflectionSpace(
  entries: JournalEntry[],
  theme: string
): CollectiveReflectionSpace {
  // Filter entries that contain this theme
  const relevantEntries = entries.filter((entry) => entry.aiTags.includes(theme));

  // Create shared insights from relevant entries
  const sharedInsights = relevantEntries.map((entry) =>
    anonymizeInsight(createSharedInsight(entry, theme, true), 'full')
  );

  // Calculate dominant mood from relevant entries
  const moodSum = relevantEntries.reduce((sum, entry) => sum + entry.mood, 0);
  const dominantMood = Math.round(moodSum / relevantEntries.length);

  return {
    id: `collective-${theme}`,
    theme,
    participantCount: relevantEntries.length,
    dominantMood,
    sharedInsights,
    collectiveResonance: calculateCollectiveResonance(entries, theme),
    createdAt: new Date().toISOString(),
  };
}

/**
 * Calculates collective resonance - a measure of how prevalent a theme is
 * Expressed as a percentage (0-100) of entries that contain this theme
 */
export function calculateCollectiveResonance(entries: JournalEntry[], theme: string): number {
  if (entries.length === 0) {
    return 0;
  }

  const entriesWithTheme = entries.filter((entry) => entry.aiTags.includes(theme)).length;
  return (entriesWithTheme / entries.length) * 100;
}
