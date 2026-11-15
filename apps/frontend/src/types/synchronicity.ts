import { JournalEntry } from './journal';

/**
 * Represents a connection between entries based on emotional/thematic resonance
 */
export type SynchronicMatch = {
  id: string;
  entry1Id: string;
  entry2Id: string;
  synchronicityScore: number; // 0-100
  commonThemes: string[];
  resonanceType: 'emotional' | 'thematic' | 'symbolic' | 'cyclical';
  insights: string[]; // AI-generated insights about the connection
};

/**
 * A "Mirror Moment" - an entry that resonates with collective patterns
 */
export type MirrorMoment = {
  id: string;
  entryId: string;
  mirrorCount: number; // How many other entries share similar themes
  collectiveResonance: number; // 0-100 how much it resonates with broader patterns
  createdAt: string;
};

/**
 * An anonymized insight shared in the collective pool
 */
export type SharedInsight = {
  id: string;
  originalEntryId?: string; // Null if fully anonymized
  theme: string;
  insight: string;
  moodLevel: number; // 1-10, anonymized
  tags: string[];
  isConsent: boolean; // User opted in to sharing
  createdAt: string;
  anonymityLevel: 'full' | 'partial' | 'identified'; // full = no trace, partial = theme only, identified = attributed
};

/**
 * A collaborative reflection space where users can see shared themes
 */
export type CollectiveReflectionSpace = {
  id: string;
  theme: string;
  sharedInsights: SharedInsight[];
  participantCount: number; // How many users contributed
  dominantMood: number;
  collectiveResonance: number; // 0-100
  createdAt: string;
};

/**
 * Synchronicity calculation metadata
 */
export type SynchronicityMetrics = {
  totalEntries: number;
  totalMatches: number;
  averageSynchronicityScore: number;
  topThemes: { theme: string; frequency: number }[];
  emotionalPatterns: {
    pattern: string;
    frequency: number;
    averageMood: number;
  }[];
  cyclicalPatterns: {
    pattern: string;
    daysApart: number[];
    frequency: number;
  }[];
};
