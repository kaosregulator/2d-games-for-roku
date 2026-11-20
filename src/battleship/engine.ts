import type {
  BattleshipGameState,
  BattleshipRulesConfig,
  OnlineProjectedView,
  Orientation,
  PlacedShip,
  ShipSpec,
  ShipTypeId,
  ShotRecord,
} from './types';

export const GRID_SIZE = 10;
export const COL_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'] as const;
export const ROW_LABELS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'] as const;

export const FLEET_SPECS: ShipSpec[] = [
  { id: 'carrier', name: 'Aircraft Carrier', length: 5, code: 'CVN-65' },
  { id: 'battleship', name: 'Battleship', length: 4, code: 'BB-63' },
  { id: 'cruiser', name: 'Cruiser', length: 3, code: 'CG-47' },
  { id: 'submarine', name: 'Submarine', length: 3, code: 'SSN-21' },
  { id: 'destroyer', name: 'Destroyer', length: 2, code: 'DDG-51' },
];

export const TOTAL_SHIP_CELLS = FLEET_SPECS.reduce((acc, s) => acc + s.length, 0); // 17

export function formatCoord(row: number, col: number): string {
  return `${COL_LABELS[col] ?? '?'}${row + 1}`;
}

export function getShipCells(ship: PlacedShip): { row: number; col: number }[] {
  const cells: { row: number; col: number }[] = [];
  for (let i = 0; i < ship.length; i++) {
    cells.push({
      row: ship.orientation === 'V' ? ship.row + i : ship.row,
      col: ship.orientation === 'H' ? ship.col + i : ship.col,
    });
  }
  return cells;
}

export function canPlaceShip(
  existingShips: PlacedShip[],
  spec: ShipSpec,
  row: number,
  col: number,
  orientation: Orientation
): boolean {
  const candidate: PlacedShip = {
    id: spec.id,
    name: spec.name,
    length: spec.length,
    row,
    col,
    orientation,
  };
  const cells = getShipCells(candidate);

  // Bounds check
  for (const c of cells) {
    if (c.row < 0 || c.row >= GRID_SIZE || c.col < 0 || c.col >= GRID_SIZE) {
      return false;
    }
  }

  // Overlap check (ignoring any previous placement of the same ship id)
  const occupied = new Set<string>();
  for (const ship of existingShips) {
    if (ship.id === spec.id) continue;
    for (const c of getShipCells(ship)) {
      occupied.add(`${c.row},${c.col}`);
    }
  }

  return cells.every((c) => !occupied.has(`${c.row},${c.col}`));
}

export function placeShipOnList(
  existingShips: PlacedShip[],
  spec: ShipSpec,
  row: number,
  col: number,
  orientation: Orientation
): PlacedShip[] | null {
  if (!canPlaceShip(existingShips, spec, row, col, orientation)) {
    return null;
  }
  const filtered = existingShips.filter((s) => s.id !== spec.id);
  return [
    ...filtered,
    {
      id: spec.id,
      name: spec.name,
      length: spec.length,
      row,
      col,
      orientation,
    },
  ];
}

export function validateCompleteFleet(ships: PlacedShip[]): boolean {
  if (ships.length !== FLEET_SPECS.length) return false;
  const seenIds = new Set<ShipTypeId>();
  const occupied = new Set<string>();

  for (const ship of ships) {
    const spec = FLEET_SPECS.find((s) => s.id === ship.id);
    if (!spec || spec.length !== ship.length || seenIds.has(ship.id)) return false;
    seenIds.add(ship.id);
    const cells = getShipCells(ship);
    for (const c of cells) {
      if (c.row < 0 || c.row >= GRID_SIZE || c.col < 0 || c.col >= GRID_SIZE) return false;
      const key = `${c.row},${c.col}`;
      if (occupied.has(key)) return false;
      occupied.add(key);
    }
  }

  return seenIds.size === FLEET_SPECS.length && occupied.size === TOTAL_SHIP_CELLS;
}

export function generateRandomFleet(rng: () => number = Math.random): PlacedShip[] {
  for (let attempt = 0; attempt < 100; attempt++) {
    const ships: PlacedShip[] = [];
    let ok = true;

    for (const spec of FLEET_SPECS) {
      let placed = false;
      for (let tries = 0; tries < 200; tries++) {
        const orientation: Orientation = rng() < 0.5 ? 'H' : 'V';
        const maxRow = orientation === 'V' ? GRID_SIZE - spec.length : GRID_SIZE - 1;
        const maxCol = orientation === 'H' ? GRID_SIZE - spec.length : GRID_SIZE - 1;
        const row = Math.floor(rng() * (maxRow + 1));
        const col = Math.floor(rng() * (maxCol + 1));
        const next = placeShipOnList(ships, spec, row, col, orientation);
        if (next) {
          ships.length = 0;
          ships.push(...next);
          placed = true;
          break;
        }
      }
      if (!placed) {
        ok = false;
        break;
      }
    }

    if (ok && validateCompleteFleet(ships)) {
      return ships;
    }
  }

  // Deterministic fallback layout (guaranteed valid)
  return FLEET_SPECS.map((spec, idx) => ({
    id: spec.id,
    name: spec.name,
    length: spec.length,
    row: idx * 2,
    col: 0,
    orientation: 'H' as Orientation,
  }));
}

