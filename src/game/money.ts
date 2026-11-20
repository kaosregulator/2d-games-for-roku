import type { BillDenomination, BillMeta } from './types';

export const BILL_DENOMINATIONS: BillMeta[] = [
  {
    value: 500,
    label: '$500',
    bg: '#F4C578',
    border: '#B87C22',
    ink: '#5A3604',
    accent: '#DDA144',
  },
  {
    value: 100,
    label: '$100',
    bg: '#F5E0B5',
    border: '#B89756',
    ink: '#4D3B16',
    accent: '#DEC184',
  },
  {
    value: 50,
    label: '$50',
    bg: '#C8D8F0',
    border: '#6383B3',
    ink: '#1E3557',
    accent: '#9CB8E0',
  },
  {
    value: 20,
    label: '$20',
    bg: '#CBE8C8',
    border: '#5E9B5B',
    ink: '#1C471A',
    accent: '#9FD19B',
  },
  {
    value: 10,
    label: '$10',
    bg: '#FBF2B7',
    border: '#BFA93B',
    ink: '#4F4209',
    accent: '#EFE082',
  },
  {
    value: 5,
    label: '$5',
    bg: '#F5C4CC',
    border: '#BD6776',
    ink: '#5B1A26',
    accent: '#E699A6',
  },
  {
    value: 1,
    label: '$1',
    bg: '#F6F4EC',
    border: '#9C988A',
    ink: '#2F2E28',
    accent: '#E2DFD3',
  },
];

export const STARTING_CASH = 1500;

/**
 * Standard Monopoly starting bill kit totaling $1,500:
 * 2x$500 ($1000), 2x$100 ($200), 2x$50 ($100), 6x$20 ($120),
 * 5x$10 ($50), 5x$5 ($25), 5x$1 ($5) = $1,500
 */
export const STARTING_BILL_KIT: Record<BillDenomination, number> = {
  500: 2,
  100: 2,
  50: 2,
  20: 6,
  10: 5,
  5: 5,
  1: 5,
};

/**
 * Decomposes any dollar amount into a realistic physical tabletop stack of bills
 * (keeps some small bills in hand when amount is large so piles look authentic).
 */
export function decomposeCashToBills(amount: number): Record<BillDenomination, number> {
  const result: Record<BillDenomination, number> = {
    500: 0,
    100: 0,
    50: 0,
    20: 0,
    10: 0,
    5: 0,
    1: 0,
  };

  if (amount <= 0) return result;

  if (amount === STARTING_CASH) {
    return { ...STARTING_BILL_KIT };
  }

  let remaining = Math.floor(amount);

  // Reserve a small realistic change pool if player has enough cash
  if (remaining >= 200) {
    result[20] += 3;
    result[10] += 2;
    result[5] += 2;
    result[1] += 5;
    remaining -= 95;
  } else if (remaining >= 50) {
    result[10] += 2;
    result[5] += 2;
    result[1] += 5;
    remaining -= 35;
  }

  const order: BillDenomination[] = [500, 100, 50, 20, 10, 5, 1];
  for (const denom of order) {
    const count = Math.floor(remaining / denom);
    if (count > 0) {
      result[denom] += count;
      remaining -= count * denom;
    }
  }

  return result;
}

export function getDominantBillForAmount(amount: number): BillMeta {
  const abs = Math.abs(amount);
  for (const meta of BILL_DENOMINATIONS) {
    if (abs >= meta.value) return meta;
  }
  return BILL_DENOMINATIONS[BILL_DENOMINATIONS.length - 1];
}
