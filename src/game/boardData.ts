import type { ColorGroup, SpaceData, SpaceGeometry, TokenId } from './types';

export const BOARD_SIZE = 1000;
export const CORNER_SIZE = 132;
export const EDGE_WIDTH = (BOARD_SIZE - CORNER_SIZE * 2) / 9; // ~81.7778
export const EDGE_HEIGHT = CORNER_SIZE;

// Full Tabletop World dimensions (Board sits centered inside the mahogany/baize table)
export const WORLD_WIDTH = 1820;
export const WORLD_HEIGHT = 1160;
export const BOARD_ORIGIN_X = (WORLD_WIDTH - BOARD_SIZE) / 2; // 410
export const BOARD_ORIGIN_Y = (WORLD_HEIGHT - BOARD_SIZE) / 2; // 80

export const COLOR_GROUP_HEX: Record<ColorGroup, string> = {
  brown: '#8B4513',
  lightBlue: '#7EC8E3',
  pink: '#D93A96',
  orange: '#F58220',
  red: '#E11D2E',
  yellow: '#F5DC1C',
  green: '#1E9E52',
  darkBlue: '#0068B5',
  railroad: '#22262A',
  utility: '#4A5568',
};

export const COLOR_GROUP_LABEL: Record<ColorGroup, string> = {
  brown: 'Brown',
  lightBlue: 'Light Blue',
  pink: 'Pink',
  orange: 'Orange',
  red: 'Red',
  yellow: 'Yellow',
  green: 'Green',
  darkBlue: 'Dark Blue',
  railroad: 'Railroad',
  utility: 'Utility',
};

export const ALL_TOKENS: { id: TokenId; name: string; tagline: string }[] = [
  { id: 'tophat', name: 'Top Hat', tagline: 'Classic Silk' },
  { id: 'dog', name: 'Scottie Dog', tagline: 'Terrier' },
  { id: 'car', name: 'Race Car', tagline: 'Grand Prix' },
  { id: 'battleship', name: 'Battleship', tagline: 'Dreadnought' },
  { id: 'thimble', name: 'Thimble', tagline: 'Tailor Silver' },
  { id: 'boot', name: 'Boot', tagline: 'Workhorse' },
  { id: 'wheelbarrow', name: 'Wheelbarrow', tagline: 'Builder' },
  { id: 'iron', name: 'Flat Iron', tagline: 'Vintage Press' },
];

export const PLAYER_ACCENTS = ['#C99738', '#C84B31', '#2E86AB', '#6B8E4E'];

