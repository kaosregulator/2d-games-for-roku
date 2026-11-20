import {
  BOARD_SPACES,
  getColorGroupSpaces,
  isOwnableSpace,
} from './boardData';
import {
  ALL_CARDS_BY_ID,
  CHANCE_CARDS,
  COMMUNITY_CHEST_CARDS,
  shuffleIds,
} from './cards';
import { STARTING_CASH } from './money';
import type {
  AuctionState,
  CardDeckType,
  ColorGroup,
  GameLogEntry,
  GameState,
  MoneyTransferEvent,
  PlayerSetupConfig,
  PlayerState,
  PropertyState,
  TradeOffer,
  TurnPhase,
} from './types';

export const BANK_INITIAL_HOUSES = 32;
export const BANK_INITIAL_HOTELS = 12;
export const GO_SALARY = 200;
export const JAIL_FINE = 50;

function addLog(
  state: GameState,
  text: string,
  tone: GameLogEntry['tone'] = 'neutral'
): GameState {
  const entry: GameLogEntry = {
    id: state.nextLogId,
    turn: state.turnNumber,
    text,
    tone,
  };
  return {
    ...state,
    lastActionText: text,
    logs: [entry, ...state.logs].slice(0, 60),
    nextLogId: state.nextLogId + 1,
  };
}

function addTransfer(
  state: GameState,
  from: string,
  to: string,
  amount: number,
  label: string
): GameState {
  if (amount <= 0) return state;
  const event: MoneyTransferEvent = {
    id: state.nextTransferId,
    from,
    to,
    amount,
    label,
    timestamp: Date.now(),
  };
  return {
    ...state,
    moneyTransfers: [...state.moneyTransfers.slice(-8), event],
    nextTransferId: state.nextTransferId + 1,
  };
}

function updatePlayer(
  state: GameState,
  playerId: string,
  updater: (p: PlayerState) => PlayerState
): GameState {
  return {
    ...state,
    players: state.players.map((p) => (p.id === playerId ? updater(p) : p)),
  };
}

export function getActivePlayer(state: GameState): PlayerState {
  return state.players[state.currentPlayerIndex];
}

export function getPlayerById(state: GameState, playerId: string): PlayerState | undefined {
  return state.players.find((p) => p.id === playerId);
}

export function getSolventPlayers(state: GameState): PlayerState[] {
  return state.players.filter((p) => !p.bankrupt);
}

export function createInitialGameState(
  configs: PlayerSetupConfig[],
  rng: () => number = Math.random
): GameState {
  const players: PlayerState[] = configs.map((cfg) => ({
    id: cfg.id,
    name: cfg.name.trim() || 'Player',
    token: cfg.token,
    isAI: cfg.isAI,
    accentColor: cfg.accentColor,
    cash: STARTING_CASH,
    position: 0,
    inJail: false,
    jailTurns: 0,
    getOutOfJailCards: [],
    bankrupt: false,
    doublesCount: 0,
  }));

  const properties: Record<number, PropertyState> = {};
  for (const space of BOARD_SPACES) {
    if (isOwnableSpace(space)) {
      properties[space.index] = {
        ownerId: null,
        houses: 0,
        mortgaged: false,
      };
    }
  }

  const initial: GameState = {
    players,
    currentPlayerIndex: 0,
    properties,
    bankHouses: BANK_INITIAL_HOUSES,
    bankHotels: BANK_INITIAL_HOTELS,
    chanceDeck: shuffleIds(
      CHANCE_CARDS.map((c) => c.id),
      rng
    ),
    chanceDiscard: [],
    communityDeck: shuffleIds(
      COMMUNITY_CHEST_CARDS.map((c) => c.id),
      rng
    ),
    communityDiscard: [],
    dice: [1, 1],
    hasRolledThisTurn: false,
    lastRollWasDoubles: false,
    pendingSteps: [],
    pendingCardRentOverride: null,
    phase: 'awaiting_roll',
    auction: null,
    drawnCard: null,
    debt: null,
    winnerId: null,
    turnNumber: 1,
    lastActionText: `${players[0]?.name ?? 'Player 1'} begins at GO. Roll the dice!`,
    logs: [],
    nextLogId: 1,
    moneyTransfers: [],
    nextTransferId: 1,
    freeParkingPot: 0,
  };

  return addLog(initial, `${players[0]?.name ?? 'Player 1'} starts at GO with $1,500.`, 'neutral');
}

export function ownsFullColorGroup(
  state: GameState,
  playerId: string,
  group: ColorGroup
): boolean {
  const spaces = getColorGroupSpaces(group);
  if (spaces.length === 0) return false;
  return spaces.every((s) => state.properties[s.index]?.ownerId === playerId);
}

export function countOwnedInGroup(
  state: GameState,
  playerId: string,
  group: ColorGroup
): number {
  return getColorGroupSpaces(group).filter(
    (s) => state.properties[s.index]?.ownerId === playerId
  ).length;
}

export function getPlayerProperties(state: GameState, playerId: string): number[] {
  return Object.entries(state.properties)
    .filter(([, prop]) => prop.ownerId === playerId)
    .map(([idx]) => Number(idx))
    .sort((a, b) => a - b);
}

export function calculateRent(
  state: GameState,
  spaceIndex: number,
  diceTotal: number,
  cardOverride: GameState['pendingCardRentOverride'] = null
): number {
  const space = BOARD_SPACES[spaceIndex];
  const prop = state.properties[spaceIndex];
  if (!space || !prop || !prop.ownerId || prop.mortgaged) return 0;

  if (space.type === 'railroad') {
    const ownedRailroads = countOwnedInGroup(state, prop.ownerId, 'railroad');
    const baseRent = 25 * Math.pow(2, Math.max(0, ownedRailroads - 1));
    if (cardOverride && cardOverride.type === 'railroad') {
      return baseRent * cardOverride.multiplier;
    }
    return baseRent;
  }

  if (space.type === 'utility') {
    if (cardOverride && cardOverride.type === 'utility') {
      return diceTotal * cardOverride.multiplier;
    }
    const ownedUtilities = countOwnedInGroup(state, prop.ownerId, 'utility');
    const multiplier = ownedUtilities >= 2 ? 10 : 4;
    return diceTotal * multiplier;
  }

  if (space.type === 'property' && space.rent && space.colorGroup) {
    if (prop.houses > 0) {
      return space.rent[Math.min(5, prop.houses)];
    }
    const base = space.rent[0];
    const hasMonopoly = ownsFullColorGroup(state, prop.ownerId, space.colorGroup);
    return hasMonopoly ? base * 2 : base;
  }

  return 0;
}

