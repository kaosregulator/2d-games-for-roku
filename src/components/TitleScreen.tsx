import { useEffect, useRef, useState } from 'react';
import type { AiDifficulty, BattleshipMode, BattleshipRulesConfig } from '../battleship/types';
import { renderFurbyPreview } from '../furby/renderer';
import { FURBY_COAT_LIST } from '../furby/simulation';
import type { FurbyCoatId } from '../furby/types';
import { ALL_TOKENS, PLAYER_ACCENTS } from '../game/boardData';
import type { PlayerSetupConfig, TokenId } from '../game/types';
import type { OnlineStartIntent } from './BattleshipGame';
import { AGED_LEATHER_TEXTURE, WALNUT_BOARD_TEXTURE } from './BattleshipGrid';
import { NavalShipSvg } from './BattleshipShips';
import type { FurbyLaunchConfig } from './FurbyExperience';
import { SilverTokenIcon } from './SilverTokens';

export type TabletopGameChoice = 'monopoly' | 'battleship' | 'furby';

function FurbyTabIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      {/* Floppy ears */}
      <ellipse cx="5.5" cy="11.5" rx="4.2" ry="2.4" transform="rotate(-28 5.5 11.5)" fill="#F5A6C8" stroke="#7A2E52" strokeWidth="1.2" />
      <ellipse cx="22.5" cy="11.5" rx="4.2" ry="2.4" transform="rotate(28 22.5 11.5)" fill="#F5A6C8" stroke="#7A2E52" strokeWidth="1.2" />
      {/* Plush round body */}
      <ellipse cx="14" cy="15.5" rx="8.5" ry="9" fill="#FAD2E5" stroke="#8E3A60" strokeWidth="1.3" />
      {/* Crown hair tuft */}
      <path d="M11 7 C11.5 3.5, 16.5 3.5, 17 7 Z" fill="#FBE5F0" stroke="#8E3A60" strokeWidth="1" />
      {/* Faceplate */}
      <ellipse cx="14" cy="14.5" rx="5.5" ry="4.4" fill="#F8E7DC" stroke="#A67C6B" strokeWidth="0.9" />
      {/* Expressive eyes */}
      <circle cx="11.8" cy="13.5" r="1.7" fill="#FFFFFF" stroke="#2D1F1A" strokeWidth="0.8" />
      <circle cx="16.2" cy="13.5" r="1.7" fill="#FFFFFF" stroke="#2D1F1A" strokeWidth="0.8" />
      <circle cx="11.8" cy="13.5" r="0.9" fill="#2A7B56" />
      <circle cx="16.2" cy="13.5" r="0.9" fill="#2A7B56" />
      {/* Yellow beak */}
      <ellipse cx="14" cy="16.8" rx="2.1" ry="1.4" fill="#FACC15" stroke="#92400E" strokeWidth="0.8" />
    </svg>
  );
}

function FurbyCoatSwatchCanvas({ coatId }: { coatId: FurbyCoatId }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    renderFurbyPreview(canvas, coatId);
  }, [coatId]);

  return (
    <canvas
      ref={canvasRef}
      width={156}
      height={144}
      className="w-[104px] h-[96px] mx-auto block"
      aria-hidden="true"
    />
  );
}

interface TitleScreenProps {
  selectedGame: TabletopGameChoice;
  onSelectGame: (game: TabletopGameChoice) => void;
  configs: PlayerSetupConfig[];
  onChangeConfigs: (next: PlayerSetupConfig[]) => void;
  onStartMonopoly: () => void;
  initialRoomCode?: string;
  onStartBattleship: (
    rules: BattleshipRulesConfig,
    onlineIntent: OnlineStartIntent | null
  ) => void;
  onStartFurby: (config: FurbyLaunchConfig) => void;
}

/**
 * Heirloom Parlor Title Screen with Game Picker (Monopoly vs Battleship).
 * Preserves the full Monopoly 2-4 player + 8 silver token configurator and adds
 * a complete 2D Battleship configurator (Vs CPU, Pass & Play, and Live Online Room vs Friend).
 */
