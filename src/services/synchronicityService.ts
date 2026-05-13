import { JournalEntry } from '../types/journal';
import { SynchronicMatch, MirrorMoment, SynchronicityMetrics } from '../types/synchronicity';

/**
 * Calculate how synchronized two entries are (0-100)
 */
export function calculateSynchronicityScore(entry1: JournalEntry, entry2: JournalEntry): number {
  if (!entry1 || !entry2) return 0;

  let score = 0;

  // Tag matching (max 40 points)
  const tags1 = new Set(entry1.aiTags || []);
  const tags2 = new Set(entry2.aiTags || []);
  const commonTags = [...tags1].filter((t) => tags2.has(t)).length;
  const totalUniqueTags = new Set([...tags1, ...tags2]).size;
  const tagScore = totalUniqueTags > 0 ? (commonTags / totalUniqueTags) * 40 : 0;
  score += tagScore;

  // Mood proximity (max 30 points)
  const moodDiff = Math.abs(entry1.mood - entry2.mood);
  const moodScore = Math.max(0, 30 - moodDiff * 3);
  score += moodScore;

  // Text similarity (max 30 points)
  const text1 = (entry1.content || '').toLowerCase();
  const text2 = (entry2.content || '').toLowerCase();

  const words1 = new Set(text1.split(/\W+/).filter((w: string) => w.length > 3));
  const words2 = new Set(text2.split(/\W+/).filter((w: string) => w.length > 3));

  const commonWords = [...words1].filter((w) => words2.has(w)).length;
  const totalWords = new Set([...words1, ...words2]).size;
  const textScore = totalWords > 0 ? (commonWords / totalWords) * 30 : 0;
  score += textScore;

  return Math.round(Math.min(100, score));
}

/**
 * Find all synchronic matches between entries above a threshold
 */
export function findSynchronicMatches(
  entries: JournalEntry[],
  minScore: number = 50
): SynchronicMatch[] {
  const matches: SynchronicMatch[] = [];

  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const entry1 = entries[i];
      const entry2 = entries[j];
      const score = calculateSynchronicityScore(entry1, entry2);

      if (score >= minScore) {
        const tags1 = new Set(entry1.aiTags || []);
        const tags2 = new Set(entry2.aiTags || []);
        const commonThemes = [...tags1].filter((t) => tags2.has(t));

        matches.push({
          id: `${entry1.id}-${entry2.id}`,
          entry1Id: entry1.id,
          entry2Id: entry2.id,
          synchronicityScore: score,
          commonThemes,
          resonanceType: determineResonanceType(entry1, entry2, commonThemes),
          insights: generateSynchronicInsights(entry1, entry2, commonThemes),
        });
      }
    }
  }

  return matches.sort((a, b) => b.synchronicityScore - a.synchronicityScore);
}

/**
 * Identify entries that mirror collective themes
 */
export function identifyMirrorMoments(
  entries: JournalEntry[],
  collectiveThemes: string[]
): MirrorMoment[] {
  const mirrors: MirrorMoment[] = [];

  entries.forEach((entry) => {
    const entryTags = new Set(entry.aiTags || []);
    const matchingThemes = collectiveThemes.filter((t) => entryTags.has(t));

    if (matchingThemes.length > 0) {
      // Count how many other entries share these themes
      const mirrorCount = entries.filter((other) => {
        if (other.id === entry.id) return false;
        const otherTags = new Set(other.aiTags || []);
        return matchingThemes.some((t) => otherTags.has(t));
      }).length;

      mirrors.push({
        id: `mirror-${entry.id}`,
        entryId: entry.id,
        mirrorCount,
        collectiveResonance: Math.round((mirrorCount / Math.max(entries.length - 1, 1)) * 100),
        createdAt: new Date().toISOString(),
      });
    }
  });

  return mirrors;
}

/**
 * Detect cyclical patterns in entries (e.g., weekly mood cycles, theme recurrence)
 */