export function getUnmortgageCost(spaceIndex: number): number {
  const space = BOARD_SPACES[spaceIndex];
  if (!space?.mortgage) return 0;
  return space.mortgage + Math.ceil(space.mortgage / 10);
}

export function canBuildHouse(
  state: GameState,
  playerId: string,
  spaceIndex: number
): { allowed: boolean; reason?: string } {
  const space = BOARD_SPACES[spaceIndex];
  const prop = state.properties[spaceIndex];
  const player = getPlayerById(state, playerId);

  if (!player || player.bankrupt) return { allowed: false, reason: 'Player inactive' };
  if (!space || space.type !== 'property' || !space.colorGroup || !space.houseCost) {
    return { allowed: false, reason: 'Cannot build on this space' };
  }
  if (!prop || prop.ownerId !== playerId) {
    return { allowed: false, reason: 'You do not own this property' };
  }
  if (!ownsFullColorGroup(state, playerId, space.colorGroup)) {
    return { allowed: false, reason: 'Must own full color group' };
  }

  const groupSpaces = getColorGroupSpaces(space.colorGroup);
  if (groupSpaces.some((s) => state.properties[s.index]?.mortgaged)) {
    return { allowed: false, reason: 'Cannot build while any property in group is mortgaged' };
  }

  if (prop.houses >= 5) {
    return { allowed: false, reason: 'Already has a Hotel' };
  }

  // Even building rule: cannot build on a property if another in the group has fewer houses
  const minHouses = Math.min(...groupSpaces.map((s) => state.properties[s.index].houses));
  if (prop.houses > minHouses) {
    return { allowed: false, reason: 'Must build evenly across color group' };
  }

  if (player.cash < space.houseCost) {
    return { allowed: false, reason: `Need $${space.houseCost}` };
  }

  if (prop.houses === 4) {
    if (state.bankHotels <= 0) {
      return { allowed: false, reason: 'No hotels left in the Bank' };
    }
  } else {
    if (state.bankHouses <= 0) {
      return { allowed: false, reason: 'Housing shortage: no houses left in the Bank' };
    }
  }

  return { allowed: true };
}

export function canSellHouse(
  state: GameState,
  playerId: string,
  spaceIndex: number
): { allowed: boolean; reason?: string } {
  const space = BOARD_SPACES[spaceIndex];
  const prop = state.properties[spaceIndex];
  const player = getPlayerById(state, playerId);

  if (!player || player.bankrupt) return { allowed: false, reason: 'Player inactive' };
  if (!space || space.type !== 'property' || !space.colorGroup || !space.houseCost) {
    return { allowed: false, reason: 'No buildings on this space' };
  }
  if (!prop || prop.ownerId !== playerId || prop.houses <= 0) {
    return { allowed: false, reason: 'No buildings to sell' };
  }

  const groupSpaces = getColorGroupSpaces(space.colorGroup);
  const maxHouses = Math.max(...groupSpaces.map((s) => state.properties[s.index].houses));
  if (prop.houses < maxHouses) {
    return { allowed: false, reason: 'Must sell evenly from highest-developed property first' };
  }

  // Downgrading hotel back to 4 houses requires 4 houses in bank (or selling whole group)
  if (prop.houses === 5 && state.bankHouses < 4) {
    return { allowed: false, reason: 'Bank needs 4 houses to break a hotel' };
  }

  return { allowed: true };
}

export function canMortgage(
  state: GameState,
  playerId: string,
  spaceIndex: number
): { allowed: boolean; reason?: string } {
  const space = BOARD_SPACES[spaceIndex];
  const prop = state.properties[spaceIndex];
  if (!space || !prop || prop.ownerId !== playerId) {
    return { allowed: false, reason: 'Not owned by you' };
  }
  if (prop.mortgaged) {
    return { allowed: false, reason: 'Already mortgaged' };
  }
  if (space.type === 'property' && space.colorGroup) {
    const groupSpaces = getColorGroupSpaces(space.colorGroup);
    if (groupSpaces.some((s) => state.properties[s.index].houses > 0)) {
      return { allowed: false, reason: 'Sell all buildings in this color group first' };
    }
  }
  return { allowed: true };
}

export function canUnmortgage(
  state: GameState,
  playerId: string,
  spaceIndex: number
): { allowed: boolean; reason?: string } {
  const prop = state.properties[spaceIndex];
  const player = getPlayerById(state, playerId);
  if (!player || !prop || prop.ownerId !== playerId) {
    return { allowed: false, reason: 'Not owned by you' };
  }
  if (!prop.mortgaged) {
    return { allowed: false, reason: 'Not mortgaged' };
  }
  const cost = getUnmortgageCost(spaceIndex);
  if (player.cash < cost) {
    return { allowed: false, reason: `Need $${cost}` };
  }
  return { allowed: true };
}

export function getPlayerNetWorth(state: GameState, playerId: string): number {
  const player = getPlayerById(state, playerId);
  if (!player || player.bankrupt) return 0;
  let total = player.cash;
  for (const idx of getPlayerProperties(state, playerId)) {
    const space = BOARD_SPACES[idx];
    const prop = state.properties[idx];
    if (prop.mortgaged) {
      total += space.mortgage ?? 0;
    } else {
      total += space.price ?? 0;
    }
    if (prop.houses > 0 && space.houseCost) {
      total += prop.houses * space.houseCost;
    }
  }
  return total;
}

export function getPlayerLiquidationCapacity(state: GameState, playerId: string): number {
  const player = getPlayerById(state, playerId);
  if (!player || player.bankrupt) return 0;
  let raisable = player.cash;
  for (const idx of getPlayerProperties(state, playerId)) {
    const space = BOARD_SPACES[idx];
    const prop = state.properties[idx];
    if (prop.houses > 0 && space.houseCost) {
      raisable += prop.houses * Math.floor(space.houseCost / 2);
    }
    if (!prop.mortgaged && space.mortgage) {
      raisable += space.mortgage;
    }
  }
  return raisable;
}

