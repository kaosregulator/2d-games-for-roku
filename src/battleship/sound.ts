class NavalSoundEngine {
  private ctx: AudioContext | null = null;
  private muted = false;

  private ensureContext(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
  }

  private createNoiseBuffer(ctx: AudioContext, durationSec: number, decayFactor = 0.35): AudioBuffer {
    const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * durationSec));
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * decayFactor));
    }
    return buffer;
  }

  /** Brass ship's bell / sonar chime for locking fleet & turns */
  public playSonarPing(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const freqs = [784, 1568];
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now);
      gain.gain.setValueAtTime(i === 0 ? 0.08 : 0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.55);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.58);
    });
  }

  /** Solid wooden board peg / hull placement thock */
  public playShipPlace(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(95, now + 0.075);
    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.085);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  /**
   * Heavy naval warship cannon broadside:
   * - Breech sub-bass punch
   * - Sharp black-powder muzzle crack
   * - Rolling ocean reverberation boom
   * - Brief descending shell whistle toward the target
   */
  public playCannonFire(startOffset = 0): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const t0 = ctx.currentTime + startOffset;
    const pitchVar = 0.94 + Math.random() * 0.12;

    // 1. Deep cannon breech thump
    const thump = ctx.createOscillator();
    const thumpGain = ctx.createGain();
    thump.type = 'sine';
    thump.frequency.setValueAtTime(118 * pitchVar, t0);
    thump.frequency.exponentialRampToValueAtTime(28, t0 + 0.28);
    thumpGain.gain.setValueAtTime(0.32, t0);
    thumpGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.32);
    thump.connect(thumpGain);
    thumpGain.connect(ctx.destination);
    thump.start(t0);
    thump.stop(t0 + 0.34);

    // 2. Sharp gunpowder muzzle crack
    const crack = ctx.createBufferSource();
    crack.buffer = this.createNoiseBuffer(ctx, 0.12, 0.22);
    const crackFilter = ctx.createBiquadFilter();
    crackFilter.type = 'bandpass';
    crackFilter.frequency.setValueAtTime(1450 * pitchVar, t0);
    crackFilter.Q.setValueAtTime(0.9, t0);
    const crackGain = ctx.createGain();
    crackGain.gain.setValueAtTime(0.24, t0);
    crackGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.12);
    crack.connect(crackFilter);
    crackFilter.connect(crackGain);
    crackGain.connect(ctx.destination);
    crack.start(t0);

    // 3. Rolling cannon barrel boom & sea echo
    const boom = ctx.createBufferSource();
    boom.buffer = this.createNoiseBuffer(ctx, 0.58, 0.36);
    const boomFilter = ctx.createBiquadFilter();
    boomFilter.type = 'lowpass';
    boomFilter.frequency.setValueAtTime(480 * pitchVar, t0);
    boomFilter.frequency.exponentialRampToValueAtTime(110, t0 + 0.54);
    const boomGain = ctx.createGain();
    boomGain.gain.setValueAtTime(0.28, t0);
    boomGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.58);
    boom.connect(boomFilter);
    boomFilter.connect(boomGain);
    boomGain.connect(ctx.destination);
    boom.start(t0);

    // 4. Short whistling cannon shell arc (leads smoothly into splash or hit)
    const whistle = ctx.createOscillator();
    const whistleGain = ctx.createGain();
    whistle.type = 'sine';
    whistle.frequency.setValueAtTime(760 * pitchVar, t0 + 0.04);
    whistle.frequency.exponentialRampToValueAtTime(340 * pitchVar, t0 + 0.24);
    whistleGain.gain.setValueAtTime(0.0008, t0 + 0.03);
    whistleGain.gain.linearRampToValueAtTime(0.025, t0 + 0.1);
    whistleGain.gain.exponentialRampToValueAtTime(0.0008, t0 + 0.24);
    whistle.connect(whistleGain);
    whistleGain.connect(ctx.destination);
    whistle.start(t0 + 0.03);
    whistle.stop(t0 + 0.25);
  }

  /**
   * Realistic ocean water splash for missed cannonballs:
   * - Crisp surface slap
   * - Sweeping sea-spray plume
   * - Trailing water droplet bloop/bubbles
   */
  public playSplash(startOffset = 0): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const t0 = ctx.currentTime + startOffset;

    // 1. Initial water impact slap (low-mid thud)
    const slapOsc = ctx.createOscillator();
    const slapGain = ctx.createGain();
    slapOsc.type = 'sine';
    slapOsc.frequency.setValueAtTime(240, t0);
    slapOsc.frequency.exponentialRampToValueAtTime(92, t0 + 0.09);
    slapGain.gain.setValueAtTime(0.14, t0);
    slapGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.1);
    slapOsc.connect(slapGain);
    slapGain.connect(ctx.destination);
    slapOsc.start(t0);
    slapOsc.stop(t0 + 0.11);

    // 2. Foaming water geyser spray
    const spray = ctx.createBufferSource();
    spray.buffer = this.createNoiseBuffer(ctx, 0.52, 0.42);
    const sprayFilter = ctx.createBiquadFilter();
    sprayFilter.type = 'bandpass';
    sprayFilter.frequency.setValueAtTime(2150, t0);
    sprayFilter.frequency.exponentialRampToValueAtTime(520, t0 + 0.46);
    sprayFilter.Q.setValueAtTime(1.15, t0);
    const sprayGain = ctx.createGain();
    sprayGain.gain.setValueAtTime(0.001, t0);
    sprayGain.gain.linearRampToValueAtTime(0.22, t0 + 0.035);
    sprayGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.52);
    spray.connect(sprayFilter);
    sprayFilter.connect(sprayGain);
    sprayGain.connect(ctx.destination);
    spray.start(t0);

    // 3. Water droplet plops & bubbles settling
    const bubbleTimes = [0.11, 0.19, 0.29];
    const bubbleFreqs = [420, 580, 490];
    bubbleTimes.forEach((dt, i) => {
      const bOsc = ctx.createOscillator();
      const bGain = ctx.createGain();
      bOsc.type = 'sine';
      const bt = t0 + dt;
      bOsc.frequency.setValueAtTime(bubbleFreqs[i], bt);
      bOsc.frequency.exponentialRampToValueAtTime(bubbleFreqs[i] * 1.55, bt + 0.065);
      bGain.gain.setValueAtTime(0.045, bt);
      bGain.gain.exponentialRampToValueAtTime(0.001, bt + 0.075);
      bOsc.connect(bGain);
      bGain.connect(ctx.destination);
      bOsc.start(bt);
      bOsc.stop(bt + 0.08);
    });
  }

  /**
   * Direct hit fiery hull explosion + optional massive sinking detonation & underwater groan
   */
  public playExplosion(sunk = false, startOffset = 0): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const t0 = ctx.currentTime + startOffset;

    // 1. Sub-bass impact punch
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(sunk ? 115 : 155, t0);
    osc.frequency.exponentialRampToValueAtTime(26, t0 + (sunk ? 0.65 : 0.36));
    oscGain.gain.setValueAtTime(sunk ? 0.24 : 0.17, t0);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t0 + (sunk ? 0.68 : 0.38));
    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + (sunk ? 0.72 : 0.4));

    // 2. Fiery detonation roar & debris crackle
    const dur = sunk ? 0.95 : 0.48;
    const roar = ctx.createBufferSource();
    roar.buffer = this.createNoiseBuffer(ctx, dur, 0.34);
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(sunk ? 920 : 1100, t0);
    filter.frequency.exponentialRampToValueAtTime(160, t0 + dur);
    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(sunk ? 0.3 : 0.22, t0);
    nGain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    roar.connect(filter);
    filter.connect(nGain);
    nGain.connect(ctx.destination);
    roar.start(t0);

    // 3. When a ship is DESTROYED: secondary magazine blast + steel hull groan + sinking bubbles!
    if (sunk) {
      // Secondary explosion 220ms later
      const secT = t0 + 0.22;
      const secNoise = ctx.createBufferSource();
      secNoise.buffer = this.createNoiseBuffer(ctx, 0.85, 0.38);
      const secFilter = ctx.createBiquadFilter();
      secFilter.type = 'lowpass';
      secFilter.frequency.setValueAtTime(640, secT);
      secFilter.frequency.exponentialRampToValueAtTime(95, secT + 0.8);
      const secGain = ctx.createGain();
      secGain.gain.setValueAtTime(0.28, secT);
      secGain.gain.exponentialRampToValueAtTime(0.001, secT + 0.85);
      secNoise.connect(secFilter);
      secFilter.connect(secGain);
      secGain.connect(ctx.destination);
      secNoise.start(secT);

      // Groaning iron hull bending as ship goes under
      const groanT = t0 + 0.38;
      const groan = ctx.createOscillator();
      const groanFilter = ctx.createBiquadFilter();
      const groanGain = ctx.createGain();
      groan.type = 'sawtooth';
      groan.frequency.setValueAtTime(148, groanT);
      groan.frequency.exponentialRampToValueAtTime(62, groanT + 1.05);
      groanFilter.type = 'bandpass';
      groanFilter.frequency.setValueAtTime(320, groanT);
      groanFilter.Q.setValueAtTime(5.5, groanT);
      groanGain.gain.setValueAtTime(0.001, groanT);
      groanGain.gain.linearRampToValueAtTime(0.09, groanT + 0.18);
      groanGain.gain.exponentialRampToValueAtTime(0.001, groanT + 1.08);
      groan.connect(groanFilter);
      groanFilter.connect(groanGain);
      groanGain.connect(ctx.destination);
      groan.start(groanT);
      groan.stop(groanT + 1.1);

      // Underwater sinking bubbles
      const sinkBubbles = [0.62, 0.78, 0.94, 1.12, 1.28];
      sinkBubbles.forEach((dt, idx) => {
        const b = ctx.createOscillator();
        const bg = ctx.createGain();
        b.type = 'sine';
        const bt = t0 + dt;
        const base = 240 + idx * 45;
        b.frequency.setValueAtTime(base, bt);
        b.frequency.exponentialRampToValueAtTime(base * 1.8, bt + 0.11);
        bg.gain.setValueAtTime(0.055, bt);
        bg.gain.exponentialRampToValueAtTime(0.001, bt + 0.12);
        b.connect(bg);
        bg.connect(ctx.destination);
        b.start(bt);
        b.stop(bt + 0.13);
      });
    }
  }

  /**
   * Full choreographed naval broadside:
   * Cannon fires immediately (0ms), shell whistles briefly, then hits water splash OR hull explosion (220ms).
   */
  public playSalvo(result: 'hit' | 'miss', sunk = false): void {
    this.playCannonFire(0);
    if (result === 'hit') {
      this.playExplosion(sunk, 0.22);
    } else {
      this.playSplash(0.23);
    }
  }

  /** Classic naval brass victory fanfare */
  public playVictory(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [392, 523.25, 659.25, 783.99];
    notes.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + idx * 0.13);
      gain.gain.setValueAtTime(0.1, now + idx * 0.13);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.13 + 0.55);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.13);
      osc.stop(now + idx * 0.13 + 0.58);
    });
  }
}

export const navalSound = new NavalSoundEngine();
