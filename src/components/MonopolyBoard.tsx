import {
  BOARD_SIZE,
  BOARD_SPACES,
  COLOR_GROUP_HEX,
  CORNER_SIZE,
  EDGE_HEIGHT,
  EDGE_WIDTH,
  getTokenBoardPosition,
  isOwnableSpace,
  SPACE_GEOMETRIES,
} from '../game/boardData';
import type { GameState, SpaceData } from '../game/types';
import { SilverTokenIcon } from './SilverTokens';

interface MonopolyBoardProps {
  state: GameState;
  diceRolling: boolean;
  steppingPlayerId: string | null;
  stepPulseKey: number;
  highlightSpaceIndex: number | null;
  onSelectSpace: (spaceIndex: number) => void;
  onClickDeck: (deck: 'chance' | 'communityChest') => void;
}

function DiceFace({ value, rolling }: { value: number; rolling: boolean }) {
  const pipMap: Record<number, [number, number][]> = {
    1: [[24, 24]],
    2: [
      [13, 13],
      [35, 35],
    ],
    3: [
      [13, 13],
      [24, 24],
      [35, 35],
    ],
    4: [
      [13, 13],
      [35, 13],
      [13, 35],
      [35, 35],
    ],
    5: [
      [13, 13],
      [35, 13],
      [24, 24],
      [13, 35],
      [35, 35],
    ],
    6: [
      [13, 12],
      [35, 12],
      [13, 24],
      [35, 24],
      [13, 36],
      [35, 36],
    ],
  };
  const pips = pipMap[value] ?? pipMap[1];

  return (
    <div
      className={`w-[54px] h-[54px] rounded-[9px] bg-[#FAF6EC] border-2 border-stone-800 shadow-[0_8px_16px_rgba(0,0,0,0.42),inset_0_-3px_5px_rgba(148,130,104,0.35)] flex items-center justify-center ${
        rolling ? 'animate-dice-roll' : ''
      }`}
    >
      <svg width="48" height="48" viewBox="0 0 48 48">
        {pips.map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r="4.3" fill="#1C1917" />
        ))}
      </svg>
    </div>
  );
}

