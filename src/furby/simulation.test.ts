import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applyFurbyPetting,
  createFurbySim,
  FURBY_COATS,
  openFurbyBox,
  placeFurbyOnTable,
  returnFurbyToBox,
  setFurbyGazeTarget,
  stepFurbySim,
  triggerFurbyAction,
} from './simulation';

test('Furby starts sealed in vintage 1999 box and transitions smoothly onto the table', () => {
  const sim = createFurbySim('crystal_pink', 'May-May');
  assert.equal(sim.phase, 'boxed');
  assert.equal(sim.boxOpenProgress, 0);
  assert.equal(FURBY_COATS[sim.coatId].hasSparkles, true);

  openFurbyBox(sim);
  assert.equal(sim.phase, 'opening');
  for (let i = 0; i < 40; i++) stepFurbySim(sim, 0.03);
  assert.equal(sim.phase, 'ready_to_lift');
  assert.equal(sim.boxOpenProgress, 1);

  placeFurbyOnTable(sim);
  assert.equal(sim.phase, 'lifting');
  let maxLift = 0;
  for (let i = 0; i < 50; i++) {
    stepFurbySim(sim, 0.03);
    maxLift = Math.max(maxLift, sim.liftHeight);
  }
  assert.ok(maxLift > 60, 'Furby lifts up out of the box in an arc before landing');
  assert.equal(sim.phase, 'on_table');
  assert.equal(sim.liftHeight, 0);

  returnFurbyToBox(sim);
  assert.equal(sim.phase, 'boxed');
  assert.equal(sim.boxOpenProgress, 0);
});

test('Furby eye gaze tracks cursor cleanly and clamps within anatomical bounds', () => {
  const sim = createFurbySim('snowball');
  placeFurbyOnTable(sim);
  for (let i = 0; i < 45; i++) stepFurbySim(sim, 0.03);

  setFurbyGazeTarget(sim, 4.5, -3.2, true);
  for (let i = 0; i < 40; i++) stepFurbySim(sim, 0.03);

  assert.ok(sim.gazeX > 0.8 && sim.gazeX <= 1);
  assert.ok(sim.gazeY < -0.8 && sim.gazeY >= -1);
});

test('Furby mouth, tongue, eyelids, ears, and fur brush respond organically to interactions', () => {
  const sim = createFurbySim('crystal_pink');
  placeFurbyOnTable(sim);
  for (let i = 0; i < 45; i++) stepFurbySim(sim, 0.03);

  // Feeding articulates beak + tongue
  triggerFurbyAction(sim, 'eat');
  let maxBeak = 0;
  let maxTongue = 0;
  for (let i = 0; i < 25; i++) {
    stepFurbySim(sim, 0.03);
    maxBeak = Math.max(maxBeak, sim.beakLowerOpen);
    maxTongue = Math.max(maxTongue, sim.tongueOut);
  }
  assert.ok(maxBeak > 0.5, 'Beak opens wide while eating');
  assert.ok(maxTongue > 0.4, 'Inner tongue animates while eating');

  // Petting adds fur brush wave & raises happiness
  const beforeHappy = sim.happiness;
  applyFurbyPetting(sim, 0.2, -0.3, 1.4, -0.2);
  assert.ok(sim.furBrush.strength > 0.35);
  assert.ok(sim.happiness >= beforeHappy);

  // Sleep closes eyelids gently & droops ears
  triggerFurbyAction(sim, 'sleep');
  for (let i = 0; i < 40; i++) stepFurbySim(sim, 0.03);
  assert.ok(sim.eyelidOpen < 0.12, 'Eyelids close while asleep');
  assert.ok(sim.earLeftAngle > 0.2, 'Left ear droops relaxed during sleep');
});

test('stepFurbySim clamps large dt spikes so springs never explode', () => {
  const sim = createFurbySim('mint_cloud');
  placeFurbyOnTable(sim);
  stepFurbySim(sim, 5.0);
  assert.ok(Number.isFinite(sim.bodyTilt));
  assert.ok(Number.isFinite(sim.earLeftAngle));
  assert.ok(Math.abs(sim.bodyTilt) <= 0.32);
  assert.ok(Math.abs(sim.earLeftAngle) <= 0.58);
});
