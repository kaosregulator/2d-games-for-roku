import type {
  FurbyActivity,
  FurbyCoatId,
  FurbyCoatSpec,
  FurbyFloatingCue,
  FurbySimState,
} from './types';

export const FURBY_COATS: Record<FurbyCoatId, FurbyCoatSpec> = {
  crystal_pink: {
    id: 'crystal_pink',
    name: 'Crystal Pink Sparkle',
    tagline: '1999 Baby Edition · Shimmering Rose Plush & Emerald Eyes',
    boxAccent: '#1D6B6A',
    boxSecondary: '#E78BB5',
    furBase: '#E997B8',
    furMid: '#F5B5D0',
    furLight: '#FFE0EE',
    furShadow: '#B86287',
    bellyFur: '#FAD3E5',
    crestTip: '#FFEBF4',
    earInner: '#D6709B',
    faceplate: '#F2E7DE',
    faceplateShade: '#D7C7BA',
    eyelid: '#EEA6C3',
    eyelidHighlight: '#FFD6E8',
    irisOuter: '#14532D',
    irisInner: '#4ADE80',
    beakTop: '#FACC15',
    beakBottom: '#EAB308',
    feet: '#F2A3C4',
    hasSparkles: true,
  },
  snowball: {
    id: 'snowball',
    name: 'Snowball Cream',
    tagline: '1999 Classic Baby · Ivory Plush & Warm Amber Eyes',
    boxAccent: '#225D7A',
    boxSecondary: '#EAB308',
    furBase: '#E8E3D9',
    furMid: '#F5F2EB',
    furLight: '#FFFFFF',
    furShadow: '#BDB5A7',
    bellyFur: '#FCFBF8',
    crestTip: '#FFFFFF',
    earInner: '#E9AEBE',
    faceplate: '#F4EDE4',
    faceplateShade: '#D8CEBF',
    eyelid: '#EDE4D8',
    eyelidHighlight: '#FFFDF8',
    irisOuter: '#78350F',
    irisInner: '#F59E0B',
    beakTop: '#FBBF24',
    beakBottom: '#D97706',
    feet: '#EFEAE0',
    hasSparkles: false,
  },
  mint_cloud: {
    id: 'mint_cloud',
    name: 'Mint Cloud',
    tagline: '1999 Retro Edition · Seafoam Plush & Sapphire Eyes',
    boxAccent: '#285F6B',
    boxSecondary: '#6EE7B7',
    furBase: '#8ED6C5',
    furMid: '#B1E6DA',
    furLight: '#E0FAF4',
    furShadow: '#589C8D',
    bellyFur: '#D4F5EE',
    crestTip: '#EEFCF9',
    earInner: '#E59CB8',
    faceplate: '#F0ECE4',
    faceplateShade: '#CFD0C7',
    eyelid: '#9FDED0',
    eyelidHighlight: '#D9F7F0',
    irisOuter: '#1E3A8A',
    irisInner: '#38BDF8',
    beakTop: '#FACC15',
    beakBottom: '#EAB308',
    feet: '#A6E1D4',
    hasSparkles: true,
  },
  midnight_ember: {
    id: 'midnight_ember',
    name: 'Midnight Ember',
    tagline: '1999 Collector Edition · Charcoal & Tangerine Plush',
    boxAccent: '#4C1D6B',
    boxSecondary: '#F97316',
    furBase: '#272329',
    furMid: '#3C3640',
    furLight: '#635B69',
    furShadow: '#151217',
    bellyFur: '#F97316',
    crestTip: '#FB923C',
    earInner: '#EA580C',
    faceplate: '#EAE2D8',
    faceplateShade: '#C7BCB0',
    eyelid: '#FB923C',
    eyelidHighlight: '#FED7AA',
    irisOuter: '#14532D',
    irisInner: '#84CC16',
    beakTop: '#FACC15',
    beakBottom: '#EA580C',
    feet: '#F97316',
    hasSparkles: false,
  },
};

