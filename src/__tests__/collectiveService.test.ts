import { describe, it, expect } from 'vitest';
import {
  createSharedInsight,
  anonymizeInsight,
  buildCollectiveReflectionSpace,
  aggregateThemesFromEntries,
  calculateCollectiveResonance,
} from '../services/collectiveService';
import { JournalEntry } from '../types/journal';

describe('collectiveService', () => {
  const createEntry = (overrides?: Partial<JournalEntry>): JournalEntry => ({
    id: Math.random().toString(),
    timestamp: new Date(),
    content: 'Test entry',
    mood: 7,
    energy: 'moderate',
    aiTags: ['Gratitude'],
    tags: [],
    ...overrides,
  });

  describe('createSharedInsight', () => {
    it('creates an insight from an entry', () => {
      const entry = createEntry({ aiTags: ['Gratitude', 'Healing'] });

      const insight = createSharedInsight(entry, 'Gratitude', true);
      expect(insight.theme).toBe('Gratitude');
      expect(insight.isConsent).toBe(true);
      expect(insight.originalEntryId).toBe(entry.id);
    });

    it('includes AI-generated insight text', () => {
      const entry = createEntry({ content: 'I am grateful for my family' });

      const insight = createSharedInsight(entry, 'Gratitude', true);
      expect(insight.insight).toBeDefined();
      expect(insight.insight.length).toBeGreaterThan(0);
    });

    it('respects consent flag', () => {
      const entry = createEntry();

      const withConsent = createSharedInsight(entry, 'Healing', true);
      const noConsent = createSharedInsight(entry, 'Healing', false);

      expect(withConsent.isConsent).toBe(true);
      expect(noConsent.isConsent).toBe(false);
    });

    it('includes mood and tags', () => {
      const entry = createEntry({ mood: 9, aiTags: ['Gratitude', 'Connection'] });

      const insight = createSharedInsight(entry, 'Gratitude', true);
      expect(insight.moodLevel).toBe(9);
      expect(insight.tags).toContain('Gratitude');
    });
  });

  describe('anonymizeInsight', () => {
    it('fully anonymizes insight when requested', () => {
      const entry = createEntry({ id: 'user-123' });
      const insight = createSharedInsight(entry, 'Healing', true);

      const anon = anonymizeInsight(insight, 'full');
      expect(anon.originalEntryId).toBeUndefined();
      expect(anon.anonymityLevel).toBe('full');
    });

    it('partially anonymizes by removing identifiers but keeping theme', () => {
      const entry = createEntry({ id: 'user-456' });
      const insight = createSharedInsight(entry, 'Connection', true);

      const partial = anonymizeInsight(insight, 'partial');
      expect(partial.anonymityLevel).toBe('partial');
      expect(partial.theme).toBe('Connection');
    });

    it('preserves identified status when requested', () => {
      const entry = createEntry({ id: 'user-789' });
      const insight = createSharedInsight(entry, 'Creativity', true);

      const identified = anonymizeInsight(insight, 'identified');
      expect(identified.anonymityLevel).toBe('identified');
    });
  });

  describe('aggregateThemesFromEntries', () => {
    it('collects all unique themes from entries', () => {
      const entries = [
        createEntry({ aiTags: ['Gratitude', 'Healing'] }),
        createEntry({ aiTags: ['Gratitude', 'Connection'] }),
        createEntry({ aiTags: ['Creativity'] }),
      ];

      const themes = aggregateThemesFromEntries(entries);
      expect(themes).toContain('Gratitude');
      expect(themes).toContain('Healing');
      expect(themes).toContain('Connection');
      expect(themes).toContain('Creativity');
    });

    it('returns unique themes only', () => {
      const entries = [
        createEntry({ aiTags: ['Gratitude'] }),
        createEntry({ aiTags: ['Gratitude'] }),
        createEntry({ aiTags: ['Gratitude'] }),
      ];

      const themes = aggregateThemesFromEntries(entries);
      expect(themes).toEqual(['Gratitude']);
    });

    it('handles empty entries', () => {
      const themes = aggregateThemesFromEntries([]);
      expect(themes).toEqual([]);
    });
  });

  describe('buildCollectiveReflectionSpace', () => {
    it('builds a reflection space from entries with a theme', () => {
      const entries = [
        createEntry({ id: '1', aiTags: ['Gratitude'], mood: 8 }),
        createEntry({ id: '2', aiTags: ['Gratitude'], mood: 9 }),
        createEntry({ id: '3', aiTags: ['Gratitude'], mood: 7 }),
      ];

      const space = buildCollectiveReflectionSpace(entries, 'Gratitude');
      expect(space.theme).toBe('Gratitude');
      expect(space.participantCount).toBe(3);
      expect(space.sharedInsights.length).toBeGreaterThan(0);
    });

    it('calculates dominant mood correctly', () => {
      const entries = [
        createEntry({ aiTags: ['Healing'], mood: 9 }),
        createEntry({ aiTags: ['Healing'], mood: 9 }),
        createEntry({ aiTags: ['Healing'], mood: 5 }),
      ];

      const space = buildCollectiveReflectionSpace(entries, 'Healing');
      expect(space.dominantMood).toBeGreaterThanOrEqual(7);
    });

    it('creates anonymized shared insights', () => {
      const entries = [createEntry({ aiTags: ['Connection'] })];

      const space = buildCollectiveReflectionSpace(entries, 'Connection');
      expect(space.sharedInsights.every((s) => s.isConsent)).toBe(true);
    });
  });

  describe('calculateCollectiveResonance', () => {
    it('returns resonance score based on theme frequency', () => {
      const entries = [
        createEntry({ aiTags: ['Gratitude'] }),
        createEntry({ aiTags: ['Gratitude'] }),
        createEntry({ aiTags: ['Creativity'] }),
      ];

      const resonance = calculateCollectiveResonance(entries, 'Gratitude');
      expect(resonance).toBeGreaterThan(50);
    });

    it('returns 0 for theme not in entries', () => {
      const entries = [createEntry({ aiTags: ['Gratitude'] })];

      const resonance = calculateCollectiveResonance(entries, 'NonExistent');
      expect(resonance).toBe(0);
    });

    it('calculates resonance as percentage of entries with theme', () => {
      const entries = [
        createEntry({ aiTags: ['Healing'] }),
        createEntry({ aiTags: ['Healing'] }),
        createEntry({ aiTags: ['Creativity'] }),
        createEntry({ aiTags: ['Creativity'] }),
      ];

      const resonance = calculateCollectiveResonance(entries, 'Healing');
      expect(resonance).toBe(50); // 2 out of 4 entries
    });

    it('returns score between 0-100', () => {
      const entries = [
        createEntry({ aiTags: ['Connection'] }),
        createEntry({ aiTags: ['Connection'] }),
      ];

      const resonance = calculateCollectiveResonance(entries, 'Connection');
      expect(resonance).toBeGreaterThanOrEqual(0);
      expect(resonance).toBeLessThanOrEqual(100);
    });
  });
});
