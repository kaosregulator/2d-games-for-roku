import { useState } from 'react';
import {
  canPlaceShip,
  COL_LABELS,
  formatCoord,
  getShipCells,
  GRID_SIZE,
  isShipSunk,
  ROW_LABELS,
} from '../battleship/engine';
import type {
  Orientation,
  PlacedShip,
  ShipSpec,
  ShipTypeId,
  ShotRecord,
} from '../battleship/types';
import { NavalShipSvg } from './BattleshipShips';

export const WALNUT_BOARD_TEXTURE =
  '/src/assets/images/antique_walnut_board_1795157879553.jpg';
export const AGED_LEATHER_TEXTURE =
  '/src/assets/images/aged_saddle_leather_1795157878370.jpg';

interface BattleshipGridProps {
  title: string;
  subtitle: string;
  variant: 'ocean' | 'radar';
  ships: PlacedShip[];
  shots: ShotRecord[];
  interactive?: boolean;
  /** Deployment mode props */
  deploySpec?: ShipSpec | null;
  deployOrientation?: Orientation;
  onDeployClick?: (row: number, col: number) => void;
  onPickUpShip?: (ship: PlacedShip) => void;
  onRotate?: () => void;
  /** Combat firing callback */
  onFireCell?: (row: number, col: number) => void;
  lastShotCoord?: { row: number; col: number; id: number } | null;
  /** Newly destroyed ship triggers chain explosions, rising foam/bubbles & submerge animation */
  justSunkShip?: { id: ShipTypeId; name: string; eventId: number } | null;
  shakeKey?: number;
  shakeHeavy?: boolean;
  testId?: string;
}

/**
 * Heirloom Antique Wood & Stitched Leather 10x10 Classic Battleship Board:
 * - Carved walnut wood casing with brass rivets & inlaid dark saddle-leather nameplate
 * - Vintage Admiralty sea-chart ocean with subtle brass compass rose & rhumb lines
 * - Tactile classic board-game pegboard holes in every square
 * - Lacquered crimson Hit pegs with fiery blast, shockwave & persistent curling smoke
 * - Ivory-cream Miss pegs with animated foaming sea-spray splash
 * - Full destroyed-ship reveal with multi-cell chain explosions, foam, bubbles & sinking animation
 */
