import { describe, expect, it } from 'vitest';
import { localeFromHeader, translateError } from '../locale';
import { buildProgress } from '../levels';
import { buildElayraSystemPrompt } from '../elayra.prompt';

describe('lingua della richiesta', () => {
  it('riconosce italiano e inglese da Accept-Language', () => {
    expect(localeFromHeader('it')).toBe('it');
    expect(localeFromHeader('it-IT,it;q=0.9')).toBe('it');
    expect(localeFromHeader('en')).toBe('en');
    expect(localeFromHeader(undefined)).toBe('it');
  });

  it('traduce i messaggi di errore solo in inglese', () => {
    expect(translateError('Non trovato', 'en')).toBe('Not found');
    expect(translateError('Non trovato', 'it')).toBe('Non trovato');
    expect(translateError('Questo mese hai usato tutte le 300 risposte di Elayra del piano Seme. Puoi passare…', 'en')).toContain(
      '300 Elayra replies included in the Seed plan'
    );
  });

  it('dà nomi e domande dei livelli nella lingua giusta', () => {
    const en = buildProgress(25, new Map(), 'en');
    expect(en.levels[0].name).toBe('The Point');
    expect(en.levels[1].question).toMatch(/attention/);
    expect(buildProgress(25, new Map(), 'it').levels[0].name).toBe('Il Punto');
  });

  it('chiede a Elayra di rispondere nella lingua dell’utente', () => {
    expect(buildElayraSystemPrompt({ locale: 'en' })).toContain('Rispondi SEMPRE e SOLO in inglese');
    expect(buildElayraSystemPrompt({ locale: 'it' })).toContain('Rispondi SEMPRE e SOLO in italiano');
    expect(buildElayraSystemPrompt({ locale: 'it' })).not.toContain('{{LINGUA}}');
  });
});
