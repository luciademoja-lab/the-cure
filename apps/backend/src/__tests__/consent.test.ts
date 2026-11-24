import { describe, expect, it } from 'vitest';
import { consentToAsk, discoveryContext, stripMarks } from '../discovery';

const base = { discovered: ['journal' as const], journalEntries: 2, hasTarotReading: false, activeDays: 3 };

describe('quando Elayra può chiedere il consenso a crescere', () => {
  it('non al primo incontro: serve almeno una pagina di diario', () => {
    expect(consentToAsk({ trainingConsent: null, consentAskedAt: null, journalEntries: 0 })).toBe(false);
    expect(consentToAsk({ trainingConsent: null, consentAskedAt: null, journalEntries: 1 })).toBe(true);
  });

  it('mai più dopo un sì o un no', () => {
    expect(consentToAsk({ trainingConsent: true, consentAskedAt: null, journalEntries: 5 })).toBe(false);
    expect(consentToAsk({ trainingConsent: false, consentAskedAt: null, journalEntries: 5 })).toBe(false);
  });

  it('senza risposta, di nuovo solo dopo due settimane', () => {
    const now = Date.parse('2026-12-20T12:00:00Z');
    expect(consentToAsk({ trainingConsent: null, consentAskedAt: '2026-12-15T12:00:00Z', journalEntries: 3 }, now)).toBe(false);
    expect(consentToAsk({ trainingConsent: null, consentAskedAt: '2026-12-01T12:00:00Z', journalEntries: 3 }, now)).toBe(true);
  });

  it('il contesto di Elayra lo dice chiaramente', () => {
    expect(discoveryContext({ ...base, trainingConsent: null })).toMatch(/NON ancora chiesto/);
    expect(discoveryContext({ ...base, trainingConsent: false })).toMatch(/rifiutato\. Non chiederlo più/);
  });

  it('il marcatore non finisce nel diario', () => {
    expect(stripMarks('Grazie.\n[[consenso]]')).toBe('Grazie.');
  });
});
