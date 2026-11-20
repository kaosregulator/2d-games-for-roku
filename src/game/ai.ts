import { BOARD_SPACES, getColorGroupSpaces } from './boardData';
import {
  buildHouse,
  canBuildHouse,
  canMortgage,
  canSellHouse,
  canUnmortgage,
  countOwnedInGroup,
  getPlayerProperties,
  mortgageProperty,
  ownsFullColorGroup,
  sellHouse,
  unmortgageProperty,
} from './engine';
import type { GameState, TradeOffer } from './types';

/**
 * Decides whether a CPU player should pay bail or use a Get Out of Jail Free card
 * before rolling.
 */
export function decideAiJailAction(
  state: GameState,
  playerId: string
): 'use_card' | 'pay_fine' | 'roll' {
  const player = state.players.find((p) => p.id === playerId);
  if (!player || !player.inJail) return 'roll';

  // Count how many unowned properties remain (early game = get out fast to buy!)
  const unownedCount = Object.values(state.properties).filter((p) => p.ownerId === null).length;

  if (player.getOutOfJailCards.length > 0 && (unownedCount > 6 || player.jailTurns >= 1)) {
    return 'use_card';
  }
  if (unownedCount > 10 && player.cash >= 350) {
    return 'pay_fine';
  }
  return 'roll';
}

/**
 * Decides whether a CPU player buys an unowned property they landed on, or sends it to auction.
 */
export function decideAiBuyProperty(state: GameState, playerId: string): boolean {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) return false;
  const space = BOARD_SPACES[player.position];
  if (!space.price || player.cash < space.price) return false;

  const reserve = 120;
  if (player.cash - space.price >= reserve) return true;

  // Still buy if it completes a color group or is high value (Orange/Red/Railroad/Dark Blue)
  if (space.colorGroup) {
    const groupSpaces = getColorGroupSpaces(space.colorGroup);
    const owned = countOwnedInGroup(state, playerId, space.colorGroup);
    if (owned + 1 === groupSpaces.length) return true;
  }

  return player.cash >= space.price + 40;
}

/**
 * Computes the CPU's bid or pass decision during an active Auction.
 */
export function decideAiAuctionMove(
  state: GameState,
  playerId: string
): { action: 'bid'; amount: number } | { action: 'pass' } {
  if (!state.auction) return { action: 'pass' };
  const player = state.players.find((p) => p.id === playerId);
  if (!player) return { action: 'pass' };

  const space = BOARD_SPACES[state.auction.spaceIndex];
  const basePrice = space.price ?? 100;

  let maxValuation = Math.floor(basePrice * 0.92);
  if (space.colorGroup) {
    const groupSpaces = getColorGroupSpaces(space.colorGroup);
    const ownedBySelf = countOwnedInGroup(state, playerId, space.colorGroup);
    if (ownedBySelf + 1 === groupSpaces.length) {
      // Completing a monopoly is worth paying a premium!
      maxValuation = Math.floor(basePrice * 1.25);
    }
    // Blocking another player's monopoly is also valuable
    const opponentNearMonopoly = state.players.some(
      (p) =>
        p.id !== playerId &&
        !p.bankrupt &&
        countOwnedInGroup(state, p.id, space.colorGroup!) + 1 === groupSpaces.length
    );
    if (opponentNearMonopoly) {
      maxValuation = Math.max(maxValuation, Math.floor(basePrice * 1.1));
    }
  }

  const nextBid = state.auction.currentBid === 0 ? Math.min(20, basePrice) : state.auction.currentBid + 10;
  const safeCap = Math.min(maxValuation, Math.max(0, player.cash - 60));

  if (nextBid <= safeCap && nextBid <= player.cash) {
    return { action: 'bid', amount: nextBid };
  }
  return { action: 'pass' };
}

/**
 * Performs smart property management for a CPU player during their turn:
 * unmortgaging properties when wealthy and building houses evenly on monopolies.
 */
