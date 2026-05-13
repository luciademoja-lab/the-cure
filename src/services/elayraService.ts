/**
 * Elayra AI Personality Engine
 * Generates personalized, compassionate responses aligned with the brand voice
 */

export interface ElayraMessage {
  text: string;
  type: 'wisdom' | 'encouragement' | 'prompt' | 'reflection';
  timestamp: Date;
}

const wisdomKeys = [
  'wisdom.1', 'wisdom.2', 'wisdom.3', 'wisdom.4', 'wisdom.5',
  'wisdom.6', 'wisdom.7', 'wisdom.8', 'wisdom.9', 'wisdom.10'
];

const encouragementKeys = [
  'encouragement.1', 'encouragement.2', 'encouragement.3', 'encouragement.4', 'encouragement.5',
  'encouragement.6', 'encouragement.7', 'encouragement.8'
];

const reflectionKeys = [
  'reflection.1', 'reflection.2', 'reflection.3', 'reflection.4', 'reflection.5'
];

const elayraResponses = {
  low: [
    'elayra.low.1', 'elayra.low.2', 'elayra.low.3', 'elayra.low.4', 'elayra.low.5',
    'elayra.low.6', 'elayra.low.7', 'elayra.low.8', 'elayra.low.9', 'elayra.low.10'
  ],
  medium: [
    'elayra.medium.1', 'elayra.medium.2', 'elayra.medium.3', 'elayra.medium.4', 'elayra.medium.5',
    'elayra.medium.6', 'elayra.medium.7', 'elayra.medium.8', 'elayra.medium.9', 'elayra.medium.10'
  ],
  high: [
    'elayra.high.1', 'elayra.high.2', 'elayra.high.3', 'elayra.high.4', 'elayra.high.5',
    'elayra.high.6', 'elayra.high.7', 'elayra.high.8', 'elayra.high.9', 'elayra.high.10'
  ]
};

/**
 * Generate a random Elayra wisdom message
 */
export function generateElayraWisdom(t: (key: string) => string): ElayraMessage {
  const key = wisdomKeys[Math.floor(Math.random() * wisdomKeys.length)];
  return {
    text: t(key),
    type: 'wisdom',
    timestamp: new Date(),
  };
}

/**
 * Generate encouragement based on user progress
 */
export function generateElayraEncouragement(entriesThisWeek: number, t: (key: string) => string): ElayraMessage {
  let key = encouragementKeys[Math.floor(Math.random() * encouragementKeys.length)];

  if (entriesThisWeek >= 5) {
    key = 'encouragement.committed';
  } else if (entriesThisWeek >= 3) {
    key = 'encouragement.consistent';
  } else if (entriesThisWeek === 1) {
    key = 'encouragement.first';
  }

  return {
    text: t(key),
    type: 'encouragement',
    timestamp: new Date(),
  };
}

/**
 * Generate a reflection prompt with Elayra's voice
 */
export function generateElayraReflection(t: (key: string) => string): ElayraMessage {
  const key = reflectionKeys[Math.floor(Math.random() * reflectionKeys.length)];
  return {
    text: t(key),
    type: 'reflection',
    timestamp: new Date(),
  };
}

/**
 * Personalize a prompt based on user mood and history
 */
export function personalizeWithElayra(basePrompt: string, userMood: number, t: (key: string) => string): string {
  let key = 'personalize.high';

  if (userMood <= 3) {
    key = 'personalize.low';
  } else if (userMood <= 5) {
    key = 'personalize.medium';
  } else if (userMood <= 7) {
    key = 'personalize.balanced';
  }

  return `${basePrompt}\n\n${t(key)}`;
}

/**
 * Generate a compassionate response to a journal entry (MVP simplified Elayra)
 */

export function generateElayraResponse(entry: { mood: number; content: string; aiTags?: string[] }): string {
  const { mood } = entry;
  let pool;

  if (mood <= 3) {
    pool = elayraResponses.low;
  } else if (mood <= 6) {
    pool = elayraResponses.medium;
  } else {
    pool = elayraResponses.high;
  }

  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex];
}