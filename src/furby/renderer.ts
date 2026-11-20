import { FURBY_COATS } from './simulation';
import type { FurbyCoatId, FurbyCoatSpec, FurbySimState } from './types';

type FurBucketKey = 'shadow' | 'base' | 'mid' | 'belly' | 'light' | 'crestTip';

interface FurStrand {
  x: number; // local Furby coordinates (center = 0,0; body ~ 190x215)
  y: number;
  angle: number;
  length: number;
  curve: number;
  bucket: FurBucketKey;
  sparkle: boolean;
  phase: number;
}

const FUR_BUCKET_ORDER: FurBucketKey[] = [
  'shadow',
  'base',
  'mid',
  'belly',
  'light',
  'crestTip',
];

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Pre-generate ~780 deterministic plush fur fibers grouped into 6 draw-call buckets for silky 60fps */
function buildFurCoatBuckets(): Record<FurBucketKey, FurStrand[]> {
  const rand = mulberry32(19991101);
  const buckets: Record<FurBucketKey, FurStrand[]> = {
    shadow: [],
    base: [],
    mid: [],
    belly: [],
    light: [],
    crestTip: [],
  };

  const pushStrand = (strand: FurStrand) => {
    buckets[strand.bucket].push(strand);
  };

  // 1. Puffy Cotton-Candy Crown Hair Crest (authentic 1999 Furby Baby top puff)
  for (let i = 0; i < 86; i++) {
    const u = (rand() - 0.5) * 2; // -1..1
    const r = Math.sqrt(rand());
    const x = u * 42 * (0.45 + 0.55 * r);
    const y = -94 - (1 - u * u * 0.6) * (10 + rand() * 28);
    const angle = -Math.PI / 2 + u * 0.52 + (rand() - 0.5) * 0.28;
    const toneRand = rand();
    const bucket: FurBucketKey =
      toneRand < 0.16 ? 'base' : toneRand < 0.5 ? 'mid' : toneRand < 0.78 ? 'light' : 'crestTip';
    pushStrand({
      x,
      y,
      angle,
      length: 18 + rand() * 18,
      curve: -u * 9 + (rand() - 0.5) * 7,
      bucket,
      sparkle: rand() < 0.16,
      phase: rand() * Math.PI * 2,
    });
  }

  // 2. Soft Shaggy Outer Plush Halo (lush velvety silhouette — curved along body contour, never spiky)
  const rimCount = 156;
  for (let i = 0; i < rimCount; i++) {
    const theta = (i / rimCount) * Math.PI * 2 + (rand() - 0.5) * 0.03;
    const pearBias =
      Math.sin(theta) > 0 ? 1 + Math.sin(theta) * 0.14 : 1 - Math.abs(Math.sin(theta)) * 0.07;
    const rx = 89 * pearBias;
    const ry = 103;
    const x = Math.cos(theta) * rx;
    const y = Math.sin(theta) * ry + 6;
    // Slight downward plush drape rather than harsh radial spikes
    const radial = Math.atan2(y - 4, x);
    const drape = Math.sin(theta) > -0.6 ? Math.PI / 2 : radial;
    const outAngle = radial * 0.68 + drape * 0.32 + (rand() - 0.5) * 0.24;
    const toneRand = rand();
    const bucket: FurBucketKey =
      toneRand < 0.24 ? 'shadow' : toneRand < 0.62 ? 'base' : toneRand < 0.86 ? 'mid' : 'light';
    pushStrand({
      x,
      y,
      angle: outAngle,
      length: 14 + rand() * 12,
      curve: (rand() - 0.5) * 10,
      bucket,
      sparkle: rand() < 0.1,
      phase: rand() * Math.PI * 2,
    });
  }

  // 3. Dense Multi-Layer Body & Soft Belly Plush Coat
  for (let i = 0; i < 480; i++) {
    const r = Math.sqrt(rand());
    const theta = rand() * Math.PI * 2;
    const pearBias =
      Math.sin(theta) > 0 ? 1 + Math.sin(theta) * 0.13 : 1 - Math.abs(Math.sin(theta)) * 0.06;
    const x = Math.cos(theta) * r * 87 * pearBias;
    const y = Math.sin(theta) * r * 101 + 6;

    // Leave interior of molded plastic faceplate clear while overlapping edges warmly
    const fpDx = x / 51;
    const fpDy = (y + 21) / 37;
    if (fpDx * fpDx + fpDy * fpDy < 0.78) continue;

    const isBelly = y > 24 && Math.abs(x) < 56 && y < 96;
    const radial = Math.atan2(y + 18, x);
    const angle = radial * 0.52 + (Math.PI / 2) * 0.48 + (rand() - 0.5) * 0.38;
    const toneRand = rand();
    const bucket: FurBucketKey = isBelly
      ? toneRand < 0.22
        ? 'base'
        : toneRand < 0.78
          ? 'belly'
          : 'light'
      : toneRand < 0.2
        ? 'shadow'
        : toneRand < 0.55
          ? 'base'
          : toneRand < 0.84
            ? 'mid'
            : 'light';

    pushStrand({
      x,
      y,
      angle,
      length: 14 + rand() * 14,
      curve: (rand() - 0.5) * 9,
      bucket,
      sparkle: rand() < 0.09,
      phase: rand() * Math.PI * 2,
    });
  }

  // 4. Cheek & Brow Faceplate Rim Fur Tufts (snuggly frame the 1999 molded faceplate)
  for (let i = 0; i < 64; i++) {
    const theta = (i / 64) * Math.PI * 2;
    const x = Math.cos(theta) * 54;
    const y = Math.sin(theta) * 39 - 21;
    const angle = theta + (rand() - 0.5) * 0.3;
    pushStrand({
      x,
      y,
      angle,
      length: 10 + rand() * 8,
      curve: (rand() - 0.5) * 6,
      bucket: rand() < 0.55 ? 'mid' : 'light',
      sparkle: rand() < 0.14,
      phase: rand() * Math.PI * 2,
    });
  }

  return buckets;
}

const FUR_BUCKETS = buildFurCoatBuckets();

// Offscreen cache for the walnut tabletop background so we never resample the high-res wood texture 60x/s
let cachedBackdropCanvas: HTMLCanvasElement | null = null;
let cachedBackdropKey = '';

