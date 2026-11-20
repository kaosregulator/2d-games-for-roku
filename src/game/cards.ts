import type { CardData } from './types';

export const CHANCE_CARDS: CardData[] = [
  {
    id: 'ch_1',
    deck: 'chance',
    title: 'Advance to GO',
    text: 'Advance to GO. Collect $200 as you pass.',
    effect: { kind: 'advanceTo', targetIndex: 0, collectGo: true },
  },
  {
    id: 'ch_2',
    deck: 'chance',
    title: 'Advance to Illinois Ave.',
    text: 'Advance to Illinois Avenue. If you pass GO, collect $200.',
    effect: { kind: 'advanceTo', targetIndex: 24, collectGo: true },
  },
  {
    id: 'ch_3',
    deck: 'chance',
    title: 'Advance to St. Charles Place',
    text: 'Advance to St. Charles Place. If you pass GO, collect $200.',
    effect: { kind: 'advanceTo', targetIndex: 11, collectGo: true },
  },
  {
    id: 'ch_4',
    deck: 'chance',
    title: 'Advance to Nearest Utility',
    text: 'Advance token to the nearest Utility. If unowned, you may buy it. If owned, pay owner 10 times dice roll.',
    effect: { kind: 'advanceNearest', targetType: 'utility', rentMultiplier: 10 },
  },
  {
    id: 'ch_5',
    deck: 'chance',
    title: 'Advance to Nearest Railroad',
    text: 'Advance token to the nearest Railroad and pay owner twice the rental to which they are otherwise entitled.',
    effect: { kind: 'advanceNearest', targetType: 'railroad', rentMultiplier: 2 },
  },
  {
    id: 'ch_6',
    deck: 'chance',
    title: 'Advance to Nearest Railroad',
    text: 'Advance token to the nearest Railroad. If owned, pay owner twice the rental.',
    effect: { kind: 'advanceNearest', targetType: 'railroad', rentMultiplier: 2 },
  },
  {
    id: 'ch_7',
    deck: 'chance',
    title: 'Bank Pays Dividend',
    text: 'Bank pays you dividend of $50.',
    effect: { kind: 'bankMoney', amount: 50 },
  },
  {
    id: 'ch_8',
    deck: 'chance',
    title: 'Get Out of Jail Free',
    text: 'This card may be kept until needed, or traded to another player.',
    effect: { kind: 'getOutOfJailFree' },
  },
  {
    id: 'ch_9',
    deck: 'chance',
    title: 'Go Back 3 Spaces',
    text: 'Move your silver token back 3 spaces.',
    effect: { kind: 'goBack', steps: 3 },
  },
  {
    id: 'ch_10',
    deck: 'chance',
    title: 'Go to Jail',
    text: 'Go directly to Jail. Do not pass GO, do not collect $200.',
    effect: { kind: 'goToJail' },
  },
  {
    id: 'ch_11',
    deck: 'chance',
    title: 'General Repairs',
    text: 'Make general repairs on all your property: pay $25 for each house and $100 for each hotel.',
    effect: { kind: 'repairs', perHouse: 25, perHotel: 100 },
  },
  {
    id: 'ch_12',
    deck: 'chance',
    title: 'Speeding Fine',
    text: 'Pay speeding fine of $15 to the Bank.',
    effect: { kind: 'bankMoney', amount: -15 },
  },
  {
    id: 'ch_13',
    deck: 'chance',
    title: 'Take a Trip to Reading',
    text: 'Take a trip to Reading Railroad. If you pass GO, collect $200.',
    effect: { kind: 'advanceTo', targetIndex: 5, collectGo: true },
  },
  {
    id: 'ch_14',
    deck: 'chance',
    title: 'Take a Walk on the Boardwalk',
    text: 'Advance token to Boardwalk.',
    effect: { kind: 'advanceTo', targetIndex: 39, collectGo: true },
  },
  {
    id: 'ch_15',
    deck: 'chance',
    title: 'Chairman of the Board',
    text: 'You have been elected Chairman of the Board. Pay each player $50.',
    effect: { kind: 'eachPlayer', amount: -50 },
  },
  {
    id: 'ch_16',
    deck: 'chance',
    title: 'Building Loan Matures',
    text: 'Your building and loan matures. Collect $150 from the Bank.',
    effect: { kind: 'bankMoney', amount: 150 },
  },
];