export function isShipSunk(ship: PlacedShip, incomingShots: ShotRecord[]): boolean {
  const hitSet = new Set(
    incomingShots.filter((s) => s.result === 'hit').map((s) => `${s.row},${s.col}`)
  );
  return getShipCells(ship).every((c) => hitSet.has(`${c.row},${c.col}`));
}

export function getSunkShips(ships: PlacedShip[], incomingShots: ShotRecord[]): PlacedShip[] {
  return ships.filter((ship) => isShipSunk(ship, incomingShots));
}

export function findShipAtCell(ships: PlacedShip[], row: number, col: number): PlacedShip | null {
  for (const ship of ships) {
    if (getShipCells(ship).some((c) => c.row === row && c.col === col)) {
      return ship;
    }
  }
  return null;
}

export function createBattleshipGame(
  config: BattleshipRulesConfig,
  rng: () => number = Math.random
): BattleshipGameState {
  const p1Name = config.player1Name.trim() || 'Admiral 1';
  const p2Name =
    config.mode === 'cpu'
      ? `CPU ${config.difficulty.charAt(0).toUpperCase() + config.difficulty.slice(1)}`
      : config.player2Name.trim() || 'Admiral 2';

  const p2Ships = config.mode === 'cpu' ? generateRandomFleet(rng) : [];

  return {
    mode: config.mode,
    difficulty: config.difficulty,
    bonusShotOnHit: config.bonusShotOnHit,
    phase: config.mode === 'online' ? 'lobby' : 'deploy_p1',
    currentTurn: 'p1',
    winner: null,
    turnNumber: 1,
    players: {
      p1: {
        id: 'p1',
        name: p1Name,
        ships: [],
        ready: false,
        incomingShots: [],
      },
      p2: {
        id: 'p2',
        name: p2Name,
        ships: p2Ships,
        ready: config.mode === 'cpu',
        incomingShots: [],
      },
    },
    lastEventText: `${p1Name}, position all 5 naval vessels on your ocean grid.`,
    lastShot: null,
    nextShotEventId: 1,
  };
}

export function lockPlayerFleet(
  state: BattleshipGameState,
  playerId: 'p1' | 'p2',
  ships: PlacedShip[]
): BattleshipGameState {
  if (!validateCompleteFleet(ships)) return state;

  const updatedPlayers = {
    ...state.players,
    [playerId]: {
      ...state.players[playerId],
      ships: [...ships],
      ready: true,
    },
  };

  if (state.mode === 'cpu') {
    return {
      ...state,
      players: updatedPlayers,
      phase: 'battle',
      currentTurn: 'p1',
      lastEventText: `All vessels locked! ${updatedPlayers.p1.name}, fire the opening salvo!`,
    };
  }

  if (state.mode === 'pass_and_play') {
    if (playerId === 'p1') {
      return {
        ...state,
        players: updatedPlayers,
        phase: 'handoff_p2',
        lastEventText: `${updatedPlayers.p1.name}'s fleet is classified. Pass controls to ${updatedPlayers.p2.name}.`,
      };
    }
    return {
      ...state,
      players: updatedPlayers,
      phase: 'handoff_turn',
      currentTurn: 'p1',
      lastEventText: `Both fleets deployed! Pass controls to ${updatedPlayers.p1.name} to begin battle.`,
    };
  }

  // Online mode
  const bothReady = updatedPlayers.p1.ready && updatedPlayers.p2.ready;
  return {
    ...state,
    players: updatedPlayers,
    phase: bothReady ? 'battle' : 'waiting_peer',
    currentTurn: 'p1',
    lastEventText: bothReady
      ? `Both fleets locked! ${updatedPlayers.p1.name} fires first.`
      : `${updatedPlayers[playerId].name} locked fleet. Waiting for opponent...`,
  };
}