export const FURBY_COAT_LIST: FurbyCoatSpec[] = Object.values(FURBY_COATS);

const FURBISH_GREETINGS = [
  'Dah a-loh u-tye!',
  'Kah may-may u-nye!',
  'Wee-tee kah!',
  'Ooh-nye a-loh!',
];

const FURBISH_TICKLE = ['Hee-hee! Kah-loo!', 'Tee-hee! May-lah!', 'Ah-may! Hee-hee!'];
const FURBISH_EAT = ['Yum! Kah ah-tah!', 'Nom nom! U-nye!', 'Ah-tah! Yum!'];
const FURBISH_DANCE = ['Dah-noh-lah!', 'Doo-ay! Wee-tee!', 'Boh-bay! Dah!'];
const FURBISH_PET = ['May-may! A-loh...', 'Ooh... kah may-may!', 'Noo-lah!'];

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * clamp(t, 0, 1);
}

function pickPhrase(list: string[], seed: number): string {
  return list[Math.abs(Math.floor(seed)) % list.length];
}

export function createFurbySim(
  coatId: FurbyCoatId = 'crystal_pink',
  name = 'May-May'
): FurbySimState {
  return {
    coatId,
    name: name.trim() || 'May-May',
    phase: 'boxed',
    boxOpenProgress: 0,
    unboxLiftProgress: 0,
    posX: 0.5,
    posY: 0.58,
    targetPosX: 0.5,
    targetPosY: 0.58,
    liftHeight: 0,
    isDragging: false,

    activity: 'idle',
    activityTimer: 0,
    activityDuration: 0,
    happiness: 78,
    energy: 86,
    time: 0,

    bodyTilt: 0,
    bodyTiltVel: 0,
    bodyBobY: 0,
    squashX: 1,
    squashY: 1,
    breathPhase: 0,

    gazeX: 0,
    gazeY: 0,
    targetGazeX: 0,
    targetGazeY: 0,
    hasCursorGaze: false,
    eyelidOpen: 0.52,
    blinkTimer: 2.4,
    blinkPhase: 0,
    pupilScale: 1,
    blushAlpha: 0.15,

    beakUpperOpen: 0,
    beakLowerOpen: 0,
    tongueOut: 0,

    earLeftAngle: -0.12,
    earLeftVel: 0,
    earRightAngle: 0.12,
    earRightVel: 0,

    footLeftLift: 0,
    footRightLift: 0,

    furBrush: { x: 0, y: 0, vx: 0, vy: 0, strength: 0 },

    speechText: null,
    speechTimer: 0,
    cues: [],
    nextCueId: 1,
  };
}

function spawnCue(
  sim: FurbySimState,
  kind: FurbyFloatingCue['kind'],
  offsetX = 0,
  offsetY = -95
): void {
  if (sim.cues.length >= 16) {
    sim.cues.shift();
  }
  sim.cues.push({
    id: sim.nextCueId++,
    x: offsetX + (Math.random() - 0.5) * 42,
    y: offsetY + (Math.random() - 0.5) * 18,
    vy: -24 - Math.random() * 18,
    life: 0,
    maxLife: 1.55 + Math.random() * 0.5,
    kind,
  });
}

/** Step 1 of Unboxing: Pop the vintage 1999 box flaps open so Furby wakes up inside */
export function openFurbyBox(sim: FurbySimState): void {
  if (sim.phase !== 'boxed') return;
  sim.phase = 'opening';
  sim.activity = 'surprised';
  sim.activityTimer = 0;
  sim.activityDuration = 1.6;
  sim.eyelidOpen = 1.12;
  sim.earLeftVel -= 6;
  sim.earRightVel += 6;
  sim.speechText = 'Ooh! A-loh!';
  sim.speechTimer = 2.2;
  spawnCue(sim, 'sparkle', 0, -110);
}