function SpaceArtIcon({ space }: { space: SpaceData }) {
  if (space.type === 'railroad') {
    return (
      <svg width="34" height="24" viewBox="0 0 40 28" fill="none">
        <rect x="6" y="10" width="24" height="10" rx="2" fill="#1C1917" />
        <rect x="24" y="4" width="6" height="8" fill="#1C1917" />
        <rect x="10" y="6" width="5" height="5" fill="#1C1917" />
        <polygon points="30,20 37,20 32,12 30,12" fill="#1C1917" />
        <circle cx="12" cy="22" r="3.5" fill="#44403C" stroke="#1C1917" strokeWidth="1.5" />
        <circle cx="20" cy="22" r="3.5" fill="#44403C" stroke="#1C1917" strokeWidth="1.5" />
        <circle cx="28" cy="22" r="3.5" fill="#44403C" stroke="#1C1917" strokeWidth="1.5" />
      </svg>
    );
  }

  if (space.type === 'chance') {
    return (
      <span
        className="font-display text-[34px] font-extrabold leading-none"
        style={{
          color: space.index === 7 ? '#D9381E' : space.index === 22 ? '#1D4ED8' : '#EA580C',
          textShadow: '0 1px 0 rgba(0,0,0,0.2)',
        }}
      >
        ?
      </span>
    );
  }

  if (space.type === 'communityChest') {
    return (
      <svg width="32" height="26" viewBox="0 0 36 30" fill="none">
        <rect x="4" y="10" width="28" height="16" rx="2" fill="#0284C7" stroke="#0C4A6E" strokeWidth="2" />
        <path d="M4 11 C4 5 32 5 32 11 Z" fill="#38BDF8" stroke="#0C4A6E" strokeWidth="2" />
        <rect x="15" y="12" width="6" height="7" rx="1" fill="#FACC15" stroke="#713F12" strokeWidth="1.2" />
        <circle cx="18" cy="15.5" r="1.2" fill="#713F12" />
      </svg>
    );
  }

  if (space.type === 'utility') {
    if (space.index === 12) {
      // Electric Company Bulb
      return (
        <svg width="28" height="30" viewBox="0 0 32 34" fill="none">
          <path
            d="M16 3 C9.5 3 5 8 5 14 C5 18 7.5 21 10 23.5 L10 27 L22 27 L22 23.5 C24.5 21 27 18 27 14 C27 8 22.5 3 16 3 Z"
            fill="#FEF08A"
            stroke="#854D0E"
            strokeWidth="2"
          />
          <rect x="11" y="27" width="10" height="4" rx="1" fill="#78716C" stroke="#1C1917" strokeWidth="1.5" />
          <path d="M13 15 L16 11 L15 16 L19 13 L16 20" stroke="#B45309" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    }
    // Water Works Faucet
    return (
      <svg width="30" height="28" viewBox="0 0 34 30" fill="none">
        <path d="M6 12 L22 12 C25 12 27 14 27 17 L27 21 L22 21 L22 17 L6 17 Z" fill="#64748B" stroke="#1E293B" strokeWidth="1.8" />
        <rect x="12" y="6" width="5" height="6" fill="#94A3B8" stroke="#1E293B" strokeWidth="1.5" />
        <path d="M8 6 L21 6" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" />
        <path d="M24.5 23 C24.5 23 22 26 22 27.5 C22 28.8 23.1 29.8 24.5 29.8 C25.9 29.8 27 28.8 27 27.5 C27 26 24.5 23 24.5 23 Z" fill="#38BDF8" stroke="#0369A1" strokeWidth="1.2" />
      </svg>
    );
  }

  if (space.type === 'tax') {
    return (
      <svg width="26" height="26" viewBox="0 0 30 30" fill="none">
        <polygon points="15,3 27,15 15,27 3,15" fill="#FDE68A" stroke="#78350F" strokeWidth="2" />
        <text x="15" y="19.5" textAnchor="middle" fontSize="13" fontWeight="800" fill="#78350F">
          $
        </text>
      </svg>
    );
  }

  return null;
}

function BuildingsBar({ houses }: { houses: number }) {
  if (houses <= 0) return null;
  if (houses === 5) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <svg width="24" height="17" viewBox="0 0 26 18">
          <polygon points="13,1 25,7 22,7 22,17 4,17 4,7 1,7" fill="#DC2626" stroke="#450A0A" strokeWidth="1.6" />
          <rect x="8" y="9" width="3.5" height="4" fill="#FEE2E2" />
          <rect x="14.5" y="9" width="3.5" height="4" fill="#FEE2E2" />
        </svg>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-[2px] w-full h-full px-1">
      {Array.from({ length: houses }).map((_, i) => (
        <svg key={i} width="15" height="15" viewBox="0 0 16 16">
          <polygon points="8,1 15,7 13,7 13,15 3,15 3,7 1,7" fill="#16A34A" stroke="#052E16" strokeWidth="1.4" />
        </svg>
      ))}
    </div>
  );
}

/**
 * High-craft 1000x1000 2D Classic Monopoly Board with all 40 spaces,
 * outward-facing print, physical houses/hotels on color headers, Chance & Community Chest
 * decks, tumbling dice, and animated cast-silver tokens.
 */