export function fireShot(
  state: BattleshipGameState,
  shooter: 'p1' | 'p2',
  row: number,
  col: number
): BattleshipGameState {
  if (state.phase !== 'battle' || state.currentTurn !== shooter) return state;
  if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) return state;

  const defender: 'p1' | 'p2' = shooter === 'p1' ? 'p2' : 'p1';
  const defenderState = state.players[defender];
  const shooterState = state.players[shooter];

  // Reject duplicate shots at the same cell
  if (defenderState.incomingShots.some((s) => s.row === row && s.col === col)) {
    return state;
  }

  const hitShip = findShipAtCell(defenderState.ships, row, col);
  const result: 'hit' | 'miss' = hitShip ? 'hit' : 'miss';

  const provisionalShot: ShotRecord = {
    row,
    col,
    result,
    turn: state.turnNumber,
  };

  const nextIncoming = [...defenderState.incomingShots, provisionalShot];
  let sunkShipName: string | undefined;

  if (hitShip && isShipSunk(hitShip, nextIncoming)) {
    provisionalShot.sunkShipId = hitShip.id;
    sunkShipName = hitShip.name;
  }

  const updatedPlayers = {
    ...state.players,
    [defender]: {
      ...defenderState,
      incomingShots: nextIncoming,
    },
  };

  const allDefenderSunk = defenderState.ships.every((s) => isShipSunk(s, nextIncoming));
  const coord = formatCoord(row, col);

  const shotEvent = {
    shooter,
    target: defender,
    row,
    col,
    result,
    sunkShipName,
    id: state.nextShotEventId,
  };

  if (allDefenderSunk) {
    return {
      ...state,
      players: updatedPlayers,
      phase: 'gameover',
      winner: shooter,
      lastShot: shotEvent,
      nextShotEventId: state.nextShotEventId + 1,
      lastEventText: `DIRECT HIT at ${coord}! ${shooterState.name} sank ${defenderState.name}'s ${sunkShipName} and WON the battle!`,
    };
  }

  const keepsTurn = result === 'hit' && state.bonusShotOnHit;
  const nextTurn: 'p1' | 'p2' = keepsTurn ? shooter : defender;

  let text = '';
  if (sunkShipName) {
    text = `SUNK! ${shooterState.name} destroyed ${defenderState.name}'s ${sunkShipName} at ${coord}!`;
  } else if (result === 'hit') {
    text = `HIT at ${coord}! ${shooterState.name} struck an enemy vessel${keepsTurn ? ' — bonus salvo!' : '.'}`;
  } else {
    text = `SPLASH at ${coord}. ${shooterState.name}'s shot missed.`;
  }

  return {
    ...state,
    players: updatedPlayers,
    currentTurn: nextTurn,
    turnNumber: state.turnNumber + 1,
    lastShot: shotEvent,
    nextShotEventId: state.nextShotEventId + 1,
    lastEventText: text,
  };
}

/**
 * Projects an authoritative BattleshipGameState into a Fog-of-War safe payload
 * for a single online player. Never exposes un-sunk enemy ship coordinates!
 */
export function projectOnlineView(
  state: BattleshipGameState,
  roomCode: string,
  role: 'p1' | 'p2',
  peerConnected: boolean,
  rematchVotes: ('p1' | 'p2')[]
): OnlineProjectedView {
  const oppRole: 'p1' | 'p2' = role === 'p1' ? 'p2' : 'p1';
  const me = state.players[role];
  const opp = state.players[oppRole];

  const opponentSunkShips = getSunkShips(opp.ships, opp.incomingShots);

  let viewPhase: OnlineProjectedView['phase'] = 'battle';
  if (state.phase === 'lobby' || !peerConnected) {
    viewPhase = state.phase === 'gameover' ? 'gameover' : 'lobby';
  } else if (state.phase === 'gameover') {
    viewPhase = 'gameover';
  } else if (!me.ready) {
    viewPhase = 'deploy';
  } else if (!opp.ready) {
    viewPhase = 'waiting_peer';
  } else {
    viewPhase = 'battle';
  }

  return {
    roomCode,
    yourRole: role,
    peerConnected,
    yourName: me.name,
    opponentName: opp.name,
    bonusShotOnHit: state.bonusShotOnHit,
    phase: viewPhase,
    currentTurn: state.currentTurn,
    winner: state.winner,
    turnNumber: state.turnNumber,
    yourShips: me.ships,
    yourReady: me.ready,
    opponentReady: opp.ready,
    incomingShots: me.incomingShots,
    outgoingShots: opp.incomingShots,
    opponentSunkShips,
    opponentShipsRemaining: Math.max(0, FLEET_SPECS.length - opponentSunkShips.length),
    lastEventText: state.lastEventText,
    lastShot: state.lastShot,
    rematchVotes,
  };
}