function getPostActionPhase(state: GameState): TurnPhase {
  const active = getActivePlayer(state);
  if (state.winnerId) return 'game_over';
  if (state.debt) return 'debt_resolution';
  if (state.pendingSteps.length > 0) return 'moving';
  if (state.lastRollWasDoubles && !active.inJail && !active.bankrupt) {
    return 'awaiting_roll';
  }
  return 'turn_end';
}

function chargePlayer(
  state: GameState,
  debtorId: string,
  creditorId: string | null,
  amount: number,
  reason: string
): GameState {
  if (amount <= 0) {
    return { ...state, phase: getPostActionPhase(state) };
  }

  const debtor = getPlayerById(state, debtorId);
  if (!debtor || debtor.bankrupt) return state;

  if (debtor.cash >= amount) {
    let next = updatePlayer(state, debtorId, (p) => ({ ...p, cash: p.cash - amount }));
    if (creditorId) {
      next = updatePlayer(next, creditorId, (p) => ({ ...p, cash: p.cash + amount }));
      const creditor = getPlayerById(next, creditorId);
      next = addTransfer(next, debtorId, creditorId, amount, reason);
      next = addLog(
        next,
        `${debtor.name} paid $${amount} to ${creditor?.name ?? 'Player'} (${reason}).`,
        'money'
      );
    } else {
      next = addTransfer(next, debtorId, 'bank', amount, reason);
      next = {
        ...next,
        freeParkingPot: next.freeParkingPot + amount,
      };
      next = addLog(next, `${debtor.name} paid $${amount} to the Bank (${reason}).`, 'money');
    }
    return { ...next, phase: getPostActionPhase(next) };
  }

  // Player cannot currently cover the charge -> enter Debt Resolution
  const creditorLabel = creditorId
    ? getPlayerById(state, creditorId)?.name ?? 'Player'
    : 'the Bank';
  const next: GameState = {
    ...state,
    debt: {
      debtorId,
      creditorId,
      amount,
      reason,
    },
    phase: 'debt_resolution',
  };
  return addLog(
    next,
    `${debtor.name} owes $${amount} to ${creditorLabel} (${reason}) — raise cash or declare bankruptcy.`,
    'alert'
  );
}

export function settleDebt(state: GameState): GameState {
  if (!state.debt) return state;
  const { debtorId, creditorId, amount, reason } = state.debt;
  const debtor = getPlayerById(state, debtorId);
  if (!debtor || debtor.cash < amount) return state;

  const cleared: GameState = { ...state, debt: null };
  return chargePlayer(cleared, debtorId, creditorId, amount, reason);
}

function sendPlayerToJail(state: GameState, playerId: string, reason: string): GameState {
  const player = getPlayerById(state, playerId);
  if (!player) return state;
  let next = updatePlayer(state, playerId, (p) => ({
    ...p,
    position: 10,
    inJail: true,
    jailTurns: 0,
    doublesCount: 0,
  }));
  next = {
    ...next,
    lastRollWasDoubles: false,
    pendingSteps: [],
    pendingCardRentOverride: null,
    phase: 'turn_end',
  };
  return addLog(next, `${player.name} was sent directly to Jail (${reason}).`, 'alert');
}

function buildForwardSteps(from: number, steps: number): number[] {
  const queue: number[] = [];
  for (let i = 1; i <= steps; i++) {
    queue.push((from + i) % 40);
  }
  return queue;
}

function buildForwardStepsToTarget(from: number, target: number): number[] {
  const dist = (target - from + 40) % 40;
  if (dist === 0) return [];
  return buildForwardSteps(from, dist);
}

function buildBackwardSteps(from: number, steps: number): number[] {
  const queue: number[] = [];
  for (let i = 1; i <= steps; i++) {
    queue.push((from - i + 40) % 40);
  }
  return queue;
}

export function rollDiceAndStartMove(
  state: GameState,
  forcedDice?: [number, number],
  rng: () => number = Math.random
): GameState {
  if (state.phase !== 'awaiting_roll') return state;
  const active = getActivePlayer(state);
  if (!active || active.bankrupt) return state;

  const d1 = forcedDice ? forcedDice[0] : Math.floor(rng() * 6) + 1;
  const d2 = forcedDice ? forcedDice[1] : Math.floor(rng() * 6) + 1;
  const total = d1 + d2;
  const isDoubles = d1 === d2;

  let next: GameState = {
    ...state,
    dice: [d1, d2],
    hasRolledThisTurn: true,
    pendingCardRentOverride: null,
  };

  if (active.inJail) {
    if (isDoubles) {
      next = updatePlayer(next, active.id, (p) => ({
        ...p,
        inJail: false,
        jailTurns: 0,
        doublesCount: 0,
      }));
      next = {
        ...next,
        lastRollWasDoubles: false, // Official rule: rolling doubles out of jail does not grant another turn
        pendingSteps: buildForwardSteps(10, total),
        phase: 'moving',
      };
      return addLog(
        next,
        `${active.name} rolled doubles (${d1} + ${d2}) and escaped Jail! Moving ${total} spaces.`,
        'neutral'
      );
    }

    const newJailTurns = active.jailTurns + 1;
    if (newJailTurns >= 3) {
      // 3rd failed roll -> must pay $50 fine and move by rolled dice
      next = updatePlayer(next, active.id, (p) => ({
        ...p,
        inJail: false,
        jailTurns: 0,
        doublesCount: 0,
      }));
      next = {
        ...next,
        lastRollWasDoubles: false,
        pendingSteps: buildForwardSteps(10, total),
      };
      next = addLog(
        next,
        `${active.name} rolled ${d1} + ${d2} on 3rd Jail turn — mandatory $${JAIL_FINE} fine.`,
        'alert'
      );
      return chargePlayer(next, active.id, null, JAIL_FINE, 'Mandatory Jail Release Fine');
    }

    next = updatePlayer(next, active.id, (p) => ({
      ...p,
      jailTurns: newJailTurns,
    }));
    next = {
      ...next,
      lastRollWasDoubles: false,
      phase: 'turn_end',
    };
    return addLog(
      next,
      `${active.name} rolled ${d1} + ${d2} (no doubles) and remains in Jail (attempt ${newJailTurns}/3).`,
      'neutral'
    );
  }

  // Normal roll (not in jail)
  if (isDoubles) {
    const newDoublesCount = active.doublesCount + 1;
    if (newDoublesCount >= 3) {
      return sendPlayerToJail(next, active.id, '3 consecutive doubles');
    }
    next = updatePlayer(next, active.id, (p) => ({
      ...p,
      doublesCount: newDoublesCount,
    }));
    next = {
      ...next,
      lastRollWasDoubles: true,
      pendingSteps: buildForwardSteps(active.position, total),
      phase: 'moving',
    };
    return addLog(
      next,
      `${active.name} rolled doubles ${d1} + ${d2} (${total})! Extra turn earned.`,
      'neutral'
    );
  }

  next = updatePlayer(next, active.id, (p) => ({
    ...p,
    doublesCount: 0,
  }));
  next = {
    ...next,
    lastRollWasDoubles: false,
    pendingSteps: buildForwardSteps(active.position, total),
    phase: 'moving',
  };
  return addLog(next, `${active.name} rolled ${d1} + ${d2} (${total}).`, 'neutral');
}

