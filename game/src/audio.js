// Procedural sound for Void Bloom: every effect is a small oscillator or a
// burst of filtered noise shaped in code, so the game ships no audio files
// at all. The context wakes on the first user gesture; until then, and
// while muted, every call is a quiet no-op.

let context = null;
let master = null;
let muted = false;

export function initAudio() {
  if (context !== null) {
    if (context.state === 'suspended') context.resume();
    return;
  }
  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtor) return;
  context = new AudioCtor();
  master = context.createGain();
  master.gain.value = 0.35;
  master.connect(context.destination);
}

export function setMuted(value) { muted = value; }
export function isMuted() { return muted; }

function tone({ from, to = from, seconds = 0.12, type = 'square', volume = 0.2, delay = 0 }) {
  if (context === null || muted) return;
  const start = context.currentTime + delay;
  const osc = context.createOscillator();
  const gain = context.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, start);
  osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), start + seconds);
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.001, start + seconds);
  osc.connect(gain).connect(master);
  osc.start(start);
  osc.stop(start + seconds + 0.02);
}

function noise({ seconds = 0.15, volume = 0.2, cutoff = 1200, delay = 0 }) {
  if (context === null || muted) return;
  const start = context.currentTime + delay;
  const length = Math.max(1, Math.floor(context.sampleRate * seconds));
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
  const source = context.createBufferSource();
  source.buffer = buffer;
  const filter = context.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = cutoff;
  const gain = context.createGain();
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.001, start + seconds);
  source.connect(filter).connect(gain).connect(master);
  source.start(start);
}

export const sfx = {
  shoot() { tone({ from: 880, to: 320, seconds: 0.07, type: 'square', volume: 0.06 }); },
  hit() { noise({ seconds: 0.05, volume: 0.10, cutoff: 2600 }); },
  kill() {
    tone({ from: 520, to: 90, seconds: 0.16, type: 'sawtooth', volume: 0.14 });
    noise({ seconds: 0.12, volume: 0.10, cutoff: 900 });
  },
  hurt() {
    tone({ from: 220, to: 55, seconds: 0.25, type: 'sawtooth', volume: 0.22 });
    noise({ seconds: 0.2, volume: 0.16, cutoff: 600 });
  },
  pickup() { tone({ from: 1180, to: 1760, seconds: 0.08, type: 'sine', volume: 0.10 }); },
  upgrade() {
    tone({ from: 523, seconds: 0.12, type: 'triangle', volume: 0.16 });
    tone({ from: 784, seconds: 0.12, type: 'triangle', volume: 0.16, delay: 0.09 });
    tone({ from: 1046, seconds: 0.2, type: 'triangle', volume: 0.16, delay: 0.18 });
  },
  wave() {
    tone({ from: 392, seconds: 0.14, type: 'triangle', volume: 0.15 });
    tone({ from: 587, seconds: 0.22, type: 'triangle', volume: 0.15, delay: 0.11 });
  },
  click() { tone({ from: 660, seconds: 0.05, type: 'sine', volume: 0.10 }); },
  over() {
    tone({ from: 392, to: 380, seconds: 0.3, type: 'triangle', volume: 0.18 });
    tone({ from: 311, to: 300, seconds: 0.3, type: 'triangle', volume: 0.18, delay: 0.28 });
    tone({ from: 233, to: 110, seconds: 0.6, type: 'triangle', volume: 0.18, delay: 0.56 });
  },
  win() {
    tone({ from: 523, seconds: 0.14, type: 'triangle', volume: 0.16 });
    tone({ from: 659, seconds: 0.14, type: 'triangle', volume: 0.16, delay: 0.12 });
    tone({ from: 784, seconds: 0.14, type: 'triangle', volume: 0.16, delay: 0.24 });
    tone({ from: 1046, seconds: 0.4, type: 'triangle', volume: 0.18, delay: 0.36 });
  },
};
