import { describe, expect, it, vi } from 'vitest';
import { appendDictated, speechLang } from './useDictation';
import { SpeechQueue } from '../lib/speech';

describe('dettatura', () => {
  it('unisce i pezzi dettati con lo spazio giusto e la maiuscola iniziale', () => {
    expect(appendDictated('', 'oggi sto bene')).toBe('Oggi sto bene');
    expect(appendDictated('Oggi sto bene', 'ma sono stanca')).toBe('Oggi sto bene ma sono stanca');
    expect(appendDictated('Ciao ', 'Elayra')).toBe('Ciao Elayra');
  });
  it('sceglie la lingua del riconoscimento dalla lingua dell’app', () => {
    expect(speechLang('it')).toBe('it-IT');
    expect(speechLang('en')).toBe('en-US');
  });
});

describe('voce di Elayra', () => {
  it('legge una frase alla volta mentre arriva il testo, e il resto alla fine', () => {
    const spoken: string[] = [];
    const speak = vi.fn((u: { text: string; onend?: () => void }) => spoken.push(u.text));
    vi.stubGlobal('speechSynthesis', { speak, cancel: vi.fn(), getVoices: () => [] });
    vi.stubGlobal(
      'SpeechSynthesisUtterance',
      class {
        text: string;
        lang = '';
        voice = null;
        rate = 1;
        pitch = 1;
        onend?: () => void;
        onerror?: () => void;
        constructor(t: string) {
          this.text = t;
        }
      }
    );
    const q = new SpeechQueue('it', () => {});
    q.push('Ti sento. Sembra una gior');
    expect(spoken).toEqual(['Ti sento.']);
    q.push('nata pesante! Vuoi dirmi di **più**');
    expect(spoken).toEqual(['Ti sento.', 'Sembra una giornata pesante!']);
    q.flush();
    expect(spoken[2]).toBe('Vuoi dirmi di più');
    vi.unstubAllGlobals();
  });
});