export function payJailFine(state: GameState): GameState {
  if (state.phase !== 'awaiting_roll') return state;
  const active = getActivePlayer(state);
  if (!active || !active.inJail || active.cash < JAIL_FINE) return state;

  let next = updatePlayer(state, active.id, (p) => ({
    ...p,
    cash: p.cash - JAIL_FINE,
    inJail: false,
    jailTurns: 0,
  }));
  next = addTransfer(next, active.id, 'bank', JAIL_FINE, 'Jail Bail');
  next = { ...next, freeParkingPot: next.freeParkingPot + JAIL_FINE };
  return addLog(
    next,
    `${active.name} paid $${JAIL_FINE} bail and is now Just Visiting. Roll to move!`,
    'money'
  );
}

export function useJailFreeCard(state: GameState): GameState {
  if (state.phase !== 'awaiting_roll') return state;
  const active = getActivePlayer(state);
  if (!active || !active.inJail || active.getOutOfJailCards.length === 0) return state;

  const [usedDeck, ...remainingCards] = active.getOutOfJailCards;
  let next = updatePlayer(state, active.id, (p) => ({
    ...p,
    inJail: false,
    jailTurns: 0,
    getOutOfJailCards: remainingCards,
  }));

  // Return the card to its respective discard pile
  if (usedDeck === 'chance') {
    next = { ...next, chanceDiscard: [...next.chanceDiscard, 'ch_8'] };
  } else {
    next = { ...next, communityDiscard: [...next.communityDiscard, 'cc_5'] };
  }

  return addLog(
    next,
    `${active.name} used a Get Out of Jail Free card! Roll the dice to move.`,
    'card'
  );
}

export function stepTokenOneSpace(state: GameState, rng: () => number = Math.random): GameState {
  if (state.phase !== 'moving' || state.pendingSteps.length === 0) return state;
  const active = getActivePlayer(state);
  if (!active) return state;

  const [nextPos, ...restSteps] = state.pendingSteps;
  const prevPos = active.position;
  const passedGo = prevPos === 39 && nextPos === 0;

  let next = updatePlayer(state, active.id, (p) => ({
    ...p,
    position: nextPos,
    cash: passedGo ? p.cash + GO_SALARY : p.cash,
  }));
  next = {
    ...next,
    pendingSteps: restSteps,
  };

  if (passedGo) {
    next = addTransfer(next, 'bank', active.id, GO_SALARY, 'Passed GO');
    next = addLog(next, `${active.name} passed GO and collected $${GO_SALARY}!`, 'money');
  }

  if (restSteps.length === 0) {
    return resolveCurrentSpace(next, rng);
  }
  return next;
}

function drawCardFromDeck(
  state: GameState,
  deckType: CardDeckType,
  rng: () => number
): { state: GameState; cardId: string } {
  let deck = deckType === 'chance' ? [...state.chanceDeck] : [...state.communityDeck];
  let discard = deckType === 'chance' ? [...state.chanceDiscard] : [...state.communityDiscard];

  if (deck.length === 0) {
    deck = shuffleIds(discard, rng);
    discard = [];
  }

  const cardId = deck.shift()!;
  const nextState: GameState =
    deckType === 'chance'
      ? { ...state, chanceDeck: deck, chanceDiscard: discard }
      : { ...state, communityDeck: deck, communityDiscard: discard };

  return { state: nextState, cardId };
}

export function resolveCurrentSpace(
  state: GameState,
  rng: () => number = Math.random
): GameState {
  const active = getActivePlayer(state);
  if (!active) return state;
  const space = BOARD_SPACES[active.position];

  if (space.type === 'go' || space.type === 'jail' || space.type === 'freeParking') {
    const next = { ...state, pendingCardRentOverride: null, phase: getPostActionPhase(state) };
    if (space.type === 'freeParking') {
      return addLog(next, `${active.name} rested at Free Parking.`, 'neutral');
    }
    return next;
  }

  if (space.type === 'goToJail') {
    return sendPlayerToJail(state, active.id, 'landed on Go To Jail');
  }

  if (space.type === 'tax' && space.taxAmount) {
    return chargePlayer(state, active.id, null, space.taxAmount, space.name);
  }

  if (space.type === 'chance' || space.type === 'communityChest') {
    const deckType: CardDeckType = space.type === 'chance' ? 'chance' : 'communityChest';
    const { state: afterDraw, cardId } = drawCardFromDeck(state, deckType, rng);
    const card = ALL_CARDS_BY_ID[cardId];
    const next: GameState = {
      ...afterDraw,
      drawnCard: { card, playerId: active.id },
      phase: 'card_reveal',
    };
    return addLog(
      next,
      `${active.name} drew ${deckType === 'chance' ? 'Chance' : 'Community Chest'}: "${card.title}".`,
      'card'
    );
  }

  if (isOwnableSpace(space)) {
    const prop = state.properties[space.index];
    if (!prop.ownerId) {
      const next: GameState = {
        ...state,
        pendingCardRentOverride: null,
        phase: 'awaiting_buy_decision',
      };
      return addLog(
        next,
        `${active.name} landed on unowned ${space.name} ($${space.price}). Buy or Auction!`,
        'property'
      );
    }

    if (prop.ownerId === active.id) {
      const next: GameState = {
        ...state,
        pendingCardRentOverride: null,
        phase: getPostActionPhase(state),
      };
      return addLog(next, `${active.name} visited their own property, ${space.name}.`, 'neutral');
    }

    if (prop.mortgaged) {
      const next: GameState = {
        ...state,
        pendingCardRentOverride: null,
        phase: getPostActionPhase(state),
      };
      return addLog(
        next,
        `${active.name} landed on ${space.name}, which is mortgaged — no rent owed.`,
        'neutral'
      );
    }

    const diceTotal = state.dice[0] + state.dice[1];
    const rent = calculateRent(state, space.index, diceTotal, state.pendingCardRentOverride);
    const cleared: GameState = { ...state, pendingCardRentOverride: null };
    return chargePlayer(cleared, active.id, prop.ownerId, rent, `Rent for ${space.name}`);
  }

  return { ...state, phase: getPostActionPhase(state) };
}

