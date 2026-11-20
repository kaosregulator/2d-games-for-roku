import test from 'node:test';
import assert from 'node:assert/strict';
import { chooseCpuShot } from './ai';
import {
  canPlaceShip,
  createBattleshipGame,
  fireShot,
  FLEET_SPECS,
  generateRandomFleet,
  getShipCells,
  getSunkShips,
  lockPlayerFleet,
  placeShipOnList,
  projectOnlineView,
  TOTAL_SHIP_CELLS,
  validateCompleteFleet,
} from './engine';
import type { PlacedShip } from './types';

test('fleet specs total 17 cells across 5 classic ships and random fleet is always valid', () => {
  assert.equal(FLEET_SPECS.length, 5);
  assert.equal(TOTAL_SHIP_CELLS, 17);

  for (let i = 0; i < 15; i++) {
    const fleet = generateRandomFleet();
    assert.equal(validateCompleteFleet(fleet), true);
  }
});

test('ship placement validates board bounds and prevents overlapping vessels', () => {
  const carrier = FLEET_SPECS[0]; // length 5
  const destroyer = FLEET_SPECS[4]; // length 2

  assert.equal(canPlaceShip([], carrier, 0, 6, 'H'), false); // overflows col 10
  assert.equal(canPlaceShip([], carrier, 0, 5, 'H'), true);

  const placed = placeShipOnList([], carrier, 0, 5, 'H')!;
  assert.ok(placed);
  assert.equal(canPlaceShip(placed, destroyer, 0, 6, 'V'), false); // overlaps (0,6)
  assert.equal(canPlaceShip(placed, destroyer, 1, 6, 'V'), true);
});

test('classic combat enforces turn alternation, duplicate rejection, sinking, and victory', () => {
  const fixedP1: PlacedShip[] = FLEET_SPECS.map((s, idx) => ({
    id: s.id,
    name: s.name,
    length: s.length,
    row: idx,
    col: 0,
    orientation: 'H',
  }));
  const fixedP2: PlacedShip[] = FLEET_SPECS.map((s, idx) => ({
    id: s.id,
    name: s.name,
    length: s.length,
    row: idx,
    col: 0,
    orientation: 'H',
  }));

  let state = createBattleshipGame({
    mode: 'pass_and_play',
    difficulty: 'commander',
    bonusShotOnHit: false,
    player1Name: 'Alpha',
    player2Name: 'Bravo',
  });
  state = lockPlayerFleet(state, 'p1', fixedP1);
  assert.equal(state.phase, 'handoff_p2');
  state = { ...state, phase: 'deploy_p2' };
  state = lockPlayerFleet(state, 'p2', fixedP2);
  assert.equal(state.phase, 'handoff_turn');
  state = { ...state, phase: 'battle' };

  // P1 misses at (9, 9) -> turn passes to P2
  state = fireShot(state, 'p1', 9, 9);
  assert.equal(state.lastShot?.result, 'miss');
  assert.equal(state.currentTurn, 'p2');

  // Duplicate shot by P2 at (9, 9) after P2 shoots once is rejected
  state = fireShot(state, 'p2', 9, 9);
  assert.equal(state.currentTurn, 'p1');
  const beforeDup = state.turnNumber;
  state = fireShot(state, 'p1', 9, 9); // already fired there!
  assert.equal(state.turnNumber, beforeDup);
  assert.equal(state.currentTurn, 'p1');

  // Sink all 17 of P2's cells with bonusShotOnHit enabled to verify immediate win
  state = { ...state, bonusShotOnHit: true };
  for (const ship of fixedP2) {
    for (const cell of getShipCells(ship)) {
      state = fireShot(state, 'p1', cell.row, cell.col);
    }
  }
  assert.equal(state.phase, 'gameover');
  assert.equal(state.winner, 'p1');
});

test('server-authoritative Fog-of-War projection never leaks un-sunk enemy ships', () => {
  const p1Fleet = generateRandomFleet(() => 0.15);
  const p2Fleet: PlacedShip[] = FLEET_SPECS.map((s, idx) => ({
    id: s.id,
    name: s.name,
    length: s.length,
    row: idx,
    col: 0,
    orientation: 'H',
  }));

  let state = createBattleshipGame({
    mode: 'online',
    difficulty: 'admiral',
    bonusShotOnHit: true,
    player1Name: 'Host',
    player2Name: 'Guest',
  });
  state = lockPlayerFleet(state, 'p1', p1Fleet);
  state = lockPlayerFleet(state, 'p2', p2Fleet);
  assert.equal(state.phase, 'battle');

  // Hit only 1 cell of P2's Destroyer (row 4, col 0) -> NOT sunk yet
  state = fireShot(state, 'p1', 4, 0);
  const viewBeforeSink = projectOnlineView(state, 'NAVY7', 'p1', true, []);
  assert.equal(viewBeforeSink.opponentSunkShips.length, 0);
  assert.equal(viewBeforeSink.opponentShipsRemaining, 5);

  // Hit 2nd cell of P2's Destroyer (row 4, col 1) -> SUNK! Now revealed!
  state = fireShot(state, 'p1', 4, 1);
  const viewAfterSink = projectOnlineView(state, 'NAVY7', 'p1', true, []);
  assert.equal(viewAfterSink.opponentSunkShips.length, 1);
  assert.equal(viewAfterSink.opponentSunkShips[0].id, 'destroyer');
  assert.equal(viewAfterSink.opponentShipsRemaining, 4);
});

test('Admiral CPU AI never repeats a cell and sinks a full fleet cleanly', () => {
  const targetFleet = generateRandomFleet();
  let state = createBattleshipGame({
    mode: 'cpu',
    difficulty: 'admiral',
    bonusShotOnHit: false,
    player1Name: 'Human',
    player2Name: 'CPU',
  });
  state = lockPlayerFleet(state, 'p1', targetFleet);
  state = { ...state, currentTurn: 'p2' };

  const fired = new Set<string>();
  let steps = 0;
  while (state.phase === 'battle' && steps < 100) {
    const sunkIds = getSunkShips(state.players.p1.ships, state.players.p1.incomingShots).map(
      (s) => s.id
    );
    const shot = chooseCpuShot(state.players.p1.incomingShots, sunkIds, 'admiral');
    const key = `${shot.row},${shot.col}`;
    assert.equal(fired.has(key), false, `CPU repeated shot at ${key}`);
    fired.add(key);

    state = fireShot(state, 'p2', shot.row, shot.col);
    if (state.phase === 'battle') {
      state = { ...state, currentTurn: 'p2' };
    }
    steps++;
  }

  assert.equal(state.phase, 'gameover');
  assert.equal(state.winner, 'p2');
});
