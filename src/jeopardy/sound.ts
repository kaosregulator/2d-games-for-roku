/**
 * Procedural Web Audio 1990s Television Game Show Sound Engine for Jeopardy!
 * Produces classic board fill tones, studio buzzer ding, early-buzz lockout thud,
 * Daily Double laser-synth sweep, correct/wrong chimes, time's-up triple beep,
 * and Final Jeopardy Think-style rhythmic marimba melody.
 */
class JeopardySoundEngine {
  private ctx: AudioContext | null = null;
  private muted = false;
  private thinkInterval: number | null = null;
  private thinkStep = 0;

  private ensureContext(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') return null;
    const activation = (
      navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }
    ).userActivation;
    if (!this.ctx && activation && !activation.hasBeenActive) {
      return null;
    }
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      if (activation && !activation.hasBeenActive) return null;
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    if (muted) {
      this.stopFinalThinkMusic();
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  /** Classic TV board-populate electronic chime cascade */
  public playBoardFill(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5, 880, 1174.66];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.055);
      gain.gain.setValueAtTime(0.001, now + i * 0.055);
      gain.gain.linearRampToValueAtTime(0.08, now + i * 0.055 + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + i * 0.055 + 0.16);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + i * 0.055);
      osc.stop(now + i * 0.055 + 0.18);
    });
  }

  /** Crisp illuminated studio buzzer ring-in */
  public playBuzzIn(isPlayer: boolean): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    const base = isPlayer ? 880 : 622.25;
    osc.type = 'sine';
    osc2.type = 'triangle';
    osc.frequency.setValueAtTime(base, now);
    osc2.frequency.setValueAtTime(base * 1.5, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.14, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

    osc.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc2.start(now);
    osc.stop(now + 0.26);
    osc2.stop(now + 0.26);
  }

  /** Early buzz lockout dull thud */
  public playLockout(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(95, now + 0.12);
    gain.gain.setValueAtTime(0.07, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.14);
  }

  /** Iconic Daily Double 1990s laser-sweep arpeggio */
  public playDailyDouble(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const pulses = [0, 0.11, 0.22, 0.33, 0.44, 0.56];
    pulses.forEach((offset, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      const startF = 1480 - idx * 80;
      const endF = 380 + idx * 95;
      osc.frequency.setValueAtTime(startF, now + offset);
      osc.frequency.exponentialRampToValueAtTime(endF, now + offset + 0.1);

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(950, now + offset);
      filter.Q.setValueAtTime(2.5, now + offset);

      gain.gain.setValueAtTime(0.001, now + offset);
      gain.gain.linearRampToValueAtTime(0.14, now + offset + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.11);

      osc.connect(filter).connect(gain).connect(ctx.destination);
      osc.start(now + offset);
      osc.stop(now + offset + 0.12);
    });
  }

  /** Warm TV game show correct-answer chord */
  public playCorrect(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const chord = [523.25, 659.25, 783.99, 1046.5];
    chord.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.045);
      gain.gain.setValueAtTime(0.001, now + i * 0.045);
      gain.gain.linearRampToValueAtTime(0.1, now + i * 0.045 + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.045 + 0.38);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + i * 0.045);
      osc.stop(now + i * 0.045 + 0.4);
    });
  }

  /** Classic wrong-answer buzzer */
  public playWrong(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [0, 0.17].forEach((offset) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(145, now + offset);
      osc.frequency.linearRampToValueAtTime(125, now + offset + 0.13);
      gain.gain.setValueAtTime(0.09, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.15);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + offset);
      osc.stop(now + offset + 0.16);
    });
  }

  /** Classic 3-beep time-expired signal */
  public playTimeUp(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [0, 0.14, 0.28].forEach((offset) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(340, now + offset);
      gain.gain.setValueAtTime(0.065, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.1);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + offset);
      osc.stop(now + offset + 0.11);
    });
  }

  /** Rhythmic original Final-Round thinking pulse */
  public startFinalThinkMusic(): void {
    this.stopFinalThinkMusic();
    if (this.muted || typeof window === 'undefined') return;
    this.thinkStep = 0;
    const melody = [
      392, 523.25, 392, 329.63, 392, 523.25, 392, 0,
      392, 523.25, 392, 523.25, 659.25, 587.33, 523.25, 493.88,
    ];
    this.thinkInterval = window.setInterval(() => {
      const ctx = this.ensureContext();
      if (!ctx) return;
      const freq = melody[this.thinkStep % melody.length];
      this.thinkStep++;
      if (!freq) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.075, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    }, 390);
  }

  public stopFinalThinkMusic(): void {
    if (this.thinkInterval !== null) {
      window.clearInterval(this.thinkInterval);
      this.thinkInterval = null;
    }
  }

  public playVictoryFanfare(): void {
    this.stopFinalThinkMusic();
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const fanfare = [
      { f: 523.25, t: 0, d: 0.16 },
      { f: 659.25, t: 0.14, d: 0.16 },
      { f: 783.99, t: 0.28, d: 0.16 },
      { f: 1046.5, t: 0.44, d: 0.55 },
    ];
    fanfare.forEach(({ f, t, d }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + t);
      gain.gain.setValueAtTime(0.001, now + t);
      gain.gain.linearRampToValueAtTime(0.13, now + t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + t + d);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + t);
      osc.stop(now + t + d + 0.03);
    });
  }
}

export const jeopardySound = new JeopardySoundEngine();