/** Step 2 of Unboxing: Lift Furby out of the collector's box and set him onto the wooden table */
export function placeFurbyOnTable(sim: FurbySimState): void {
  if (sim.phase === 'boxed') {
    sim.boxOpenProgress = 1;
    sim.phase = 'lifting';
  } else if (sim.phase === 'opening' || sim.phase === 'ready_to_lift') {
    sim.boxOpenProgress = 1;
    sim.phase = 'lifting';
  } else {
    return;
  }
  sim.unboxLiftProgress = 0;
  sim.targetPosX = 0.54;
  sim.targetPosY = 0.57;
  sim.activity = 'babble';
  sim.activityTimer = 0;
  sim.activityDuration = 2.6;
  sim.speechText = pickPhrase(FURBISH_GREETINGS, sim.time * 10 + sim.nextCueId);
  sim.speechTimer = 2.8;
  sim.happiness = clamp(sim.happiness + 12, 0, 100);
  spawnCue(sim, 'heart', -24, -120);
  spawnCue(sim, 'sparkle', 26, -115);
}

/** Return Furby neatly back into the vintage 1999 display box so the player can re-unbox anytime */
export function returnFurbyToBox(sim: FurbySimState): void {
  sim.phase = 'boxed';
  sim.boxOpenProgress = 0;
  sim.unboxLiftProgress = 0;
  sim.posX = 0.5;
  sim.posY = 0.58;
  sim.targetPosX = 0.5;
  sim.targetPosY = 0.58;
  sim.liftHeight = 0;
  sim.isDragging = false;
  sim.activity = 'idle';
  sim.activityTimer = 0;
  sim.activityDuration = 0;
  sim.eyelidOpen = 0.52;
  sim.beakUpperOpen = 0;
  sim.beakLowerOpen = 0;
  sim.tongueOut = 0;
  sim.speechText = null;
  sim.speechTimer = 0;
}

/** Trigger an expressive physical interaction once Furby is out of the box (or peeking) */
export function triggerFurbyAction(sim: FurbySimState, action: FurbyActivity): void {
  if (sim.phase === 'boxed') {
    openFurbyBox(sim);
    return;
  }

  sim.activity = action;
  sim.activityTimer = 0;

  switch (action) {
    case 'tickle':
      sim.activityDuration = 2.6;
      sim.happiness = clamp(sim.happiness + 9, 0, 100);
      sim.energy = clamp(sim.energy - 3, 15, 100);
      sim.bodyTiltVel += (Math.random() > 0.5 ? 1 : -1) * 3.8;
      sim.earLeftVel -= 9;
      sim.earRightVel += 9;
      sim.squashX = 1.12;
      sim.squashY = 0.89;
      sim.speechText = pickPhrase(FURBISH_TICKLE, sim.time * 13 + sim.nextCueId);
      sim.speechTimer = 2.5;
      spawnCue(sim, 'sparkle', -28, -95);
      spawnCue(sim, 'heart', 24, -105);
      break;

    case 'eat':
      sim.activityDuration = 2.4;
      sim.happiness = clamp(sim.happiness + 7, 0, 100);
      sim.energy = clamp(sim.energy + 14, 0, 100);
      sim.targetGazeX = 0;
      sim.targetGazeY = 0.38;
      sim.speechText = pickPhrase(FURBISH_EAT, sim.time * 17 + sim.nextCueId);
      sim.speechTimer = 2.4;
      spawnCue(sim, 'crumb', -12, -25);
      spawnCue(sim, 'crumb', 14, -22);
      spawnCue(sim, 'heart', 0, -110);
      break;

    case 'dance':
      sim.activityDuration = 3.8;
      sim.happiness = clamp(sim.happiness + 12, 0, 100);
      sim.energy = clamp(sim.energy - 6, 10, 100);
      sim.earLeftVel -= 10;
      sim.earRightVel += 10;
      sim.speechText = pickPhrase(FURBISH_DANCE, sim.time * 11 + sim.nextCueId);
      sim.speechTimer = 3.2;
      spawnCue(sim, 'sparkle', -38, -115);
      spawnCue(sim, 'sparkle', 38, -115);
      break;

    case 'happy_pet':
      sim.activityDuration = 1.8;
      sim.happiness = clamp(sim.happiness + 5, 0, 100);
      sim.speechText = pickPhrase(FURBISH_PET, sim.time * 9 + sim.nextCueId);
      sim.speechTimer = 2.0;
      spawnCue(sim, 'heart', 0, -115);
      break;

    case 'yawn':
      sim.activityDuration = 2.2;
      sim.speechText = 'Yaaawn... way-loh...';
      sim.speechTimer = 2.2;
      break;

    case 'sleep':
      sim.activityDuration = 9999;
      sim.energy = clamp(sim.energy + 10, 0, 100);
      sim.speechText = 'Way-loh...';
      sim.speechTimer = 1.8;
      spawnCue(sim, 'zzz', 28, -115);
      break;

    case 'surprised':
      sim.activityDuration = 1.3;
      sim.eyelidOpen = 1.15;
      sim.earLeftVel -= 11;
      sim.earRightVel += 11;
      sim.squashX = 0.88;
      sim.squashY = 1.14;
      sim.speechText = 'Ooh-nye!';
      sim.speechTimer = 1.6;
      break;

    case 'babble':
    default:
      sim.activityDuration = 2.2;
      sim.speechText = pickPhrase(FURBISH_GREETINGS, sim.time * 7 + sim.nextCueId);
      sim.speechTimer = 2.2;
      break;
  }
}

