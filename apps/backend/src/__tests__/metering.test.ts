import { describe, expect, it } from 'vitest';
import { costUsd } from '../metering';

describe('costo delle chiamate', () => {
  it('Haiku 5.5: pochi decimi di centesimo per una risposta tipica', () => {
    const c = costUsd('claude-haiku-5-5', { input_tokens: 1000, output_tokens: 300, cache_read_input_tokens: 10000 });
    expect(c).toBeCloseTo((1000 * 0.1 + 300 * 0.5 + 10000 * 0.01) / 1e6, 10);
  });

  it('Haiku 5.5 oltre 100.000 token costa cinque volte tanto', () => {
    const short = costUsd('claude-haiku-5-5', { input_tokens: 99_000 });
    const long = costUsd('claude-haiku-5-5', { input_tokens: 101_000 });
    expect(long / short).toBeGreaterThan(5);
  });

  it('Sonnet 5.5 e un modello sconosciuto (contato come Sonnet)', () => {
    expect(costUsd('claude-sonnet-5-5', { input_tokens: 1_000_000, output_tokens: 1_000_000 })).toBeCloseTo(12, 6);
    expect(costUsd('modello-nuovo', { output_tokens: 1_000_000 })).toBeCloseTo(10, 6);
  });
});