export function buyCurrentProperty(state: GameState): GameState {
  if (state.phase !== 'awaiting_buy_decision') return state;
  const active = getActivePlayer(state);
  const space = BOARD_SPACES[active.position];
  const prop = state.properties[space.index];

  if (!space.price || !prop || prop.ownerId !== null || active.cash < space.price) {
    return state;
  }

  let next = updatePlayer(state, active.id, (p) => ({
    ...p,
    cash: p.cash - space.price!,
  }));
  next = {
    ...next,
    properties: {
      ...next.properties,
      [space.index]: {
        ...prop,
        ownerId: active.id,
      },
    },
  };
  next = addTransfer(next, active.id, 'bank', space.price, `Bought ${space.shortName}`);
  next = addLog(next, `${active.name} purchased ${space.name} for $${space.price}!`, 'property');
  return { ...next, phase: getPostActionPhase(next) };
}

export function startAuction(state: GameState, spaceIndex?: number): GameState {
  const active = getActivePlayer(state);
  const targetIndex = spaceIndex ?? active.position;
  const space = BOARD_SPACES[targetIndex];
  if (!space || !isOwnableSpace(space)) return state;

  const eligibleBidders = state.players
    .filter((p) => !p.bankrupt)
    .map((p) => p.id);

  if (eligibleBidders.length === 0) {
    return { ...state, phase: getPostActionPhase(state) };
  }

  // Start bidding with active player (or first solvent player)
  const startIdx = Math.max(0, eligibleBidders.indexOf(active.id));
  const ordered = [
    ...eligibleBidders.slice(startIdx),
    ...eligibleBidders.slice(0, startIdx),
  ];

  const auction: AuctionState = {
    spaceIndex: targetIndex,
    currentBid: 0,
    highestBidderId: null,
    activeBidderIds: ordered,
    currentTurnBidderIndex: 0,
  };

  return addLog(
    {
      ...state,
      auction,
      phase: 'auction',
    },
    `Auction opened for ${space.name}! All players may bid.`,
    'property'
  );
}

export function placeAuctionBid(
  state: GameState,
  playerId: string,
  bidAmount: number
): GameState {
  if (state.phase !== 'auction' || !state.auction) return state;
  const { auction } = state;
  const currentBidderId = auction.activeBidderIds[auction.currentTurnBidderIndex];
  if (currentBidderId !== playerId) return state;

  const player = getPlayerById(state, playerId);
  if (!player || player.bankrupt) return state;

  const minRequired = auction.currentBid === 0 ? 10 : auction.currentBid + 10;
  if (bidAmount < minRequired || bidAmount > player.cash) return state;

  // If only one bidder remains, they win immediately at their bid
  if (auction.activeBidderIds.length === 1) {
    return finalizeAuction(
      {
        ...state,
        auction: {
          ...auction,
          currentBid: bidAmount,
          highestBidderId: playerId,
        },
      },
      playerId,
      bidAmount
    );
  }

  const nextBidderIndex = (auction.currentTurnBidderIndex + 1) % auction.activeBidderIds.length;
  const next: GameState = {
    ...state,
    auction: {
      ...auction,
      currentBid: bidAmount,
      highestBidderId: playerId,
      currentTurnBidderIndex: nextBidderIndex,
    },
  };
  return addLog(
    next,
    `${player.name} bid $${bidAmount} for ${BOARD_SPACES[auction.spaceIndex].shortName}.`,
    'property'
  );
}

export function passAuction(state: GameState, playerId: string): GameState {
  if (state.phase !== 'auction' || !state.auction) return state;
  const { auction } = state;
  const currentBidderId = auction.activeBidderIds[auction.currentTurnBidderIndex];
  if (currentBidderId !== playerId) return state;

  const player = getPlayerById(state, playerId);
  const remaining = auction.activeBidderIds.filter((id) => id !== playerId);

  // If nobody bid and nobody is left, property remains unowned
  if (remaining.length === 0) {
    const next: GameState = {
      ...state,
      auction: null,
      phase: getPostActionPhase({ ...state, auction: null }),
    };
    return addLog(
      next,
      `No bids placed for ${BOARD_SPACES[auction.spaceIndex].name}. It remains with the Bank.`,
      'neutral'
    );
  }

  // If 1 bidder left AND they are already the highest bidder, they win!
  if (remaining.length === 1 && auction.highestBidderId === remaining[0]) {
    return finalizeAuction(state, auction.highestBidderId, auction.currentBid);
  }

  const nextTurnIdx = auction.currentTurnBidderIndex % remaining.length;
  const next: GameState = {
    ...state,
    auction: {
      ...auction,
      activeBidderIds: remaining,
      currentTurnBidderIndex: nextTurnIdx,
    },
  };
  return addLog(next, `${player?.name ?? 'Player'} passed in the auction.`, 'neutral');
}

function finalizeAuction(
  state: GameState,
  winnerId: string,
  winningBid: number
): GameState {
  if (!state.auction) return state;
  const space = BOARD_SPACES[state.auction.spaceIndex];
  const winner = getPlayerById(state, winnerId);
  if (!winner) return state;

  let next = updatePlayer(state, winnerId, (p) => ({
    ...p,
    cash: p.cash - winningBid,
  }));
  next = {
    ...next,
    properties: {
      ...next.properties,
      [space.index]: {
        ...next.properties[space.index],
        ownerId: winnerId,
      },
    },
    auction: null,
  };
  next = addTransfer(next, winnerId, 'bank', winningBid, `Won Auction: ${space.shortName}`);
  next = addLog(
    next,
    `SOLD! ${winner.name} won ${space.name} at auction for $${winningBid}!`,
    'property'
  );
  return { ...next, phase: getPostActionPhase(next) };
}

