export interface DailyRitual {
  id: string;
  type: 'morning' | 'evening';
  date: Date;
  prompt: string;
  response?: string;
  completed: boolean;
  lightPointsEarned?: number;
}

export interface DailyPracticeData {
  morningRitual?: DailyRitual;
  eveningRitual?: DailyRitual;
  date: Date;
}

const morningPrompts = [
  'What do I choose to feel today?',
  'What is asking to be born through me today?',
  'Where is my power today?',
  'What small act of self-love can I offer myself?',
  'How will I honor my presence today?',
  'What intention will I carry?',
  'What am I grateful for, even in the uncertainty?',
];

const eveningPrompts = [
  'What moment today opened my heart?',
  'How did I show up for myself today?',
  'What am I grateful for tonight?',
  'What did I learn about myself today?',
  'How will I rest and let the universe hold me?',
  'What do I want to release as I close this day?',
  'How did I honor my own wisdom today?',
];