export const BOARD_SPACES: SpaceData[] = [
  { index: 0, name: 'GO', shortName: 'GO', type: 'go' },
  {
    index: 1,
    name: 'Mediterranean Avenue',
    shortName: 'Mediterranean Ave',
    type: 'property',
    colorGroup: 'brown',
    price: 60,
    rent: [2, 10, 30, 90, 160, 250],
    houseCost: 50,
    mortgage: 30,
  },
  { index: 2, name: 'Community Chest', shortName: 'Community Chest', type: 'communityChest' },
  {
    index: 3,
    name: 'Baltic Avenue',
    shortName: 'Baltic Ave',
    type: 'property',
    colorGroup: 'brown',
    price: 60,
    rent: [4, 20, 60, 180, 320, 450],
    houseCost: 50,
    mortgage: 30,
  },
  { index: 4, name: 'Income Tax', shortName: 'Income Tax', type: 'tax', taxAmount: 200 },
  {
    index: 5,
    name: 'Reading Railroad',
    shortName: 'Reading RR',
    type: 'railroad',
    colorGroup: 'railroad',
    price: 200,
    mortgage: 100,
  },
  {
    index: 6,
    name: 'Oriental Avenue',
    shortName: 'Oriental Ave',
    type: 'property',
    colorGroup: 'lightBlue',
    price: 100,
    rent: [6, 30, 90, 270, 400, 550],
    houseCost: 50,
    mortgage: 50,
  },
  { index: 7, name: 'Chance', shortName: 'Chance', type: 'chance' },
  {
    index: 8,
    name: 'Vermont Avenue',
    shortName: 'Vermont Ave',
    type: 'property',
    colorGroup: 'lightBlue',
    price: 100,
    rent: [6, 30, 90, 270, 400, 550],
    houseCost: 50,
    mortgage: 50,
  },
  {
    index: 9,
    name: 'Connecticut Avenue',
    shortName: 'Connecticut Ave',
    type: 'property',
    colorGroup: 'lightBlue',
    price: 120,
    rent: [8, 40, 100, 300, 450, 600],
    houseCost: 50,
    mortgage: 60,
  },
  { index: 10, name: 'Jail / Just Visiting', shortName: 'Jail', type: 'jail' },
  {
    index: 11,
    name: 'St. Charles Place',
    shortName: 'St. Charles Pl',
    type: 'property',
    colorGroup: 'pink',
    price: 140,
    rent: [10, 50, 150, 450, 625, 750],
    houseCost: 100,
    mortgage: 70,
  },
  {
    index: 12,
    name: 'Electric Company',
    shortName: 'Electric Co.',
    type: 'utility',
    colorGroup: 'utility',
    price: 150,
    mortgage: 75,
  },
  {
    index: 13,
    name: 'States Avenue',
    shortName: 'States Ave',
    type: 'property',
    colorGroup: 'pink',
    price: 140,
    rent: [10, 50, 150, 450, 625, 750],
    houseCost: 100,
    mortgage: 70,
  },
  {
    index: 14,
    name: 'Virginia Avenue',
    shortName: 'Virginia Ave',
    type: 'property',
    colorGroup: 'pink',
    price: 160,
    rent: [12, 60, 180, 500, 700, 900],
    houseCost: 100,
    mortgage: 80,
  },
  {
    index: 15,
    name: 'Pennsylvania Railroad',
    shortName: 'Penn. RR',
    type: 'railroad',
    colorGroup: 'railroad',
    price: 200,
    mortgage: 100,
  },
  {
    index: 16,
    name: 'St. James Place',
    shortName: 'St. James Pl',
    type: 'property',
    colorGroup: 'orange',
    price: 180,
    rent: [14, 70, 200, 550, 750, 950],
    houseCost: 100,
    mortgage: 90,
  },
  { index: 17, name: 'Community Chest', shortName: 'Community Chest', type: 'communityChest' },
  {
    index: 18,
    name: 'Tennessee Avenue',
    shortName: 'Tennessee Ave',
    type: 'property',
    colorGroup: 'orange',
    price: 180,
    rent: [14, 70, 200, 550, 750, 950],
    houseCost: 100,
    mortgage: 90,
  },
  {
    index: 19,
    name: 'New York Avenue',
    shortName: 'New York Ave',
    type: 'property',
    colorGroup: 'orange',
    price: 200,
    rent: [16, 80, 220, 600, 800, 1000],
    houseCost: 100,
    mortgage: 100,
  },
  { index: 20, name: 'Free Parking', shortName: 'Free Parking', type: 'freeParking' },
  {
    index: 21,
    name: 'Kentucky Avenue',
    shortName: 'Kentucky Ave',
    type: 'property',
    colorGroup: 'red',
    price: 220,
    rent: [18, 90, 250, 700, 875, 1050],
    houseCost: 150,
    mortgage: 110,
  },
  { index: 22, name: 'Chance', shortName: 'Chance', type: 'chance' },
  {
    index: 23,
    name: 'Indiana Avenue',
    shortName: 'Indiana Ave',
    type: 'property',
    colorGroup: 'red',
    price: 220,
    rent: [18, 90, 250, 700, 875, 1050],
    houseCost: 150,
    mortgage: 110,
  },
  {
    index: 24,
    name: 'Illinois Avenue',
    shortName: 'Illinois Ave',
    type: 'property',
    colorGroup: 'red',
    price: 240,
    rent: [20, 100, 300, 750, 925, 1100],
    houseCost: 150,
    mortgage: 120,
  },
  {
    index: 25,
    name: 'B. & O. Railroad',
    shortName: 'B. & O. RR',
    type: 'railroad',
    colorGroup: 'railroad',
    price: 200,
    mortgage: 100,
  },
  {
    index: 26,
    name: 'Atlantic Avenue',
    shortName: 'Atlantic Ave',
    type: 'property',
    colorGroup: 'yellow',
    price: 260,
    rent: [22, 110, 330, 800, 975, 1150],
    houseCost: 150,
    mortgage: 130,
  },
  {
    index: 27,
    name: 'Ventnor Avenue',
    shortName: 'Ventnor Ave',
    type: 'property',
    colorGroup: 'yellow',
    price: 260,
    rent: [22, 110, 330, 800, 975, 1150],
    houseCost: 150,
    mortgage: 130,
  },
  {
    index: 28,
    name: 'Water Works',
    shortName: 'Water Works',
    type: 'utility',
    colorGroup: 'utility',
    price: 150,
    mortgage: 75,
  },
  {
    index: 29,
    name: 'Marvin Gardens',
    shortName: 'Marvin Gardens',
    type: 'property',
    colorGroup: 'yellow',
    price: 280,
    rent: [24, 120, 360, 850, 1025, 1200],
    houseCost: 150,
    mortgage: 140,
  },
  { index: 30, name: 'Go To Jail', shortName: 'Go To Jail', type: 'goToJail' },
  {
    index: 31,
    name: 'Pacific Avenue',
    shortName: 'Pacific Ave',
    type: 'property',
    colorGroup: 'green',
    price: 300,
    rent: [26, 130, 390, 900, 1100, 1275],
    houseCost: 200,
    mortgage: 150,
  },
  {
    index: 32,
    name: 'North Carolina Avenue',
    shortName: 'N. Carolina Ave',
    type: 'property',
    colorGroup: 'green',
    price: 300,
    rent: [26, 130, 390, 900, 1100, 1275],
    houseCost: 200,
    mortgage: 150,
  },
  { index: 33, name: 'Community Chest', shortName: 'Community Chest', type: 'communityChest' },
  {
    index: 34,
    name: 'Pennsylvania Avenue',
    shortName: 'Pennsylvania Ave',
    type: 'property',
    colorGroup: 'green',
    price: 320,
    rent: [28, 150, 450, 1000, 1200, 1400],
    houseCost: 200,
    mortgage: 160,
  },
  {
    index: 35,
    name: 'Short Line',
    shortName: 'Short Line RR',
    type: 'railroad',
    colorGroup: 'railroad',
    price: 200,
    mortgage: 100,
  },
  { index: 36, name: 'Chance', shortName: 'Chance', type: 'chance' },
  {
    index: 37,
    name: 'Park Place',
    shortName: 'Park Place',
    type: 'property',
    colorGroup: 'darkBlue',
    price: 350,
    rent: [35, 175, 500, 1100, 1300, 1500],
    houseCost: 200,
    mortgage: 175,
  },
  { index: 38, name: 'Luxury Tax', shortName: 'Luxury Tax', type: 'tax', taxAmount: 100 },
  {
    index: 39,
    name: 'Boardwalk',
    shortName: 'Boardwalk',
    type: 'property',
    colorGroup: 'darkBlue',
    price: 400,
    rent: [50, 200, 600, 1400, 1700, 2000],
    houseCost: 200,
    mortgage: 200,
  },
];