export interface FurbyStageMetrics {
  cx: number;
  cy: number;
  scale: number;
  boxX: number;
  boxY: number;
  boxScale: number;
}

export function getFurbyStageMetrics(
  sim: FurbySimState,
  width: number,
  height: number
): FurbyStageMetrics {
  const baseScale = Math.min(width / 1120, height / 700, 1.25);
  const scale = Math.max(0.68, baseScale * 1.05);

  // Box sits center when boxed/opening, then parks neatly to the left as a vintage tabletop prop!
  const boxCenterX = width * 0.5;
  const boxParkedX = Math.max(150 * scale, width * 0.2);
  const boxSlide =
    sim.phase === 'on_table'
      ? 1
      : sim.phase === 'lifting'
        ? Math.min(1, sim.unboxLiftProgress * 0.75)
        : 0;
  const boxX = boxCenterX + (boxParkedX - boxCenterX) * boxSlide;
  const boxY = height * 0.58;
  const boxScale = scale * (1 - boxSlide * 0.16);

  // Furby position
  const cx = sim.phase === 'boxed' || sim.phase === 'opening' || sim.phase === 'ready_to_lift'
    ? boxCenterX
    : width * sim.posX;
  const cy = (sim.phase === 'boxed' || sim.phase === 'opening' || sim.phase === 'ready_to_lift'
    ? boxY + 12 * scale
    : height * sim.posY) - sim.liftHeight * scale;

  return { cx, cy, scale, boxX, boxY, boxScale };
}

export type FurbyHitZone = 'head' | 'belly' | 'beak' | 'ear_left' | 'ear_right' | 'box' | null;

export function hitTestFurbyZone(
  sim: FurbySimState,
  canvasX: number,
  canvasY: number,
  width: number,
  height: number
): { zone: FurbyHitZone; localNormX: number; localNormY: number } {
  const m = getFurbyStageMetrics(sim, width, height);
  const lx = (canvasX - m.cx) / m.scale;
  const ly = (canvasY - m.cy) / m.scale;

  // Check beak first
  if (lx * lx / (26 * 26) + (ly - 8) * (ly - 8) / (24 * 24) <= 1) {
    return { zone: 'beak', localNormX: lx / 100, localNormY: ly / 100 };
  }
  // Check ears
  if (lx < -72 && lx > -168 && ly < 10 && ly > -115) {
    return { zone: 'ear_left', localNormX: lx / 100, localNormY: ly / 100 };
  }
  if (lx > 72 && lx < 168 && ly < 10 && ly > -115) {
    return { zone: 'ear_right', localNormX: lx / 100, localNormY: ly / 100 };
  }
  // Check body oval
  if ((lx * lx) / (104 * 104) + ((ly - 2) * (ly - 2)) / (118 * 118) <= 1) {
    const zone: FurbyHitZone = ly > 24 ? 'belly' : 'head';
    return { zone, localNormX: lx / 100, localNormY: ly / 100 };
  }
  // Check collector box
  const bx = (canvasX - m.boxX) / m.boxScale;
  const by = (canvasY - m.boxY) / m.boxScale;
  if (Math.abs(bx) < 155 && by > -205 && by < 175) {
    return { zone: 'box', localNormX: lx / 100, localNormY: ly / 100 };
  }

  return { zone: null, localNormX: lx / 100, localNormY: ly / 100 };
}

function drawRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/** Back half of the 1999 Vintage Faceted Furby Collector Window Box */
function drawCollectorBoxBack(
  ctx: CanvasRenderingContext2D,
  coat: FurbyCoatSpec,
  openProgress: number,
  x: number,
  y: number,
  scale: number
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // Tabletop ground cast shadow under box
  ctx.save();
  ctx.fillStyle = 'rgba(8, 4, 2, 0.56)';
  ctx.beginPath();
  ctx.ellipse(0, 156, 162, 28, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Rear top cardboard flap opening upward
  const flapAngle = openProgress * 1.15;
  ctx.save();
  ctx.translate(0, -172);
  ctx.scale(1, Math.cos(flapAngle * 0.45));
  const flapH = 44 + openProgress * 46;
  ctx.fillStyle = coat.boxAccent;
  ctx.strokeStyle = 'rgba(255, 240, 200, 0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-118, 0);
  ctx.lineTo(-96, -flapH);
  ctx.lineTo(96, -flapH);
  ctx.lineTo(118, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Vintage wavy accent stripe inside lid
  ctx.fillStyle = coat.boxSecondary;
  ctx.globalAlpha = 0.55;
  ctx.fillRect(-88, -flapH * 0.58, 176, 10);
  ctx.restore();

  // Box interior back wall (vintage pastel starburst cardboard liner)
  const backGrad = ctx.createLinearGradient(-120, -170, 120, 145);
  backGrad.addColorStop(0, '#133C42');
  backGrad.addColorStop(0.5, '#1D545C');
  backGrad.addColorStop(1, '#102F35');
  ctx.fillStyle = backGrad;
  ctx.beginPath();
  ctx.moveTo(-124, -170);
  ctx.lineTo(124, -170);
  ctx.lineTo(138, 138);
  ctx.lineTo(-138, 138);
  ctx.closePath();
  ctx.fill();

  // Subtle retro 90s concentric arcs on interior liner
  ctx.save();
  ctx.strokeStyle = coat.boxSecondary;
  ctx.globalAlpha = 0.16;
  ctx.lineWidth = 3;
  for (let r = 42; r <= 128; r += 26) {
    ctx.beginPath();
    ctx.arc(0, -18, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

  // Left & Right Angled Faceted Cardboard Side Walls
  ctx.fillStyle = coat.boxAccent;
  // Left facet
  ctx.beginPath();
  ctx.moveTo(-152, -150);
  ctx.lineTo(-124, -170);
  ctx.lineTo(-138, 138);
  ctx.lineTo(-156, 118);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Right facet
  ctx.beginPath();
  ctx.moveTo(152, -150);
  ctx.lineTo(124, -170);
  ctx.lineTo(138, 138);
  ctx.lineTo(156, 118);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Interior floor cardboard shelf where Furby sits
  const floorGrad = ctx.createLinearGradient(0, 92, 0, 144);
  floorGrad.addColorStop(0, '#0F3036');
  floorGrad.addColorStop(1, coat.boxAccent);
  ctx.fillStyle = floorGrad;
  ctx.beginPath();
  ctx.moveTo(-142, 108);
  ctx.lineTo(142, 108);
  ctx.lineTo(156, 148);
  ctx.lineTo(-156, 148);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/** Front glossy acetate window, retro script collar, sticker badge & hinged side flaps */
function drawCollectorBoxFront(
  ctx: CanvasRenderingContext2D,
  coat: FurbyCoatSpec,
  openProgress: number,
  x: number,
  y: number,
  scale: number
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // Glossy clear front plastic acetate window (fades/slides cleanly as box opens)
  const windowAlpha = Math.max(0.18, 1 - openProgress * 0.72);
  ctx.save();
  ctx.translate(0, -openProgress * 22);
  ctx.globalAlpha = windowAlpha;

  const glassGrad = ctx.createLinearGradient(-136, -155, 136, 118);
  glassGrad.addColorStop(0, 'rgba(255, 255, 255, 0.24)');
  glassGrad.addColorStop(0.28, 'rgba(255, 255, 255, 0.04)');
  glassGrad.addColorStop(0.55, 'rgba(255, 255, 255, 0.16)');
  glassGrad.addColorStop(0.85, 'rgba(255, 255, 255, 0.03)');
  glassGrad.addColorStop(1, 'rgba(255, 255, 255, 0.18)');
  ctx.fillStyle = glassGrad;
  ctx.beginPath();
  ctx.moveTo(-136, -138);
  ctx.lineTo(136, -138);
  ctx.lineTo(142, 108);
  ctx.lineTo(-142, 108);
  ctx.closePath();
  ctx.fill();

  // Crisp diagonal acetate glare strips (signature sealed toy window look!)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
  ctx.beginPath();
  ctx.moveTo(-112, -136);
  ctx.lineTo(-78, -136);
  ctx.lineTo(-126, 98);
  ctx.lineTo(-140, 98);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
  ctx.beginPath();
  ctx.moveTo(64, -136);
  ctx.lineTo(82, -136);
  ctx.lineTo(28, 98);
  ctx.lineTo(14, 98);
  ctx.closePath();
  ctx.fill();

  // Plastic window edge creases
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.36)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(-134, -136, 268, 240);
  ctx.restore();

  // Iconic Bottom Vintage Cardboard Collar
  const baseGrad = ctx.createLinearGradient(-152, 92, 152, 158);
  baseGrad.addColorStop(0, coat.boxAccent);
  baseGrad.addColorStop(0.5, '#247A78');
  baseGrad.addColorStop(1, '#154B4C');
  ctx.fillStyle = baseGrad;
  ctx.beginPath();
  ctx.moveTo(-156, 114);
  ctx.lineTo(-136, 98);
  ctx.lineTo(136, 98);
  ctx.lineTo(156, 114);
  ctx.lineTo(146, 160);
  ctx.lineTo(-146, 160);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 232, 175, 0.48)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Nostalgic Script Box Logo ("Furby Babies")
  ctx.save();
  ctx.font = '700 28px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 5;
  ctx.strokeStyle = '#18363C';
  ctx.strokeText('Furby', 8, 127);
  ctx.fillStyle = '#FCD34D';
  ctx.fillText('Furby', 8, 127);

  ctx.font = '700 13px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = coat.boxSecondary;
  ctx.fillText('1999 COLLECTOR EDITION', 8, 148);
  ctx.restore();

  // Classic Yellow Oval Sticker on Lower-Left Acetate Corner (from reference image!)
  ctx.save();
  ctx.translate(-92, 84);
  ctx.rotate(-0.14);
  ctx.fillStyle = '#FACC15';
  ctx.strokeStyle = '#B45309';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.ellipse(0, 0, 38, 25, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#7C2D12';
  ctx.font = '800 9.5px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('UNBOX ME', 0, -4);
  ctx.font = '700 8px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('& PLAY!', 0, 9);
  ctx.restore();

  // Top Cardboard Rim & Folding Header Canopy (swings open upward!)
  ctx.save();
  ctx.translate(0, -142);
  const lidScaleY = Math.max(0.18, 1 - openProgress * 0.85);
  ctx.translate(0, -openProgress * 30);
  ctx.scale(1, lidScaleY);

  const topGrad = ctx.createLinearGradient(-150, -34, 150, 14);
  topGrad.addColorStop(0, '#185355');
  topGrad.addColorStop(0.5, coat.boxAccent);
  topGrad.addColorStop(1, '#133F42');
  ctx.fillStyle = topGrad;
  ctx.beginPath();
  ctx.moveTo(-152, -8);
  ctx.lineTo(-132, -32);
  ctx.lineTo(132, -32);
  ctx.lineTo(152, -8);
  ctx.lineTo(138, 14);
  ctx.lineTo(-138, 14);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 232, 175, 0.52)';
  ctx.lineWidth = 1.8;
  ctx.stroke();

  if (openProgress < 0.7) {
    ctx.globalAlpha = 1 - openProgress * 1.35;
    ctx.fillStyle = '#FEF3C7';
    ctx.font = '700 10.5px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('The more you play with me, the more I do!', 0, -6);
  }
  ctx.restore();

  ctx.restore();
}

/** Draw one sculpted floppy plush Furby ear with velvet inner auricle & fuzzy rim */
function drawFurbyEar(
  ctx: CanvasRenderingContext2D,
  coat: FurbyCoatSpec,
  side: -1 | 1,
  angle: number
): void {
  ctx.save();
  ctx.translate(side * 72, -52);
  ctx.rotate(angle);
  ctx.scale(side, 1);

  // Outer plush fur backing
  const outerGrad = ctx.createLinearGradient(0, -20, 88, 16);
  outerGrad.addColorStop(0, coat.furMid);
  outerGrad.addColorStop(0.6, coat.furBase);
  outerGrad.addColorStop(1, coat.furShadow);
  ctx.fillStyle = outerGrad;
  ctx.strokeStyle = coat.furShadow;
  ctx.lineWidth = 2.5;

  ctx.beginPath();
  ctx.moveTo(-8, -14);
  ctx.bezierCurveTo(28, -56, 84, -46, 96, -12);
  ctx.bezierCurveTo(100, 14, 60, 42, 12, 34);
  ctx.bezierCurveTo(-4, 30, -12, 12, -8, -14);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Velvety inner ear scoop
  const innerGrad = ctx.createLinearGradient(8, -12, 82, 14);
  innerGrad.addColorStop(0, '#8A3B5E');
  innerGrad.addColorStop(0.35, coat.earInner);
  innerGrad.addColorStop(1, coat.furMid);
  ctx.fillStyle = innerGrad;
  ctx.beginPath();
  ctx.moveTo(6, -4);
  ctx.bezierCurveTo(32, -34, 72, -28, 80, -6);
  ctx.bezierCurveTo(82, 12, 48, 28, 14, 22);
  ctx.closePath();
  ctx.fill();

  // Subtle horizontal ear-fold ridges (iconic 1999 rubber/plush ear detail)
  ctx.strokeStyle = 'rgba(255, 240, 248, 0.28)';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(18, 2);
  ctx.quadraticCurveTo(44, -6, 66, -2);
  ctx.moveTo(20, 12);
  ctx.quadraticCurveTo(42, 6, 60, 8);
  ctx.stroke();

  // Soft fur edge tufts along top ear ridge
  ctx.strokeStyle = coat.furLight;
  ctx.lineWidth = 2.2;
  for (let i = 0; i < 9; i++) {
    const t = i / 8;
    const ex = 6 + t * 76;
    const ey = -18 - Math.sin(t * Math.PI) * 24 + t * 4;
    ctx.beginPath();
    ctx.moveTo(ex, ey);
    ctx.lineTo(ex + 6, ey - 9);
    ctx.stroke();
  }

  ctx.restore();
}

/** Draw plump 3-toed 1999 Furby plush foot */
function drawFurbyFoot(
  ctx: CanvasRenderingContext2D,
  coat: FurbyCoatSpec,
  x: number,
  y: number,
  side: -1 | 1,
  lift: number
): void {
  ctx.save();
  ctx.translate(x, y - lift);
  ctx.rotate(side * (0.1 + lift * 0.015));

  const grad = ctx.createRadialGradient(-4, -6, 4, 0, 2, 30);
  grad.addColorStop(0, coat.furLight);
  grad.addColorStop(0.55, coat.feet);
  grad.addColorStop(1, coat.furShadow);
  ctx.fillStyle = grad;
  ctx.strokeStyle = coat.furShadow;
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.ellipse(0, 0, 28, 19, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Sculpted 3-toe stitch indents
  ctx.strokeStyle = 'rgba(70, 35, 50, 0.45)';
  ctx.lineWidth = 2.2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-9, 6);
  ctx.lineTo(-10, 17);
  ctx.moveTo(9, 6);
  ctx.lineTo(10, 17);
  ctx.stroke();

  ctx.restore();
}

/** Draw ultra-detailed 1999 acrylic Furby doll eye with radial iris, caustics & mechanical eyelid */
function drawFurbyEye(
  ctx: CanvasRenderingContext2D,
  coat: FurbyCoatSpec,
  cx: number,
  cy: number,
  radius: number,
  sim: FurbySimState,
  side: -1 | 1
): void {
  ctx.save();
  ctx.translate(cx, cy);

  // Outer recessed faceplate eye-socket rim
  ctx.fillStyle = '#3B2F2A';
  ctx.beginPath();
  ctx.arc(0, 0, radius + 2.4, 0, Math.PI * 2);
  ctx.fill();

  // Clip eyeball interior
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.clip();

  // Glossy curved white sclera with subtle top shadow
  const scleraGrad = ctx.createRadialGradient(-3, -4, 3, 0, 0, radius);
  scleraGrad.addColorStop(0, '#FFFFFF');
  scleraGrad.addColorStop(0.75, '#F4F1EC');
  scleraGrad.addColorStop(1, '#CFC6BC');
  ctx.fillStyle = scleraGrad;
  ctx.fillRect(-radius, -radius, radius * 2, radius * 2);

  // Move iris/pupil smoothly by cursor gaze
  const gx = sim.gazeX * radius * 0.34;
  const gy = sim.gazeY * radius * 0.28;
  const irisR = radius * 0.62;

  ctx.save();
  ctx.translate(gx, gy);

  // Deep radial acrylic iris
  const irisGrad = ctx.createRadialGradient(0, 0, irisR * 0.22, 0, 0, irisR);
  irisGrad.addColorStop(0, coat.irisInner);
  irisGrad.addColorStop(0.68, coat.irisOuter);
  irisGrad.addColorStop(1, '#0A1E15');
  ctx.fillStyle = irisGrad;
  ctx.beginPath();
  ctx.arc(0, 0, irisR, 0, Math.PI * 2);
  ctx.fill();

  // Fibrous radial iris spokes (gives real 1999 toy acrylic eye sparkle!)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * irisR * 0.42, Math.sin(a) * irisR * 0.42);
    ctx.lineTo(Math.cos(a) * irisR * 0.9, Math.sin(a) * irisR * 0.9);
    ctx.stroke();
  }

  // Lower caustic bright crescent inside acrylic eye
  ctx.fillStyle = 'rgba(255, 255, 255, 0.26)';
  ctx.beginPath();
  ctx.arc(0, irisR * 0.28, irisR * 0.56, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.fill();

  // Dilating jet-black pupil
  const pupilR = irisR * 0.47 * sim.pupilScale;
  ctx.fillStyle = '#09090B';
  ctx.beginPath();
  ctx.arc(0, 0, pupilR, 0, Math.PI * 2);
  ctx.fill();

  // Crisp twin window-light specular catchlights (makes eyes feel alive!)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.beginPath();
  ctx.ellipse(-irisR * 0.34, -irisR * 0.36, irisR * 0.22, irisR * 0.16, -0.45, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
  ctx.beginPath();
  ctx.arc(irisR * 0.28, irisR * 0.26, irisR * 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Subtle upper socket ambient shadow
  const sockShadow = ctx.createLinearGradient(0, -radius, 0, -radius * 0.25);
  sockShadow.addColorStop(0, 'rgba(30, 18, 22, 0.32)');
  sockShadow.addColorStop(1, 'rgba(30, 18, 22, 0)');
  ctx.fillStyle = sockShadow;
  ctx.fillRect(-radius, -radius, radius * 2, radius);

  // Articulated Pearlescent Plastic Mechanical Eyelid!
  // eyelidOpen: 1.0 = open high, 0.0 = tightly closed all the way down
  const closedFrac = Math.max(0, Math.min(1, 1 - sim.eyelidOpen * 0.94));
  const lidY = -radius + closedFrac * radius * 2.08;

  if (lidY > -radius + 1) {
    const lidGrad = ctx.createLinearGradient(0, -radius, 0, lidY);
    lidGrad.addColorStop(0, coat.eyelidHighlight);
    lidGrad.addColorStop(0.55, coat.eyelid);
    lidGrad.addColorStop(1, coat.furShadow);
    ctx.fillStyle = lidGrad;

    ctx.beginPath();
    ctx.moveTo(-radius - 2, -radius - 2);
    ctx.lineTo(radius + 2, -radius - 2);
    ctx.lineTo(radius + 2, lidY);
    // Slight curved lid contour
    ctx.quadraticCurveTo(0, lidY + 5 * (1 - closedFrac * 0.4), -radius - 2, lidY);
    ctx.closePath();
    ctx.fill();

    // Glossy pearlescent lid sheen
    ctx.fillStyle = 'rgba(255, 255, 255, 0.32)';
    ctx.beginPath();
    ctx.ellipse(0, lidY - 9, radius * 0.65, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Dark curved mechanical lash line + fanned eyelashes
    ctx.strokeStyle = '#1E1519';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(-radius, lidY);
    ctx.quadraticCurveTo(0, lidY + 5 * (1 - closedFrac * 0.4), radius, lidY);
    ctx.stroke();

    // Iconic 1999 Furby curved eyelashes
    ctx.lineWidth = 1.65;
    ctx.lineCap = 'round';
    const lashCount = 7;
    for (let i = 0; i < lashCount; i++) {
      const t = (i / (lashCount - 1)) * 2 - 1; // -1..1
      const lx = t * radius * 0.82;
      const ly = lidY + (1 - t * t) * 3.5;
      const lashDir = closedFrac > 0.72 ? 1 : -1;
      const spread = t * 0.55 + side * 0.12;
      ctx.beginPath();
      ctx.moveTo(lx, ly);
      ctx.lineTo(lx + Math.sin(spread) * 7.5, ly + lashDir * (5.5 + (1 - Math.abs(t)) * 2.5));
      ctx.stroke();
    }
  }

  ctx.restore(); // end clip

  // Soft outer rim shine
  ctx.strokeStyle = 'rgba(255, 248, 240, 0.45)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(0, 0, radius + 1.2, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();

  ctx.restore();
}

/** Draw articulated 2-piece 1999 yellow plastic beak + crimson mouth + bobbing pink tongue */
function drawFurbyBeak(
  ctx: CanvasRenderingContext2D,
  coat: FurbyCoatSpec,
  sim: FurbySimState
): void {
  const upperLift = sim.beakUpperOpen * 10;
  const lowerDrop = sim.beakLowerOpen * 17;
  const mouthOpen = sim.beakUpperOpen + sim.beakLowerOpen;

  ctx.save();
  ctx.translate(0, 5);

  // Subtle shadow under beak on faceplate
  ctx.fillStyle = 'rgba(65, 38, 24, 0.28)';
  ctx.beginPath();
  ctx.ellipse(0, 14 + lowerDrop * 0.65, 22, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  // Inner mouth cavity + bobbing pink tongue (visible whenever mouth opens!)
  if (mouthOpen > 0.04) {
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(0, 3 + lowerDrop * 0.35 - upperLift * 0.2, 16, 6 + mouthOpen * 11, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#52111E';
    ctx.fill();
    ctx.clip();

    // Cute rounded bobbing pink tongue inside beak
    const tongueY = 9 + lowerDrop * 0.45 - sim.tongueOut * 7;
    const tongueGrad = ctx.createRadialGradient(0, tongueY - 2, 2, 0, tongueY, 13);
    tongueGrad.addColorStop(0, '#FB7185');
    tongueGrad.addColorStop(1, '#BE123C');
    ctx.fillStyle = tongueGrad;
    ctx.beginPath();
    ctx.ellipse(0, tongueY, 12.5, 8.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Center tongue crease
    ctx.strokeStyle = 'rgba(136, 19, 55, 0.45)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(0, tongueY - 4);
    ctx.lineTo(0, tongueY + 5);
    ctx.stroke();
    ctx.restore();
  }

  // Lower yellow molded beak mandible
  ctx.save();
  ctx.translate(0, lowerDrop);
  const lowGrad = ctx.createLinearGradient(0, -2, 0, 18);
  lowGrad.addColorStop(0, coat.beakTop);
  lowGrad.addColorStop(1, coat.beakBottom);
  ctx.fillStyle = lowGrad;
  ctx.strokeStyle = '#92400E';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(-19, 1);
  ctx.quadraticCurveTo(0, 4, 19, 1);
  ctx.bezierCurveTo(18, 14, 9, 18, 0, 18);
  ctx.bezierCurveTo(-9, 18, -18, 14, -19, 1);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Upper yellow molded beak mandible
  ctx.save();
  ctx.translate(0, -upperLift);
  const topGrad = ctx.createRadialGradient(-4, -8, 2, 0, -2, 24);
  topGrad.addColorStop(0, '#FEF08A');
  topGrad.addColorStop(0.55, coat.beakTop);
  topGrad.addColorStop(1, coat.beakBottom);
  ctx.fillStyle = topGrad;
  ctx.strokeStyle = '#92400E';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(-21, 2);
  ctx.bezierCurveTo(-20, -13, -8, -18, 0, -18);
  ctx.bezierCurveTo(8, -18, 20, -13, 21, 2);
  ctx.quadraticCurveTo(0, 9, -21, 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Glossy plastic specular arc on upper beak
  ctx.fillStyle = 'rgba(255, 255, 255, 0.58)';
  ctx.beginPath();
  ctx.ellipse(-5, -9, 7.5, 3.2, -0.25, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

/** Draw the full articulated 2D Furby plush character */
export function drawFurbyCharacter(
  ctx: CanvasRenderingContext2D,
  sim: FurbySimState,
  cx: number,
  cy: number,
  scale: number
): void {
  const coat = FURBY_COATS[sim.coatId];

  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);

  // Soft tabletop contact shadow (shrinks & blurs gently when lifted off the wood!)
  if (sim.phase === 'on_table' || sim.phase === 'lifting') {
    const liftFactor = Math.max(0.45, 1 - sim.liftHeight / 210);
    ctx.save();
    ctx.translate(0, 118 + sim.liftHeight);
    ctx.fillStyle = `rgba(10, 5, 2, ${0.48 * liftFactor})`;
    ctx.beginPath();
    ctx.ellipse(0, 0, 94 * liftFactor, 22 * liftFactor, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Apply living servo-plush body bob, tilt, and squash-and-stretch
  ctx.translate(0, sim.bodyBobY);
  ctx.rotate(sim.bodyTilt);
  ctx.scale(sim.squashX, sim.squashY);

  // 1. Plump 3-Toed Plush Feet at bottom
  drawFurbyFoot(ctx, coat, -44, 102, -1, sim.footLeftLift);
  drawFurbyFoot(ctx, coat, 44, 102, 1, sim.footRightLift);

  // 2. Expressive Articulated Floppy Ears behind head rim
  drawFurbyEar(ctx, coat, -1, sim.earLeftAngle);
  drawFurbyEar(ctx, coat, 1, sim.earRightAngle);

  // 3. Soft Core Plush Body Base (underneath fur strands so zero gaps ever show)
  const bodyGrad = ctx.createRadialGradient(-22, -38, 16, 0, 12, 128);
  bodyGrad.addColorStop(0, coat.furLight);
  bodyGrad.addColorStop(0.5, coat.furBase);
  bodyGrad.addColorStop(1, coat.furShadow);
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.moveTo(0, -100);
  ctx.bezierCurveTo(66, -100, 98, -42, 104, 24);
  ctx.bezierCurveTo(108, 86, 62, 114, 0, 114);
  ctx.bezierCurveTo(-62, 114, -108, 86, -104, 24);
  ctx.bezierCurveTo(-98, -42, -66, -100, 0, -100);
  ctx.closePath();
  ctx.fill();

  // Soft lighter belly plush patch underlayer
  const bellyGrad = ctx.createRadialGradient(0, 56, 8, 0, 62, 62);
  bellyGrad.addColorStop(0, coat.bellyFur);
  bellyGrad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = bellyGrad;
  ctx.beginPath();
  ctx.ellipse(0, 60, 58, 46, 0, 0, Math.PI * 2);
  ctx.fill();

  // Soft puffy plush crown underlayer (so crown tuft looks like soft cotton-candy fur)
  const crestGrad = ctx.createRadialGradient(0, -112, 8, 0, -104, 48);
  crestGrad.addColorStop(0, coat.crestTip);
  crestGrad.addColorStop(0.65, coat.furMid);
  crestGrad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = crestGrad;
  ctx.beginPath();
  ctx.ellipse(0, -106, 44, 28, 0, 0, Math.PI * 2);
  ctx.fill();

  // 4. Batched Multi-Layer Plush Fur Strands (6 draw calls total + 1 sparkle tinsel pass!)
  const brush = sim.furBrush;
  const hasBrush = brush.strength > 0.01;
  const brushPxX = brush.x * 100;
  const brushPxY = brush.y * 100;
  const swayBase = Math.sin(sim.breathPhase) * 0.045 - sim.bodyTiltVel * 0.06;

  const bucketColors: Record<FurBucketKey, string> = {
    shadow: coat.furShadow,
    base: coat.furBase,
    mid: coat.furMid,
    belly: coat.bellyFur,
    light: coat.furLight,
    crestTip: coat.crestTip,
  };
  const bucketWidths: Record<FurBucketKey, number> = {
    shadow: 3.6,
    base: 3.1,
    mid: 2.6,
    belly: 2.7,
    light: 2.0,
    crestTip: 1.8,
  };
  const bucketAlphas: Record<FurBucketKey, number> = {
    shadow: 0.92,
    base: 0.9,
    mid: 0.84,
    belly: 0.82,
    light: 0.72,
    crestTip: 0.75,
  };

  ctx.lineCap = 'round';
  const sparkleSegments: Array<[number, number, number, number]> = [];

  for (let b = 0; b < FUR_BUCKET_ORDER.length; b++) {
    const key = FUR_BUCKET_ORDER[b];
    const list = FUR_BUCKETS[key];
    ctx.strokeStyle = bucketColors[key];
    ctx.lineWidth = bucketWidths[key];
    ctx.globalAlpha = bucketAlphas[key];
    ctx.beginPath();

    for (let i = 0; i < list.length; i++) {
      const s = list[i];
      let dxPush = 0;
      let dyPush = 0;
      if (hasBrush) {
        const ddx = s.x - brushPxX;
        const ddy = s.y - brushPxY;
        const distSq = ddx * ddx + ddy * ddy;
        if (distSq < 4900) {
          const falloff = (1 - Math.sqrt(distSq) / 70) * brush.strength;
          dxPush = brush.vx * 14 * falloff + (ddx / 70) * 6 * falloff;
          dyPush = brush.vy * 14 * falloff + (ddy / 70) * 6 * falloff;
        }
      }

      const localSway = swayBase + Math.sin(sim.time * 2.4 + s.phase) * 0.032;
      const ang = s.angle + localSway;
      const cosA = Math.cos(ang);
      const sinA = Math.sin(ang);
      const tipX = s.x + cosA * s.length + dxPush;
      const tipY = s.y + sinA * s.length + dyPush;
      const midX = (s.x + tipX) * 0.5 - sinA * s.curve * 0.35;
      const midY = (s.y + tipY) * 0.5 + cosA * s.curve * 0.35;

      ctx.moveTo(s.x, s.y);
      ctx.quadraticCurveTo(midX, midY, tipX, tipY);

      if (coat.hasSparkles && s.sparkle) {
        const wave = Math.sin(sim.time * 3.1 + s.phase);
        if (wave > 0.35) {
          sparkleSegments.push([s.x, s.y, tipX, tipY]);
        }
      }
    }

    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Soft 3D velvety plush volume shading over fur (gives authentic round stuffed-toy softness)
  const volumeGrad = ctx.createRadialGradient(-24, -36, 22, 0, 14, 122);
  volumeGrad.addColorStop(0, 'rgba(255, 255, 255, 0.14)');
  volumeGrad.addColorStop(0.62, 'rgba(255, 255, 255, 0)');
  volumeGrad.addColorStop(1, 'rgba(28, 12, 20, 0.24)');
  ctx.fillStyle = volumeGrad;
  ctx.beginPath();
  ctx.ellipse(0, 8, 102, 114, 0, 0, Math.PI * 2);
  ctx.fill();

  // Batched Iridescent Crystal Sparkle Tinsel Fibers (1 single stroke call!)
  if (sparkleSegments.length > 0) {
    ctx.strokeStyle = 'rgba(255, 250, 255, 0.68)';
    ctx.lineWidth = 1.15;
    ctx.beginPath();
    for (let i = 0; i < sparkleSegments.length; i++) {
      const seg = sparkleSegments[i];
      ctx.moveTo(seg[0], seg[1]);
      ctx.lineTo(seg[2], seg[3]);
    }
    ctx.stroke();
  }

  // 5. Iconic 1999 Molded Plastic Faceplate Mask
  const faceGrad = ctx.createRadialGradient(0, -30, 8, 0, -18, 60);
  faceGrad.addColorStop(0, coat.faceplate);
  faceGrad.addColorStop(0.78, coat.faceplate);
  faceGrad.addColorStop(1, coat.faceplateShade);
  ctx.fillStyle = faceGrad;
  ctx.strokeStyle = 'rgba(90, 62, 54, 0.35)';
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.moveTo(0, -60);
  ctx.bezierCurveTo(38, -60, 56, -42, 54, -18);
  ctx.bezierCurveTo(52, 8, 28, 22, 0, 22);
  ctx.bezierCurveTo(-28, 22, -52, 8, -54, -18);
  ctx.bezierCurveTo(-56, -42, -38, -60, 0, -60);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Soft rosy cheek blush when happy/petted/tickled
  if (sim.blushAlpha > 0.05) {
    ctx.fillStyle = `rgba(244, 114, 182, ${sim.blushAlpha * 0.34})`;
    ctx.beginPath();
    ctx.ellipse(-34, -4, 14, 8, 0.15, 0, Math.PI * 2);
    ctx.ellipse(34, -4, 14, 8, -0.15, 0, Math.PI * 2);
    ctx.fill();
  }

  // Iconic Forehead Ruby-Black IR Sensor Dome (between the eyes!)
  ctx.save();
  const sensorGrad = ctx.createRadialGradient(-2, -50, 1, 0, -48, 8);
  sensorGrad.addColorStop(0, '#581C2F');
  sensorGrad.addColorStop(0.55, '#1A0B10');
  sensorGrad.addColorStop(1, '#090507');
  ctx.fillStyle = sensorGrad;
  ctx.beginPath();
  ctx.ellipse(0, -48, 8.5, 6.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.beginPath();
  ctx.ellipse(-2.5, -50, 2.5, 1.3, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 6. Expressive Articulated Acrylic Eyes & Mechanical Eyelids
  drawFurbyEye(ctx, coat, -23, -24, 20.5, sim, -1);
  drawFurbyEye(ctx, coat, 23, -24, 20.5, sim, 1);

  // 7. Articulated 2-Piece Yellow Plastic Beak & Pink Tongue
  drawFurbyBeak(ctx, coat, sim);

  // 8. Floating Silent Visual Cues (hearts, sparkles, crumbs, sleep zZz)
  for (const cue of sim.cues) {
    const progress = cue.life / cue.maxLife;
    const alpha = Math.sin(progress * Math.PI);
    ctx.save();
    ctx.translate(cue.x, cue.y);
    ctx.globalAlpha = alpha;
    if (cue.kind === 'heart') {
      ctx.fillStyle = '#FB7185';
      ctx.beginPath();
      ctx.moveTo(0, 6);
      ctx.bezierCurveTo(-10, -2, -10, -10, -4, -10);
      ctx.bezierCurveTo(-1, -10, 0, -7, 0, -5);
      ctx.bezierCurveTo(0, -7, 1, -10, 4, -10);
      ctx.bezierCurveTo(10, -10, 10, -2, 0, 6);
      ctx.fill();
    } else if (cue.kind === 'sparkle') {
      ctx.fillStyle = '#FDE047';
      ctx.beginPath();
      ctx.moveTo(0, -9);
      ctx.lineTo(2.5, -2.5);
      ctx.lineTo(9, 0);
      ctx.lineTo(2.5, 2.5);
      ctx.lineTo(0, 9);
      ctx.lineTo(-2.5, 2.5);
      ctx.lineTo(-9, 0);
      ctx.lineTo(-2.5, -2.5);
      ctx.closePath();
      ctx.fill();
    } else if (cue.kind === 'zzz') {
      ctx.fillStyle = '#FDE68A';
      ctx.font = '700 16px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('z', 0, 0);
    } else {
      ctx.fillStyle = '#FCD34D';
      ctx.beginPath();
      ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // 9. Silent Furbish Speech Bubble (zero sound — expressive visual chatter!)
  if (sim.speechText && sim.speechTimer > 0) {
    const fade = Math.min(1, sim.speechTimer * 2.5);
    ctx.save();
    ctx.rotate(-sim.bodyTilt * 0.7);
    ctx.translate(0, -152);
    ctx.globalAlpha = fade;

    ctx.font = '700 14px "Plus Jakarta Sans", sans-serif';
    const textW = ctx.measureText(sim.speechText).width;
    const pillW = Math.max(106, textW + 28);
    const pillH = 32;

    drawRoundedRectPath(ctx, -pillW / 2, -pillH / 2, pillW, pillH, 10);
    ctx.fillStyle = 'rgba(253, 248, 238, 0.96)';
    ctx.fill();
    ctx.strokeStyle = '#C49E54';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Little pointer triangle down toward Furby
    ctx.beginPath();
    ctx.moveTo(-7, pillH / 2 - 1);
    ctx.lineTo(7, pillH / 2 - 1);
    ctx.lineTo(0, pillH / 2 + 8);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#2B1B12';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(sim.speechText, 0, 1);
    ctx.restore();
  }

  ctx.restore();
}

/** Render the complete Furby Tabletop Scene (wooden table, vintage box back, Furby, vintage box front) */
export function renderFurbyScene(
  ctx: CanvasRenderingContext2D,
  sim: FurbySimState,
  width: number,
  height: number,
  woodImg: HTMLImageElement | null
): void {
  ctx.clearRect(0, 0, width, height);

  // 1. Warm Heirloom Antique Walnut Tabletop & Soft Parlor Horizon (cached offscreen!)
  const woodReady = Boolean(woodImg && woodImg.complete && woodImg.naturalWidth > 0);
  const bgKey = `${Math.round(width)}x${Math.round(height)}_${woodReady ? 'img' : 'fb'}`;
  if (typeof document !== 'undefined') {
    if (!cachedBackdropCanvas || cachedBackdropKey !== bgKey) {
      if (!cachedBackdropCanvas) {
        cachedBackdropCanvas = document.createElement('canvas');
      }
      cachedBackdropCanvas.width = Math.max(1, Math.round(width));
      cachedBackdropCanvas.height = Math.max(1, Math.round(height));
      cachedBackdropKey = bgKey;
      const bctx = cachedBackdropCanvas.getContext('2d');
      if (bctx) {
        if (woodReady && woodImg) {
          const horizonY = height * 0.34;
          const wallGrad = bctx.createLinearGradient(0, 0, 0, horizonY + 40);
          wallGrad.addColorStop(0, '#160E0A');
          wallGrad.addColorStop(0.75, '#251710');
          wallGrad.addColorStop(1, '#1A100B');
          bctx.fillStyle = wallGrad;
          bctx.fillRect(0, 0, width, horizonY + 12);

          bctx.save();
          bctx.beginPath();
          bctx.rect(0, horizonY, width, height - horizonY);
          bctx.clip();
          bctx.drawImage(woodImg, 0, horizonY - 10, width, height - horizonY + 20);
          const lampGrad = bctx.createRadialGradient(
            width * 0.5,
            height * 0.58,
            40,
            width * 0.5,
            height * 0.58,
            Math.max(width, height) * 0.62
          );
          lampGrad.addColorStop(0, 'rgba(255, 224, 178, 0.14)');
          lampGrad.addColorStop(0.55, 'rgba(20, 11, 6, 0.25)');
          lampGrad.addColorStop(1, 'rgba(8, 4, 2, 0.72)');
          bctx.fillStyle = lampGrad;
          bctx.fillRect(0, horizonY, width, height - horizonY);
          bctx.restore();

          bctx.fillStyle = 'rgba(229, 193, 123, 0.16)';
          bctx.fillRect(0, horizonY, width, 2);
        } else {
          const fallbackGrad = bctx.createRadialGradient(
            width * 0.5,
            height * 0.55,
            40,
            width * 0.5,
            height * 0.55,
            Math.max(width, height) * 0.75
          );
          fallbackGrad.addColorStop(0, '#4B2E1E');
          fallbackGrad.addColorStop(0.6, '#2A1910');
          fallbackGrad.addColorStop(1, '#120A06');
          bctx.fillStyle = fallbackGrad;
          bctx.fillRect(0, 0, width, height);
        }
      }
    }
    ctx.drawImage(cachedBackdropCanvas, 0, 0, width, height);
  }

  const coat = FURBY_COATS[sim.coatId];
  const m = getFurbyStageMetrics(sim, width, height);

  // 2. Render Collector Box + Furby in exact depth order!
  const insideBox =
    sim.phase === 'boxed' || sim.phase === 'opening' || sim.phase === 'ready_to_lift';

  if (insideBox) {
    // Furby sits snugly INSIDE the 1999 collector box behind the clear acetate front!
    drawCollectorBoxBack(ctx, coat, sim.boxOpenProgress, m.boxX, m.boxY, m.boxScale);
    drawFurbyCharacter(ctx, sim, m.cx, m.cy + 4 * m.scale, m.scale * 0.77);
    drawCollectorBoxFront(ctx, coat, sim.boxOpenProgress, m.boxX, m.boxY, m.boxScale);
  } else {
    // Opened collector box parked aside as a tabletop prop; Furby stands free & alive on the table!
    drawCollectorBoxBack(ctx, coat, 1, m.boxX, m.boxY, m.boxScale);
    drawCollectorBoxFront(ctx, coat, 1, m.boxX, m.boxY, m.boxScale);
    drawFurbyCharacter(ctx, sim, m.cx, m.cy, m.scale);
  }
}

/** Tiny preview helper used on the Title Screen coat picker */
export function renderFurbyPreview(
  canvas: HTMLCanvasElement,
  coatId: FurbyCoatId
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth || 88;
  const h = canvas.clientHeight || 88;
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  const previewSim: FurbySimState = {
    coatId,
    name: '',
    phase: 'on_table',
    boxOpenProgress: 1,
    unboxLiftProgress: 1,
    posX: 0.5,
    posY: 0.5,
    targetPosX: 0.5,
    targetPosY: 0.5,
    liftHeight: 0,
    isDragging: false,
    activity: 'idle',
    activityTimer: 0,
    activityDuration: 0,
    happiness: 90,
    energy: 90,
    time: 0.5,
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
    eyelidOpen: 0.96,
    blinkTimer: 3,
    blinkPhase: 0,
    pupilScale: 1,
    blushAlpha: 0.3,
    beakUpperOpen: 0.1,
    beakLowerOpen: 0.14,
    tongueOut: 0,
    earLeftAngle: -0.06,
    earLeftVel: 0,
    earRightAngle: 0.06,
    earRightVel: 0,
    footLeftLift: 0,
    footRightLift: 0,
    furBrush: { x: 0, y: 0, vx: 0, vy: 0, strength: 0 },
    speechText: null,
    speechTimer: 0,
    cues: [],
    nextCueId: 1,
  };

  drawFurbyCharacter(ctx, previewSim, w / 2, h * 0.54, Math.min(w, h) / 290);
}
