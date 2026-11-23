export type Mood = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
export type Energy = 'low' | 'moderate' | 'high';
export type PromptLevel = 'light' | 'medium' | 'deep';

export interface JournalEntry {
  id: string;
  content: string;
  mood: Mood;
  energy: Energy;
  timestamp: Date;
  tags: string[];
  aiTags: string[];
  promptUsed?: string;
  bodyFocus?: string; // somatic awareness
  sensation?: string; // from backend
  aiPrompt?: string;
  elayraResponse?: string;
  lightPointsEarned?: number;
  /** Le pagine scritte da sole: il giorno (AAAA-MM-GG) e le parole della persona. */
  day?: string | null;
  userWords?: string[];
}

export interface CheckInData {
  mood: Mood;
  energy: Energy;
  bodySensation: string;
}

export interface AIPrompt {
  key: string;
  level: PromptLevel;
  theme: string;
}

export interface ElaborationSuggestion {
  originalText: string;
  suggestion: string;
  confidence: number;
}
