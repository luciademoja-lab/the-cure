/**
 * Il fruscio di una pagina che si gira, creato al momento con Web Audio:
 * un soffio di carta (rumore filtrato) che sale e si spegne, più un piccolo tocco quando la pagina si posa.
 * Nessun file da scaricare; se il browser non ha l'audio, semplicemente non suona.
 */
let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  try {
    ctx = ctx ?? new Ctor();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function noise(ac: AudioContext, seconds: number): AudioBuffer {
  const buffer = ac.createBuffer(1, Math.ceil(ac.sampleRate * seconds), ac.sampleRate);
  const data = buffer.getChannelData(0);
  // Rumore "marrone" con qualche granello: somiglia alla carta più del rumore bianco.
  let last = 0;
  for (let i = 0; i < data.length; i++) {
    const white = Math.random() * 2 - 1;
    last = (last + 0.06 * white) / 1.06;
    const grain = Math.random() < 0.004 ? (Math.random() * 2 - 1) * 0.6 : 0;
    data[i] = last * 3.2 + white * 0.12 + grain;
  }
  return buffer;
}

/** Suona il fruscio, lungo quanto il gesto (in millisecondi). */
export function playPageTurn(durationMs = 1100): void {
  const ac = audio();
  if (!ac) return;
  const t0 = ac.currentTime + 0.01;
  const dur = durationMs / 1000;

  const src = ac.createBufferSource();
  src.buffer = noise(ac, dur + 0.2);

  // Il fruscio cambia timbro mentre la pagina attraversa l'aria.
  const band = ac.createBiquadFilter();
  band.type = 'bandpass';
  band.Q.value = 0.7;
  band.frequency.setValueAtTime(900, t0);
  band.frequency.linearRampToValueAtTime(2600, t0 + dur * 0.45);
  band.frequency.linearRampToValueAtTime(1200, t0 + dur);

  const soft = ac.createBiquadFilter();
  soft.type = 'lowpass';
  soft.frequency.value = 5200;

  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(0.09, t0 + dur * 0.3);
  gain.gain.exponentialRampToValueAtTime(0.05, t0 + dur * 0.7);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + 0.15);

  src.connect(band).connect(soft).connect(gain).connect(ac.destination);
  src.start(t0);
  src.stop(t0 + dur + 0.2);

  // La pagina si posa: un tocco sordo e breve.
  const thump = ac.createBufferSource();
  thump.buffer = noise(ac, 0.12);
  const low = ac.createBiquadFilter();
  low.type = 'lowpass';
  low.frequency.value = 700;
  const tg = ac.createGain();
  const tl = t0 + dur * 0.92;
  tg.gain.setValueAtTime(0.0001, tl);
  tg.gain.exponentialRampToValueAtTime(0.12, tl + 0.015);
  tg.gain.exponentialRampToValueAtTime(0.0001, tl + 0.11);
  thump.connect(low).connect(tg).connect(ac.destination);
  thump.start(tl);
  thump.stop(tl + 0.12);
}
