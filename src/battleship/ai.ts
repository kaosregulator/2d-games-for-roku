import { FLEET_SPECS, GRID_SIZE } from './engine';
import type { AiDifficulty, ShipTypeId, ShotRecord } from './types';

const DIRS: [number, number][] = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];

/**
 * Selects the next target cell for the CPU opponent using:
 * - Ensign: Random search + adjacent follow-up on active hits
 * - Commander: Directional Hunt & Target along hit ship axes
 * - Admiral: Full Probability Density Heatmap across all remaining un-sunk ships + Target lock
 */
export function chooseCpuShot(
  shotsFiredAtPlayer: ShotRecord[],
  sunkPlayerShipIds: ShipTypeId[],
  difficulty: AiDifficulty,
  rng: () => number = Math.random
): { row: number; col: number } {
  const shotMap = new Map<string, ShotRecord>();
  for (const s of shotsFiredAtPlayer) {
    shotMap.set(`${s.row},${s.col}`, s);
  }

  const isAvailable = (r: number, c: number) =>
    r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE && !shotMap.has(`${r},${c}`);

  // Identify "live" hits (hits that don't belong to an already-sunk ship, approximated via target cells)
  // Better yet: track hits not surrounded by all misses, or prioritize hits whose cluster is still active.
  const allHits = shotsFiredAtPlayer.filter((s) => s.result === 'hit');
  const sunkCount = sunkPlayerShipIds.length;
  const remainingLengths = FLEET_SPECS.filter((s) => !sunkPlayerShipIds.includes(s.id)).map(
    (s) => s.length
  );

  // Target mode: find hits adjacent to unshot cells (and prefer continuing inline streaks of 2+ hits)
  if (allHits.length > 0 && remainingLengths.length > 0) {
    const inlineCandidates: { row: number; col: number }[] = [];
    const adjacentCandidates: { row: number; col: number }[] = [];
    const hitSet = new Set(allHits.map((h) => `${h.row},${h.col}`));

    for (const hit of allHits) {
      for (const [dr, dc] of DIRS) {
        const nr = hit.row + dr;
        const nc = hit.col + dc;
        if (!isAvailable(nr, nc)) continue;

        // If the opposite cell is also a hit, this extends an identified ship line!
        const oppKey = `${hit.row - dr},${hit.col - dc}`;
        if (hitSet.has(oppKey)) {
          inlineCandidates.push({ row: nr, col: nc });
        } else {
          adjacentCandidates.push({ row: nr, col: nc });
        }
      }
    }

    if (difficulty !== 'ensign' && inlineCandidates.length > 0) {
      return inlineCandidates[Math.floor(rng() * inlineCandidates.length)];
    }

    if (adjacentCandidates.length > 0 && (difficulty !== 'ensign' || rng() < 0.72)) {
      if (difficulty === 'admiral') {
        // Score adjacent candidates by remaining ship fit density
        return pickHighestHeatmapCell(adjacentCandidates, shotMap, remainingLengths, rng);
      }
      return adjacentCandidates[Math.floor(rng() * adjacentCandidates.length)];
    }
  }

  // Hunt mode
  const allAvailable: { row: number; col: number }[] = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (isAvailable(r, c)) {
        allAvailable.push({ row: r, col: c });
      }
    }
  }

  if (allAvailable.length === 0) {
    return { row: 0, col: 0 };
  }

  if (difficulty === 'admiral') {
    // True Probability Density Heatmap across all remaining ship lengths!
    const best = pickHighestHeatmapCell(allAvailable, shotMap, remainingLengths, rng);
    if (best) return best;
  }

  if (difficulty === 'commander') {
    // Parity checkerboard hunt (since smallest remaining ship is >= 2)
    const minLen = Math.min(...(remainingLengths.length ? remainingLengths : [2]));
    const parityCells = allAvailable.filter((c) => (c.row + c.col) % minLen === 0);
    const pool = parityCells.length > 0 ? parityCells : allAvailable;
    return pool[Math.floor(rng() * pool.length)];
  }

  // Ensign: pure random hunt (with slight bias if sunkCount >= 0)
  void sunkCount;
  return allAvailable[Math.floor(rng() * allAvailable.length)];
}

function pickHighestHeatmapCell(
  candidates: { row: number; col: number }[],
  shotMap: Map<string, ShotRecord>,
  remainingLengths: number[],
  rng: () => number
): { row: number; col: number } {
  const scores: number[][] = Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => 0)
  );

  const isBlocked = (r: number, c: number) => {
    const rec = shotMap.get(`${r},${c}`);
    return rec?.result === 'miss';
  };

  for (const len of remainingLengths) {
    // Horizontal placements
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c <= GRID_SIZE - len; c++) {
        let valid = true;
        let hitBonus = 0;
        for (let k = 0; k < len; k++) {
          if (isBlocked(r, c + k)) {
            valid = false;
            break;
          }
          if (shotMap.get(`${r},${c + k}`)?.result === 'hit') {
            hitBonus += 4;
          }
        }
        if (valid) {
          for (let k = 0; k < len; k++) {
            if (!shotMap.has(`${r},${c + k}`)) {
              scores[r][c + k] += 1 + hitBonus;
            }
          }
        }
      }
    }

    // Vertical placements
    for (let c = 0; c < GRID_SIZE; c++) {
      for (let r = 0; r <= GRID_SIZE - len; r++) {
        let valid = true;
        let hitBonus = 0;
        for (let k = 0; k < len; k++) {
          if (isBlocked(r + k, c)) {
            valid = false;
            break;
          }
          if (shotMap.get(`${r + k},${c}`)?.result === 'hit') {
            hitBonus += 4;
          }
        }
        if (valid) {
          for (let k = 0; k < len; k++) {
            if (!shotMap.has(`${r + k},${c}`)) {
              scores[r + k][c] += 1 + hitBonus;
            }
          }
        }
      }
    }
  }

  let bestScore = -1;
  let bestCells: { row: number; col: number }[] = [];
  for (const cell of candidates) {
    const s = scores[cell.row][cell.col];
    if (s > bestScore) {
      bestScore = s;
      bestCells = [cell];
    } else if (s === bestScore) {
      bestCells.push(cell);
    }
  }

  return bestCells[Math.floor(rng() * bestCells.length)] ?? candidates[0];
}