export function runAiPropertyManagement(state: GameState, playerId: string): GameState {
  let next = state;
  const getPlayer = (s: GameState) => s.players.find((p) => p.id === playerId)!;

  // 1. Unmortgage properties if we have plenty of cash
  for (const idx of getPlayerProperties(next, playerId)) {
    const player = getPlayer(next);
    if (player.cash < 360) break;
    if (canUnmortgage(next, playerId, idx).allowed) {
      next = unmortgageProperty(next, playerId, idx);
    }
  }

  // 2. Build houses/hotels evenly while keeping a healthy cash cushion
  let builtSomething = true;
  let safety = 0;
  while (builtSomething && safety < 12) {
    builtSomething = false;
    safety++;
    const player = getPlayer(next);
    if (player.cash < 260) break;

    const owned = getPlayerProperties(next, playerId);
    // Prefer building on higher-ROI color groups first (orange, red, yellow, pink, green, darkBlue, lightBlue, brown)
    const priorityOrder = ['orange', 'red', 'yellow', 'pink', 'green', 'darkBlue', 'lightBlue', 'brown'];
    owned.sort((a, b) => {
      const ga = BOARD_SPACES[a].colorGroup ?? 'brown';
      const gb = BOARD_SPACES[b].colorGroup ?? 'brown';
      return priorityOrder.indexOf(ga) - priorityOrder.indexOf(gb);
    });

    for (const idx of owned) {
      const space = BOARD_SPACES[idx];
      if (!space.houseCost) continue;
      if (getPlayer(next).cash - space.houseCost < 220) continue;
      if (canBuildHouse(next, playerId, idx).allowed) {
        next = buildHouse(next, playerId, idx);
        builtSomething = true;
        break;
      }
    }
  }

  return next;
}

/**
 * Raises cash for a CPU player who is in debt (mortgaging unimproved properties first,
 * then selling houses evenly). Returns updated state; caller checks if debt can be settled.
 */
export function runAiRaiseFundsForDebt(state: GameState, playerId: string): GameState {
  if (!state.debt || state.debt.debtorId !== playerId) return state;
  let next = state;
  const targetCash = state.debt.amount;
  const getCash = (s: GameState) => s.players.find((p) => p.id === playerId)?.cash ?? 0;

  // 1. Mortgage non-monopoly properties first
  const owned = getPlayerProperties(next, playerId);
  const nonMonopoly = owned.filter((idx) => {
    const g = BOARD_SPACES[idx].colorGroup;
    return !g || !ownsFullColorGroup(next, playerId, g);
  });
  for (const idx of nonMonopoly) {
    if (getCash(next) >= targetCash) return next;
    if (canMortgage(next, playerId, idx).allowed) {
      next = mortgageProperty(next, playerId, idx);
    }
  }

  // 2. Sell houses/hotels evenly
  let safety = 0;
  while (getCash(next) < targetCash && safety < 40) {
    safety++;
    let sold = false;
    for (const idx of getPlayerProperties(next, playerId)) {
      if (canSellHouse(next, playerId, idx).allowed) {
        next = sellHouse(next, playerId, idx);
        sold = true;
        break;
      }
    }
    if (!sold) break;
  }

  // 3. Mortgage remaining properties
  for (const idx of getPlayerProperties(next, playerId)) {
    if (getCash(next) >= targetCash) return next;
    if (canMortgage(next, playerId, idx).allowed) {
      next = mortgageProperty(next, playerId, idx);
    }
  }

  return next;
}

/**
 * Evaluates a trade offer sent to a CPU player. Returns true if the deal is fair or favorable.
 */
export function evaluateAiTradeOffer(state: GameState, offer: TradeOffer): boolean {
  const aiId = offer.toPlayerId;

  const valueOfPropFor = (spaceIndex: number, beneficiaryId: string): number => {
    const space = BOARD_SPACES[spaceIndex];
    const prop = state.properties[spaceIndex];
    let val = space.price ?? 100;
    if (prop?.mortgaged) val *= 0.6;
    if (space.colorGroup) {
      const groupSize = getColorGroupSpaces(space.colorGroup).length;
      const ownedCount = countOwnedInGroup(state, beneficiaryId, space.colorGroup);
      if (ownedCount + 1 >= groupSize) {
        val *= 1.65; // Huge bonus if it completes a monopoly
      }
    }
    return val;
  };

  let aiGain = offer.offerCash + offer.offerJailCards * 50;
  for (const idx of offer.offerProperties) {
    aiGain += valueOfPropFor(idx, aiId);
  }

  let aiLoss = offer.requestCash + offer.requestJailCards * 55;
  for (const idx of offer.requestProperties) {
    // Also penalize if giving this property completes the opponent's monopoly
    const base = valueOfPropFor(idx, aiId);
    const opponentVal = valueOfPropFor(idx, offer.fromPlayerId);
    aiLoss += Math.max(base, opponentVal * 0.95);
  }

  return aiGain >= aiLoss * 0.95;
}