export const OWNABLE_TYPES = new Set(['property', 'railroad', 'utility']);

export function isOwnableSpace(space: SpaceData): boolean {
  return OWNABLE_TYPES.has(space.type);
}

export function getColorGroupSpaces(group: ColorGroup): SpaceData[] {
  return BOARD_SPACES.filter((s) => s.colorGroup === group);
}

/**
 * Exact 2D geometry for all 40 spaces on the 1000x1000 Monopoly board.
 * Index 0 (GO) is bottom-right, going clockwise:
 * 0: bottom-right corner
 * 1..9: bottom edge (right to left)
 * 10: bottom-left corner (Jail)
 * 11..19: left edge (bottom to top)
 * 20: top-left corner (Free Parking)
 * 21..29: top edge (left to right)
 * 30: top-right corner (Go To Jail)
 * 31..39: right edge (top to bottom)
 */
export function getSpaceGeometry(index: number): SpaceGeometry {
  const idx = ((index % 40) + 40) % 40;

  if (idx === 0) {
    const x = BOARD_SIZE - CORNER_SIZE;
    const y = BOARD_SIZE - CORNER_SIZE;
    return {
      index: idx,
      x,
      y,
      width: CORNER_SIZE,
      height: CORNER_SIZE,
      centerX: x + CORNER_SIZE / 2,
      centerY: y + CORNER_SIZE / 2,
      side: 'corner',
      rotation: 0,
    };
  }

  if (idx >= 1 && idx <= 9) {
    const slot = 9 - idx; // 1 -> 8 (rightmost), 9 -> 0 (leftmost)
    const x = CORNER_SIZE + slot * EDGE_WIDTH;
    const y = BOARD_SIZE - EDGE_HEIGHT;
    return {
      index: idx,
      x,
      y,
      width: EDGE_WIDTH,
      height: EDGE_HEIGHT,
      centerX: x + EDGE_WIDTH / 2,
      centerY: y + EDGE_HEIGHT / 2,
      side: 'bottom',
      rotation: 0,
    };
  }

  if (idx === 10) {
    return {
      index: idx,
      x: 0,
      y: BOARD_SIZE - CORNER_SIZE,
      width: CORNER_SIZE,
      height: CORNER_SIZE,
      centerX: CORNER_SIZE / 2,
      centerY: BOARD_SIZE - CORNER_SIZE / 2,
      side: 'corner',
      rotation: 0,
    };
  }

  if (idx >= 11 && idx <= 19) {
    const slot = 19 - idx; // 11 -> 8 (bottommost), 19 -> 0 (topmost)
    const x = 0;
    const y = CORNER_SIZE + slot * EDGE_WIDTH;
    return {
      index: idx,
      x,
      y,
      width: EDGE_HEIGHT,
      height: EDGE_WIDTH,
      centerX: EDGE_HEIGHT / 2,
      centerY: y + EDGE_WIDTH / 2,
      side: 'left',
      rotation: 90,
    };
  }

  if (idx === 20) {
    return {
      index: idx,
      x: 0,
      y: 0,
      width: CORNER_SIZE,
      height: CORNER_SIZE,
      centerX: CORNER_SIZE / 2,
      centerY: CORNER_SIZE / 2,
      side: 'corner',
      rotation: 0,
    };
  }

  if (idx >= 21 && idx <= 29) {
    const slot = idx - 21; // 21 -> 0 (leftmost), 29 -> 8 (rightmost)
    const x = CORNER_SIZE + slot * EDGE_WIDTH;
    const y = 0;
    return {
      index: idx,
      x,
      y,
      width: EDGE_WIDTH,
      height: EDGE_HEIGHT,
      centerX: x + EDGE_WIDTH / 2,
      centerY: EDGE_HEIGHT / 2,
      side: 'top',
      rotation: 180,
    };
  }

  if (idx === 30) {
    const x = BOARD_SIZE - CORNER_SIZE;
    return {
      index: idx,
      x,
      y: 0,
      width: CORNER_SIZE,
      height: CORNER_SIZE,
      centerX: x + CORNER_SIZE / 2,
      centerY: CORNER_SIZE / 2,
      side: 'corner',
      rotation: 0,
    };
  }

  // 31..39 right edge (top to bottom)
  const slot = idx - 31;
  const x = BOARD_SIZE - EDGE_HEIGHT;
  const y = CORNER_SIZE + slot * EDGE_WIDTH;
  return {
    index: idx,
    x,
    y,
    width: EDGE_HEIGHT,
    height: EDGE_WIDTH,
    centerX: x + EDGE_HEIGHT / 2,
    centerY: y + EDGE_WIDTH / 2,
    side: 'right',
    rotation: 270,
  };
}

