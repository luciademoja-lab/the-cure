import { AIPrompt, ElaborationSuggestion, PromptLevel } from '../types/journal';

const promptTemplates = {
  light: [
    'prompt.light.1',
    'prompt.light.2',
    'prompt.light.3',
    'prompt.light.4',
    'prompt.light.5',
  ],
  medium: [
    'prompt.medium.1',
    'prompt.medium.2',
    'prompt.medium.3',
    'prompt.medium.4',
    'prompt.medium.5',
  ],
  deep: [
    'prompt.deep.1',
    'prompt.deep.2',
    'prompt.deep.3',
    'prompt.deep.4',
    'prompt.deep.5',
  ],
};

const themes = ['gratitude', 'healing', 'creativity', 'vision', 'reflection', 'embodiment'];

/**
 * Generate an AI prompt based on level and optional theme
 * MVP uses templates; future versions will use OpenAI
 */
export function generateAIPrompt(level: PromptLevel = 'light', theme?: string): AIPrompt {
  const templates = promptTemplates[level];
  const randomKey = templates[Math.floor(Math.random() * templates.length)];
  const selectedTheme = theme || themes[Math.floor(Math.random() * themes.length)];

  return {
    key: randomKey,
    level,
    theme: selectedTheme,
  };
}

/**
 * Detect emotional tone and suggest elaborations
 * MVP uses pattern matching; future versions will use GPT
 */
export function suggestElaborations(text: string): ElaborationSuggestion[] {
  const emotionalKeywords: Record<string, string[]> = {
    sadness: ['sad', 'hurt', 'lost', 'alone', 'empty'],
    joy: ['happy', 'loved', 'grateful', 'light', 'free'],
    fear: ['afraid', 'anxious', 'worried', 'scared'],
    anger: ['angry', 'frustrated', 'rage', 'furious'],
  };

  const suggestions: ElaborationSuggestion[] = [];

  for (const [emotion, keywords] of Object.entries(emotionalKeywords)) {
    if (keywords.some((kw) => text.toLowerCase().includes(kw))) {
      let suggestion = '';

      if (emotion === 'sadness') {
        suggestion = 'What does this sadness need from you right now? How can you honor it?';
      } else if (emotion === 'joy') {
        suggestion = 'What made this moment possible? How can you anchor this feeling?';
      } else if (emotion === 'fear') {
        suggestion = 'What is beneath this fear? What are you truly afraid of losing?';
      } else if (emotion === 'anger') {
        suggestion = 'What boundary is asking to be set? What power is asking to return to you?';
      }

      suggestions.push({
        originalText: text,
        suggestion,
        confidence: 0.75,
      });
    }
  }

  return suggestions;
}

/**
 * Generate AI tags from entry content
 * MVP uses keyword detection; future: GPT categorization
 */
export function generateAITags(content: string): string[] {
  const emotionMap: Record<string, string[]> = {
    Gratitude: ['grateful', 'thank', 'appreciate', 'blessed'],
    Healing: ['heal', 'release', 'forgive', 'transform'],
    Creativity: ['create', 'dream', 'imagine', 'manifest'],
    Reflection: ['reflect', 'understand', 'realize', 'discover'],
    Connection: ['love', 'connect', 'together', 'community'],
  };

  const found = new Set<string>();
  const lowerContent = content.toLowerCase();

  for (const [tag, keywords] of Object.entries(emotionMap)) {
    if (keywords.some((kw) => lowerContent.includes(kw))) {
      found.add(tag);
    }
  }

  return Array.from(found);
}

/**
 * Calculate Light Points based on entry quality
 */
export function calculateLightPoints(contentLength: number, hasTag: boolean, moodImprovement?: boolean): number {
  let points = 5; // base

  if (contentLength > 200) points += 3;
  if (contentLength > 500) points += 5;
  if (hasTag) points += 2;
  if (moodImprovement) points += 5;

  return Math.min(points, 20); // cap at 20
}
