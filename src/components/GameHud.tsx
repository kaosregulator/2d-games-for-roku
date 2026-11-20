import { Camera, Maximize2, Pause, ScrollText, Volume2, VolumeX } from 'lucide-react';
import { BOARD_SPACES } from '../game/boardData';
import {
  getActivePlayer,
  getPlayerById,
  getPlayerProperties,
  JAIL_FINE,
} from '../game/engine';
import type { CameraFocus, CameraMode, GameState } from '../game/types';
import { SilverTokenIcon } from './SilverTokens';

interface GameHudProps {
  state: GameState;
  cameraMode: CameraMode;
  cameraFocus: CameraFocus;
  muted: boolean;
  showLog: boolean;
  onRollDice: () => void;
  onEndTurn: () => void;
  onPayJailFine: () => void;
  onUseJailCard: () => void;
  onSettleDebt: () => void;
  onDeclareBankruptcy: () => void;
  onOpenProperties: () => void;
  onOpenTrade: () => void;
  onSetCameraMode: (mode: CameraMode) => void;
  onToggleMute: () => void;
  onToggleLog: () => void;
  onPause: () => void;
}

/**
 * World-matched mahogany & brass perimeter HUD dock.
 * Keeps >= 85% of the tabletop unobstructed, uses zero backdrop-filter over canvas/board,
 * zero pill clutter, and crisp tabular-nums currency figures.
 */
