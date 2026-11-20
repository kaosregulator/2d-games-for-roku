import test from 'node:test';
import assert from 'node:assert/strict';
import { BOARD_SPACES } from './boardData';
import { CHANCE_CARDS, COMMUNITY_CHEST_CARDS } from './cards';
import { decomposeCashToBills, STARTING_CASH } from './money';
import {
  BANK_INITIAL_HOTELS,
  BANK_INITIAL_HOUSES,
  buildHouse,
  buyCurrentProperty,
  calculateRent,
  canBuildHouse,
  createInitialGameState,
  declareBankruptcy,
  endTurn,
  executeTrade,
  getUnmortgageCost,
  mortgageProperty,
  passAuction,
  payJailFine,
  placeAuctionBid,
  resolveDrawnCard,
  rollDiceAndStartMove,
  sellHouse,
  settleDebt,
  startAuction,
  stepTokenOneSpace,
  unmortgageProperty,
  useJailFreeCard,
} from './engine';
import type { GameState, PlayerSetupConfig } from './types';

const TWO_PLAYERS: PlayerSetupConfig[] = [
  { id: 'p1', name: 'Alice', token: 'tophat', isAI: false, accentColor: '#C99738' },
  { id: 'p2', name: 'Bob', token: 'car', isAI: true, accentColor: '#C84B31' },
];

function stepAllPending(state: GameState): GameState {
  let s = state;
  let guard = 0;
  while (s.phase === 'moving' && s.pendingSteps.length > 0 && guard < 50) {
    s = stepTokenOneSpace(s, () => 0.5);
    guard++;
  }
  return s;
}

test('board has all 40 spaces, 16 Chance cards, 16 Community Chest cards, and exact $1,500 bill kit', () => {
  assert.equal(BOARD_SPACES.length, 40);
  assert.equal(CHANCE_CARDS.length, 16);
  assert.equal(COMMUNITY_CHEST_CARDS.length, 16);

  const bills = decomposeCashToBills(STARTING_CASH);
  const sum = Object.entries(bills).reduce((acc, [denom, count]) => acc + Number(denom) * count, 0);
  assert.equal(sum, 1500);
});

test('movement steps one tile at a time, passes GO for +$200, and prompts buy on unowned property', () => {
  let state = createInitialGameState(TWO_PLAYERS, () => 0.1);
  // Move player 1 to space 37 (Park Place), then roll 4 -> lands on space 1 (Mediterranean Ave) passing GO
  state = {
    ...state,
    players: state.players.map((p, i) => (i === 0 ? { ...p, position: 37 } : p)),
  };

  state = rollDiceAndStartMove(state, [1, 3]);
  assert.equal(state.phase, 'moving');
  assert.deepEqual(state.pendingSteps, [38, 39, 0, 1]);

  state = stepAllPending(state);
  assert.equal(state.players[0].position, 1);
  assert.equal(state.players[0].cash, 1700); // 1500 + 200 GO salary
  assert.equal(state.phase, 'awaiting_buy_decision');

  state = buyCurrentProperty(state);
  assert.equal(state.properties[1].ownerId, 'p1');
  assert.equal(state.players[0].cash, 1640); // 1700 - 60
  assert.equal(state.phase, 'turn_end');
});

test('three consecutive doubles sends player directly to Jail without collecting GO', () => {
  let state = createInitialGameState(TWO_PLAYERS, () => 0.2);

  // 1st double: 2+2 = 4 (Income Tax)
  state = rollDiceAndStartMove(state, [2, 2]);
  state = stepAllPending(state);
  assert.equal(state.phase, 'awaiting_roll'); // doubles grants extra roll
  assert.equal(state.players[0].doublesCount, 1);

  // 2nd double: 3+3 = 6 -> lands on Jail Just Visiting (10)
  state = rollDiceAndStartMove(state, [3, 3]);
  state = stepAllPending(state);
  assert.equal(state.players[0].position, 10);
  assert.equal(state.players[0].inJail, false);
  assert.equal(state.phase, 'awaiting_roll');
  assert.equal(state.players[0].doublesCount, 2);

  // 3rd double: immediately sent to Jail!
  state = rollDiceAndStartMove(state, [4, 4]);
  assert.equal(state.players[0].inJail, true);
  assert.equal(state.players[0].position, 10);
  assert.equal(state.phase, 'turn_end');
});

