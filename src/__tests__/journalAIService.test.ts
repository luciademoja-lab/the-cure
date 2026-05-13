import { describe, it, expect } from 'vitest';
import {
  generateAIPrompt,
  suggestElaborations,
  generateAITags,
  calculateLightPoints,
} from '../services/journalAIService';

describe('journalAIService', () => {
  describe('generateAIPrompt', () => {
    it('generates a prompt for light level', () => {
      const prompt = generateAIPrompt('light');
      expect(prompt.key).toBeDefined();
      expect(prompt.level).toBe('light');
      expect(prompt.theme).toBeDefined();
    });

    it('generates a prompt for medium level', () => {
      const prompt = generateAIPrompt('medium');
      expect(prompt.key).toBeDefined();
      expect(prompt.level).toBe('medium');
    });

    it('generates a prompt for deep level', () => {
      const prompt = generateAIPrompt('deep');
      expect(prompt.key).toBeDefined();
      expect(prompt.level).toBe('deep');
    });

    it('generates different prompts on multiple calls', () => {
      const prompts = [
        generateAIPrompt('light'),
        generateAIPrompt('light'),
        generateAIPrompt('light'),
      ];
      const unique = new Set(prompts.map((p) => p.key));
      expect(unique.size).toBeGreaterThan(1);
    });
  });

  describe('suggestElaborations', () => {
    it('suggests elaborations for sadness keywords', () => {
      const suggestions = suggestElaborations('I feel so sad and hurt today');
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0].suggestion).toBeDefined();
    });

    it('suggests elaborations for joy keywords', () => {
      const suggestions = suggestElaborations('I felt so happy and grateful');
      expect(suggestions.length).toBeGreaterThan(0);
    });

    it('returns empty array for neutral text', () => {
      const suggestions = suggestElaborations('Today was a regular day');
      expect(suggestions).toEqual([]);
    });
  });

  describe('generateAITags', () => {
    it('tags gratitude entries', () => {
      const tags = generateAITags('I am so grateful for my life and thankful for this moment');
      expect(tags).toContain('Gratitude');
    });

    it('tags healing entries', () => {
      const tags = generateAITags('I am releasing old patterns and healing my wounds');
      expect(tags).toContain('Healing');
    });

    it('tags creativity entries', () => {
      const tags = generateAITags('Today I created something beautiful and manifested my dreams');
      expect(tags).toContain('Creativity');
    });

    it('returns empty array for untagged content', () => {
      const tags = generateAITags('The weather is cloudy');
      expect(tags).toEqual([]);
    });

    it('can tag multiple emotions', () => {
      const tags = generateAITags('I am grateful and healing, creating with intention');
      expect(tags.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('calculateLightPoints', () => {
    it('gives base points for short entries', () => {
      const points = calculateLightPoints(50, false);
      expect(points).toBe(5);
    });

    it('awards bonus for medium entries', () => {
      const points = calculateLightPoints(250, false);
      expect(points).toBeGreaterThan(5);
    });

    it('awards bonus for long entries', () => {
      const points = calculateLightPoints(600, false);
      expect(points).toBeGreaterThan(12);
    });

    it('awards bonus for tagged entries', () => {
      const basePoints = calculateLightPoints(100, false);
      const taggedPoints = calculateLightPoints(100, true);
      expect(taggedPoints).toBeGreaterThan(basePoints);
    });

    it('awards bonus for mood improvement', () => {
      const points = calculateLightPoints(100, false, true);
      expect(points).toBeGreaterThan(5);
    });
  });
});