export function resolveDrawnCard(state: GameState, rng: () => number = Math.random): GameState {
  if (state.phase !== 'card_reveal' || !state.drawnCard) return state;
  const { card, playerId } = state.drawnCard;
  const player = getPlayerById(state, playerId);
  if (!player) return state;

  let next: GameState = {
    ...state,
    drawnCard: null,
  };

  // Discard unless Get Out of Jail Free
  if (card.effect.kind !== 'getOutOfJailFree') {
    if (card.deck === 'chance') {
      next = { ...next, chanceDiscard: [...next.chanceDiscard, card.id] };
    } else {
      next = { ...next, communityDiscard: [...next.communityDiscard, card.id] };
    }
  }

  const effect = card.effect;

  switch (effect.kind) {
    case 'getOutOfJailFree': {
      next = updatePlayer(next, playerId, (p) => ({
        ...p,
        getOutOfJailCards: [...p.getOutOfJailCards, card.deck],
      }));
      next = addLog(next, `${player.name} kept a Get Out of Jail Free card.`, 'card');
      return { ...next, phase: getPostActionPhase(next) };
    }

    case 'goToJail': {
      return sendPlayerToJail(next, playerId, `${card.deck === 'chance' ? 'Chance' : 'Community Chest'} card`);
    }

    case 'bankMoney': {
      if (effect.amount >= 0) {
        next = updatePlayer(next, playerId, (p) => ({
          ...p,
          cash: p.cash + effect.amount,
        }));
        next = addTransfer(next, 'bank', playerId, effect.amount, card.title);
        next = addLog(next, `${player.name} collected $${effect.amount} (${card.title}).`, 'money');
        return { ...next, phase: getPostActionPhase(next) };
      }
      return chargePlayer(next, playerId, null, Math.abs(effect.amount), card.title);
    }

    case 'eachPlayer': {
      const others = next.players.filter((p) => !p.bankrupt && p.id !== playerId);
      if (effect.amount > 0) {
        let totalCollected = 0;
        for (const other of others) {
          const paid = Math.min(other.cash, effect.amount);
          totalCollected += paid;
          next = updatePlayer(next, other.id, (p) => ({ ...p, cash: p.cash - paid }));
          next = addTransfer(next, other.id, playerId, paid, card.title);
        }
        next = updatePlayer(next, playerId, (p) => ({ ...p, cash: p.cash + totalCollected }));
        next = addLog(
          next,
          `${player.name} collected $${totalCollected} total from other players (${card.title}).`,
          'money'
        );
        return { ...next, phase: getPostActionPhase(next) };
      } else {
        const perPlayer = Math.abs(effect.amount);
        const totalOwed = perPlayer * others.length;
        if (player.cash >= totalOwed) {
          next = updatePlayer(next, playerId, (p) => ({ ...p, cash: p.cash - totalOwed }));
          for (const other of others) {
            next = updatePlayer(next, other.id, (p) => ({ ...p, cash: p.cash + perPlayer }));
            next = addTransfer(next, playerId, other.id, perPlayer, card.title);
          }
          next = addLog(
            next,
            `${player.name} paid $${perPlayer} to each player ($${totalOwed} total).`,
            'money'
          );
          return { ...next, phase: getPostActionPhase(next) };
        }
        // If short on cash, resolve total debt through the Bank first
        return chargePlayer(next, playerId, null, totalOwed, card.title);
      }
    }

    case 'repairs': {
      let houses = 0;
      let hotels = 0;
      for (const idx of getPlayerProperties(next, playerId)) {
        const prop = next.properties[idx];
        if (prop.houses === 5) hotels += 1;
        else houses += prop.houses;
      }
      const totalCost = houses * effect.perHouse + hotels * effect.perHotel;
      if (totalCost === 0) {
        next = addLog(next, `${player.name} owns no buildings — $0 repairs owed.`, 'neutral');
        return { ...next, phase: getPostActionPhase(next) };
      }
      return chargePlayer(
        next,
        playerId,
        null,
        totalCost,
        `${card.title} (${houses}H / ${hotels}Ht)`
      );
    }

    case 'advanceTo': {
      const steps = buildForwardStepsToTarget(player.position, effect.targetIndex);
      if (steps.length === 0) {
        return resolveCurrentSpace(next, rng);
      }
      return {
        ...next,
        pendingSteps: steps,
        phase: 'moving',
      };
    }

    case 'advanceNearest': {
      const targets = effect.targetType === 'railroad' ? [5, 15, 25, 35] : [12, 28];
      let nearest = targets[0];
      let minDist = 41;
      for (const t of targets) {
        const d = (t - player.position + 40) % 40;
        const forwardDist = d === 0 ? 40 : d;
        if (forwardDist < minDist) {
          minDist = forwardDist;
          nearest = t;
        }
      }
      const steps = buildForwardStepsToTarget(player.position, nearest);
      // For nearest Utility, classic card specifies throwing dice to determine 10x rent
      const utilityDice: [number, number] =
        effect.targetType === 'utility'
          ? [Math.floor(rng() * 6) + 1, Math.floor(rng() * 6) + 1]
          : next.dice;
      return {
        ...next,
        dice: utilityDice,
        pendingCardRentOverride: {
          type: effect.targetType,
          multiplier: effect.rentMultiplier,
        },
        pendingSteps: steps,
        phase: 'moving',
      };
    }

    case 'goBack': {
      const steps = buildBackwardSteps(player.position, effect.steps);
      return {
        ...next,
        pendingSteps: steps,
        phase: 'moving',
      };
    }
  }
}