test('declining purchase starts mandatory auction and highest bidder wins', () => {
  let state = createInitialGameState(TWO_PLAYERS, () => 0.1);
  state = rollDiceAndStartMove(state, [1, 2]); // lands on Baltic Ave (3)
  state = stepAllPending(state);
  assert.equal(state.phase, 'awaiting_buy_decision');

  state = startAuction(state);
  assert.equal(state.phase, 'auction');
  assert.ok(state.auction);

  // Alice bids $20, Bob bids $40, Alice passes -> Bob wins Baltic Ave for $40
  state = placeAuctionBid(state, 'p1', 20);
  state = placeAuctionBid(state, 'p2', 40);
  state = passAuction(state, 'p1');

  assert.equal(state.phase, 'turn_end');
  assert.equal(state.properties[3].ownerId, 'p2');
  assert.equal(state.players[1].cash, 1460);
});

test('rent calculation enforces monopoly double rent, houses, hotels, railroads, utilities, and mortgage $0', () => {
  let state = createInitialGameState(TWO_PLAYERS, () => 0.1);
  // Give p1 Mediterranean (1) only
  state = {
    ...state,
    properties: {
      ...state.properties,
      1: { ownerId: 'p1', houses: 0, mortgaged: false },
    },
  };
  assert.equal(calculateRent(state, 1, 7), 2);

  // Give p1 Baltic (3) too -> full brown monopoly doubles base rent
  state = {
    ...state,
    properties: {
      ...state.properties,
      3: { ownerId: 'p1', houses: 0, mortgaged: false },
    },
  };
  assert.equal(calculateRent(state, 1, 7), 4);
  assert.equal(calculateRent(state, 3, 7), 8);

  // Even building rule: build on 1 -> cannot build 2nd on 1 until 3 has 1
  state = buildHouse(state, 'p1', 1);
  assert.equal(state.properties[1].houses, 1);
  assert.equal(state.bankHouses, BANK_INITIAL_HOUSES - 1);
  assert.equal(calculateRent(state, 1, 7), 10);
  assert.equal(canBuildHouse(state, 'p1', 1).allowed, false);

  // Build on 3 -> now can build 2nd on 1
  state = buildHouse(state, 'p1', 3);
  assert.equal(canBuildHouse(state, 'p1', 1).allowed, true);

  // Upgrade both to 4 houses then 1 hotel -> bank houses return +4 and bankHotels -1
  state = buildHouse(state, 'p1', 1);
  state = buildHouse(state, 'p1', 3);
  state = buildHouse(state, 'p1', 1);
  state = buildHouse(state, 'p1', 3);
  state = buildHouse(state, 'p1', 1);
  state = buildHouse(state, 'p1', 3);
  assert.equal(state.bankHouses, BANK_INITIAL_HOUSES - 8);
  state = buildHouse(state, 'p1', 1); // Hotel on Mediterranean
  assert.equal(state.properties[1].houses, 5);
  assert.equal(state.bankHotels, BANK_INITIAL_HOTELS - 1);
  assert.equal(state.bankHouses, BANK_INITIAL_HOUSES - 4);
  assert.equal(calculateRent(state, 1, 7), 250);

  // Sell hotel back down
  state = sellHouse(state, 'p1', 1);
  assert.equal(state.properties[1].houses, 4);
  assert.equal(state.bankHotels, BANK_INITIAL_HOTELS);

  // Railroads & Utilities
  state = {
    ...state,
    properties: {
      ...state.properties,
      5: { ownerId: 'p2', houses: 0, mortgaged: false },
      15: { ownerId: 'p2', houses: 0, mortgaged: false },
      25: { ownerId: 'p2', houses: 0, mortgaged: false },
      12: { ownerId: 'p2', houses: 0, mortgaged: false },
      28: { ownerId: 'p2', houses: 0, mortgaged: false },
    },
  };
  assert.equal(calculateRent(state, 5, 7), 100); // 3 railroads
  assert.equal(calculateRent(state, 5, 7, { type: 'railroad', multiplier: 2 }), 200); // Chance 2x RR
  assert.equal(calculateRent(state, 12, 8), 80); // 2 utilities -> 10x dice

  // Mortgaged collects $0
  state = mortgageProperty(state, 'p2', 5);
  assert.equal(calculateRent(state, 5, 7), 0);
  const unmortgageCost = getUnmortgageCost(5);
  assert.equal(unmortgageCost, 110); // $100 + 10%
  state = unmortgageProperty(state, 'p2', 5);
  assert.equal(state.properties[5].mortgaged, false);
});

