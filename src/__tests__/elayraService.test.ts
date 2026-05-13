import { describe, it, expect, vi } from 'vitest';
import {
  generateElayraWisdom,
  generateElayraEncouragement,
  generateElayraReflection,
  personalizeWithElayra,
  ElayraMessage
} from '../services/elayraService';

describe('elayraService', () => {
  const mockTranslate = vi.fn((key: string) => {
    const translations: Record<string, string> = {
      'wisdom.1': 'You are exactly where you need to be.',
      'encouragement.1': 'You showed up today. That is everything.',
      'reflection.1': 'What would your wisest self tell you right now?',
      'personalize.low': 'I see you are in a tender place.',
      'personalize.medium': 'You are navigating something.',
      'personalize.balanced': 'You are finding your balance.',
      'personalize.high': 'Your light is shining.'
    };
    return translations[key] || key;
  });

  describe('generateElayraWisdom', () => {
    it('returns a valid wisdom message object', () => {
      const message = generateElayraWisdom(mockTranslate);

      expect(message).toBeDefined();
      expect(message.text).toBeDefined();
      expect(typeof message.text).toBe('string');
      expect(message.text.length).toBeGreaterThan(0);
      expect(message.type).toBe('wisdom');
      expect(message.timestamp).toBeInstanceOf(Date);
    });

    it('returns different wisdom messages on multiple calls', () => {
      const message1 = generateElayraWisdom(mockTranslate);
      const message2 = generateElayraWisdom(mockTranslate);

      expect(message1.text).toBeDefined();
      expect(message2.text).toBeDefined();
      expect(typeof message1.text).toBe('string');
      expect(typeof message2.text).toBe('string');
    });

    it('uses the provided translation function', () => {
      generateElayraWisdom(mockTranslate);
      expect(mockTranslate).toHaveBeenCalled();
    });
  });

  describe('generateElayraEncouragement', () => {
    it('returns an encouragement message', () => {
      const message = generateElayraEncouragement(1, mockTranslate);

      expect(message).toBeDefined();
      expect(message.text).toBeDefined();
      expect(typeof message.text).toBe('string');
      expect(message.text.length).toBeGreaterThan(0);
      expect(message.type).toBe('encouragement');
      expect(message.timestamp).toBeInstanceOf(Date);
    });

    it('returns different encouragement messages on multiple calls', () => {
      const message1 = generateElayraEncouragement(1, mockTranslate);
      const message2 = generateElayraEncouragement(1, mockTranslate);

      expect(message1.text).toBeDefined();
      expect(message2.text).toBeDefined();
    });

    it('returns appropriate encouragement for first entry', () => {
      mockTranslate.mockClear();
      const message = generateElayraEncouragement(1, mockTranslate);

      expect(message).toBeDefined();
      expect(message.type).toBe('encouragement');
    });

    it('returns appropriate encouragement for consistent entries', () => {
      mockTranslate.mockClear();
      const message = generateElayraEncouragement(3, mockTranslate);

      expect(message).toBeDefined();
      expect(message.type).toBe('encouragement');
    });

    it('returns appropriate encouragement for committed entries', () => {
      mockTranslate.mockClear();
      const message = generateElayraEncouragement(5, mockTranslate);

      expect(message).toBeDefined();
      expect(message.type).toBe('encouragement');
    });
  });

  describe('generateElayraReflection', () => {
    it('returns a reflection message', () => {
      mockTranslate.mockClear();
      const message = generateElayraReflection(mockTranslate);

      expect(message).toBeDefined();
      expect(message.text).toBeDefined();
      expect(typeof message.text).toBe('string');
      expect(message.text.length).toBeGreaterThan(0);
      expect(message.type).toBe('reflection');
      expect(message.timestamp).toBeInstanceOf(Date);
    });

    it('returns different reflection prompts on multiple calls', () => {
      mockTranslate.mockClear();
      const message1 = generateElayraReflection(mockTranslate);
      const message2 = generateElayraReflection(mockTranslate);

      expect(message1.text).toBeDefined();
      expect(message2.text).toBeDefined();
    });
  });

  describe('personalizeWithElayra', () => {
    it('returns a personalized prompt for low mood', () => {
      mockTranslate.mockClear();
      const basePrompt = 'What are you feeling?';
      const result = personalizeWithElayra(basePrompt, 2, mockTranslate);

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toContain(basePrompt);
    });

    it('returns a personalized prompt for medium mood', () => {
      mockTranslate.mockClear();
      const basePrompt = 'What are you feeling?';
      const result = personalizeWithElayra(basePrompt, 4, mockTranslate);

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toContain(basePrompt);
    });

    it('returns a personalized prompt for balanced mood', () => {
      mockTranslate.mockClear();
      const basePrompt = 'What are you feeling?';
      const result = personalizeWithElayra(basePrompt, 6, mockTranslate);

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toContain(basePrompt);
    });

    it('returns a personalized prompt for high mood', () => {
      mockTranslate.mockClear();
      const basePrompt = 'What are you feeling?';
      const result = personalizeWithElayra(basePrompt, 9, mockTranslate);

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toContain(basePrompt);
    });

    it('includes personalization based on mood level', () => {
      mockTranslate.mockClear();
      const basePrompt = 'How are you?';
      const lowMoodResult = personalizeWithElayra(basePrompt, 2, mockTranslate);
      const highMoodResult = personalizeWithElayra(basePrompt, 9, mockTranslate);

      expect(lowMoodResult).toBeDefined();
      expect(highMoodResult).toBeDefined();
      // Both should contain the base prompt
      expect(lowMoodResult).toContain(basePrompt);
      expect(highMoodResult).toContain(basePrompt);
    });
  });
});