export function buildHouse(state: GameState, playerId: string, spaceIndex: number): GameState {
  const check = canBuildHouse(state, playerId, spaceIndex);
  if (!check.allowed) return state;

  const space = BOARD_SPACES[spaceIndex];
  const prop = state.properties[spaceIndex];
  const player = getPlayerById(state, playerId)!;
  const cost = space.houseCost!;
  const isHotelUpgrade = prop.houses === 4;

  let next = updatePlayer(state, playerId, (p) => ({
    ...p,
    cash: p.cash - cost,
  }));

  next = {
    ...next,
    properties: {
      ...next.properties,
      [spaceIndex]: {
        ...prop,
        houses: prop.houses + 1,
      },
    },
    // Upgrading 4 houses -> hotel returns 4 houses to the bank and takes 1 hotel
    bankHouses: isHotelUpgrade ? next.bankHouses + 4 : next.bankHouses - 1,
    bankHotels: isHotelUpgrade ? next.bankHotels - 1 : next.bankHotels,
  };

  next = addTransfer(
    next,
    playerId,
    'bank',
    cost,
    isHotelUpgrade ? `Hotel on ${space.shortName}` : `House on ${space.shortName}`
  );
  return addLog(
    next,
    `${player.name} built a ${isHotelUpgrade ? 'Hotel' : 'House'} on ${space.name} for $${cost}.`,
    'property'
  );
}

export function sellHouse(state: GameState, playerId: string, spaceIndex: number): GameState {
  const check = canSellHouse(state, playerId, spaceIndex);
  if (!check.allowed) return state;

  const space = BOARD_SPACES[spaceIndex];
  const prop = state.properties[spaceIndex];
  const player = getPlayerById(state, playerId)!;
  const refund = Math.floor(space.houseCost! / 2);
  const isHotelDowngrade = prop.houses === 5;

  let next = updatePlayer(state, playerId, (p) => ({
    ...p,
    cash: p.cash + refund,
  }));

  next = {
    ...next,
    properties: {
      ...next.properties,
      [spaceIndex]: {
        ...prop,
        houses: prop.houses - 1,
      },
    },
    bankHouses: isHotelDowngrade ? next.bankHouses - 4 : next.bankHouses + 1,
    bankHotels: isHotelDowngrade ? next.bankHotels + 1 : next.bankHotels,
  };

  next = addTransfer(
    next,
    'bank',
    playerId,
    refund,
    isHotelDowngrade ? `Sold Hotel on ${space.shortName}` : `Sold House on ${space.shortName}`
  );
  return addLog(
    next,
    `${player.name} sold a ${isHotelDowngrade ? 'Hotel' : 'House'} on ${space.name} for $${refund}.`,
    'money'
  );
}

export function mortgageProperty(
  state: GameState,
  playerId: string,
  spaceIndex: number
): GameState {
  const check = canMortgage(state, playerId, spaceIndex);
  if (!check.allowed) return state;

  const space = BOARD_SPACES[spaceIndex];
  const prop = state.properties[spaceIndex];
  const player = getPlayerById(state, playerId)!;
  const payout = space.mortgage!;

  let next = updatePlayer(state, playerId, (p) => ({
    ...p,
    cash: p.cash + payout,
  }));
  next = {
    ...next,
    properties: {
      ...next.properties,
      [spaceIndex]: {
        ...prop,
        mortgaged: true,
      },
    },
  };
  next = addTransfer(next, 'bank', playerId, payout, `Mortgaged ${space.shortName}`);
  return addLog(next, `${player.name} mortgaged ${space.name} for $${payout}.`, 'money');
}

export function unmortgageProperty(
  state: GameState,
  playerId: string,
  spaceIndex: number
): GameState {
  const check = canUnmortgage(state, playerId, spaceIndex);
  if (!check.allowed) return state;

  const space = BOARD_SPACES[spaceIndex];
  const prop = state.properties[spaceIndex];
  const player = getPlayerById(state, playerId)!;
  const cost = getUnmortgageCost(spaceIndex);

  let next = updatePlayer(state, playerId, (p) => ({
    ...p,
    cash: p.cash - cost,
  }));
  next = {
    ...next,
    properties: {
      ...next.properties,
      [spaceIndex]: {
        ...prop,
        mortgaged: false,
      },
    },
  };
  next = addTransfer(next, playerId, 'bank', cost, `Unmortgaged ${space.shortName}`);
  return addLog(next, `${player.name} lifted mortgage on ${space.name} for $${cost}.`, 'property');
}

export function canExecuteTrade(
  state: GameState,
  offer: TradeOffer
): { valid: boolean; reason?: string } {
  const from = getPlayerById(state, offer.fromPlayerId);
  const to = getPlayerById(state, offer.toPlayerId);
  if (!from || !to || from.bankrupt || to.bankrupt || from.id === to.id) {
    return { valid: false, reason: 'Invalid trade participants' };
  }
  if (offer.offerCash < 0 || offer.requestCash < 0) {
    return { valid: false, reason: 'Cash amounts must be positive' };
  }
  if (from.cash < offer.offerCash) {
    return { valid: false, reason: `${from.name} lacks $${offer.offerCash}` };
  }
  if (to.cash < offer.requestCash) {
    return { valid: false, reason: `${to.name} lacks $${offer.requestCash}` };
  }
  if (offer.offerJailCards > from.getOutOfJailCards.length) {
    return { valid: false, reason: 'Not enough Jail Free cards offered' };
  }
  if (offer.requestJailCards > to.getOutOfJailCards.length) {
    return { valid: false, reason: 'Partner lacks requested Jail Free cards' };
  }

  const checkProps = (indices: number[], ownerId: string): string | null => {
    for (const idx of indices) {
      const prop = state.properties[idx];
      const space = BOARD_SPACES[idx];
      if (!prop || prop.ownerId !== ownerId) return `${space?.name ?? idx} is not owned`;
      if (space.type === 'property' && space.colorGroup) {
        const groupSpaces = getColorGroupSpaces(space.colorGroup);
        if (groupSpaces.some((s) => state.properties[s.index].houses > 0)) {
          return `Must sell buildings in ${space.colorGroup} group before trading ${space.shortName}`;
        }
      }
    }
    return null;
  };

  const errFrom = checkProps(offer.offerProperties, from.id);
  if (errFrom) return { valid: false, reason: errFrom };
  const errTo = checkProps(offer.requestProperties, to.id);
  if (errTo) return { valid: false, reason: errTo };

  const hasAnything =
    offer.offerCash > 0 ||
    offer.requestCash > 0 ||
    offer.offerProperties.length > 0 ||
    offer.requestProperties.length > 0 ||
    offer.offerJailCards > 0 ||
    offer.requestJailCards > 0;

  if (!hasAnything) {
    return { valid: false, reason: 'Add cash, properties, or cards to trade' };
  }

  return { valid: true };
}

