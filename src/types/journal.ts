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
  lightPointsEarned?: number;
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