export function BattleshipGrid({
  title,
  subtitle,
  variant,
  ships,
  shots,
  interactive = false,
  deploySpec = null,
  deployOrientation = 'H',
  onDeployClick,
  onPickUpShip,
  onRotate,
  onFireCell,
  lastShotCoord = null,
  justSunkShip = null,
  shakeKey = 0,
  shakeHeavy = false,
  testId,
}: BattleshipGridProps) {
  const [hoverCell, setHoverCell] = useState<{ row: number; col: number } | null>(null);

  const shotMap = new Map<string, ShotRecord>();
  for (const s of shots) {
    shotMap.set(`${s.row},${s.col}`, s);
  }

  // Track cells belonging to the newly destroyed ship so chain explosions erupt along its entire hull
  const justSunkCellIndex = new Map<string, number>();
  if (justSunkShip) {
    const sunkShipObj = ships.find((s) => s.id === justSunkShip.id);
    if (sunkShipObj) {
      getShipCells(sunkShipObj).forEach((cell, idx) => {
        justSunkCellIndex.set(`${cell.row},${cell.col}`, idx);
      });
    }
  }

  const ghostValid =
    deploySpec && hoverCell
      ? canPlaceShip(ships, deploySpec, hoverCell.row, hoverCell.col, deployOrientation)
      : false;

  const isTargetChart = variant === 'radar';

  return (
    <div
      key={shakeKey > 0 ? `shake-${shakeKey}` : 'steady'}
      data-testid={testId}
      className={`relative flex flex-col rounded-lg p-3.5 ${
        shakeKey > 0 ? (shakeHeavy ? 'animate-board-shake-heavy' : 'animate-board-shake') : ''
      }`}
      style={{
        backgroundColor: '#2B1B12',
        backgroundImage: `linear-gradient(155deg, rgba(44, 27, 16, 0.72), rgba(20, 12, 7, 0.86)), url('${WALNUT_BOARD_TEXTURE}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        border: '2px solid #B68F48',
        boxShadow:
          '0 22px 52px rgba(0, 0, 0, 0.72), inset 0 1px 0 rgba(246, 217, 152, 0.25), inset 0 0 24px rgba(0, 0, 0, 0.55)',
      }}
      onContextMenu={(e) => {
        if (deploySpec && onRotate) {
          e.preventDefault();
          onRotate();
        }
      }}
    >
      {/* Decorative Brass Corner Rivets */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-1.5 left-1.5 w-2 h-2 rounded-full bg-gradient-to-br from-[#F3D999] to-[#7D5B26] shadow-sm"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-gradient-to-br from-[#F3D999] to-[#7D5B26] shadow-sm"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-1.5 left-1.5 w-2 h-2 rounded-full bg-gradient-to-br from-[#F3D999] to-[#7D5B26] shadow-sm"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-1.5 right-1.5 w-2 h-2 rounded-full bg-gradient-to-br from-[#F3D999] to-[#7D5B26] shadow-sm"
      />

      {/* Stitched Leather Nameplate Header */}
      <div
        className="flex items-center justify-between gap-2 rounded px-3 py-2 mb-2.5"
        style={{
          backgroundColor: '#1E140F',
          backgroundImage: `linear-gradient(rgba(22, 13, 9, 0.58), rgba(16, 9, 6, 0.72)), url('${AGED_LEATHER_TEXTURE}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          border: '1px solid rgba(196, 158, 84, 0.45)',
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.65)',
        }}
      >
        <div className="flex items-baseline gap-2 min-w-0">
          <h3 className="font-display text-sm sm:text-[15px] font-bold tracking-wider uppercase text-[#F4E3C1] whitespace-nowrap shrink-0">
            {title}
          </h3>
          <span className="text-[11px] text-[#CBB592]/80 truncate">{subtitle}</span>
        </div>
        <span className="font-mono-num text-[11px] font-semibold text-[#E5C17B] whitespace-nowrap shrink-0">
          {hoverCell ? formatCoord(hoverCell.row, hoverCell.col) : 'A1–J10'}
        </span>
      </div>

      {/* Coordinate Frame + Recessed 10x10 Nautical Pegboard */}
      <div className="select-none">
        {/* Engraved Brass-on-Wood Top Column Labels A..J */}
        <div className="grid grid-cols-[24px_1fr] gap-1 mb-1">
          <div />
          <div className="grid grid-cols-10 text-center font-mono-num text-[11px] font-bold text-[#DFC592]">
            {COL_LABELS.map((label, c) => (
              <div
                key={label}
                className={hoverCell?.col === c ? 'text-[#FFF4D6] scale-110 transition-transform' : undefined}
              >
                {label}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-[24px_1fr] gap-1">
          {/* Engraved Brass-on-Wood Left Row Labels 1..10 */}
          <div className="grid grid-rows-10 items-center text-right pr-1 font-mono-num text-[11px] font-bold text-[#DFC592]">
            {ROW_LABELS.map((label, r) => (
              <div
                key={label}
                className={hoverCell?.row === r ? 'text-[#FFF4D6] scale-110 transition-transform' : undefined}
              >
                {label}
              </div>
            ))}
          </div>

          {/* 10x10 Vintage Admiralty Nautical Sea-Chart Playfield */}
          <div
            className="relative aspect-square w-full rounded-[3px] overflow-hidden"
            style={{
              backgroundColor: isTargetChart ? '#122933' : '#14333F',
              backgroundImage: isTargetChart
                ? 'radial-gradient(circle at 50% 50%, rgba(36, 94, 110, 0.42) 0%, rgba(14, 34, 44, 0.96) 78%)'
                : 'radial-gradient(circle at 38% 30%, rgba(45, 108, 122, 0.45) 0%, rgba(16, 42, 54, 0.97) 80%)',
              border: '2px solid #8A6B37',
              boxShadow: 'inset 0 6px 22px rgba(0, 0, 0, 0.65)',
            }}
            onMouseLeave={() => setHoverCell(null)}
          >
            {/* Vintage Cartography Compass Rose & Brass Rhumb Lines */}
            <svg
              viewBox="0 0 100 100"
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ opacity: isTargetChart ? 0.22 : 0.14 }}
              aria-hidden="true"
            >
              <circle cx="50" cy="50" r="22" fill="none" stroke="#E5C17B" strokeWidth="0.45" />
              <circle cx="50" cy="50" r="38" fill="none" stroke="#E5C17B" strokeWidth="0.35" strokeDasharray="2 2" />
              <line x1="50" y1="0" x2="50" y2="100" stroke="#E5C17B" strokeWidth="0.3" />
              <line x1="0" y1="50" x2="100" y2="50" stroke="#E5C17B" strokeWidth="0.3" />
              <line x1="12" y1="12" x2="88" y2="88" stroke="#E5C17B" strokeWidth="0.22" />
              <line x1="88" y1="12" x2="12" y2="88" stroke="#E5C17B" strokeWidth="0.22" />
              {/* Center Antique Compass Star */}
              <polygon points="50,36 52.8,47.2 64,50 52.8,52.8 50,64 47.2,52.8 36,50 47.2,47.2" fill="#E5C17B" />
            </svg>

            {/* Layer 1: 100 Interactive Pegboard Grid Cells */}
            <div className="grid grid-cols-10 grid-rows-10 w-full h-full relative z-10">
              {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, index) => {
                const row = Math.floor(index / GRID_SIZE);
                const col = index % GRID_SIZE;
                const shot = shotMap.get(`${row},${col}`);
                const coord = formatCoord(row, col);
                const isHovered = hoverCell?.row === row && hoverCell?.col === col;
                const isAxisHover =
                  interactive &&
                  !shot &&
                  hoverCell !== null &&
                  (hoverCell.row === row || hoverCell.col === col);

                const canFireHere = Boolean(interactive && onFireCell && !shot);
                const canDeployHere = Boolean(interactive && onDeployClick);

                return (
                  <button
                    key={coord}
                    type="button"
                    data-cell={coord}
                    aria-label={
                      canFireHere
                        ? `Fire cannon at ${coord}`
                        : canDeployHere
                          ? `Place ship at ${coord}`
                          : `${title} ${coord}${shot ? ` (${shot.result})` : ''}`
                    }
                    disabled={!canFireHere && !canDeployHere}
                    onMouseEnter={() => setHoverCell({ row, col })}
                    onClick={() => {
                      if (canDeployHere && onDeployClick) {
                        onDeployClick(row, col);
                      } else if (canFireHere && onFireCell) {
                        onFireCell(row, col);
                      }
                    }}
                    className={`relative border border-[#D4AF37]/18 flex items-center justify-center transition-colors focus-visible:outline-2 focus-visible:outline-amber-400 focus-visible:z-40 ${
                      canFireHere
                        ? 'cursor-crosshair hover:bg-amber-300/18'
                        : canDeployHere
                          ? 'cursor-pointer hover:bg-emerald-400/16'
                          : 'cursor-default'
                    } ${isAxisHover ? 'bg-[#E5C17B]/[0.07]' : ''}`}
                  >
                    {/* Classic Recessed Pegboard Socket Hole */}
                    <span
                      aria-hidden="true"
                      className="w-[20%] h-[20%] rounded-full bg-[#06131A]/85 shadow-[inset_0_1px_2px_rgba(0,0,0,0.9),0_1px_0_rgba(229,193,123,0.16)] pointer-events-none"
                    />

                    {/* Antique Brass Gunner's Sight Reticle on Hover */}
                    {canFireHere && isHovered && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-[78%] h-[78%] rounded-full border-2 border-[#F5D38E] shadow-[0_0_8px_rgba(245,211,142,0.55)] flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#F5D38E]" />
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Layer 2: Placed 2D Naval Ships + Sinking Foam & Underwater Bubbles */}
            <div className="absolute inset-0 pointer-events-none z-20">
              {ships.map((ship) => {
                const sunk = isShipSunk(ship, shots);
                const sinkingNow = Boolean(justSunkShip && justSunkShip.id === ship.id);
                const leftPct = ship.col * 10;
                const topPct = ship.row * 10;
                const widthPct = ship.orientation === 'H' ? ship.length * 10 : 10;
                const heightPct = ship.orientation === 'V' ? ship.length * 10 : 10;

                const canReposition = Boolean(interactive && onPickUpShip && !deploySpec);

                return (
                  <div
                    key={sinkingNow ? `${ship.id}-sink-${justSunkShip?.eventId}` : ship.id}
                    data-ship={ship.id}
                    data-sunk={sunk ? 'true' : 'false'}
                    onClick={
                      canReposition
                        ? (e) => {
                            e.stopPropagation();
                            onPickUpShip?.(ship);
                          }
                        : undefined
                    }
                    title={canReposition ? `Click to reposition ${ship.name}` : ship.name}
                    className={`absolute p-[2px] ${
                      canReposition ? 'pointer-events-auto cursor-grab hover:brightness-110' : ''
                    }`}
                    style={{
                      left: `${leftPct}%`,
                      top: `${topPct}%`,
                      width: `${widthPct}%`,
                      height: `${heightPct}%`,
                    }}
                  >
                    {/* Sea-Foam Whirlpool Ring When Ship Sinks */}
                    {sinkingNow && (
                      <div
                        className="absolute -inset-1.5 rounded-full border-2 border-[#E6F4F8]/80 bg-[#7DD3FC]/15 animate-sink-foam"
                        aria-hidden="true"
                      />
                    )}

                    <NavalShipSvg
                      shipId={ship.id}
                      length={ship.length}
                      orientation={ship.orientation}
                      sunk={sunk}
                      sinkingNow={sinkingNow}
                    />

                    {/* Rising Sea Bubbles Over Sunken Hull */}
                    {sunk && (
                      <div className="absolute inset-0 overflow-visible pointer-events-none" aria-hidden="true">
                        <span
                          className="absolute left-[22%] top-[42%] w-1.5 h-1.5 rounded-full border border-[#BAE6FD]/80 bg-[#E0F2FE]/35 animate-bubble-pop"
                          style={{ animationDelay: '0ms' }}
                        />
                        <span
                          className="absolute left-[54%] top-[36%] w-2 h-2 rounded-full border border-[#BAE6FD]/80 bg-[#E0F2FE]/30 animate-bubble-pop"
                          style={{ animationDelay: '450ms' }}
                        />
                        <span
                          className="absolute left-[78%] top-[52%] w-1.5 h-1.5 rounded-full border border-[#BAE6FD]/80 bg-[#E0F2FE]/35 animate-bubble-pop"
                          style={{ animationDelay: '900ms' }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Live Ghost Preview while placing a ship */}
              {interactive && deploySpec && hoverCell && (
                <div
                  className="absolute p-[2px] opacity-85"
                  style={{
                    left: `${hoverCell.col * 10}%`,
                    top: `${hoverCell.row * 10}%`,
                    width: `${deployOrientation === 'H' ? deploySpec.length * 10 : 10}%`,
                    height: `${deployOrientation === 'V' ? deploySpec.length * 10 : 10}%`,
                  }}
                >
                  <NavalShipSvg
                    shipId={deploySpec.id}
                    length={deploySpec.length}
                    orientation={deployOrientation}
                    ghost={ghostValid ? 'valid' : 'invalid'}
                  />
                </div>
              )}
            </div>

            {/* Layer 3: Lacquered Pegs, Explosions, Billowing Smoke & Ocean Water Splashes */}
            <div className="absolute inset-0 pointer-events-none z-30">
              {shots.map((shot) => {
                const isLatest =
                  lastShotCoord !== null &&
                  lastShotCoord.row === shot.row &&
                  lastShotCoord.col === shot.col;
                const sinkChainIdx = justSunkCellIndex.get(`${shot.row},${shot.col}`);
                const showExplosion =
                  shot.result === 'hit' && (isLatest || sinkChainIdx !== undefined);
                const explosionDelayMs =
                  sinkChainIdx !== undefined ? sinkChainIdx * 110 : 0;

                const leftPct = shot.col * 10;
                const topPct = shot.row * 10;

                return (
                  <div
                    key={`${shot.row},${shot.col}`}
                    className="absolute flex items-center justify-center overflow-visible"
                    style={{
                      left: `${leftPct}%`,
                      top: `${topPct}%`,
                      width: '10%',
                      height: '10%',
                    }}
                  >
                    {shot.result === 'hit' ? (
                      <div className="relative w-full h-full flex items-center justify-center overflow-visible">
                        {/* Persistent Glowing Ember Bed */}
                        <div
                          className="absolute w-[88%] h-[88%] rounded-full animate-ember-flicker"
                          style={{
                            background:
                              'radial-gradient(circle, rgba(251,146,60,0.82) 0%, rgba(220,38,38,0.44) 55%, rgba(0,0,0,0) 76%)',
                          }}
                        />

                        {/* Continuous Curling Ash & Charcoal Smoke Plumes Rising From Damaged / Sunk Hull */}
                        <div
                          className="absolute -top-[28%] left-[12%] w-[64%] h-[64%] rounded-full animate-smoke-rise"
                          style={{
                            background:
                              'radial-gradient(circle, rgba(180,172,164,0.62) 0%, rgba(58,52,48,0.72) 50%, rgba(0,0,0,0) 78%)',
                            animationDelay: `${((shot.row * 7 + shot.col * 13) % 9) * 180}ms`,
                          }}
                        />
                        <div
                          className="absolute -top-[18%] left-[26%] w-[56%] h-[56%] rounded-full animate-smoke-rise-alt"
                          style={{
                            background:
                              'radial-gradient(circle, rgba(140,132,124,0.58) 0%, rgba(36,32,29,0.75) 52%, rgba(0,0,0,0) 78%)',
                            animationDelay: `${(((shot.row * 5 + shot.col * 11) % 7) + 3) * 190}ms`,
                          }}
                        />

                        {/* Classic Glossy Crimson Board-Game Hit Peg */}
                        <div
                          key={isLatest ? `hit-${lastShotCoord?.id}` : 'hit'}
                          className={`relative z-10 w-[52%] h-[52%] rounded-full bg-gradient-to-br from-[#F87171] via-[#DC2626] to-[#7F1D1D] border-[1.5px] border-[#FDE8D8] shadow-[0_3px_7px_rgba(0,0,0,0.75),0_0_10px_rgba(239,68,68,0.65)] ${
                            isLatest ? 'animate-hit-burst' : ''
                          }`}
                        >
                          <div className="absolute top-[16%] left-[18%] w-[32%] h-[32%] rounded-full bg-white/65" />
                        </div>

                        {/* Fiery Explosion Burst + Shockwave Ring on Direct Hit or Ship Destruction */}
                        {showExplosion && (
                          <div
                            key={`boom-${justSunkShip?.eventId ?? lastShotCoord?.id ?? 0}-${shot.row}-${shot.col}`}
                            className="absolute inset-0 flex items-center justify-center overflow-visible z-20"
                          >
                            {/* Expanding Fiery Shockwave Ring */}
                            <div
                              className="absolute w-[92%] h-[92%] rounded-full border-2 border-[#FDBA74] animate-explosion-ring"
                              style={{ animationDelay: `${explosionDelayMs}ms` }}
                            />
                            {/* Starburst Fireball SVG */}
                            <svg
                              viewBox="0 0 64 64"
                              className="w-[155%] h-[155%] overflow-visible animate-explosion-flash"
                              style={{ animationDelay: `${explosionDelayMs}ms` }}
                              aria-hidden="true"
                            >
                              <polygon
                                points="32,2 39,18 56,10 47,26 62,33 46,40 54,56 38,47 32,62 25,47 10,55 18,39 2,32 18,25 10,9 26,18"
                                fill="#EA580C"
                              />
                              <polygon
                                points="32,10 37,22 49,17 42,29 54,34 42,38 47,50 35,43 32,54 28,43 16,49 22,37 10,32 22,27 17,16 28,22"
                                fill="#FACC15"
                              />
                              <circle cx="32" cy="32" r="9" fill="#FFFBEB" />
                            </svg>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="relative w-full h-full flex items-center justify-center overflow-visible">
                        {/* Animated Ocean Water Splash Rings & Sea-Spray Plume */}
                        {isLatest && (
                          <>
                            <div
                              key={`rip1-${lastShotCoord?.id}`}
                              className="absolute w-[82%] h-[82%] rounded-full border-2 border-[#E0F2FE] animate-splash-ripple"
                            />
                            <div
                              key={`rip2-${lastShotCoord?.id}`}
                              className="absolute w-[58%] h-[58%] rounded-full border border-[#BAE6FD]/90 animate-splash-ripple"
                              style={{ animationDelay: '120ms' }}
                            />
                            <svg
                              key={`plume-${lastShotCoord?.id}`}
                              viewBox="0 0 48 48"
                              className="absolute w-[125%] h-[125%] overflow-visible animate-splash-plume"
                              aria-hidden="true"
                            >
                              <path
                                d="M24 34 C19 25 14 20 12 14 C16 17 20 19 22 22 C22 14 23 8 24 5 C25 8 26 14 26 22 C28 19 32 17 36 14 C34 20 29 25 24 34 Z"
                                fill="#F0F9FF"
                                fillOpacity="0.92"
                              />
                              <circle cx="10" cy="18" r="2.2" fill="#E0F2FE" />
                              <circle cx="38" cy="17" r="2.2" fill="#E0F2FE" />
                              <circle cx="24" cy="4" r="1.8" fill="#FFFFFF" />
                            </svg>
                          </>
                        )}

                        {/* Classic Glossy Ivory-Cream Board-Game Miss Peg */}
                        <div className="w-[44%] h-[44%] rounded-full bg-gradient-to-br from-[#FFFDF7] via-[#E7DFD1] to-[#9E9484] border-[1.5px] border-[#574C3F] shadow-[0_3px_6px_rgba(0,0,0,0.68)]" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Layer 4: Brief Vintage Brass "SHIP SUNK" Proclamation Banner */}
            {justSunkShip && (
              <div
                key={`banner-${justSunkShip.eventId}`}
                data-testid="ship-sunk-banner"
                className="pointer-events-none absolute left-1/2 top-1/2 z-40 px-5 py-2.5 rounded text-center animate-sunk-banner whitespace-nowrap"
                style={{
                  backgroundColor: 'rgba(28, 16, 11, 0.96)',
                  border: '2px solid #D4AF37',
                  boxShadow: '0 14px 36px rgba(0, 0, 0, 0.85)',
                }}
              >
                <div className="text-[10px] tracking-[0.26em] uppercase font-bold text-[#F59E0B]">
                  Vessel Destroyed
                </div>
                <div className="font-display text-base sm:text-lg font-extrabold tracking-wider uppercase text-[#FAF3E3]">
                  {justSunkShip.name} Sunk!
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