export function detectCyclicalPatterns(
  entries: JournalEntry[]
): {
  pattern: string;
  daysApart: number[];
  frequency: number;
}[] {
  const patterns: Map<string, number[]> = new Map();

  // Detect mood cycles
  const sortedByDate = [...entries].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  for (let i = 0; i < sortedByDate.length; i++) {
    for (let j = i + 1; j < sortedByDate.length; j++) {
      const e1 = sortedByDate[i];
      const e2 = sortedByDate[j];

      // Check if moods are similar (within 2 points)
      if (Math.abs(e1.mood - e2.mood) <= 2) {
        const date1 = new Date(e1.timestamp).getTime();
        const date2 = new Date(e2.timestamp).getTime();
        const daysApart = Math.round((date2 - date1) / (24 * 60 * 60 * 1000));

        const key = `mood-${e1.mood}`;
        if (!patterns.has(key)) {
          patterns.set(key, []);
        }
        patterns.get(key)!.push(daysApart);
      }
    }
  }

  // Convert to result format
  return Array.from(patterns.entries()).map(([pattern, daysApart]) => ({
    pattern,
    daysApart: [...new Set(daysApart)].sort((a, b) => a - b),
    frequency: daysApart.length,
  }));
}

/**
 * Calculate comprehensive synchronicity metrics across all entries
 */
export function calculateSynchronicityMetrics(entries: JournalEntry[]): SynchronicityMetrics {
  const matches = findSynchronicMatches(entries, 0); // Get all matches
  const allTags: Map<string, number> = new Map();
  const moodTotals: Map<number, { count: number; tags: string[] }> = new Map();

  // Tally themes and moods
  entries.forEach((entry) => {
    (entry.aiTags || []).forEach((tag) => {
      allTags.set(tag, (allTags.get(tag) || 0) + 1);
    });

    const mood = entry.mood;
    if (!moodTotals.has(mood)) {
      moodTotals.set(mood, { count: 0, tags: [] });
    }
    moodTotals.get(mood)!.count += 1;
    moodTotals.get(mood)!.tags.push(...(entry.aiTags || []));
  });

  const topThemes = Array.from(allTags.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([theme, frequency]) => ({ theme, frequency }));

  const emotionalPatterns = Array.from(moodTotals.entries())
    .map(([mood, data]) => ({
      pattern: `Mood ${mood}`,
      frequency: data.count,
      averageMood: mood,
    }))
    .sort((a, b) => b.frequency - a.frequency);

  const avgSynchronicity =
    matches.length > 0 ? Math.round(matches.reduce((s, m) => s + m.synchronicityScore, 0) / matches.length) : 0;

  return {
    totalEntries: entries.length,
    totalMatches: matches.length,
    averageSynchronicityScore: avgSynchronicity,
    topThemes,
    emotionalPatterns,
    cyclicalPatterns: detectCyclicalPatterns(entries),
  };
}

/**
 * Helper: Determine resonance type
 */
function determineResonanceType(entry1: JournalEntry, entry2: JournalEntry, commonThemes: string[]): 'emotional' | 'thematic' | 'symbolic' | 'cyclical' {
  // Theme-based
  if (commonThemes.length > 1) return 'thematic';
  // Mood-based
  if (Math.abs(entry1.mood - entry2.mood) <= 1) return 'emotional';
  // Default
  return 'symbolic';
}

/**
 * Helper: Generate insights about synchronic connection
 */
function generateSynchronicInsights(
  entry1: JournalEntry,
  _entry2: JournalEntry,
  commonThemes: string[]
): string[] {
  const insights: string[] = [];

  if (commonThemes.includes('Gratitude')) {
    insights.push('Both entries express deep gratitude—a resonant pattern of appreciation.');
  }
  if (commonThemes.includes('Healing')) {
    insights.push('Healing themes appear together, suggesting consistent inner work.');
  }
  if (commonThemes.includes('Connection')) {
    insights.push('Connection is a recurring resonance, pointing to relational depth.');
  }
  if (commonThemes.length > 2) {
    insights.push('Multiple themes align—a powerful synchronic moment.');
  }

  if (insights.length === 0) {
    insights.push('These entries resonate through subtle emotional currents.');
  }

  return insights;
}
