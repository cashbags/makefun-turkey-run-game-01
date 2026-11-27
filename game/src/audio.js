// GOBBLE RUN — sound: every noise is a WebAudio oscillator.
// One job: bleeps. No audio files, no network, nothing to load.
// Sounds only start after a user gesture (the browser insists), and the
// first gesture arms the context. Mute silences everything at once.

export function createAudio() {
  return { ctx: null, muted: false };
}

// Arm the audio context on the first gesture. Safe to call repeatedly.
export function armAudio(a) {
  if (a.ctx) {
    if (a.ctx.state === 'suspended') a.ctx.resume().catch(() => {});
    return;
  }
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    a.ctx = new Ctx();
  } catch {
    a.ctx = null;
  }
}

// One blip: a sine/triangle/square tone that slides from f0 to f1.
function blip(a, { type = 'sine', f0 = 440, f1 = null, dur = 0.12, vol = 0.12, delay = 0 }) {
  if (!a.ctx || a.muted) return;
  try {
    const t0 = a.ctx.currentTime + delay;
    const osc = a.ctx.createOscillator();
    const gain = a.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(f0, t0);
    if (f1 !== null) osc.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t0 + dur);
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(a.ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  } catch {
    // Sound is garnish: a failure here must never break the game.
  }
}

// The world's event names become sounds. Called once a frame with the
// step's drained events.
export function playEvents(a, events, muted) {
  a.muted = muted;
  for (const e of events) {
    if (e === 'jump') blip(a, { type: 'triangle', f0: 300, f1: 620, dur: 0.14, vol: 0.1 });
    else if (e === 'slide') blip(a, { type: 'sine', f0: 420, f1: 180, dur: 0.1, vol: 0.07 });
    else if (e === 'hit') {
      blip(a, { type: 'square', f0: 180, f1: 60, dur: 0.25, vol: 0.16 });
      blip(a, { type: 'sawtooth', f0: 90, f1: 40, dur: 0.3, vol: 0.1, delay: 0.02 });
    } else if (e === 'shield') blip(a, { type: 'triangle', f0: 700, f1: 900, dur: 0.12, vol: 0.1 });
    else if (e === 'kernel') blip(a, { type: 'sine', f0: 880, f1: 1320, dur: 0.07, vol: 0.06 });
    else if (e === 'power') {
      blip(a, { type: 'sine', f0: 523, f1: 523, dur: 0.09, vol: 0.1 });
      blip(a, { type: 'sine', f0: 659, f1: 659, dur: 0.09, vol: 0.1, delay: 0.08 });
      blip(a, { type: 'sine', f0: 784, f1: 784, dur: 0.14, vol: 0.1, delay: 0.16 });
    } else if (e === 'heart') blip(a, { type: 'sine', f0: 660, f1: 990, dur: 0.2, vol: 0.1 });
    else if (e === 'caught') {
      blip(a, { type: 'sawtooth', f0: 220, f1: 55, dur: 0.7, vol: 0.14 });
      blip(a, { type: 'square', f0: 110, f1: 40, dur: 0.7, vol: 0.1, delay: 0.1 });
    } else if (e === 'escaped') {
      const notes = [523, 659, 784, 1047];
      notes.forEach((f, i) => blip(a, { type: 'triangle', f0: f, f1: f, dur: 0.18, vol: 0.11, delay: i * 0.12 }));
    } else if (e === 'gobble') {
      blip(a, { type: 'square', f0: 300, f1: 180, dur: 0.07, vol: 0.06 });
      blip(a, { type: 'square', f0: 300, f1: 180, dur: 0.07, vol: 0.06, delay: 0.1 });
    }
  }
}
