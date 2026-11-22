import { describe, expect, it } from 'vitest';
import { describeCards, drawSpread, MAJOR_ARCANA, nextMonth, parseMonth, recentMonths } from '../tarot';

describe('mazzo dei tarocchi', () => {
  it('ha i 22 Arcani Maggiori con nomi nelle due lingue', () => {
    expect(MAJOR_ARCANA).toHaveLength(22);
    MAJOR_ARCANA.forEach((c, i) => {
      expect(c.id).toBe(i);
      expect(c.it && c.en && c.upright && c.reversed).toBeTruthy();
    });
  });

  it('estrae sempre tre carte diverse nelle tre posizioni', () => {
    for (let i = 0; i < 200; i++) {
      const spread = drawSpread();
      expect(spread.map((c) => c.position)).toEqual(['past', 'present', 'path']);
      expect(new Set(spread.map((c) => c.id)).size).toBe(3);
    }
  });

  it('scarta carte non valide quando le descrive', () => {
    const out = describeCards([{ id: 17, reversed: false, position: 'present' }, { id: 99, position: 'past' }, 'x']);
    expect(out).toEqual([{ id: 17, reversed: false, position: 'present', name: { it: 'La Stella', en: 'The Star' } }]);
  });

  it('accetta solo mesi tra un anno fa e oggi', () => {
    const now = new Date('2026-11-21T00:00:00Z');
    expect(parseMonth('2026-11', now)).toBe('2026-11-01');
    expect(parseMonth('2025-11', now)).toBe('2025-11-01');
    expect(parseMonth('2025-10', now)).toBeNull();
    expect(parseMonth('2026-12', now)).toBeNull();
    expect(parseMonth('2026-13', now)).toBeNull();
    expect(nextMonth('2026-12-01')).toBe('2027-01-01');
    expect(recentMonths(3, now)).toEqual(['2026-11', '2026-10', '2026-09']);
    expect(recentMonths(2, new Date('2026-01-05T00:00:00Z'))).toEqual(['2026-01', '2025-12']);
  });
});

import { isComplete, thinkingFor } from '../services/ai.service';

describe('isComplete', () => {
  it('rifiuta risposte vuote o interrotte dal filtro', () => {
    expect(isComplete('', 'end_turn')).toBe(false);
    expect(isComplete('Forse è la stessa che stamattina hai ch', 'refusal')).toBe(false);
    expect(isComplete('Benvenuta, Sophia. Oggi ti sei pres', 'max_tokens')).toBe(false);
  });
  it('accetta una risposta finita', () => {
    expect(isComplete('Ciao, Lucia.', 'end_turn')).toBe(true);
  });
});

describe('thinkingFor', () => {
  it('spegne il pensiero iniziale dei modelli 5.5', () => {
    expect(thinkingFor('claude-haiku-5-5')).toEqual({ thinking: { type: 'disabled' } });
    expect(thinkingFor('claude-sonnet-5-5')).toEqual({ thinking: { type: 'between_tools' } });
    expect(thinkingFor('claude-opus-4-1')).toEqual({});
  });
});
