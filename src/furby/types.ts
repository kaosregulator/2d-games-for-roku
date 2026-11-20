export type FurbyCoatId = 'crystal_pink' | 'snowball' | 'mint_cloud' | 'midnight_ember';

export type FurbyPhase = 'boxed' | 'opening' | 'ready_to_lift' | 'lifting' | 'on_table';

export type FurbyActivity =
  | 'idle'
  | 'babble'
  | 'happy_pet'
  | 'tickle'
  | 'eat'
  | 'dance'
  | 'yawn'
  | 'sleep'
  | 'surprised';

export interface FurbyCoatSpec {
  id: FurbyCoatId;
  name: string;
  tagline: string;
  boxAccent: string;
  boxSecondary: string;
  furBase: string;
  furMid: string;
  furLight: string;
  furShadow: string;
  bellyFur: string;
  crestTip: string;
  earInner: string;
  faceplate: string;
  faceplateShade: string;
  eyelid: string;
  eyelidHighlight: string;
  irisOuter: string;
  irisInner: string;
  beakTop: string;
  beakBottom: string;
  feet: string;
  hasSparkles: boolean;
}

export interface FurBrushImpulse {
  /** Normalized local offset relative to Furby center (-1..1) */
  x: number;
  y: number;
  vx: number;
  vy: number;
  strength: number;
}

export interface FurbyFloatingCue {
  id: number;
  x: number;
  y: number;
  vy: number;
  life: number;
  maxLife: number;
  kind: 'heart' | 'sparkle' | 'zzz' | 'crumb';
}

export interface FurbySimState {
  coatId: FurbyCoatId;
  name: string;
  phase: FurbyPhase;
  /** 0 = sealed box, 1 = lid flaps fully open */
  boxOpenProgress: number;
  /** 0 = seated in box, 1 = lifted onto table */
  unboxLiftProgress: number;
  /** Normalized stage position (0.5, 0.56 is table center) */
  posX: number;
  posY: number;
  targetPosX: number;
  targetPosY: number;
  /** Lifted height off table in pixels (for hop / drag carry) */
  liftHeight: number;
  isDragging: boolean;

  // Mood & animation state
  activity: FurbyActivity;
  activityTimer: number;
  activityDuration: number;
  happiness: number; // 0..100
  energy: number; // 0..100
  time: number;

  // Kinematics: Body servo movement
  bodyTilt: number; // radians (-0.28..0.28)
  bodyTiltVel: number;
  bodyBobY: number; // px
  squashX: number; // 0.85..1.18
  squashY: number; // 0.85..1.18
  breathPhase: number;

  // Kinematics: Eyes & Eyelids
  gazeX: number; // -1..1
  gazeY: number; // -1..1
  targetGazeX: number;
  targetGazeY: number;
  hasCursorGaze: boolean;
  /** 0 = tightly shut, 1 = wide open, 1.15 = startled wide */
  eyelidOpen: number;
  blinkTimer: number;
  blinkPhase: number; // 0 = not blinking, >0 active blink
  pupilScale: number; // 0.78..1.25
  blushAlpha: number; // 0..1

  // Kinematics: 2-Piece Beak & Tongue
  /** 0 = closed, 1 = wide open */
  beakUpperOpen: number;
  beakLowerOpen: number;
  tongueOut: number; // 0..1

  // Kinematics: Floppy Plush Ears (spring-damper)
  earLeftAngle: number;
  earLeftVel: number;
  earRightAngle: number;
  earRightVel: number;

  // Kinematics: Plush Feet
  footLeftLift: number;
  footRightLift: number;

  // Fur tactile touch physics
  furBrush: FurBrushImpulse;

  // Silent visual speech bubble (no audio!)
  speechText: string | null;
  speechTimer: number;

  // Floating subtle visual cues
  cues: FurbyFloatingCue[];
  nextCueId: number;
}