export function MonopolyBoard({
  state,
  diceRolling,
  steppingPlayerId,
  stepPulseKey,
  highlightSpaceIndex,
  onSelectSpace,
  onClickDeck,
}: MonopolyBoardProps) {
  const playerMap = Object.fromEntries(state.players.map((p) => [p.id, p]));
  const activePlayer = state.players[state.currentPlayerIndex];

  // Group non-bankrupt players by (position + jail status) so tokens spread cleanly without overlap
  const tokenSlots = new Map<string, string[]>();
  for (const p of state.players) {
    if (p.bankrupt) continue;
    const key = `${p.position}:${p.inJail ? 'J' : 'N'}`;
    const list = tokenSlots.get(key) ?? [];
    list.push(p.id);
    tokenSlots.set(key, list);
  }

  return (
    <div
      data-testid="monopoly-board"
      className="relative select-none"
      style={{
        width: BOARD_SIZE,
        height: BOARD_SIZE,
        backgroundColor: '#D6E8D8',
        border: '5px solid #1C1917',
        boxShadow: '0 22px 54px rgba(0, 0, 0, 0.72), 0 0 0 3px #B89347',
      }}
    >
      {/* Center Board Field */}
      <div
        className="absolute overflow-hidden"
        style={{
          left: CORNER_SIZE,
          top: CORNER_SIZE,
          width: BOARD_SIZE - CORNER_SIZE * 2,
          height: BOARD_SIZE - CORNER_SIZE * 2,
          backgroundColor: '#CDE4D0',
          border: '2px solid #1C1917',
        }}
      >
        {/* Subtle vintage geometric inlay lines */}
        <div
          className="absolute inset-4 pointer-events-none"
          style={{ border: '1px solid rgba(28, 25, 23, 0.16)' }}
        />

        {/* Community Chest Card Deck (Top-Left Diagonal) */}
        <button
          type="button"
          onClick={() => onClickDeck('communityChest')}
          aria-label="Community Chest card deck"
          className="absolute group cursor-pointer focus-visible:outline-2 focus-visible:outline-amber-500"
          style={{
            left: 72,
            top: 86,
            width: 174,
            height: 112,
            transform: 'rotate(-45deg)',
          }}
        >
          {/* Stack thickness layers */}
          <div className="absolute inset-0 translate-x-[5px] translate-y-[5px] rounded-[6px] bg-[#0369A1] border border-stone-900" />
          <div className="absolute inset-0 translate-x-[2.5px] translate-y-[2.5px] rounded-[6px] bg-[#0EA5E9] border border-stone-900" />
          <div className="relative w-full h-full rounded-[6px] bg-[#7DD3FC] border-2 border-stone-900 p-2 flex flex-col items-center justify-center shadow-lg group-hover:-translate-y-1 transition-transform">
            <div className="inset-1.5 absolute border border-dashed border-sky-900/50 rounded-[3px] pointer-events-none" />
            <div className="font-board text-[15px] font-bold tracking-[0.12em] text-sky-950 uppercase">
              Community Chest
            </div>
            <div className="mt-1 font-mono-num text-[11px] font-bold text-sky-900/80">
              {state.communityDeck.length} cards
            </div>
          </div>
        </button>

        {/* Classic Diagonal MONOPOLY Center Banner */}
        <div
          className="absolute left-1/2 top-1/2 pointer-events-none flex flex-col items-center"
          style={{ transform: 'translate(-50%, -50%) rotate(-45deg)' }}
        >
          <div
            className="px-10 py-3 rounded-[4px] border-[3px] border-stone-900 shadow-[0_6px_16px_rgba(0,0,0,0.28)]"
            style={{ backgroundColor: '#D62828' }}
          >
            <div
              className="font-board text-[54px] font-bold tracking-[0.14em] text-[#FAF6EC] leading-none uppercase"
              style={{ textShadow: '2px 2px 0 #1C1917' }}
            >
              MONOPOLY
            </div>
          </div>
          <div className="mt-2 font-display text-[12px] font-bold tracking-[0.34em] text-stone-800/80 uppercase">
            Grand Tabletop Edition
          </div>
        </div>

        {/* Center Board Dice Tray (bottom-left of diagonal, clean unobstructed space) */}
        <div
          data-testid="board-dice-tray"
          className="absolute flex flex-col items-center justify-center rounded-xl px-4 py-3"
          style={{
            left: 84,
            bottom: 82,
            backgroundColor: 'rgba(18, 52, 36, 0.14)',
            border: '1.5px dashed rgba(28, 25, 23, 0.28)',
          }}
        >
          <div className="flex items-center gap-3">
            <DiceFace value={state.dice[0]} rolling={diceRolling} />
            <DiceFace value={state.dice[1]} rolling={diceRolling} />
          </div>
          <div className="mt-2 font-mono-num text-[12px] font-bold text-stone-800">
            Roll: {state.dice[0] + state.dice[1]}
            {state.dice[0] === state.dice[1] && state.hasRolledThisTurn ? ' · DOUBLES' : ''}
          </div>
        </div>

        {/* Chance Card Deck (Bottom-Right Diagonal) */}
        <button
          type="button"
          onClick={() => onClickDeck('chance')}
          aria-label="Chance card deck"
          className="absolute group cursor-pointer focus-visible:outline-2 focus-visible:outline-amber-500"
          style={{
            right: 72,
            bottom: 86,
            width: 174,
            height: 112,
            transform: 'rotate(-45deg)',
          }}
        >
          <div className="absolute inset-0 translate-x-[5px] translate-y-[5px] rounded-[6px] bg-[#9A3412] border border-stone-900" />
          <div className="absolute inset-0 translate-x-[2.5px] translate-y-[2.5px] rounded-[6px] bg-[#EA580C] border border-stone-900" />
          <div className="relative w-full h-full rounded-[6px] bg-[#FDBA74] border-2 border-stone-900 p-2 flex flex-col items-center justify-center shadow-lg group-hover:-translate-y-1 transition-transform">
            <div className="inset-1.5 absolute border border-dashed border-orange-950/50 rounded-[3px] pointer-events-none" />
            <div className="font-board text-[18px] font-bold tracking-[0.18em] text-orange-950 uppercase">
              Chance
            </div>
            <div className="mt-1 font-mono-num text-[11px] font-bold text-orange-950/80">
              {state.chanceDeck.length} cards
            </div>
          </div>
        </button>
      </div>

      {/* All 40 Board Spaces */}
      {BOARD_SPACES.map((space) => {
        const geom = SPACE_GEOMETRIES[space.index];
        const prop = state.properties[space.index];
        const owner = prop?.ownerId ? playerMap[prop.ownerId] : null;
        const isHighlighted = highlightSpaceIndex === space.index;
        const clickable = isOwnableSpace(space);

        if (geom.side === 'corner') {
          return (
            <div
              key={space.index}
              data-space-index={space.index}
              className="absolute border border-stone-900 bg-[#D6E8D8] overflow-hidden"
              style={{
                left: geom.x,
                top: geom.y,
                width: geom.width,
                height: geom.height,
              }}
            >
              {/* GO Corner (0) */}
              {space.index === 0 && (
                <div className="w-full h-full flex flex-col items-center justify-between p-2.5 text-stone-900">
                  <div className="text-[9px] font-board font-semibold tracking-wider text-center uppercase leading-tight">
                    Collect $200 Salary As You Pass
                  </div>
                  <div className="font-board text-[44px] font-extrabold text-[#D62828] leading-none tracking-wider -rotate-12">
                    GO
                  </div>
                  <svg width="92" height="18" viewBox="0 0 92 18">
                    <path d="M88 9 L12 9 M22 3 L10 9 L22 15" stroke="#D62828" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </svg>
                </div>
              )}

              {/* JAIL / JUST VISITING Corner (10) */}
              {space.index === 10 && (
                <div className="relative w-full h-full text-stone-900">
                  {/* Orange Barred Jail Cell in Top-Right Quadrant */}
                  <div
                    className="absolute right-0 top-0 border-l-2 border-b-2 border-stone-900 flex flex-col items-center justify-center overflow-hidden"
                    style={{
                      width: 86,
                      height: 86,
                      backgroundColor: '#F58220',
                    }}
                  >
                    {/* Iron Bars */}
                    <div className="absolute inset-0 flex justify-evenly pointer-events-none opacity-40">
                      <div className="w-[3px] h-full bg-stone-950" />
                      <div className="w-[3px] h-full bg-stone-950" />
                      <div className="w-[3px] h-full bg-stone-950" />
                    </div>
                    <div className="relative z-10 rotate-45 bg-[#FAF6EC] border border-stone-900 px-1.5 py-0.5 text-center">
                      <div className="font-board text-[10px] font-bold leading-none uppercase">
                        In Jail
                      </div>
                    </div>
                  </div>
                  {/* Just Visiting Labels */}
                  <div className="absolute left-1.5 top-5 -rotate-90 origin-center font-board text-[10px] font-bold tracking-widest uppercase text-stone-800">
                    Just
                  </div>
                  <div className="absolute bottom-2 right-3 font-board text-[11px] font-bold tracking-widest uppercase text-stone-800">
                    Visiting
                  </div>
                </div>
              )}

              {/* FREE PARKING Corner (20) */}
              {space.index === 20 && (
                <div className="w-full h-full flex flex-col items-center justify-center p-2 text-stone-900">
                  <div className="font-board text-[13px] font-bold tracking-wider uppercase text-[#D62828]">
                    Free
                  </div>
                  <svg width="46" height="32" viewBox="0 0 48 34" className="my-1">
                    <path d="M6 22 L10 12 L18 10 L32 10 L39 14 L43 22 Z" fill="#D62828" stroke="#1C1917" strokeWidth="2" />
                    <rect x="16" y="13" width="14" height="6" fill="#E0F2FE" stroke="#1C1917" strokeWidth="1.2" />
                    <circle cx="14" cy="24" r="5" fill="#1C1917" />
                    <circle cx="14" cy="24" r="2" fill="#E2E8F0" />
                    <circle cx="35" cy="24" r="5" fill="#1C1917" />
                    <circle cx="35" cy="24" r="2" fill="#E2E8F0" />
                  </svg>
                  <div className="font-board text-[13px] font-bold tracking-wider uppercase text-[#D62828]">
                    Parking
                  </div>
                </div>
              )}

              {/* GO TO JAIL Corner (30) */}
              {space.index === 30 && (
                <div className="w-full h-full flex flex-col items-center justify-center p-2 text-stone-900">
                  <div className="font-board text-[13px] font-bold tracking-wider uppercase text-stone-900">
                    Go To
                  </div>
                  <svg width="42" height="36" viewBox="0 0 44 38" className="my-1">
                    <circle cx="22" cy="19" r="15" fill="#1E3A8A" stroke="#1C1917" strokeWidth="2" />
                    <polygon points="22,8 25,15 33,15 27,20 29,27 22,23 15,27 17,20 11,15 19,15" fill="#FACC15" stroke="#713F12" strokeWidth="1" />
                  </svg>
                  <div className="font-board text-[14px] font-bold tracking-wider uppercase text-stone-900">
                    Jail
                  </div>
                </div>
              )}

              {isHighlighted && (
                <div className="absolute inset-0 border-4 border-amber-400 pointer-events-none animate-spotlight" />
              )}
            </div>
          );
        }

        // Edge spaces (bottom, left, top, right): always author inside an upright EDGE_WIDTH x EDGE_HEIGHT inner card rotated cleanly!
        const headerColor =
          space.type === 'property' && space.colorGroup
            ? COLOR_GROUP_HEX[space.colorGroup]
            : null;

        return (
          <div
            key={space.index}
            data-space-index={space.index}
            onClick={clickable ? () => onSelectSpace(space.index) : undefined}
            className={`absolute border border-stone-900 bg-[#D6E8D8] overflow-hidden ${
              clickable ? 'cursor-pointer hover:brightness-95' : ''
            }`}
            style={{
              left: geom.x,
              top: geom.y,
              width: geom.width,
              height: geom.height,
            }}
          >
            {/* Upright inner tile layout rotated to face outward around the board */}
            <div
              className="absolute left-1/2 top-1/2 flex flex-col justify-between text-stone-900"
              style={{
                width: EDGE_WIDTH,
                height: EDGE_HEIGHT,
                transform: `translate(-50%, -50%) rotate(${geom.rotation}deg)`,
              }}
            >
              {/* Property Color Header + Physical Green Houses / Red Hotel */}
              {headerColor ? (
                <div
                  className="w-full h-[27px] border-b-2 border-stone-900 flex items-center justify-center shrink-0"
                  style={{ backgroundColor: headerColor }}
                >
                  <BuildingsBar houses={prop?.houses ?? 0} />
                </div>
              ) : (
                <div className="h-[6px] shrink-0" />
              )}

              {/* Space Title */}
              <div className="px-1 pt-1 text-center font-board text-[10px] font-bold uppercase leading-[1.12] tracking-[0.02em] text-stone-950">
                {space.shortName}
              </div>

              {/* Center Icon for Non-Street Spaces */}
              {!headerColor && (
                <div className="flex-1 flex items-center justify-center">
                  <SpaceArtIcon space={space} />
                </div>
              )}

              {/* Price or Tax Footer + Owner Marker */}
              <div className="pb-1.5 px-1 flex flex-col items-center">
                {space.price && (
                  <span className="font-mono-num text-[10px] font-bold text-stone-900">
                    ${space.price}
                  </span>
                )}
                {space.taxAmount && (
                  <span className="font-mono-num text-[10px] font-bold text-rose-900">
                    Pay ${space.taxAmount}
                  </span>
                )}
                {owner && (
                  <div
                    className="mt-0.5 w-full h-[6px] rounded-[1px] border border-stone-900"
                    style={{ backgroundColor: owner.accentColor }}
                    title={`Owned by ${owner.name}`}
                  />
                )}
              </div>

              {/* Mortgaged Overlay Stamp on Tile */}
              {prop?.mortgaged && (
                <div className="absolute inset-0 bg-stone-900/25 flex items-center justify-center pointer-events-none">
                  <span className="px-1 py-0.5 bg-red-700 text-white font-board text-[9px] font-bold tracking-widest uppercase -rotate-12 border border-white/60">
                    MORT
                  </span>
                </div>
              )}
            </div>

            {isHighlighted && (
              <div className="absolute inset-0 border-[3px] border-amber-400 pointer-events-none animate-spotlight z-20" />
            )}
          </div>
        );
      })}

      {/* Animated Silver Tokens Layer */}
      <div className="absolute inset-0 pointer-events-none z-30">
        {state.players.map((player) => {
          if (player.bankrupt) return null;
          const key = `${player.position}:${player.inJail ? 'J' : 'N'}`;
          const occupants = tokenSlots.get(key) ?? [player.id];
          const slotIdx = occupants.indexOf(player.id);
          const pos = getTokenBoardPosition(
            player.position,
            slotIdx,
            occupants.length,
            player.inJail
          );
          const isCurrent = player.id === activePlayer?.id;
          const isStepping = steppingPlayerId === player.id;

          return (
            <div
              key={player.id}
              data-testid={`token-${player.id}`}
              data-space={player.position}
              className="absolute transition-[left,top] duration-[175ms] ease-out"
              style={{
                left: pos.x,
                top: pos.y,
                zIndex: isCurrent ? 38 : 32,
              }}
            >
              <div
                key={isStepping ? `hop-${stepPulseKey}` : 'idle'}
                className={isStepping ? 'animate-token-hop' : '-translate-x-1/2 -translate-y-1/2'}
                style={{
                  transform: isStepping ? undefined : 'translate(-50%, -50%)',
                }}
              >
                <SilverTokenIcon
                  token={player.token}
                  size={isCurrent ? 48 : 42}
                  accentRingColor={player.accentColor}
                  active={isCurrent}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