export function executeTrade(state: GameState, offer: TradeOffer): GameState {
  const check = canExecuteTrade(state, offer);
  if (!check.valid) return state;

  const from = getPlayerById(state, offer.fromPlayerId)!;
  const to = getPlayerById(state, offer.toPlayerId)!;

  const fromJailGive = from.getOutOfJailCards.slice(0, offer.offerJailCards);
  const fromJailKeep = from.getOutOfJailCards.slice(offer.offerJailCards);
  const toJailGive = to.getOutOfJailCards.slice(0, offer.requestJailCards);
  const toJailKeep = to.getOutOfJailCards.slice(offer.requestJailCards);

  let next = updatePlayer(state, from.id, (p) => ({
    ...p,
    cash: p.cash - offer.offerCash + offer.requestCash,
    getOutOfJailCards: [...fromJailKeep, ...toJailGive],
  }));

  next = updatePlayer(next, to.id, (p) => ({
    ...p,
    cash: p.cash + offer.offerCash - offer.requestCash,
    getOutOfJailCards: [...toJailKeep, ...fromJailGive],
  }));

  const updatedProps = { ...next.properties };
  for (const idx of offer.offerProperties) {
    updatedProps[idx] = { ...updatedProps[idx], ownerId: to.id };
  }
  for (const idx of offer.requestProperties) {
    updatedProps[idx] = { ...updatedProps[idx], ownerId: from.id };
  }
  next = { ...next, properties: updatedProps };

  if (offer.offerCash > 0) {
    next = addTransfer(next, from.id, to.id, offer.offerCash, 'Trade Deal');
  }
  if (offer.requestCash > 0) {
    next = addTransfer(next, to.id, from.id, offer.requestCash, 'Trade Deal');
  }

  return addLog(
    next,
    `Trade completed between ${from.name} and ${to.name}!`,
    'property'
  );
}

export function declareBankruptcy(
  state: GameState,
  playerId: string,
  creditorId: string | null = null
): GameState {
  const player = getPlayerById(state, playerId);
  if (!player || player.bankrupt) return state;

  const effectiveCreditor = creditorId ?? state.debt?.creditorId ?? null;
  let next = state;
  let bankHouses = next.bankHouses;
  let bankHotels = next.bankHotels;
  const updatedProps = { ...next.properties };

  // Liquidate all buildings back to the Bank
  let liquidatedCash = player.cash;
  for (const idx of getPlayerProperties(next, playerId)) {
    const prop = updatedProps[idx];
    const space = BOARD_SPACES[idx];
    if (prop.houses > 0 && space.houseCost) {
      if (prop.houses === 5) {
        bankHotels += 1;
        liquidatedCash += Math.floor((space.houseCost * 5) / 2);
      } else {
        bankHouses += prop.houses;
        liquidatedCash += Math.floor((space.houseCost * prop.houses) / 2);
      }
    }
    if (effectiveCreditor) {
      updatedProps[idx] = {
        ownerId: effectiveCreditor,
        houses: 0,
        mortgaged: prop.mortgaged,
      };
    } else {
      updatedProps[idx] = {
        ownerId: null,
        houses: 0,
        mortgaged: false,
      };
    }
  }

  if (effectiveCreditor) {
    next = updatePlayer(next, effectiveCreditor, (p) => ({
      ...p,
      cash: p.cash + Math.max(0, liquidatedCash),
      getOutOfJailCards: [...p.getOutOfJailCards, ...player.getOutOfJailCards],
    }));
    if (liquidatedCash > 0) {
      next = addTransfer(next, playerId, effectiveCreditor, liquidatedCash, 'Bankruptcy Assets');
    }
  } else {
    // Return held Jail Free cards to their discard piles
    let chanceDiscard = [...next.chanceDiscard];
    let communityDiscard = [...next.communityDiscard];
    for (const deck of player.getOutOfJailCards) {
      if (deck === 'chance') chanceDiscard.push('ch_8');
      else communityDiscard.push('cc_5');
    }
    next = { ...next, chanceDiscard, communityDiscard };
  }

  next = updatePlayer(next, playerId, (p) => ({
    ...p,
    cash: 0,
    bankrupt: true,
    inJail: false,
    getOutOfJailCards: [],
  }));

  next = {
    ...next,
    properties: updatedProps,
    bankHouses: Math.min(BANK_INITIAL_HOUSES, bankHouses),
    bankHotels: Math.min(BANK_INITIAL_HOTELS, bankHotels),
    debt: null,
    pendingSteps: [],
    lastRollWasDoubles: false,
  };

  const creditorName = effectiveCreditor
    ? getPlayerById(next, effectiveCreditor)?.name ?? 'Player'
    : 'the Bank';
  next = addLog(
    next,
    `${player.name} declared BANKRUPTCY! Assets transferred to ${creditorName}.`,
    'alert'
  );

  // Check if only one solvent player remains -> Victory!
  const solvent = getSolventPlayers(next);
  if (solvent.length === 1) {
    next = {
      ...next,
      winnerId: solvent[0].id,
      phase: 'game_over',
    };
    return addLog(
      next,
      `${solvent[0].name} is the last tycoon standing and WINS the game!`,
      'property'
    );
  }

  // Advance turn if the bankrupt player was the active player
  if (getActivePlayer(next).id === playerId) {
    return advanceToNextPlayer(next);
  }
  return { ...next, phase: getPostActionPhase(next) };
}

function advanceToNextPlayer(state: GameState): GameState {
  const count = state.players.length;
  let nextIdx = (state.currentPlayerIndex + 1) % count;
  let safety = 0;
  while (state.players[nextIdx].bankrupt && safety < count) {
    nextIdx = (nextIdx + 1) % count;
    safety++;
  }

  const nextPlayer = state.players[nextIdx];
  let next = updatePlayer(state, nextPlayer.id, (p) => ({
    ...p,
    doublesCount: 0,
  }));

  next = {
    ...next,
    currentPlayerIndex: nextIdx,
    hasRolledThisTurn: false,
    lastRollWasDoubles: false,
    pendingSteps: [],
    pendingCardRentOverride: null,
    phase: 'awaiting_roll',
    turnNumber: state.turnNumber + 1,
  };

  return addLog(next, `It is now ${nextPlayer.name}'s turn.`, 'neutral');
}

export function endTurn(state: GameState): GameState {
  if (state.phase !== 'turn_end') return state;
  if (state.debt || state.winnerId) return state;
  return advanceToNextPlayer(state);
}