export const SPACE_GEOMETRIES: SpaceGeometry[] = Array.from({ length: 40 }, (_, i) =>
  getSpaceGeometry(i)
);

/**
 * Returns the board-space (x, y) for a player's silver token, neatly offsetting
 * multiple tokens on the same space and separating "In Jail" from "Just Visiting".
 */
export function getTokenBoardPosition(
  spaceIndex: number,
  slotIndex: number,
  totalInSlot: number,
  inJail: boolean
): { x: number; y: number } {
  const geom = SPACE_GEOMETRIES[spaceIndex];

  // Special handling for Jail corner (index 10)
  if (spaceIndex === 10) {
    if (inJail) {
      // Inside the orange barred cell (top-right quadrant of space 10)
      const jailOffsets = [
        { dx: 16, dy: -22 },
        { dx: 36, dy: -22 },
        { dx: 16, dy: 0 },
        { dx: 36, dy: 0 },
      ];
      const off = jailOffsets[slotIndex % jailOffsets.length];
      return { x: geom.centerX + off.dx, y: geom.centerY + off.dy };
    } else {
      // Just Visiting L-strip along left and bottom edges of space 10
      const visitingOffsets = [
        { dx: -44, dy: -20 },
        { dx: -44, dy: 18 },
        { dx: -16, dy: 44 },
        { dx: 22, dy: 44 },
      ];
      const off = visitingOffsets[slotIndex % visitingOffsets.length];
      return { x: geom.centerX + off.dx, y: geom.centerY + off.dy };
    }
  }

  // Spread tokens nicely inside normal tiles, biased slightly away from the color bar
  let baseX = geom.centerX;
  let baseY = geom.centerY;
  if (geom.side === 'bottom') baseY += 12;
  if (geom.side === 'top') baseY -= 12;
  if (geom.side === 'left') baseX -= 12;
  if (geom.side === 'right') baseX += 12;

  if (totalInSlot <= 1) {
    return { x: baseX, y: baseY };
  }

  const spreadOffsets =
    geom.side === 'corner'
      ? [
          { dx: -27, dy: -22 },
          { dx: 27, dy: -22 },
          { dx: -27, dy: 24 },
          { dx: 27, dy: 24 },
        ]
      : [
          { dx: -17, dy: -14 },
          { dx: 17, dy: -14 },
          { dx: -17, dy: 16 },
          { dx: 17, dy: 16 },
        ];
  const off = spreadOffsets[slotIndex % spreadOffsets.length];
  return { x: baseX + off.dx, y: baseY + off.dy };
}

/**
 * Converts a board-relative coordinate (0..1000) to full tabletop world space.
 */
export function boardToWorld(bx: number, by: number): { x: number; y: number } {
  return {
    x: BOARD_ORIGIN_X + bx,
    y: BOARD_ORIGIN_Y + by,
  };
}

/**
 * Returns tabletop world anchor coordinates for each player's table money tray
 * and for the Bank tray (used by flying banknote animations & Action Cam).
 */
export function getMoneyAnchorWorld(entityId: string, playerIndexMap: Record<string, number>): { x: number; y: number } {
  if (entityId === 'bank') {
    return { x: 215, y: 340 };
  }
  const idx = playerIndexMap[entityId] ?? 0;
  return { x: 1605, y: 205 + idx * 240 };
}