export function GameHud({
  state,
  cameraMode,
  cameraFocus,
  muted,
  showLog,
  onRollDice,
  onEndTurn,
  onPayJailFine,
  onUseJailCard,
  onSettleDebt,
  onDeclareBankruptcy,
  onOpenProperties,
  onOpenTrade,
  onSetCameraMode,
  onToggleMute,
  onToggleLog,
  onPause,
}: GameHudProps) {
  const active = getActivePlayer(state);
  const currentSpace = BOARD_SPACES[active.position];
  const isHumanTurn = !active.isAI && !active.bankrupt;
  const activeDeedCount = getPlayerProperties(state, active.id).length;

  const debtCreditorName = state.debt?.creditorId
    ? getPlayerById(state, state.debt.creditorId)?.name ?? 'Player'
    : 'the Bank';
  const canPayDebtNow = state.debt ? active.cash >= state.debt.amount : false;

  return (
    <div className="fixed inset-0 z-30 pointer-events-none flex flex-col justify-between p-3 sm:p-4">
      {/* TOP PERIMETER CLUSTER: Active Turn Plaque (Left) + Camera & Utility Controls (Right) */}
      <div className="flex items-start justify-between gap-3">
        {/* Left: Active Player Turn & Cash Plaque */}
        <div
          data-testid="active-player-hud"
          className="pointer-events-auto flex items-center gap-3 rounded-md px-3.5 py-2"
          style={{
            backgroundColor: 'rgba(24, 16, 12, 0.94)',
            border: `1.5px solid ${active.accentColor}`,
            boxShadow: '0 8px 24px rgba(0,0,0,0.55)',
          }}
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-emerald-950/90"
            style={{ border: `2px solid ${active.accentColor}` }}
          >
            <SilverTokenIcon token={active.token} size={32} />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-amber-200/75">
              <span>Turn {state.turnNumber}</span>
              <span aria-hidden="true">·</span>
              <span className="truncate max-w-[160px]">{currentSpace.shortName}</span>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="font-display text-base font-bold text-amber-50 whitespace-nowrap">
                {active.name}
              </span>
              <span
                data-testid="active-player-cash"
                className="font-mono-num text-lg font-bold text-emerald-300"
              >
                ${active.cash.toLocaleString()}
              </span>
              <span className="hidden sm:inline text-xs text-amber-100/65 whitespace-nowrap">
                {activeDeedCount} Deeds
              </span>
            </div>
          </div>
        </div>

        {/* Right: Action Cam Mode Selector + Compact Utility Icons */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Camera Mode Segmented Control */}
          <div
            className="flex items-center gap-1 rounded-md p-1"
            style={{
              backgroundColor: 'rgba(24, 16, 12, 0.94)',
              border: '1.5px solid rgba(196, 158, 84, 0.45)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.55)',
            }}
          >
            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                onSetCameraMode('action');
              }}
              aria-label="Action Cam mode"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-semibold cursor-pointer whitespace-nowrap transition-colors ${
                cameraMode === 'action'
                  ? 'bg-amber-600 text-stone-950'
                  : 'text-amber-100/80 hover:text-amber-50'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Action Cam</span>
            </button>
            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                onSetCameraMode('overview');
              }}
              aria-label="Full Board view"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-semibold cursor-pointer whitespace-nowrap transition-colors ${
                cameraMode === 'overview'
                  ? 'bg-amber-600 text-stone-950'
                  : 'text-amber-100/80 hover:text-amber-50'
              }`}
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Full Board</span>
            </button>
          </div>

          {/* Utility Icon Buttons: Log, Mute, Pause */}
          <div
            className="flex items-center gap-1 rounded-md p-1"
            style={{
              backgroundColor: 'rgba(24, 16, 12, 0.94)',
              border: '1.5px solid rgba(196, 158, 84, 0.45)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.55)',
            }}
          >
            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                onToggleLog();
              }}
              aria-label="Toggle turn ledger"
              title="Turn Ledger"
              className={`w-8 h-8 rounded flex items-center justify-center cursor-pointer transition-colors ${
                showLog
                  ? 'bg-amber-600 text-stone-950'
                  : 'text-amber-100/85 hover:bg-stone-800'
              }`}
            >
              <ScrollText className="w-4 h-4" />
            </button>
            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                onToggleMute();
              }}
              aria-label={muted ? 'Unmute sound' : 'Mute sound'}
              title={muted ? 'Unmute [M]' : 'Mute [M]'}
              className="w-8 h-8 rounded flex items-center justify-center cursor-pointer text-amber-100/85 hover:bg-stone-800 transition-colors"
            >
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                onPause();
              }}
              aria-label="Pause game"
              title="Pause [P]"
              className="w-8 h-8 rounded flex items-center justify-center cursor-pointer text-amber-100/85 hover:bg-stone-800 transition-colors"
            >
              <Pause className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* OPTIONAL COLLAPSIBLE LEDGER PANEL (Top-Right Below Utility Bar) */}
      {showLog && (
        <div
          data-testid="turn-ledger"
          className="pointer-events-auto self-end mt-2 w-80 max-h-64 overflow-y-auto rounded-md p-3 space-y-1.5"
          style={{
            backgroundColor: 'rgba(20, 14, 10, 0.96)',
            border: '1.5px solid rgba(196, 158, 84, 0.5)',
            boxShadow: '0 14px 36px rgba(0,0,0,0.75)',
          }}
        >
          <div className="font-display text-xs font-bold tracking-widest uppercase text-amber-200 border-b border-amber-500/25 pb-1.5">
            Tabletop Ledger
          </div>
          {state.logs.map((entry) => (
            <div
              key={entry.id}
              className="text-xs leading-snug text-amber-100/85 border-b border-stone-800/80 pb-1 last:border-0"
            >
              <span className="font-mono-num text-[10px] text-amber-300/65 mr-1.5">
                T{entry.turn}
              </span>
              <span>{entry.text}</span>
            </div>
          ))}
        </div>
      )}

      {/* Spacer pushes bottom dock cleanly to bottom edge */}
      <div className="flex-1" />

      {/* BOTTOM PERIMETER ACTION DOCK */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
        {/* Live Action Cam Caption & Event Line */}
        <div
          data-testid="action-narration"
          className="pointer-events-auto flex items-center gap-3 rounded-md px-3.5 py-2 max-w-xl w-full sm:w-auto"
          style={{
            backgroundColor: 'rgba(24, 16, 12, 0.94)',
            border: '1.5px solid rgba(196, 158, 84, 0.4)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.55)',
          }}
        >
          <span className="text-[11px] font-mono-num font-semibold text-amber-300/90 whitespace-nowrap shrink-0">
            {cameraMode === 'action'
              ? cameraFocus.label
              : cameraMode === 'overview'
                ? 'Full Table'
                : 'Free Cam'}
          </span>
          <span aria-hidden="true" className="text-amber-500/50">
            |
          </span>
          <span className="text-xs text-amber-50/90 truncate">{state.lastActionText}</span>
        </div>

        {/* Turn Action Buttons */}
        <div
          className="pointer-events-auto flex flex-wrap items-center justify-end gap-2 rounded-md px-3 py-2"
          style={{
            backgroundColor: 'rgba(24, 16, 12, 0.95)',
            border: '1.5px solid rgba(196, 158, 84, 0.5)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
          }}
        >
          {/* Secondary Management Buttons (available on human turn) */}
          {isHumanTurn && state.phase !== 'moving' && state.phase !== 'game_over' && (
            <>
              <button
                type="button"
                onClick={onOpenProperties}
                className="px-3.5 py-2 rounded text-xs font-semibold cursor-pointer bg-stone-800 hover:bg-stone-700 text-amber-100 border border-amber-500/35 whitespace-nowrap"
              >
                Properties
              </button>
              <button
                type="button"
                onClick={onOpenTrade}
                className="px-3.5 py-2 rounded text-xs font-semibold cursor-pointer bg-stone-800 hover:bg-stone-700 text-amber-100 border border-amber-500/35 whitespace-nowrap"
              >
                Trade
              </button>
            </>
          )}

          {/* Jail Pre-Roll Options */}
          {isHumanTurn && state.phase === 'awaiting_roll' && active.inJail && (
            <>
              <button
                type="button"
                disabled={active.cash < JAIL_FINE}
                onClick={onPayJailFine}
                className="px-3.5 py-2 rounded text-xs font-semibold cursor-pointer bg-amber-700 hover:bg-amber-600 text-white border border-amber-400/50 disabled:opacity-35 whitespace-nowrap"
              >
                Pay ${JAIL_FINE} Bail
              </button>
              {active.getOutOfJailCards.length > 0 && (
                <button
                  type="button"
                  onClick={onUseJailCard}
                  className="px-3.5 py-2 rounded text-xs font-semibold cursor-pointer bg-sky-700 hover:bg-sky-600 text-white border border-sky-400/50 whitespace-nowrap"
                >
                  Use Jail Free Card
                </button>
              )}
            </>
          )}

          {/* Primary Action Button */}
          {isHumanTurn && state.phase === 'awaiting_roll' && (
            <button
              type="button"
              data-testid="roll-dice-btn"
              onClick={onRollDice}
              className="px-5 py-2 rounded text-xs sm:text-sm font-bold tracking-wide cursor-pointer bg-emerald-700 hover:bg-emerald-600 text-white border border-amber-300/70 shadow whitespace-nowrap"
            >
              {active.inJail
                ? 'Roll for Doubles'
                : state.lastRollWasDoubles
                  ? 'Roll Doubles Again'
                  : 'Roll Dice'}
            </button>
          )}

          {isHumanTurn && state.phase === 'turn_end' && (
            <button
              type="button"
              data-testid="end-turn-btn"
              onClick={onEndTurn}
              className="px-5 py-2 rounded text-xs sm:text-sm font-bold tracking-wide cursor-pointer bg-amber-600 hover:bg-amber-500 text-stone-950 border border-amber-300 shadow whitespace-nowrap"
            >
              End Turn
            </button>
          )}

          {isHumanTurn && state.phase === 'debt_resolution' && state.debt && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-rose-300 whitespace-nowrap">
                Owe ${state.debt.amount} to {debtCreditorName}
              </span>
              <button
                type="button"
                disabled={!canPayDebtNow}
                onClick={onSettleDebt}
                className="px-3.5 py-2 rounded text-xs font-bold cursor-pointer bg-emerald-700 hover:bg-emerald-600 text-white disabled:opacity-35 whitespace-nowrap"
              >
                Pay ${state.debt.amount}
              </button>
              <button
                type="button"
                onClick={onDeclareBankruptcy}
                className="px-3.5 py-2 rounded text-xs font-bold cursor-pointer bg-rose-800 hover:bg-rose-700 text-white whitespace-nowrap"
              >
                Bankrupt
              </button>
            </div>
          )}

          {!isHumanTurn && state.phase !== 'game_over' && (
            <span className="px-3 py-1.5 text-xs font-semibold text-amber-200/90 whitespace-nowrap">
              {active.name} is taking their turn...
            </span>
          )}

          {isHumanTurn && state.phase === 'moving' && (
            <span className="px-3 py-1.5 text-xs font-semibold text-amber-200 whitespace-nowrap">
              Moving token...
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
