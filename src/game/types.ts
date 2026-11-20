export type TokenId =
  | 'tophat'
  | 'dog'
  | 'car'
  | 'battleship'
  | 'thimble'
  | 'boot'
  | 'wheelbarrow'
  | 'iron';

export type ColorGroup =
  | 'brown'
  | 'lightBlue'
  | 'pink'
  | 'orange'
  | 'red'
  | 'yellow'
  | 'green'
  | 'darkBlue'
  | 'railroad'
  | 'utility';

export type SpaceType =
  | 'go'
  | 'property'
  | 'communityChest'
  | 'tax'
  | 'railroad'
  | 'chance'
  | 'jail'
  | 'utility'
  | 'freeParking'
  | 'goToJail';

export interface SpaceData {
  index: number;
  name: string;
  shortName: string;
  type: SpaceType;
  colorGroup?: ColorGroup;
  price?: number;
  rent?: [number, number, number, number, number, number]; // [base, 1h, 2h, 3h, 4h, hotel]
  houseCost?: number;
  mortgage?: number;
  taxAmount?: number;
}

export type CardDeckType = 'chance' | 'communityChest';

export type CardEffect =
  | { kind: 'advanceTo'; targetIndex: number; collectGo: boolean }
  | { kind: 'advanceNearest'; targetType: 'railroad' | 'utility'; rentMultiplier: number }
  | { kind: 'goBack'; steps: number }
  | { kind: 'goToJail' }
  | { kind: 'getOutOfJailFree' }
  | { kind: 'bankMoney'; amount: number } // positive = receive, negative = pay
  | { kind: 'eachPlayer'; amount: number } // positive = collect from each, negative = pay each
  | { kind: 'repairs'; perHouse: number; perHotel: number };

export interface CardData {
  id: string;
  deck: CardDeckType;
  title: string;
  text: string;
  effect: CardEffect;
}

export interface PlayerSetupConfig {
  id: string;
  name: string;
  token: TokenId;
  isAI: boolean;
  accentColor: string;
}

export interface PlayerState {
  id: string;
  name: string;
  token: TokenId;
  isAI: boolean;
  accentColor: string;
  cash: number;
  position: number;
  inJail: boolean;
  jailTurns: number;
  getOutOfJailCards: CardDeckType[];
  bankrupt: boolean;
  doublesCount: number;
}

export interface PropertyState {
  ownerId: string | null;
  houses: number; // 0..4 houses, 5 = hotel
  mortgaged: boolean;
}

export interface AuctionState {
  spaceIndex: number;
  currentBid: number;
  highestBidderId: string | null;
  activeBidderIds: string[];
  currentTurnBidderIndex: number;
}

export interface TradeOffer {
  fromPlayerId: string;
  toPlayerId: string;
  offerCash: number;
  requestCash: number;
  offerProperties: number[];
  requestProperties: number[];
  offerJailCards: number;
  requestJailCards: number;
}

export interface DebtState {
  debtorId: string;
  creditorId: string | null; // null = Bank
  amount: number;
  reason: string;
}

export interface DrawnCardState {
  card: CardData;
  playerId: string;
}

export interface MoneyTransferEvent {
  id: number;
  from: string; // playerId or 'bank'
  to: string;   // playerId or 'bank'
  amount: number;
  label: string;
  timestamp: number;
}

export interface GameLogEntry {
  id: number;
  turn: number;
  text: string;
  tone: 'neutral' | 'money' | 'property' | 'card' | 'alert';
}

export type TurnPhase =
  | 'awaiting_roll'
  | 'moving'
  | 'awaiting_buy_decision'
  | 'auction'
  | 'card_reveal'
  | 'debt_resolution'
  | 'turn_end'
  | 'game_over';

export type CameraMode = 'action' | 'overview' | 'free';

export interface CameraFocus {
  worldX: number;
  worldY: number;
  zoom: number;
  label: string;
}

export interface GameState {
  players: PlayerState[];
  currentPlayerIndex: number;
  properties: Record<number, PropertyState>;
  bankHouses: number; // max 32
  bankHotels: number; // max 12
  chanceDeck: string[];
  chanceDiscard: string[];
  communityDeck: string[];
  communityDiscard: string[];
  dice: [number, number];
  hasRolledThisTurn: boolean;
  lastRollWasDoubles: boolean;
  pendingSteps: number[]; // queue of board space indices for move-by-move stepping
  pendingCardRentOverride: { type: 'railroad' | 'utility'; multiplier: number } | null;
  phase: TurnPhase;
  auction: AuctionState | null;
  drawnCard: DrawnCardState | null;
  debt: DebtState | null;
  winnerId: string | null;
  turnNumber: number;
  lastActionText: string;
  logs: GameLogEntry[];
  nextLogId: number;
  moneyTransfers: MoneyTransferEvent[];
  nextTransferId: number;
  freeParkingPot: number; // informational only; classic rules don't award free parking
}

export type BillDenomination = 500 | 100 | 50 | 20 | 10 | 5 | 1;

export interface BillMeta {
  value: BillDenomination;
  label: string;
  bg: string;
  border: string;
  ink: string;
  accent: string;
}

export interface SpaceGeometry {
  index: number;
  x: number; // relative to board 0..1000
  y: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  side: 'bottom' | 'left' | 'top' | 'right' | 'corner';
  rotation: number; // degrees for readable outward-facing print
}
