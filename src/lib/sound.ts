// ── Sound Engine — Web Audio API, zero dependencies ───────────────────────
// All sounds are synthesized procedurally. No audio files needed.

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function getVolume(): number {
  try {
    const raw = localStorage.getItem("wb_sfx_volume");
    return raw !== null ? parseFloat(raw) : 0.5;
  } catch { return 0.5; }
}

// ── Primitive synth helpers ────────────────────────────────────────────────

function playTone(
  freq: number,
  duration: number,
  type: OscillatorType = "sine",
  gainPeak = 0.3,
  attack = 0.01,
  decay = 0.1,
  sustain = 0.6,
  release = 0.2
) {
  const vol = getVolume();
  if (vol === 0) return;
  try {
    const c = getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain);
    gain.connect(c.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, c.currentTime);
    gain.gain.setValueAtTime(0, c.currentTime);
    gain.gain.linearRampToValueAtTime(gainPeak * vol, c.currentTime + attack);
    gain.gain.linearRampToValueAtTime(gainPeak * sustain * vol, c.currentTime + attack + decay);
    gain.gain.setValueAtTime(gainPeak * sustain * vol, c.currentTime + duration - release);
    gain.gain.linearRampToValueAtTime(0, c.currentTime + duration);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + duration);
  } catch {}
}

function playNoise(duration: number, gainPeak = 0.1) {
  const vol = getVolume();
  if (vol === 0) return;
  try {
    const c = getCtx();
    const bufSize = c.sampleRate * duration;
    const buf = c.createBuffer(1, bufSize, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource();
    src.buffer = buf;
    const gain = c.createGain();
    src.connect(gain);
    gain.connect(c.destination);
    gain.gain.setValueAtTime(gainPeak * vol, c.currentTime);
    gain.gain.linearRampToValueAtTime(0, c.currentTime + duration);
    src.start();
    src.stop(c.currentTime + duration);
  } catch {}
}

// ── Public sound effects ───────────────────────────────────────────────────

export const sfx = {
  /** Word accepted — bright ascending chime */
  wordAccepted() {
    playTone(523, 0.08, "triangle", 0.4, 0.005, 0.03, 0.8, 0.05);
    setTimeout(() => playTone(659, 0.08, "triangle", 0.35, 0.005, 0.03, 0.8, 0.05), 60);
    setTimeout(() => playTone(784, 0.15, "triangle", 0.3, 0.005, 0.05, 0.7, 0.1), 120);
  },

  /** Word rejected — low buzz */
  wordRejected() {
    playTone(180, 0.12, "sawtooth", 0.25, 0.005, 0.05, 0.5, 0.07);
    setTimeout(() => playTone(160, 0.1, "sawtooth", 0.2, 0.005, 0.05, 0.4, 0.05), 80);
  },

  /** Timer tick — subtle click */
  tick() {
    playTone(1200, 0.03, "square", 0.08, 0.001, 0.01, 0.5, 0.02);
  },

  /** Timer critical — urgent pulse */
  timerCritical() {
    playTone(880, 0.06, "square", 0.2, 0.001, 0.02, 0.6, 0.04);
  },

  /** Match found — triumphant fanfare */
  matchFound() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((f, i) => setTimeout(() => playTone(f, 0.2, "triangle", 0.35, 0.01, 0.05, 0.7, 0.1), i * 80));
  },

  /** Player eliminated — descending sad tones */
  eliminated() {
    playTone(440, 0.15, "sine", 0.3, 0.01, 0.05, 0.7, 0.1);
    setTimeout(() => playTone(349, 0.15, "sine", 0.25, 0.01, 0.05, 0.7, 0.1), 120);
    setTimeout(() => playTone(262, 0.3, "sine", 0.2, 0.01, 0.1, 0.6, 0.2), 240);
  },

  /** Victory — big win fanfare */
  victory() {
    const melody = [523, 659, 784, 659, 784, 1047];
    melody.forEach((f, i) => setTimeout(() => playTone(f, 0.18, "triangle", 0.4, 0.01, 0.04, 0.8, 0.1), i * 100));
  },

  /** Defeat — low descending */
  defeat() {
    playTone(392, 0.2, "sine", 0.25, 0.01, 0.08, 0.6, 0.15);
    setTimeout(() => playTone(330, 0.2, "sine", 0.2, 0.01, 0.08, 0.6, 0.15), 180);
    setTimeout(() => playTone(262, 0.4, "sine", 0.15, 0.01, 0.1, 0.5, 0.3), 360);
  },

  /** Button click — crisp tap */
  click() {
    playTone(800, 0.04, "square", 0.12, 0.001, 0.01, 0.5, 0.03);
  },

  /** XP gain — sparkle */
  xpGain() {
    playTone(1047, 0.06, "triangle", 0.2, 0.005, 0.02, 0.6, 0.04);
    setTimeout(() => playTone(1319, 0.08, "triangle", 0.18, 0.005, 0.02, 0.6, 0.06), 50);
    setTimeout(() => playTone(1568, 0.12, "triangle", 0.15, 0.005, 0.03, 0.5, 0.09), 100);
  },

  /** Rank up — epic ascending */
  rankUp() {
    const notes = [523, 659, 784, 1047, 1319];
    notes.forEach((f, i) => setTimeout(() => playTone(f, 0.25, "triangle", 0.4, 0.01, 0.05, 0.8, 0.15), i * 90));
    setTimeout(() => playNoise(0.1, 0.05), 450);
  },

  /** Countdown beep */
  countdown() {
    playTone(660, 0.1, "sine", 0.3, 0.005, 0.03, 0.7, 0.07);
  },

  /** Achievement unlocked */
  achievement() {
    const notes = [784, 988, 1175, 1568];
    notes.forEach((f, i) => setTimeout(() => playTone(f, 0.15, "triangle", 0.3, 0.01, 0.04, 0.7, 0.1), i * 70));
  },

  /** Notification pop */
  notification() {
    playTone(880, 0.06, "sine", 0.2, 0.005, 0.02, 0.6, 0.04);
    setTimeout(() => playTone(1100, 0.08, "sine", 0.18, 0.005, 0.02, 0.5, 0.06), 60);
  },
};
