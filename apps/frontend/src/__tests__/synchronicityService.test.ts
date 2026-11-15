import { describe, it, expect } from 'vitest';
import {
  findSynchronicMatches,
  calculateSynchronicityScore,
  identifyMirrorMoments,
  detectCyclicalPatterns,
  calculateSynchronicityMetrics,
} from '../services/synchronicityService';
import { JournalEntry } from '../types/journal';

describe('synchronicityService', () => {
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

  describe('calculateSynchronicityScore', () => {
    it('returns high score for entries with identical tags', () => {
      const entry1 = createEntry({ aiTags: ['Gratitude', 'Healing'] });
      const entry2 = createEntry({ aiTags: ['Gratitude', 'Healing'] });

      const score = calculateSynchronicityScore(entry1, entry2);
      expect(score).toBeGreaterThan(80);
    });

    it('returns high score for entries with similar mood', () => {
      const entry1 = createEntry({ mood: 8, content: 'Feeling grateful' });
      const entry2 = createEntry({ mood: 7, content: 'Grateful for this day' });

      const score = calculateSynchronicityScore(entry1, entry2);
      expect(score).toBeGreaterThan(50);
    });

    it('returns lower score for entries with different tags', () => {
      const entry1 = createEntry({ aiTags: ['Gratitude'] });
      const entry2 = createEntry({ aiTags: ['Creativity'] });

      const score = calculateSynchronicityScore(entry1, entry2);
      expect(score).toBeLessThan(70);
    });

    it('considers text similarity in scoring', () => {
      const entry1 = createEntry({ content: 'I am grateful for my family' });
      const entry2 = createEntry({ content: 'I am grateful for my loved ones' });

      const score = calculateSynchronicityScore(entry1, entry2);
      expect(score).toBeGreaterThan(60);
    });

    it('returns score between 0-100', () => {
      const entry1 = createEntry();
      const entry2 = createEntry();

      const score = calculateSynchronicityScore(entry1, entry2);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('findSynchronicMatches', () => {
    it('finds matching entries with similar themes', () => {
      const entries = [
        createEntry({ id: '1', aiTags: ['Gratitude', 'Connection'] }),
        createEntry({ id: '2', aiTags: ['Gratitude', 'Connection'] }),
        createEntry({ id: '3', aiTags: ['Creativity'] }),
      ];

      const matches = findSynchronicMatches(entries, 50);
      expect(matches.length).toBeGreaterThan(0);
    });

    it('filters matches by minimum synchronicity score', () => {
      const entries = [
        createEntry({ id: '1', aiTags: ['Gratitude'] }),
        createEntry({ id: '2', aiTags: ['Creativity'] }),
      ];

      const matches = findSynchronicMatches(entries, 80);
      expect(matches.length).toBe(0);
    });

    it('returns matches with synchronicity score >= minScore', () => {
      const entries = [
        createEntry({ id: '1', mood: 9, aiTags: ['Healing'] }),
        createEntry({ id: '2', mood: 8, aiTags: ['Healing'] }),
      ];

      const matches = findSynchronicMatches(entries, 50);
      matches.forEach((match) => {
        expect(match.synchronicityScore).toBeGreaterThanOrEqual(50);
      });
    });

    it('includes common themes in matches', () => {
      const entries = [
        createEntry({ id: '1', aiTags: ['Gratitude', 'Connection'] }),
        createEntry({ id: '2', aiTags: ['Gratitude', 'Connection'] }),
      ];

      const matches = findSynchronicMatches(entries);
      expect(matches[0].commonThemes).toContain('Gratitude');
      expect(matches[0].commonThemes).toContain('Connection');
    });
  });

  describe('identifyMirrorMoments', () => {
    it('identifies entries matching collective themes', () => {
      const entries = [
        createEntry({ id: '1', aiTags: ['Healing', 'Gratitude'] }),
        createEntry({ id: '2', aiTags: ['Healing', 'Connection'] }),
        createEntry({ id: '3', aiTags: ['Healing', 'Creativity'] }),
      ];
      const collectiveThemes = ['Healing', 'Gratitude'];

      const mirrors = identifyMirrorMoments(entries, collectiveThemes);
      expect(mirrors.length).toBeGreaterThan(0);
    });

    it('calculates mirror count correctly', () => {
      const entries = [
        createEntry({ id: '1', aiTags: ['Gratitude'] }),
        createEntry({ id: '2', aiTags: ['Gratitude', 'Connection'] }),
        createEntry({ id: '3', aiTags: ['Gratitude', 'Healing'] }),
      ];
      const collectiveThemes = ['Gratitude'];

      const mirrors = identifyMirrorMoments(entries, collectiveThemes);
      expect(mirrors[0].mirrorCount).toBeGreaterThan(0);
    });
  });

  describe('detectCyclicalPatterns', () => {
    it('finds cyclical emotional patterns', () => {
      const now = new Date();
      const entries = [
        createEntry({
          id: '1',
          timestamp: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
          mood: 8,
          aiTags: ['Healing'],
        }),
        createEntry({
          id: '2',
          timestamp: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
          mood: 8,
          aiTags: ['Healing'],
        }),
      ];

      const patterns = detectCyclicalPatterns(entries);
      expect(Array.isArray(patterns)).toBe(true);
    });

    it('tracks days between cyclical entries', () => {
      const now = new Date();
      const entries = [
        createEntry({
          id: '1',
          timestamp: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
          mood: 7,
        }),
        createEntry({
          id: '2',
          timestamp: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
          mood: 7,
        }),
      ];

      const patterns = detectCyclicalPatterns(entries);
      expect(patterns.some((p) => p.daysApart && p.daysApart.length > 0)).toBe(true);
    });
  });

  describe('calculateSynchronicityMetrics', () => {
    it('calculates total entries', () => {
      const entries = [createEntry({ id: '1' }), createEntry({ id: '2' })];

      const metrics = calculateSynchronicityMetrics(entries);
      expect(metrics.totalEntries).toBe(2);
    });

    it('calculates average synchronicity score', () => {
      const entries = [
        createEntry({ id: '1', aiTags: ['Gratitude'] }),
        createEntry({ id: '2', aiTags: ['Gratitude'] }),
        createEntry({ id: '3', aiTags: ['Gratitude'] }),
      ];

      const metrics = calculateSynchronicityMetrics(entries);
      expect(metrics.averageSynchronicityScore).toBeGreaterThanOrEqual(0);
      expect(metrics.averageSynchronicityScore).toBeLessThanOrEqual(100);
    });

    it('identifies top themes', () => {
      const entries = [
        createEntry({ id: '1', aiTags: ['Gratitude', 'Connection'] }),
        createEntry({ id: '2', aiTags: ['Gratitude', 'Connection'] }),
        createEntry({ id: '3', aiTags: ['Creativity'] }),
      ];

      const metrics = calculateSynchronicityMetrics(entries);
      expect(metrics.topThemes.length).toBeGreaterThan(0);
      expect(metrics.topThemes[0].theme).toBe('Gratitude');
    });

    it('detects emotional patterns', () => {
      const entries = [
        createEntry({ id: '1', mood: 8 }),
        createEntry({ id: '2', mood: 8 }),
        createEntry({ id: '3', mood: 5 }),
      ];

      const metrics = calculateSynchronicityMetrics(entries);
      expect(metrics.emotionalPatterns.length).toBeGreaterThan(0);
    });
  });
});
