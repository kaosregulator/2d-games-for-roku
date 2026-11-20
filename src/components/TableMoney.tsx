import { BOARD_SPACES, COLOR_GROUP_HEX, getMoneyAnchorWorld } from '../game/boardData';
import { getPlayerProperties } from '../game/engine';
import {
  BILL_DENOMINATIONS,
  decomposeCashToBills,
  getDominantBillForAmount,
} from '../game/money';
import type { BillMeta, GameState, PlayerState } from '../game/types';
import { SilverTokenIcon } from './SilverTokens';

/**
 * Single crisp Monopoly paper banknote rendered in SVG-like layered DOM for razor-sharp zoom.
 */
function BanknoteVisual({
  meta,
  stackCount = 1,
  compact = false,
}: {
  meta: BillMeta;
  stackCount?: number;
  compact?: boolean;
}) {
  const visibleLayers = Math.min(4, Math.max(1, Math.ceil(stackCount / 2)));
  const w = compact ? 68 : 112;
  const h = compact ? 32 : 52;

  return (
    <div
      className="relative select-none"
      style={{ width: w + 6, height: h + 8 }}
    >
      {/* Underlying bills in stack */}
      {Array.from({ length: visibleLayers - 1 }).map((_, idx) => {
        const offset = (visibleLayers - 1 - idx) * 2.2;
        return (
          <div
            key={idx}
            className="absolute rounded-[3px] shadow-sm"
            style={{
              width: w,
              height: h,
              left: offset,
              top: offset,
              backgroundColor: meta.bg,
              border: `1.5px solid ${meta.border}`,
              opacity: 0.88,
            }}
          />
        );
      })}

      {/* Top bill */}
      <div
        className={`absolute left-0 top-0 rounded-[3px] flex items-center ${
          compact ? 'justify-between px-1.5' : 'justify-between px-2'
        } shadow-[0_3px_6px_rgba(0,0,0,0.4)]`}
        style={{
          width: w,
          height: h,
          backgroundColor: meta.bg,
          border: `1.5px solid ${meta.border}`,
          color: meta.ink,
        }}
      >
        <div
          className="inset-[3px] absolute rounded-[2px] pointer-events-none"
          style={{ border: `1px dashed ${meta.border}`, opacity: 0.65 }}
        />
        <span
          className={`font-board font-bold tracking-tight z-10 ${
            compact ? 'text-[10px]' : 'text-[13px]'
          }`}
        >
          {meta.label}
        </span>

        {/* Center ornamental medallion */}
        <div
          className="rounded-full flex items-center justify-center font-display font-bold z-10"
          style={{
            width: compact ? 20 : 34,
            height: compact ? 20 : 34,
            backgroundColor: meta.accent,
            border: `1.5px solid ${meta.border}`,
            fontSize: compact ? 7.5 : 11,
          }}
        >
          {meta.value}
        </div>

        {!compact && (
          <span className="font-board font-bold tracking-tight z-10 text-[11px]">
            {meta.value}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Physical Banker's Money Tray + 32 Green Houses & 12 Red Hotels Supply sitting
 * directly on the Left Emerald Baize Apron of the tabletop.
 */
export function BankTableTray({
  bankHouses,
  bankHotels,
}: {
  bankHouses: number;
  bankHotels: number;
}) {
  return (
    <div
      data-testid="bank-money-tray"
      className="absolute flex flex-col justify-between rounded-md p-4"
      style={{
        left: 56,
        top: 84,
        width: 320,
        height: 992,
        backgroundColor: 'rgba(26, 17, 12, 0.9)',
        border: '2px solid rgba(196, 158, 84, 0.55)',
        boxShadow: 'inset 0 2px 14px rgba(0,0,0,0.65), 0 12px 28px rgba(0,0,0,0.55)',
      }}
    >
      {/* Brass Plaque Header */}
      <div className="border-b border-amber-500/30 pb-2.5 text-center">
        <div className="font-display text-[17px] font-bold tracking-[0.22em] text-amber-200 uppercase">
          The Bank
        </div>
        <div className="mt-0.5 text-[11px] tracking-wider text-amber-100/65">
          Official Treasury &amp; Building Supply
        </div>
      </div>

      {/* All 7 Monopoly Banknote Compartments */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-3.5 py-3">
        {BILL_DENOMINATIONS.map((meta) => (
          <div
            key={meta.value}
            className={`flex flex-col items-center justify-center rounded px-2 py-2.5 ${
              meta.value === 500 ? 'col-span-2' : ''
            }`}
            style={{
              backgroundColor: 'rgba(13, 44, 31, 0.72)',
              border: '1px solid rgba(196, 158, 84, 0.28)',
              boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.5)',
            }}
          >
            <BanknoteVisual meta={meta} stackCount={8} />
            <span className="mt-1.5 font-mono-num text-[11px] font-semibold text-amber-100/80">
              {meta.label} Reserve
            </span>
          </div>
        ))}
      </div>

      {/* Physical Houses (32) & Hotels (12) Tray */}
      <div
        className="rounded p-3"
        style={{
          backgroundColor: 'rgba(13, 44, 31, 0.8)',
          border: '1px solid rgba(196, 158, 84, 0.35)',
        }}
      >
        <div className="flex items-center justify-between border-b border-amber-400/20 pb-1.5 mb-2.5">
          <span className="font-display text-xs font-bold tracking-widest text-amber-200 uppercase">
            Building Tray
          </span>
          <span className="font-mono-num text-[11px] text-amber-100/75">
            {bankHouses}H · {bankHotels}Ht
          </span>
        </div>

        {/* Green Houses */}
        <div className="mb-2.5">
          <div className="flex items-center justify-between text-[11px] text-emerald-200/85 mb-1">
            <span>Houses Available</span>
            <span className="font-mono-num font-bold">{bankHouses} / 32</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {Array.from({ length: 32 }).map((_, i) => (
              <svg
                key={i}
                width="13"
                height="13"
                viewBox="0 0 16 16"
                className={i < bankHouses ? 'opacity-100' : 'opacity-15'}
              >
                <polygon points="8,1 15,7 13,7 13,15 3,15 3,7 1,7" fill="#16A34A" stroke="#052E16" strokeWidth="1.2" />
              </svg>
            ))}
          </div>
        </div>

        {/* Red Hotels */}
        <div>
          <div className="flex items-center justify-between text-[11px] text-rose-200/85 mb-1">
            <span>Hotels Available</span>
            <span className="font-mono-num font-bold">{bankHotels} / 12</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: 12 }).map((_, i) => (
              <svg
                key={i}
                width="18"
                height="14"
                viewBox="0 0 22 16"
                className={i < bankHotels ? 'opacity-100' : 'opacity-15'}
              >
                <polygon points="11,1 21,6 19,6 19,15 3,15 3,6 1,6" fill="#DC2626" stroke="#450A0A" strokeWidth="1.3" />
                <rect x="7" y="8" width="2.5" height="3" fill="#FEE2E2" />
                <rect x="12.5" y="8" width="2.5" height="3" fill="#FEE2E2" />
              </svg>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Physical per-player cash piles, owned Title Deed mini-cards, and Get Out of Jail Free
 * cards laid out on the Right Emerald Baize Apron of the tabletop.
 */
export function PlayerTableStations({
  state,
  onInspectDeed,
}: {
  state: GameState;
  onInspectDeed: (spaceIndex: number) => void;
}) {
  return (
    <div
      data-testid="player-table-stations"
      className="absolute flex flex-col gap-3.5"
      style={{
        left: 1444,
        top: 84,
        width: 322,
        height: 992,
      }}
    >
      {state.players.map((player, idx) => {
        const isCurrent = idx === state.currentPlayerIndex && !player.bankrupt;
        const ownedIndices = getPlayerProperties(state, player.id);
        const billBreakdown = decomposeCashToBills(player.cash);
        const nonZeroBills = BILL_DENOMINATIONS.filter((m) => billBreakdown[m.value] > 0);

        return (
          <PlayerTableSeat
            key={player.id}
            player={player}
            isCurrent={isCurrent}
            ownedIndices={ownedIndices}
            state={state}
            nonZeroBills={nonZeroBills}
            billBreakdown={billBreakdown}
            onInspectDeed={onInspectDeed}
          />
        );
      })}
    </div>
  );
}

function PlayerTableSeat({
  player,
  isCurrent,
  ownedIndices,
  state,
  nonZeroBills,
  billBreakdown,
  onInspectDeed,
}: {
  player: PlayerState;
  isCurrent: boolean;
  ownedIndices: number[];
  state: GameState;
  nonZeroBills: BillMeta[];
  billBreakdown: Record<number, number>;
  onInspectDeed: (spaceIndex: number) => void;
}) {
  return (
    <div
      className={`relative flex-1 rounded-md p-3 transition-transform duration-200 ${
        player.bankrupt ? 'opacity-45 grayscale' : ''
      }`}
      style={{
        backgroundColor: isCurrent ? 'rgba(29, 20, 14, 0.95)' : 'rgba(20, 15, 11, 0.86)',
        border: isCurrent
          ? `2px solid ${player.accentColor}`
          : '1.5px solid rgba(196, 158, 84, 0.35)',
        boxShadow: isCurrent
          ? `0 0 0 2px rgba(245, 198, 96, 0.25), 0 10px 24px rgba(0,0,0,0.6)`
          : '0 6px 16px rgba(0,0,0,0.45)',
      }}
    >
      {/* Header Row: Silver Token + Name + Live Cash */}
      <div className="flex items-center justify-between border-b border-amber-500/25 pb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
            style={{
              backgroundColor: 'rgba(13, 44, 31, 0.9)',
              border: `2px solid ${player.accentColor}`,
            }}
          >
            <SilverTokenIcon token={player.token} size={28} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-display text-sm font-bold text-amber-100 truncate">
                {player.name}
              </span>
              {player.isAI && (
                <span className="text-[10px] font-mono-num text-amber-200/65">CPU</span>
              )}
            </div>
            <div className="text-[11px] text-amber-100/60">
              {player.bankrupt
                ? 'Bankrupt'
                : player.inJail
                  ? `In Jail (Turn ${player.jailTurns}/3)`
                  : isCurrent
                    ? 'Active Turn'
                    : BOARD_SPACES[player.position].shortName}
            </div>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="font-mono-num text-lg font-bold text-emerald-300">
            ${player.cash.toLocaleString()}
          </div>
          <div className="text-[10px] text-amber-100/55">
            {ownedIndices.length} Deeds
          </div>
        </div>
      </div>

      {/* Physical Money Stacks on the Table for this Player */}
      <div className="mt-2">
        <div className="flex flex-wrap gap-1.5 items-center min-h-[42px]">
          {nonZeroBills.length === 0 ? (
            <span className="text-[11px] italic text-amber-100/45">No cash on table</span>
          ) : (
            nonZeroBills.slice(0, 4).map((meta) => (
              <div key={meta.value} className="relative">
                <BanknoteVisual meta={meta} stackCount={billBreakdown[meta.value]} compact />
                <span className="absolute -bottom-1 right-0 bg-[#1a120d] px-1 text-[9px] font-mono-num font-bold text-amber-200 border border-amber-500/40 rounded-sm">
                  ×{billBreakdown[meta.value]}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Owned Title Deed Cards + Jail Free Cards on the Table */}
      <div className="mt-2.5 flex flex-wrap gap-1 items-center">
        {ownedIndices.map((idx) => {
          const space = BOARD_SPACES[idx];
          const prop = state.properties[idx];
          const headerHex = space.colorGroup ? COLOR_GROUP_HEX[space.colorGroup] : '#334155';
          return (
            <button
              key={idx}
              type="button"
              onClick={() => onInspectDeed(idx)}
              title={`Inspect ${space.name}`}
              aria-label={`Inspect ${space.name} deed`}
              className={`relative w-[22px] h-[28px] rounded-[2px] border border-stone-900 bg-[#F8F4E8] shadow-sm transition-transform hover:scale-125 hover:z-10 cursor-pointer ${
                prop.mortgaged ? 'opacity-50' : ''
              }`}
            >
              <div
                className="w-full h-[7px] rounded-t-[1px]"
                style={{ backgroundColor: headerHex }}
              />
              {prop.houses > 0 && (
                <div className="flex justify-center items-center mt-0.5 text-[7px] font-bold text-stone-900">
                  {prop.houses === 5 ? 'H' : prop.houses}
                </div>
              )}
              {prop.mortgaged && (
                <div className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-red-700">
                  M
                </div>
              )}
            </button>
          );
        })}

        {player.getOutOfJailCards.map((deck, i) => (
          <div
            key={`jail-${deck}-${i}`}
            title="Get Out of Jail Free Card"
            className="px-1.5 py-0.5 rounded-[2px] border border-amber-900 text-[9px] font-board font-bold text-stone-900 shadow-sm"
            style={{
              backgroundColor: deck === 'chance' ? '#FBBF24' : '#7DD3FC',
            }}
          >
            JAIL FREE
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Animated flying banknotes across the tabletop when rent, taxes, GO salary, or purchases occur.
 */
export function FlyingMoneyLayer({ state }: { state: GameState }) {
  const playerIndexMap: Record<string, number> = {};
  state.players.forEach((p, idx) => {
    playerIndexMap[p.id] = idx;
  });

  const now = Date.now();
  const recent = state.moneyTransfers.filter((t) => now - t.timestamp < 1400);

  return (
    <div className="absolute inset-0 pointer-events-none z-40">
      {recent.map((transfer) => {
        const fromPt = getMoneyAnchorWorld(transfer.from, playerIndexMap);
        const toPt = getMoneyAnchorWorld(transfer.to, playerIndexMap);
        const billMeta = getDominantBillForAmount(transfer.amount);

        return (
          <div
            key={transfer.id}
            className="absolute left-0 top-0 animate-bill-fly flex flex-col items-center"
            style={
              {
                '--from-x': `${fromPt.x - 45}px`,
                '--from-y': `${fromPt.y - 25}px`,
                '--to-x': `${toPt.x - 45}px`,
                '--to-y': `${toPt.y - 25}px`,
              } as React.CSSProperties
            }
          >
            <BanknoteVisual meta={billMeta} stackCount={3} compact />
            <span className="mt-0.5 px-1.5 py-0.5 rounded bg-stone-950/90 text-amber-200 font-mono-num text-[11px] font-bold border border-amber-500/50">
              ${transfer.amount}
            </span>
          </div>
        );
      })}
    </div>
  );
}