/** Update live cursor gaze target (-1..1 relative to Furby's eyes) */
export function setFurbyGazeTarget(
  sim: FurbySimState,
  normX: number,
  normY: number,
  active: boolean
): void {
  sim.hasCursorGaze = active;
  if (active) {
    sim.targetGazeX = clamp(normX, -1, 1);
    sim.targetGazeY = clamp(normY, -1, 1);
  }
}

/** Brush Furby's fur with velocity impulse so individual fur strands part & settle */
export function applyFurbyPetting(
  sim: FurbySimState,
  localNormX: number,
  localNormY: number,
  velX: number,
  velY: number
): void {
  sim.furBrush.x = clamp(localNormX, -1.2, 1.2);
  sim.furBrush.y = clamp(localNormY, -1.2, 1.2);
  sim.furBrush.vx = clamp(velX, -2.5, 2.5);
  sim.furBrush.vy = clamp(velY, -2.5, 2.5);
  sim.furBrush.strength = Math.min(1, sim.furBrush.strength + 0.45);

  // Petting wakes gently or comforts Furby
  if (sim.phase === 'on_table') {
    sim.happiness = clamp(sim.happiness + 0.35, 0, 100);
    sim.bodyTiltVel += clamp(velX * 0.28, -0.5, 0.5);
    if (sim.activity === 'idle' || sim.activity === 'sleep') {
      sim.activity = 'happy_pet';
      sim.activityTimer = 0;
      sim.activityDuration = 1.5;
      sim.speechText = pickPhrase(FURBISH_PET, sim.time * 5 + sim.nextCueId);
      sim.speechTimer = 1.8;
      spawnCue(sim, 'heart', localNormX * 40, -110);
    }
  }
}

