export type ShipTypeId = 'carrier' | 'battleship' | 'cruiser' | 'submarine' | 'destroyer';

export type Orientation = 'H' | 'V';

export interface ShipSpec {
  id: ShipTypeId;
  name: string;
  length: number;
  code: string;
}

export interface PlacedShip {
  id: ShipTypeId;
  name: string;
  length: number;
  row: number; // 0..9
  col: number; // 0..9
  orientation: Orientation;
}

export interface ShotRecord {
  row: number;
  col: number;
  result: 'hit' | 'miss';
  sunkShipId?: ShipTypeId;
  turn: number;
}

export type BattleshipMode = 'cpu' | 'pass_and_play' | 'online';

export type AiDifficulty = 'ensign' | 'commander' | 'admiral';

export interface BattleshipRulesConfig {
  mode: BattleshipMode;
  difficulty: AiDifficulty;
  bonusShotOnHit: boolean;
  player1Name: string;
  player2Name: string;
}

export interface PlayerFleetState {
  id: 'p1' | 'p2';
  name: string;
  ships: PlacedShip[];
  ready: boolean;
  incomingShots: ShotRecord[]; // shots opponent fired at THIS player's grid
}

export type BattleshipPhase =
  | 'lobby'        // Online waiting for friend to join room
  | 'deploy_p1'    // Player 1 placing fleet (or local player in online mode)
  | 'handoff_p2'   // Pass & play privacy curtain before Player 2 deploys
  | 'deploy_p2'    // Player 2 placing fleet (pass & play)
  | 'waiting_peer' // Online: you locked fleet, waiting for friend to lock fleet
  | 'handoff_turn' // Pass & play privacy curtain between battle turns
  | 'battle'       // Active firing phase
  | 'gameover';

export interface BattleshipGameState {
  mode: BattleshipMode;
  difficulty: AiDifficulty;
  bonusShotOnHit: boolean;
  phase: BattleshipPhase;
  currentTurn: 'p1' | 'p2';
  winner: 'p1' | 'p2' | null;
  turnNumber: number;
  players: {
    p1: PlayerFleetState;
    p2: PlayerFleetState;
  };
  lastEventText: string;
  lastShot: {
    shooter: 'p1' | 'p2';
    target: 'p1' | 'p2';
    row: number;
    col: number;
    result: 'hit' | 'miss';
    sunkShipName?: string;
    id: number;
  } | null;
  nextShotEventId: number;
}

/**
 * Fog-of-war safe view sent by the authoritative server to an online player.
 * Un-sunk opponent ships are NEVER included in this payload!
 */
export interface OnlineProjectedView {
  roomCode: string;
  yourRole: 'p1' | 'p2';
  peerConnected: boolean;
  yourName: string;
  opponentName: string;
  bonusShotOnHit: boolean;
  phase: 'lobby' | 'deploy' | 'waiting_peer' | 'battle' | 'gameover';
  currentTurn: 'p1' | 'p2';
  winner: 'p1' | 'p2' | null;
  turnNumber: number;
  yourShips: PlacedShip[];
  yourReady: boolean;
  opponentReady: boolean;
  incomingShots: ShotRecord[];     // opponent's shots on your ocean grid
  outgoingShots: ShotRecord[];     // your shots on opponent's radar grid
  opponentSunkShips: PlacedShip[]; // ONLY ships that have been completely sunk!
  opponentShipsRemaining: number;
  lastEventText: string;
  lastShot: BattleshipGameState['lastShot'];
  rematchVotes: ('p1' | 'p2')[];
}