test('Jail escape paths: pay $50 fine, use Get Out of Jail Free card, or 3rd roll mandatory fine', () => {
  let state = createInitialGameState(TWO_PLAYERS, () => 0.1);
  state = {
    ...state,
    players: state.players.map((p, i) =>
      i === 0 ? { ...p, position: 10, inJail: true, getOutOfJailCards: ['chance'] } : p
    ),
  };

  // Path A: use card
  const afterCard = useJailFreeCard(state);
  assert.equal(afterCard.players[0].inJail, false);
  assert.equal(afterCard.players[0].getOutOfJailCards.length, 0);

  // Path B: pay $50 fine
  const afterFine = payJailFine(state);
  assert.equal(afterFine.players[0].inJail, false);
  assert.equal(afterFine.players[0].cash, 1450);

  // Path C: 3rd failed roll auto-pays $50 and moves
  let s3 = {
    ...state,
    players: state.players.map((p, i) => (i === 0 ? { ...p, jailTurns: 2 } : p)),
  };
  s3 = rollDiceAndStartMove(s3, [1, 2]);
  assert.equal(s3.players[0].inJail, false);
  assert.equal(s3.players[0].cash, 1450);
  assert.equal(s3.phase, 'moving');
  s3 = stepAllPending(s3);
  assert.equal(s3.players[0].position, 13);
});

test('Chance card Go Back 3 Spaces and Trading & Bankruptcy win condition work cleanly', () => {
  let state = createInitialGameState(TWO_PLAYERS, () => 0.1);
  // Put ch_9 (Go Back 3 Spaces) on top of Chance deck and move p1 to space 7 (Chance)
  state = {
    ...state,
    chanceDeck: ['ch_9', ...state.chanceDeck.filter((id) => id !== 'ch_9')],
  };
  state = rollDiceAndStartMove(state, [3, 4]);
  state = stepAllPending(state);
  assert.equal(state.phase, 'card_reveal');
  assert.equal(state.drawnCard?.card.id, 'ch_9');

  state = resolveDrawnCard(state);
  assert.equal(state.phase, 'moving');
  assert.deepEqual(state.pendingSteps, [6, 5, 4]); // lands on Income Tax ($200)
  state = stepAllPending(state);
  assert.equal(state.players[0].position, 4);
  assert.equal(state.players[0].cash, 1300);

  // Trade property + cash between Alice and Bob
  state = {
    ...state,
    properties: {
      ...state.properties,
      1: { ownerId: 'p1', houses: 0, mortgaged: false },
      3: { ownerId: 'p2', houses: 0, mortgaged: false },
    },
  };
  state = executeTrade(state, {
    fromPlayerId: 'p1',
    toPlayerId: 'p2',
    offerCash: 100,
    requestCash: 0,
    offerProperties: [],
    requestProperties: [3],
    offerJailCards: 0,
    requestJailCards: 0,
  });
  assert.equal(state.properties[3].ownerId, 'p1');
  assert.equal(state.players[0].cash, 1200);
  assert.equal(state.players[1].cash, 1600);

  // Debt resolution & Bankruptcy -> Bob wins!
  state = endTurn(state);
  assert.equal(state.currentPlayerIndex, 1);

  // Simulate p1 owning $2000 debt to p2
  let debtState: GameState = {
    ...state,
    currentPlayerIndex: 0,
    players: state.players.map((p, i) => (i === 0 ? { ...p, cash: 50 } : p)),
    debt: { debtorId: 'p1', creditorId: 'p2', amount: 200, reason: 'Rent' },
    phase: 'debt_resolution',
  };
  // Settle should fail until enough cash
  assert.equal(settleDebt(debtState).phase, 'debt_resolution');
  // Declare bankruptcy -> p2 inherits properties and wins
  const ended = declareBankruptcy(debtState, 'p1', 'p2');
  assert.equal(ended.phase, 'game_over');
  assert.equal(ended.winnerId, 'p2');
  assert.equal(ended.properties[1].ownerId, 'p2');
  assert.equal(ended.properties[3].ownerId, 'p2');
});