export function TitleScreen({
  selectedGame,
  onSelectGame,
  configs,
  onChangeConfigs,
  onStartMonopoly,
  initialRoomCode = '',
  onStartBattleship,
  onStartFurby,
}: TitleScreenProps) {
  const takenTokens = new Set(configs.map((c) => c.token));

  // Battleship setup state
  const [bsMode, setBsMode] = useState<BattleshipMode>(
    initialRoomCode ? 'online' : 'cpu'
  );
  const [difficulty, setDifficulty] = useState<AiDifficulty>('commander');
  const [bonusShotOnHit, setBonusShotOnHit] = useState(false);
  const [p1Name, setP1Name] = useState('Admiral 1');
  const [p2Name, setP2Name] = useState('Admiral 2');
  const [roomCodeInput, setRoomCodeInput] = useState(initialRoomCode.toUpperCase());

  // Furby 1999 collector unboxing setup state
  const [furbyCoatId, setFurbyCoatId] = useState<FurbyCoatId>('crystal_pink');
  const [furbyName, setFurbyName] = useState('May-May');

  const setPlayerCount = (count: number) => {
    if (count === configs.length) return;
    if (count < configs.length) {
      onChangeConfigs(configs.slice(0, count));
      return;
    }
    const next = [...configs];
    const used = new Set(next.map((c) => c.token));
    const defaultNames = ['Player 1', 'Victoria', 'Arthur', 'Clara'];
    while (next.length < count) {
      const idx = next.length;
      const available = ALL_TOKENS.find((t) => !used.has(t.id))?.id ?? 'iron';
      used.add(available);
      next.push({
        id: `p${idx + 1}`,
        name: defaultNames[idx] ?? `Player ${idx + 1}`,
        token: available,
        isAI: idx > 0,
        accentColor: PLAYER_ACCENTS[idx % PLAYER_ACCENTS.length],
      });
    }
    onChangeConfigs(next);
  };

  const updatePlayer = (index: number, patch: Partial<PlayerSetupConfig>) => {
    onChangeConfigs(
      configs.map((c, i) => (i === index ? { ...c, ...patch } : c))
    );
  };

  const cycleToken = (index: number, token: TokenId) => {
    const holderIdx = configs.findIndex((c, i) => i !== index && c.token === token);
    if (holderIdx >= 0) {
      const prevToken = configs[index].token;
      onChangeConfigs(
        configs.map((c, i) => {
          if (i === index) return { ...c, token };
          if (i === holderIdx) return { ...c, token: prevToken };
          return c;
        })
      );
      return;
    }
    updatePlayer(index, { token });
  };

  const launchBattleshipLocal = () => {
    onStartBattleship(
      {
        mode: bsMode,
        difficulty,
        bonusShotOnHit,
        player1Name: p1Name,
        player2Name: p2Name,
      },
      null
    );
  };

  const launchBattleshipOnline = (action: 'create' | 'join') => {
    const cleanCode = roomCodeInput.trim().toUpperCase();
    if (action === 'join' && cleanCode.length < 3) return;
    onStartBattleship(
      {
        mode: 'online',
        difficulty: 'admiral',
        bonusShotOnHit,
        player1Name: p1Name,
        player2Name: 'Friend',
      },
      {
        action,
        roomCode: action === 'join' ? cleanCode : undefined,
        playerName: p1Name.trim() || 'Admiral',
        bonusShotOnHit,
      }
    );
  };

  const launchFurby = () => {
    onStartFurby({
      coatId: furbyCoatId,
      name: furbyName.trim() || 'May-May',
    });
  };

  return (
    <div
      data-testid="title-screen"
      className="fixed inset-0 z-40 flex flex-col items-center justify-between p-4 sm:p-6 overflow-y-auto"
      style={{
        backgroundColor: '#160E0A',
        backgroundImage:
          selectedGame === 'battleship' || selectedGame === 'furby'
            ? `radial-gradient(ellipse at 50% 42%, rgba(28, 17, 10, 0.55) 0%, rgba(12, 7, 4, 0.9) 100%), url('${WALNUT_BOARD_TEXTURE}')`
            : 'radial-gradient(ellipse at 50% 45%, rgba(16, 11, 8, 0.52) 0%, rgba(12, 8, 6, 0.86) 100%)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Top Game Picker Bar: Monopoly | Battleship | Furby */}
      <div
        role="tablist"
        aria-label="Choose Tabletop Game"
        className="flex items-center gap-1.5 rounded-lg p-1.5"
        style={{
          backgroundColor: 'rgba(18, 13, 10, 0.94)',
          border: '1.5px solid rgba(196, 158, 84, 0.55)',
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.65)',
        }}
      >
        <button
          type="button"
          role="tab"
          aria-selected={selectedGame === 'monopoly'}
          onClick={() => onSelectGame('monopoly')}
          className={`flex items-center gap-2 px-5 py-2 rounded-md text-sm font-display font-bold tracking-wider uppercase cursor-pointer transition-colors whitespace-nowrap ${
            selectedGame === 'monopoly'
              ? 'bg-[#B91C1C] text-amber-50 border border-amber-300/70'
              : 'text-amber-100/75 hover:text-amber-50 hover:bg-stone-900/70 border border-transparent'
          }`}
        >
          <SilverTokenIcon token="tophat" size={22} />
          <span>Monopoly</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={selectedGame === 'battleship'}
          onClick={() => onSelectGame('battleship')}
          className={`flex items-center gap-2 px-5 py-2 rounded-md text-sm font-display font-bold tracking-wider uppercase cursor-pointer transition-colors whitespace-nowrap ${
            selectedGame === 'battleship'
              ? 'bg-[#7A4A21] text-[#FAF2E1] border border-[#E5C17B]/80'
              : 'text-amber-100/75 hover:text-amber-50 hover:bg-stone-900/70 border border-transparent'
          }`}
        >
          <SilverTokenIcon token="battleship" size={22} />
          <span>Battleship</span>
        </button>

        <button
          type="button"
          role="tab"
          data-testid="tab-furby"
          aria-selected={selectedGame === 'furby'}
          onClick={() => onSelectGame('furby')}
          className={`flex items-center gap-2 px-5 py-2 rounded-md text-sm font-display font-bold tracking-wider uppercase cursor-pointer transition-colors whitespace-nowrap ${
            selectedGame === 'furby'
              ? 'bg-[#1F6A70] text-[#FFF4F8] border border-[#F2A6CA]/85'
              : 'text-amber-100/75 hover:text-amber-50 hover:bg-stone-900/70 border border-transparent'
          }`}
        >
          <FurbyTabIcon />
          <span>Furby</span>
        </button>
      </div>

      {/* Center Framed Heirloom Setup Plaque */}
      <div
        className="w-full max-w-[790px] rounded-lg px-6 py-5 sm:px-8 sm:py-6 my-3"
        style={
          selectedGame === 'battleship' || selectedGame === 'furby'
            ? {
                backgroundColor: '#1E140F',
                backgroundImage: `linear-gradient(160deg, rgba(30, 18, 12, 0.72), rgba(16, 10, 6, 0.88)), url('${AGED_LEATHER_TEXTURE}')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                border: '2px solid #C49E54',
                boxShadow:
                  '0 32px 84px rgba(0, 0, 0, 0.88), inset 0 0 0 1px rgba(255, 226, 163, 0.16)',
              }
            : {
                backgroundColor: 'rgba(24, 16, 12, 0.95)',
                border: '2px solid #C49E54',
                boxShadow:
                  '0 32px 84px rgba(0, 0, 0, 0.88), inset 0 0 0 1px rgba(255, 226, 163, 0.14)',
              }
        }
      >
        {selectedGame === 'monopoly' ? (
          <>
            {/* Bespoke Inline SVG Art Deco MONOPOLY Crest */}
            <div className="flex flex-col items-center text-center">
              <svg
                viewBox="0 0 540 104"
                className="w-full max-w-[440px] h-auto"
                role="img"
                aria-label="Monopoly Grand Tabletop"
              >
                <path
                  d="M28 14 L512 14 L526 28 L526 76 L512 90 L28 90 L14 76 L14 28 Z"
                  fill="#B91C1C"
                  stroke="#D4AF37"
                  strokeWidth="3.5"
                />
                <path
                  d="M34 20 L506 20 L518 32 L518 72 L506 84 L34 84 L22 72 L22 32 Z"
                  fill="none"
                  stroke="#FAF6EC"
                  strokeWidth="1.4"
                  strokeOpacity="0.65"
                />
                <polygon points="36,52 44,44 52,52 44,60" fill="#D4AF37" />
                <polygon points="488,52 496,44 504,52 496,60" fill="#D4AF37" />
                <text
                  x="270"
                  y="67"
                  textAnchor="middle"
                  fill="#FAF6EC"
                  fontFamily="Oswald, sans-serif"
                  fontWeight="700"
                  fontSize="50"
                  letterSpacing="8"
                  style={{ paintOrder: 'stroke fill', stroke: '#1C1917', strokeWidth: '4px' }}
                >
                  MONOPOLY
                </text>
              </svg>

              <p className="mt-1 font-display text-xs sm:text-sm tracking-[0.24em] text-amber-200/85 uppercase">
                Grand Tabletop Edition · Silver Tokens &amp; Action Cam
              </p>
            </div>

            {/* Player Count Selector */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-b border-amber-500/25 py-2.5">
              <span className="text-sm font-semibold text-amber-100">Table Seats</span>
              <div className="flex items-center gap-1.5 bg-stone-950/80 p-1 rounded border border-amber-500/25">
                {[2, 3, 4].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setPlayerCount(count)}
                    className={`px-3.5 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                      configs.length === count
                        ? 'bg-amber-600 text-stone-950'
                        : 'text-amber-100/75 hover:text-amber-50'
                    }`}
                  >
                    {count} Players
                  </button>
                ))}
              </div>
            </div>

            {/* Player Rows + Silver Token Picker */}
            <div className="mt-3.5 space-y-2">
              {configs.map((cfg, idx) => (
                <div
                  key={cfg.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded px-3.5 py-2 bg-stone-950/75 border border-amber-500/20"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 bg-emerald-950/80"
                      style={{ border: `2px solid ${cfg.accentColor}` }}
                    >
                      <SilverTokenIcon token={cfg.token} size={28} />
                    </div>
                    <div className="flex items-center gap-2 min-w-0">
                      <label htmlFor={`player-name-${idx}`} className="sr-only">
                        Player {idx + 1} name
                      </label>
                      <input
                        id={`player-name-${idx}`}
                        type="text"
                        maxLength={16}
                        value={cfg.name}
                        onChange={(e) => updatePlayer(idx, { name: e.target.value })}
                        className="w-32 sm:w-36 rounded bg-stone-900 border border-amber-500/30 px-2.5 py-1.5 text-sm font-medium text-amber-50 focus:outline-none focus:border-amber-400"
                      />
                      <button
                        type="button"
                        onClick={() => updatePlayer(idx, { isAI: !cfg.isAI })}
                        className={`px-2.5 py-1.5 rounded text-xs font-semibold cursor-pointer border whitespace-nowrap ${
                          cfg.isAI
                            ? 'bg-stone-800 border-stone-600 text-amber-200'
                            : 'bg-emerald-900/70 border-emerald-500/50 text-emerald-100'
                        }`}
                      >
                        {cfg.isAI ? 'CPU Bot' : 'Human'}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-wrap">
                    {ALL_TOKENS.map((t) => {
                      const selected = cfg.token === t.id;
                      const usedByOther = !selected && takenTokens.has(t.id);
                      return (
                        <button
                          key={t.id}
                          type="button"
                          title={`${t.name}${usedByOther ? ' (swap)' : ''}`}
                          aria-label={`Select ${t.name} for ${cfg.name}`}
                          onClick={() => cycleToken(idx, t.id)}
                          className={`w-8 h-8 rounded flex items-center justify-center cursor-pointer transition-transform ${
                            selected
                              ? 'bg-amber-500/25 border-2 border-amber-400 scale-105'
                              : usedByOther
                                ? 'bg-stone-900/40 border border-stone-800 opacity-45 hover:opacity-85'
                                : 'bg-stone-900/80 border border-stone-700 hover:border-amber-400/60'
                          }`}
                        >
                          <SilverTokenIcon token={t.id} size={24} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Primary Monopoly CTA */}
            <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-amber-100/70">
                Official Rules · $1,500 Starting Cash · 32 Houses · 12 Hotels · All 32 Cards
              </div>
              <button
                type="button"
                data-start="true"
                onClick={onStartMonopoly}
                className="w-full sm:w-auto px-8 py-3 rounded font-display text-base font-bold tracking-wider uppercase cursor-pointer transition-colors bg-emerald-700 hover:bg-emerald-600 text-white border-2 border-amber-300/75 shadow-[0_10px_28px_rgba(0,0,0,0.55)] whitespace-nowrap"
              >
                Start Game
              </button>
            </div>
          </>
        ) : selectedGame === 'battleship' ? (
          <>
            {/* Bespoke Inline SVG Antique Wood & Brass BATTLESHIP Crest */}
            <div className="flex flex-col items-center text-center">
              <svg
                viewBox="0 0 540 104"
                className="w-full max-w-[440px] h-auto"
                role="img"
                aria-label="Battleship Classic Heirloom Edition"
              >
                <path
                  d="M28 14 L512 14 L526 28 L526 76 L512 90 L28 90 L14 76 L14 28 Z"
                  fill="#173844"
                  stroke="#D4AF37"
                  strokeWidth="3.5"
                />
                <path
                  d="M34 20 L506 20 L518 32 L518 72 L506 84 L34 84 L22 72 L22 32 Z"
                  fill="none"
                  stroke="#F4E3C1"
                  strokeWidth="1.4"
                  strokeOpacity="0.6"
                />
                {/* Antique Brass Compass Star Marks */}
                <polygon points="44,42 46.5,49.5 54,52 46.5,54.5 44,62 41.5,54.5 34,52 41.5,49.5" fill="#D4AF37" />
                <polygon points="496,42 498.5,49.5 506,52 498.5,54.5 496,62 493.5,54.5 486,52 493.5,49.5" fill="#D4AF37" />
                <text
                  x="270"
                  y="67"
                  textAnchor="middle"
                  fill="#FAF2E1"
                  fontFamily="Oswald, sans-serif"
                  fontWeight="700"
                  fontSize="48"
                  letterSpacing="7"
                  style={{ paintOrder: 'stroke fill', stroke: '#1B110C', strokeWidth: '4px' }}
                >
                  BATTLESHIP
                </text>
              </svg>

              <p className="mt-1 font-display text-xs sm:text-sm tracking-[0.24em] text-[#DFC592] uppercase">
                Classic Wood &amp; Leather Board Edition · Naval Broadsides
              </p>

              {/* Live 2D Cast-Metal & Teak Fleet Showcase Strip */}
              <div className="mt-3 flex flex-wrap items-center justify-center gap-4 px-4 py-2 rounded bg-[#142D37]/85 border border-[#B68F48]/45 shadow-inner">
                <div className="w-[105px] h-[22px]">
                  <NavalShipSvg shipId="carrier" length={5} orientation="H" />
                </div>
                <div className="w-[86px] h-[22px]">
                  <NavalShipSvg shipId="battleship" length={4} orientation="H" />
                </div>
                <div className="w-[68px] h-[22px]">
                  <NavalShipSvg shipId="cruiser" length={3} orientation="H" />
                </div>
                <div className="w-[68px] h-[22px]">
                  <NavalShipSvg shipId="submarine" length={3} orientation="H" />
                </div>
                <div className="w-[48px] h-[22px]">
                  <NavalShipSvg shipId="destroyer" length={2} orientation="H" />
                </div>
              </div>
            </div>

            {/* 3-Way Play Mode Selector */}
            <div className="mt-4 border-t border-b border-[#B68F48]/30 py-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setBsMode('cpu')}
                  className={`px-3.5 py-2.5 rounded text-left cursor-pointer border transition-colors ${
                    bsMode === 'cpu'
                      ? 'bg-[#462B1A]/90 border-[#E5C17B] text-[#FAF2E1]'
                      : 'bg-[#140D09]/80 border-[#6E5233]/45 text-[#DFC592]/85 hover:border-[#C49E54]/70'
                  }`}
                >
                  <div className="text-sm font-bold">Vs CPU</div>
                  <div className="text-[11px] opacity-75">Solo vs Naval Captain</div>
                </button>

                <button
                  type="button"
                  onClick={() => setBsMode('pass_and_play')}
                  className={`px-3.5 py-2.5 rounded text-left cursor-pointer border transition-colors ${
                    bsMode === 'pass_and_play'
                      ? 'bg-[#462B1A]/90 border-[#E5C17B] text-[#FAF2E1]'
                      : 'bg-[#140D09]/80 border-[#6E5233]/45 text-[#DFC592]/85 hover:border-[#C49E54]/70'
                  }`}
                >
                  <div className="text-sm font-bold">Pass &amp; Play</div>
                  <div className="text-[11px] opacity-75">2 Friends · Same Device</div>
                </button>

                <button
                  type="button"
                  onClick={() => setBsMode('online')}
                  className={`px-3.5 py-2.5 rounded text-left cursor-pointer border transition-colors ${
                    bsMode === 'online'
                      ? 'bg-[#462B1A]/90 border-[#E5C17B] text-[#FAF2E1]'
                      : 'bg-[#140D09]/80 border-[#6E5233]/45 text-[#DFC592]/85 hover:border-[#C49E54]/70'
                  }`}
                >
                  <div className="text-sm font-bold">Online vs Friend</div>
                  <div className="text-[11px] opacity-75">Live Room Code · 2 Devices</div>
                </button>
              </div>
            </div>

            {/* Mode-Specific Configuration */}
            <div className="mt-4 space-y-3">
              {bsMode === 'cpu' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded bg-[#140D09]/80 border border-[#6E5233]/45 p-3">
                    <label htmlFor="bs-p1-name" className="text-xs text-[#CBB592] block mb-1.5">
                      Your Callsign
                    </label>
                    <input
                      id="bs-p1-name"
                      type="text"
                      maxLength={18}
                      value={p1Name}
                      onChange={(e) => setP1Name(e.target.value)}
                      className="w-full rounded bg-[#21150F] border border-[#8A6B37]/50 px-3 py-1.5 text-sm text-[#FAF2E1] focus:outline-none focus:border-[#E5C17B]"
                    />
                  </div>

                  <div className="rounded bg-[#140D09]/80 border border-[#6E5233]/45 p-3">
                    <div className="text-xs text-[#CBB592] mb-1.5">Captain Difficulty</div>
                    <div className="grid grid-cols-3 gap-1">
                      {(['ensign', 'commander', 'admiral'] as AiDifficulty[]).map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setDifficulty(lvl)}
                          className={`py-1.5 rounded text-xs font-semibold capitalize cursor-pointer ${
                            difficulty === lvl
                              ? 'bg-[#C49E54] text-[#1A100A]'
                              : 'bg-[#21150F] text-[#DFC592] hover:text-white'
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {bsMode === 'pass_and_play' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded bg-[#140D09]/80 border border-[#6E5233]/45 p-3">
                    <label htmlFor="bs-local-p1" className="text-xs text-[#CBB592] block mb-1.5">
                      Commander 1 Name
                    </label>
                    <input
                      id="bs-local-p1"
                      type="text"
                      maxLength={18}
                      value={p1Name}
                      onChange={(e) => setP1Name(e.target.value)}
                      className="w-full rounded bg-[#21150F] border border-[#8A6B37]/50 px-3 py-1.5 text-sm text-[#FAF2E1] focus:outline-none focus:border-[#E5C17B]"
                    />
                  </div>
                  <div className="rounded bg-[#140D09]/80 border border-[#6E5233]/45 p-3">
                    <label htmlFor="bs-local-p2" className="text-xs text-[#CBB592] block mb-1.5">
                      Commander 2 Name
                    </label>
                    <input
                      id="bs-local-p2"
                      type="text"
                      maxLength={18}
                      value={p2Name}
                      onChange={(e) => setP2Name(e.target.value)}
                      className="w-full rounded bg-[#21150F] border border-[#8A6B37]/50 px-3 py-1.5 text-sm text-[#FAF2E1] focus:outline-none focus:border-[#E5C17B]"
                    />
                  </div>
                </div>
              )}

              {bsMode === 'online' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded bg-[#140D09]/80 border border-[#6E5233]/45 p-3 space-y-2">
                    <label htmlFor="bs-online-name" className="text-xs text-[#CBB592] block">
                      Your Callsign
                    </label>
                    <input
                      id="bs-online-name"
                      type="text"
                      maxLength={18}
                      value={p1Name}
                      onChange={(e) => setP1Name(e.target.value)}
                      className="w-full rounded bg-[#21150F] border border-[#8A6B37]/50 px-3 py-1.5 text-sm text-[#FAF2E1] focus:outline-none focus:border-[#E5C17B]"
                    />
                    <button
                      type="button"
                      data-testid="create-room-btn"
                      onClick={() => launchBattleshipOnline('create')}
                      className="w-full py-2 rounded text-xs font-bold uppercase tracking-wider cursor-pointer bg-[#14532D] hover:bg-[#166534] text-[#FAF2E1] border border-[#D4AF37]/60"
                    >
                      Create Private Room
                    </button>
                  </div>

                  <div className="rounded bg-[#140D09]/80 border border-[#6E5233]/45 p-3 space-y-2">
                    <label htmlFor="bs-room-code" className="text-xs text-[#CBB592] block">
                      Have a Friend&apos;s Room Code?
                    </label>
                    <input
                      id="bs-room-code"
                      type="text"
                      maxLength={8}
                      placeholder="e.g. NAVY7"
                      value={roomCodeInput}
                      onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                      className="w-full rounded bg-[#21150F] border border-[#8A6B37]/50 px-3 py-1.5 font-mono-num text-sm tracking-widest uppercase text-[#F5D38E] focus:outline-none focus:border-[#E5C17B]"
                    />
                    <button
                      type="button"
                      data-testid="join-room-btn"
                      disabled={roomCodeInput.trim().length < 3}
                      onClick={() => launchBattleshipOnline('join')}
                      className="w-full py-2 rounded text-xs font-bold uppercase tracking-wider cursor-pointer bg-[#7A4A21] hover:bg-[#8E5728] text-[#FAF2E1] border border-[#E5C17B]/60 disabled:opacity-35 disabled:cursor-not-allowed"
                    >
                      Join Friend&apos;s Room
                    </button>
                  </div>
                </div>
              )}

              {/* Classic Rule Option */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <label className="flex items-center gap-2.5 text-xs text-[#E8DAC4] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bonusShotOnHit}
                    onChange={(e) => setBonusShotOnHit(e.target.checked)}
                    className="accent-amber-500 w-4 h-4"
                  />
                  <span>Streak Fire (scoring a Hit grants a bonus cannon shot)</span>
                </label>

                {bsMode !== 'online' && (
                  <button
                    type="button"
                    data-start="true"
                    onClick={launchBattleshipLocal}
                    className="w-full sm:w-auto px-8 py-3 rounded font-display text-base font-bold tracking-wider uppercase cursor-pointer transition-colors bg-[#14532D] hover:bg-[#166534] text-[#FAF2E1] border-2 border-[#D4AF37]/80 shadow-[0_10px_28px_rgba(0,0,0,0.55)] whitespace-nowrap"
                  >
                    Start Battle
                  </button>
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Bespoke Inline SVG Vintage 1999 FURBY Collector Crest */}
            <div className="flex flex-col items-center text-center">
              <svg
                viewBox="0 0 540 104"
                className="w-full max-w-[440px] h-auto"
                role="img"
                aria-label="Furby 1999 Collector Unboxing Edition"
              >
                <path
                  d="M28 14 L512 14 L526 28 L526 76 L512 90 L28 90 L14 76 L14 28 Z"
                  fill="#1C5C62"
                  stroke="#D4AF37"
                  strokeWidth="3.5"
                />
                <path
                  d="M34 20 L506 20 L518 32 L518 72 L506 84 L34 84 L22 72 L22 32 Z"
                  fill="none"
                  stroke="#F7B7D6"
                  strokeWidth="1.5"
                  strokeOpacity="0.82"
                />
                {/* Four-point sparkle stars */}
                <polygon
                  points="46,41 48.5,49.5 57,52 48.5,54.5 46,63 43.5,54.5 35,52 43.5,49.5"
                  fill="#FDE047"
                />
                <polygon
                  points="494,41 496.5,49.5 505,52 496.5,54.5 494,63 491.5,54.5 483,52 491.5,49.5"
                  fill="#FDE047"
                />
                <text
                  x="270"
                  y="68"
                  textAnchor="middle"
                  fill="#FFF2F8"
                  fontFamily="Oswald, sans-serif"
                  fontWeight="700"
                  fontSize="52"
                  letterSpacing="10"
                  style={{ paintOrder: 'stroke fill', stroke: '#1B110C', strokeWidth: '4px' }}
                >
                  FURBY
                </text>
              </svg>

              <p className="mt-1 font-display text-xs sm:text-sm tracking-[0.24em] text-[#F5C6DC] uppercase">
                1999 Collector Box Edition · Unbox &amp; Place on Table
              </p>
            </div>

            {/* 4-Coat Vintage 1999 Collector Selector with Live 2D Plush Previews */}
            <div className="mt-4 border-t border-b border-[#B68F48]/30 py-3.5">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#DFC592]">
                  Choose Sealed 1999 Box Edition
                </span>
                <span className="text-[11px] text-[#CBB592]">
                  Silent 2D Plush Engine · Real Fur, Eyes, Beak &amp; Ears
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {FURBY_COAT_LIST.map((coat) => {
                  const selected = furbyCoatId === coat.id;
                  return (
                    <button
                      key={coat.id}
                      type="button"
                      data-testid={`furby-coat-${coat.id}`}
                      onClick={() => setFurbyCoatId(coat.id)}
                      className={`rounded-md p-2 text-center cursor-pointer border transition-colors ${
                        selected
                          ? 'bg-[#254549]/90 border-[#F4B4D2] text-[#FFF4F8] shadow-[0_6px_20px_rgba(0,0,0,0.45)]'
                          : 'bg-[#140D09]/80 border-[#6E5233]/45 text-[#DFC592]/85 hover:border-[#C49E54]/80'
                      }`}
                    >
                      <FurbyCoatSwatchCanvas coatId={coat.id} />
                      <div className="mt-1 text-xs font-bold leading-tight">{coat.name}</div>
                      <div className="text-[10px] opacity-75 mt-0.5 leading-tight">
                        {coat.tagline}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Furby Name & Primary Unbox CTA */}
            <div className="mt-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="w-full sm:w-64">
                <label htmlFor="furby-name-input" className="text-xs text-[#CBB592] block mb-1.5">
                  Your Furby&apos;s Name
                </label>
                <input
                  id="furby-name-input"
                  type="text"
                  maxLength={18}
                  value={furbyName}
                  onChange={(e) => setFurbyName(e.target.value)}
                  className="w-full rounded bg-[#21150F] border border-[#8A6B37]/55 px-3 py-2 text-sm font-medium text-[#FAF2E1] focus:outline-none focus:border-[#F4B4D2]"
                />
              </div>

              <button
                type="button"
                data-start="true"
                data-testid="start-furby-btn"
                onClick={launchFurby}
                className="w-full sm:w-auto px-8 py-3 rounded font-display text-base font-bold tracking-wider uppercase cursor-pointer transition-colors bg-[#1F6A70] hover:bg-[#27828A] text-[#FFF4F8] border-2 border-[#E5C17B]/85 shadow-[0_10px_28px_rgba(0,0,0,0.55)] whitespace-nowrap"
              >
                Unbox Furby
              </button>
            </div>
          </>
        )}
      </div>

      {/* Single flat, borderless bottom control hint line */}
      <div className="text-xs text-amber-100/70 tracking-wide text-center">
        {selectedGame === 'monopoly'
          ? 'Space Roll / Continue · Drag & Scroll Free Camera · C Action Cam · O Full Board · P Pause'
          : selectedGame === 'battleship'
            ? 'Click Grid Deploy / Fire · Right-Click or R Rotate Ship · M Mute · P Pause'
            : 'Click Box Unbox · Move Cursor Eye Tracking · Brush Fur Pet · Click Beak Feed · Drag Across Table · P Pause'}
      </div>
    </div>
  );
}
