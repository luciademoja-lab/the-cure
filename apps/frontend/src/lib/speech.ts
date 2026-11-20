import { speechLang } from '../hooks/useDictation';

/**
 * La voce di Elayra con la sintesi vocale del browser.
 * Il testo arriva a pezzi mentre Elayra scrive: si legge una frase alla volta appena è completa.
 */
export const speechSupported = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

function pickVoice(lang: string): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  const prefix = lang.slice(0, 2);
  const same = voices.filter((v) => v.lang.toLowerCase().startsWith(prefix));
  const nice = same.find((v) => /natural|premium|enhanced|google|neural/i.test(v.name));
  return nice || same[0] || null;
}

export class SpeechQueue {
  private buffer = '';
  private pending = 0;
  private stopped = false;
  constructor(private locale: string, private onIdle: () => void) {}

  /** Aggiunge testo in arrivo; legge le frasi già complete. */
  push(text: string) {
    if (this.stopped) return;
    this.buffer += text;
    const re = /[^.!?…\n]*[.!?…]+["»”)]?\s+|[^\n]*\n+/g;
    let consumed = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(this.buffer)) !== null) {
      if (m.index !== consumed) break;
      this.say(m[0]);
      consumed = re.lastIndex;
    }
    this.buffer = this.buffer.slice(consumed);
  }

  /** Il messaggio è finito: legge ciò che resta. */
  flush() {
    if (this.stopped) return;
    const rest = this.buffer.trim();
    this.buffer = '';
    if (rest) this.say(rest);
    else if (this.pending === 0) this.onIdle();
  }

  stop() {
    this.stopped = true;
    this.buffer = '';
    window.speechSynthesis.cancel();
  }

  private say(sentence: string) {
    const clean = sentence.replace(/[*_#>`]/g, '').trim();
    if (!clean) return;
    const u = new SpeechSynthesisUtterance(clean);
    u.lang = speechLang(this.locale);
    const voice = pickVoice(u.lang);
    if (voice) u.voice = voice;
    u.rate = 0.96;
    u.pitch = 1;
    this.pending += 1;
    const done = () => {
      this.pending = Math.max(0, this.pending - 1);
      if (this.pending === 0 && this.buffer === '' && !this.stopped) this.onIdle();
    };
    u.onend = done;
    u.onerror = done;
    window.speechSynthesis.speak(u);
  }
}