/** Pick up & carry Furby across the wooden tabletop */
export function setFurbyDragged(
  sim: FurbySimState,
  dragging: boolean,
  normPosX?: number,
  normPosY?: number
): void {
  if (dragging) {
    if (sim.phase === 'ready_to_lift' || sim.phase === 'opening') {
      sim.phase = 'on_table';
      sim.boxOpenProgress = 1;
      sim.unboxLiftProgress = 1;
      sim.speechText = 'Wee! A-loh!';
      sim.speechTimer = 2.0;
    }
    sim.isDragging = true;
    if (sim.activity === 'sleep') {
      sim.activity = 'surprised';
      sim.activityTimer = 0;
      sim.activityDuration = 1.1;
    }
    if (typeof normPosX === 'number' && typeof normPosY === 'number') {
      sim.targetPosX = clamp(normPosX, 0.22, 0.84);
      sim.targetPosY = clamp(normPosY, 0.44, 0.72);
    }
  } else if (sim.isDragging) {
    sim.isDragging = false;
    // Soft plush landing squash
    sim.squashX = 1.13;
    sim.squashY = 0.88;
    sim.earLeftVel += 5;
    sim.earRightVel -= 5;
  }
}

/**
 * Pure 60fps kinematic simulation step with clamped dt (<= 0.05s).
 * Drives unboxing, breathing, mechanical servo body tilt, cursor eye-tracking,
 * blinking, articulated 2-piece beak + tongue, floppy spring-damper ears, feet & fur decay.
 */