export const COMMUNITY_CHEST_CARDS: CardData[] = [
  {
    id: 'cc_1',
    deck: 'communityChest',
    title: 'Advance to GO',
    text: 'Advance to GO. Collect $200.',
    effect: { kind: 'advanceTo', targetIndex: 0, collectGo: true },
  },
  {
    id: 'cc_2',
    deck: 'communityChest',
    title: 'Bank Error in Your Favor',
    text: 'Bank error in your favor. Collect $200.',
    effect: { kind: 'bankMoney', amount: 200 },
  },
  {
    id: 'cc_3',
    deck: 'communityChest',
    title: "Doctor's Fee",
    text: "Doctor's fee. Pay $50 to the Bank.",
    effect: { kind: 'bankMoney', amount: -50 },
  },
  {
    id: 'cc_4',
    deck: 'communityChest',
    title: 'Sale of Stock',
    text: 'From sale of stock you get $50.',
    effect: { kind: 'bankMoney', amount: 50 },
  },
  {
    id: 'cc_5',
    deck: 'communityChest',
    title: 'Get Out of Jail Free',
    text: 'This card may be kept until needed, or traded to another player.',
    effect: { kind: 'getOutOfJailFree' },
  },
  {
    id: 'cc_6',
    deck: 'communityChest',
    title: 'Go to Jail',
    text: 'Go directly to Jail. Do not pass GO, do not collect $200.',
    effect: { kind: 'goToJail' },
  },
  {
    id: 'cc_7',
    deck: 'communityChest',
    title: 'Holiday Fund Matures',
    text: 'Holiday fund matures. Receive $100.',
    effect: { kind: 'bankMoney', amount: 100 },
  },
  {
    id: 'cc_8',
    deck: 'communityChest',
    title: 'Income Tax Refund',
    text: 'Income tax refund. Collect $20.',
    effect: { kind: 'bankMoney', amount: 20 },
  },
  {
    id: 'cc_9',
    deck: 'communityChest',
    title: 'It Is Your Birthday',
    text: 'It is your birthday! Collect $10 from every player.',
    effect: { kind: 'eachPlayer', amount: 10 },
  },
  {
    id: 'cc_10',
    deck: 'communityChest',
    title: 'Life Insurance Matures',
    text: 'Life insurance matures. Collect $100.',
    effect: { kind: 'bankMoney', amount: 100 },
  },
  {
    id: 'cc_11',
    deck: 'communityChest',
    title: 'Hospital Fees',
    text: 'Pay hospital fees of $100.',
    effect: { kind: 'bankMoney', amount: -100 },
  },
  {
    id: 'cc_12',
    deck: 'communityChest',
    title: 'School Fees',
    text: 'Pay school fees of $50.',
    effect: { kind: 'bankMoney', amount: -50 },
  },
  {
    id: 'cc_13',
    deck: 'communityChest',
    title: 'Consultancy Fee',
    text: 'Receive $25 consultancy fee.',
    effect: { kind: 'bankMoney', amount: 25 },
  },
  {
    id: 'cc_14',
    deck: 'communityChest',
    title: 'Street Repairs',
    text: 'You are assessed for street repairs: $40 per house and $115 per hotel.',
    effect: { kind: 'repairs', perHouse: 40, perHotel: 115 },
  },
  {
    id: 'cc_15',
    deck: 'communityChest',
    title: 'Beauty Contest Prize',
    text: 'You have won second prize in a beauty contest. Collect $10.',
    effect: { kind: 'bankMoney', amount: 10 },
  },
  {
    id: 'cc_16',
    deck: 'communityChest',
    title: 'Inheritance',
    text: 'You inherit $100.',
    effect: { kind: 'bankMoney', amount: 100 },
  },
];

export const ALL_CARDS_BY_ID: Record<string, CardData> = Object.fromEntries(
  [...CHANCE_CARDS, ...COMMUNITY_CHEST_CARDS].map((card) => [card.id, card])
);

export function shuffleIds(ids: string[], rng: () => number = Math.random): string[] {
  const arr = [...ids];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