export function stepFurbySim(sim: FurbySimState, rawDt: number): void {
  const dt = Math.min(Math.max(rawDt, 0), 0.05);
  if (dt <= 0) return;

  sim.time += dt;
  sim.breathPhase += dt * (sim.activity === 'sleep' ? 1.45 : 2.55);

  // 1. Unboxing Phase Progression
  if (sim.phase === 'opening') {
    sim.boxOpenProgress = clamp(sim.boxOpenProgress + dt * 1.45, 0, 1);
    if (sim.boxOpenProgress >= 1) {
      sim.phase = 'ready_to_lift';
    }
  } else if (sim.phase === 'lifting') {
    sim.unboxLiftProgress = clamp(sim.unboxLiftProgress + dt * 1.05, 0, 1);
    const p = sim.unboxLiftProgress;
    // Smooth parabolic lift out of the box and soft drop onto the wooden table
    sim.liftHeight = Math.sin(p * Math.PI) * 118;
    sim.posX = lerp(0.5, sim.targetPosX, p);
    sim.posY = lerp(0.58, sim.targetPosY, p);
    if (p >= 1) {
      sim.phase = 'on_table';
      sim.liftHeight = 0;
      sim.squashX = 1.15;
      sim.squashY = 0.86;
      sim.earLeftVel += 6.5;
      sim.earRightVel -= 6.5;
    }
  } else if (sim.phase === 'on_table') {
    sim.posX = lerp(sim.posX, sim.targetPosX, dt * 11);
    sim.posY = lerp(sim.posY, sim.targetPosY, dt * 11);
    const desiredLift = sim.isDragging ? 52 : 0;
    sim.liftHeight = lerp(sim.liftHeight, desiredLift, dt * 12);
  }

  // 2. Activity Lifecycle & Speech Bubble Timer
  if (sim.speechTimer > 0) {
    sim.speechTimer = Math.max(0, sim.speechTimer - dt);
    if (sim.speechTimer === 0) sim.speechText = null;
  }

  if (sim.activity !== 'idle' && sim.activity !== 'sleep') {
    sim.activityTimer += dt;
    if (sim.activityTimer >= sim.activityDuration) {
      if (sim.activity === 'yawn') {
        sim.activity = 'sleep';
        sim.activityTimer = 0;
        sim.activityDuration = 9999;
      } else {
        sim.activity = 'idle';
        sim.activityTimer = 0;
        sim.activityDuration = 0;
      }
    }
  }

  // Periodic peaceful zZz bubbles while sleeping
  if (sim.activity === 'sleep') {
    sim.energy = clamp(sim.energy + dt * 2.5, 0, 100);
    if (Math.floor(sim.time * 0.7) !== Math.floor((sim.time - dt) * 0.7)) {
      spawnCue(sim, 'zzz', 30, -110);
    }
  }

  // 3. Body Servo Movement, Squash & Stretch, & Feet Taps
  let targetTilt = 0;
  let targetBob = Math.sin(sim.breathPhase) * 2.2;
  let targetFootL = 0;
  let targetFootR = 0;

  if (sim.isDragging) {
    targetTilt = clamp((sim.targetPosX - sim.posX) * 2.6, -0.26, 0.26);
    targetBob = Math.sin(sim.time * 10) * 3;
    targetFootL = Math.max(0, Math.sin(sim.time * 15)) * 10;
    targetFootR = Math.max(0, Math.sin(sim.time * 15 + Math.PI)) * 10;
  } else if (sim.activity === 'dance') {
    targetTilt = Math.sin(sim.time * 7.2) * 0.17;
    targetBob = -Math.abs(Math.sin(sim.time * 7.2)) * 13;
    targetFootL = Math.max(0, Math.sin(sim.time * 7.2)) * 11;
    targetFootR = Math.max(0, -Math.sin(sim.time * 7.2)) * 11;
  } else if (sim.activity === 'tickle') {
    targetTilt = Math.sin(sim.time * 14.5) * 0.14;
    targetBob = -Math.abs(Math.sin(sim.time * 14.5)) * 8;
    targetFootL = Math.max(0, Math.sin(sim.time * 16)) * 8;
    targetFootR = Math.max(0, Math.cos(sim.time * 16)) * 8;
  } else if (sim.activity === 'happy_pet') {
    targetTilt = Math.sin(sim.time * 3.2) * 0.07;
    targetBob = Math.sin(sim.time * 4.5) * 3.5;
  } else if (sim.activity === 'eat') {
    targetTilt = Math.sin(sim.time * 8.5) * 0.04;
    targetBob = Math.abs(Math.sin(sim.time * 9.5)) * 4;
  } else if (sim.activity === 'sleep') {
    targetTilt = 0.06 + Math.sin(sim.breathPhase * 0.6) * 0.025;
    targetBob = Math.sin(sim.breathPhase) * 3.2;
  } else if (sim.phase === 'on_table') {
    // Organic curious idle servo rock (classic 1999 Furby living presence)
    targetTilt = Math.sin(sim.time * 0.9) * 0.045 + sim.gazeX * 0.04;
  }

  // Spring-damper body tilt
  const tiltSpring = (targetTilt - sim.bodyTilt) * 42 - sim.bodyTiltVel * 7.5;
  sim.bodyTiltVel += tiltSpring * dt;
  sim.bodyTilt = clamp(sim.bodyTilt + sim.bodyTiltVel * dt, -0.32, 0.32);

  sim.bodyBobY = lerp(sim.bodyBobY, targetBob, dt * 12);
  sim.squashX = lerp(sim.squashX, 1 + Math.sin(sim.breathPhase) * 0.015, dt * 9);
  sim.squashY = lerp(sim.squashY, 1 - Math.sin(sim.breathPhase) * 0.015, dt * 9);
  sim.footLeftLift = lerp(sim.footLeftLift, targetFootL, dt * 16);
  sim.footRightLift = lerp(sim.footRightLift, targetFootR, dt * 16);

  // 4. Expressive Eyes, Eyelids, Saccadic Gaze & Blinking
  if (!sim.hasCursorGaze) {
    if (sim.activity === 'sleep') {
      sim.targetGazeX = 0;
      sim.targetGazeY = 0.25;
    } else if (sim.activity === 'dance') {
      sim.targetGazeX = Math.sin(sim.time * 4.2) * 0.65;
      sim.targetGazeY = -0.15;
    } else if (sim.phase === 'boxed') {
      sim.targetGazeX = Math.sin(sim.time * 0.7) * 0.35;
      sim.targetGazeY = 0.05;
    } else {
      // Gentle curious autonomous eye glance around the room
      sim.targetGazeX = Math.sin(sim.time * 0.85) * 0.45 * Math.cos(sim.time * 0.33);
      sim.targetGazeY = Math.sin(sim.time * 0.55) * 0.2;
    }
  }
  sim.gazeX = lerp(sim.gazeX, sim.targetGazeX, dt * 9.5);
  sim.gazeY = lerp(sim.gazeY, sim.targetGazeY, dt * 9.5);

  // Natural blinking timer
  sim.blinkTimer -= dt;
  if (sim.blinkTimer <= 0 && sim.activity !== 'sleep') {
    sim.blinkPhase = 0.001;
    sim.blinkTimer = 2.6 + (Math.sin(sim.time * 7.3) * 0.5 + 0.5) * 3.4;
  }
  if (sim.blinkPhase > 0) {
    sim.blinkPhase += dt * 5.6;
    if (sim.blinkPhase >= 1) sim.blinkPhase = 0;
  }
  const blinkDip = sim.blinkPhase > 0 ? Math.sin(sim.blinkPhase * Math.PI) : 0;

  let baseEyelid = 0.96;
  let desiredPupil = 1.0;
  let desiredBlush = 0.14;

  if (sim.phase === 'boxed') {
    baseEyelid = 0.62 + Math.sin(sim.time * 0.9) * 0.08;
  } else if (sim.activity === 'sleep') {
    baseEyelid = 0.03;
    desiredPupil = 0.85;
  } else if (sim.activity === 'yawn') {
    baseEyelid = 0.28;
  } else if (sim.activity === 'happy_pet') {
    baseEyelid = 0.46;
    desiredPupil = 1.12;
    desiredBlush = 0.68;
  } else if (sim.activity === 'tickle') {
    baseEyelid = 0.52 + Math.sin(sim.time * 16) * 0.14;
    desiredPupil = 1.15;
    desiredBlush = 0.78;
  } else if (sim.activity === 'surprised' || sim.isDragging) {
    baseEyelid = 1.12;
    desiredPupil = 1.18;
    desiredBlush = 0.35;
  } else if (sim.activity === 'eat') {
    baseEyelid = 0.74;
    desiredPupil = 1.1;
    desiredBlush = 0.55;
  } else if (sim.activity === 'dance') {
    baseEyelid = 1.02;
    desiredPupil = 1.14;
    desiredBlush = 0.52;
  }

  const desiredEyelid = clamp(baseEyelid * (1 - blinkDip * 0.96), 0.02, 1.15);
  sim.eyelidOpen = lerp(sim.eyelidOpen, desiredEyelid, dt * 18);
  sim.pupilScale = lerp(sim.pupilScale, desiredPupil, dt * 8);
  sim.blushAlpha = lerp(sim.blushAlpha, desiredBlush, dt * 6);

  // 5. Articulated 2-Piece Yellow Beak & Pink Tongue
  let targetUpper = 0;
  let targetLower = 0;
  let targetTongue = 0;

  if (sim.activity === 'babble' || sim.activity === 'dance') {
    const syllable = Math.max(0, Math.sin(sim.time * 13.5) * Math.sin(sim.time * 4.1 + 0.5));
    targetUpper = syllable * 0.62;
    targetLower = syllable * 0.88;
    targetTongue = syllable * 0.65;
  } else if (sim.activity === 'tickle') {
    const giggle = 0.28 + Math.abs(Math.sin(sim.time * 16.5)) * 0.72;
    targetUpper = giggle * 0.55;
    targetLower = giggle * 0.92;
    targetTongue = giggle * 0.85;
  } else if (sim.activity === 'eat') {
    const chomp = Math.pow(Math.abs(Math.sin(sim.time * 9.5)), 1.4);
    targetUpper = chomp * 0.68;
    targetLower = chomp * 0.96;
    targetTongue = chomp > 0.35 ? 0.92 : 0.25;
  } else if (sim.activity === 'yawn') {
    const yawnBell = Math.sin(clamp(sim.activityTimer / Math.max(0.1, sim.activityDuration), 0, 1) * Math.PI);
    targetUpper = yawnBell * 0.82;
    targetLower = yawnBell * 1.0;
    targetTongue = yawnBell * 0.95;
  } else if (sim.activity === 'surprised') {
    targetUpper = 0.55;
    targetLower = 0.7;
    targetTongue = 0.45;
  } else if (sim.activity === 'happy_pet') {
    const purr = Math.max(0, Math.sin(sim.time * 6.5)) * 0.26;
    targetUpper = purr;
    targetLower = purr * 1.3;
    targetTongue = purr * 0.5;
  } else if (sim.activity === 'sleep') {
    const snore = Math.max(0, Math.sin(sim.breathPhase - 0.6)) * 0.22;
    targetUpper = snore * 0.4;
    targetLower = snore;
    targetTongue = 0;
  } else if (sim.speechTimer > 0) {
    const talk = Math.abs(Math.sin(sim.time * 12)) * 0.55;
    targetUpper = talk * 0.5;
    targetLower = talk * 0.8;
    targetTongue = talk * 0.4;
  }

  sim.beakUpperOpen = lerp(sim.beakUpperOpen, targetUpper, dt * 20);
  sim.beakLowerOpen = lerp(sim.beakLowerOpen, targetLower, dt * 20);
  sim.tongueOut = lerp(sim.tongueOut, targetTongue, dt * 16);

  // 6. Floppy Plush Ears with Secondary Spring-Damper Physics
  let restEarL = -0.05;
  let restEarR = 0.05;
  if (sim.phase === 'boxed') {
    restEarL = 0.14;
    restEarR = -0.14;
  } else if (sim.activity === 'sleep' || sim.activity === 'yawn') {
    restEarL = 0.34;
    restEarR = -0.34;
  } else if (sim.activity === 'surprised' || sim.isDragging) {
    restEarL = -0.32;
    restEarR = 0.32;
  } else if (sim.activity === 'dance') {
    const flap = Math.sin(sim.time * 10.5) * 0.32;
    restEarL = -0.14 + flap;
    restEarR = 0.14 + flap;
  } else if (sim.activity === 'tickle') {
    restEarL = -0.22 + Math.sin(sim.time * 18) * 0.24;
    restEarR = 0.22 - Math.sin(sim.time * 18) * 0.24;
  } else if (sim.activity === 'happy_pet') {
    restEarL = 0.16 + Math.sin(sim.time * 4) * 0.07;
    restEarR = -0.16 - Math.sin(sim.time * 4) * 0.07;
  } else {
    restEarL = -0.06 + Math.sin(sim.time * 2.1) * 0.05 - sim.bodyTilt * 0.7;
    restEarR = 0.06 - Math.sin(sim.time * 2.1 + 0.6) * 0.05 - sim.bodyTilt * 0.7;
  }

  const earAccelL = (restEarL - sim.earLeftAngle) * 75 - sim.earLeftVel * 7.2;
  const earAccelR = (restEarR - sim.earRightAngle) * 75 - sim.earRightVel * 7.2;
  sim.earLeftVel += earAccelL * dt;
  sim.earRightVel += earAccelR * dt;
  sim.earLeftAngle = clamp(sim.earLeftAngle + sim.earLeftVel * dt, -0.58, 0.58);
  sim.earRightAngle = clamp(sim.earRightAngle + sim.earRightVel * dt, -0.58, 0.58);

  // 7. Fur Brush Displacement Decay
  sim.furBrush.strength = Math.max(0, sim.furBrush.strength - dt * 1.4);
  sim.furBrush.vx *= Math.pow(0.08, dt);
  sim.furBrush.vy *= Math.pow(0.08, dt);

  // 8. Floating Visual Cues
  for (let i = sim.cues.length - 1; i >= 0; i--) {
    const c = sim.cues[i];
    c.life += dt;
    c.y += c.vy * dt;
    c.x += Math.sin(c.life * 4 + c.id) * 10 * dt;
    if (c.life >= c.maxLife) {
      sim.cues.splice(i, 1);
    }
  }
}
