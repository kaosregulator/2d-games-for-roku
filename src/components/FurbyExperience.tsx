import {
  Box,
  Hand,
  Moon,
  Music2,
  PackageOpen,
  Pause,
  Sparkles,
  Sun,
  Utensils,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getFurbyStageMetrics,
  hitTestFurbyZone,
  renderFurbyScene,
} from '../furby/renderer';
import {
  applyFurbyPetting,
  createFurbySim,
  FURBY_COATS,
  openFurbyBox,
  placeFurbyOnTable,
  returnFurbyToBox,
  setFurbyDragged,
  setFurbyGazeTarget,
  stepFurbySim,
  triggerFurbyAction,
} from '../furby/simulation';
import type { FurbyActivity, FurbyCoatId, FurbyPhase, FurbySimState } from '../furby/types';
import { AGED_LEATHER_TEXTURE, WALNUT_BOARD_TEXTURE } from './BattleshipGrid';

export interface FurbyLaunchConfig {
  coatId: FurbyCoatId;
  name: string;
}

interface FurbyExperienceProps {
  config: FurbyLaunchConfig;
  onReturnTitle: () => void;
}

/**
 * Interactive 60fps 2D Collector's Furby Unboxing & Tabletop Experience (Silent — zero audio).
 * Focuses on lifelike plush fur physics, articulated acrylic eyes & mechanical eyelids,
 * 2-piece yellow beak & tongue movement, floppy spring-damper ears, and 1999 box unboxing.
 */
export function FurbyExperience({ config, onReturnTitle }: FurbyExperienceProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const simRef = useRef<FurbySimState>(createFurbySim(config.coatId, config.name));
  const woodImgRef = useRef<HTMLImageElement | null>(null);
  const pausedRef = useRef(false);

  // Pointer drag/petting refs (no 60Hz React state!)
  const pointerDownRef = useRef(false);
  const pointerStartRef = useRef<{ x: number; y: number; moved: boolean; zone: string | null }>({
    x: 0,
    y: 0,
    moved: false,
    zone: null,
  });
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null);

  // Discrete React HUD snapshots (updated only when phase/activity/pause changes)
  const [phase, setPhase] = useState<FurbyPhase>('boxed');
  const [activity, setActivity] = useState<FurbyActivity>('idle');
  const [paused, setPaused] = useState(false);

  const coat = FURBY_COATS[config.coatId];

  useEffect(() => {
    pausedRef.current = paused;
    document.body.dataset.state = paused ? 'paused' : 'playing';
  }, [paused]);

  // Preload antique walnut wood surface for the tabletop
  useEffect(() => {
    const img = new Image();
    img.src = WALNUT_BOARD_TEXTURE;
    woodImgRef.current = img;
  }, []);

  // Main 60fps decoupled canvas loop + ResizeObserver
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    let lastTime = performance.now();
    let lastReportedPhase: FurbyPhase = simRef.current.phase;
    let lastReportedActivity: FurbyActivity = simRef.current.activity;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.floor(rect.width));
      const h = Math.max(1, Math.floor(rect.height));
      if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    const frame = (now: number) => {
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;

      const sim = simRef.current;
      if (!pausedRef.current) {
        stepFurbySim(sim, Math.min(rawDt, 0.05));
      }

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      renderFurbyScene(ctx, sim, w, h, woodImgRef.current);

      if (sim.phase !== lastReportedPhase) {
        lastReportedPhase = sim.phase;
        setPhase(sim.phase);
      }
      if (sim.activity !== lastReportedActivity) {
        lastReportedActivity = sim.activity;
        setActivity(sim.activity);
      }

      rafId = window.requestAnimationFrame(frame);
    };

    rafId = window.requestAnimationFrame(frame);

    return () => {
      window.cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, []);

  // Keyboard shortcuts: P/Escape Pause, Space/Enter advance unboxing
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;

      if (e.code === 'Escape' || e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        setPaused((v) => !v);
      } else if ((e.code === 'Space' || e.code === 'Enter') && !pausedRef.current) {
        const sim = simRef.current;
        if (sim.phase === 'boxed') {
          e.preventDefault();
          openFurbyBox(sim);
          setPhase(sim.phase);
        } else if (sim.phase === 'ready_to_lift') {
          e.preventDefault();
          placeFurbyOnTable(sim);
          setPhase(sim.phase);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Clear pointer drag on blur
  useEffect(() => {
    const onBlur = () => {
      pointerDownRef.current = false;
      setFurbyDragged(simRef.current, false);
    };
    window.addEventListener('blur', onBlur);
    return () => window.removeEventListener('blur', onBlur);
  }, []);

  const toCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      w: rect.width,
      h: rect.height,
    };
  };

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (pausedRef.current) return;
    const sim = simRef.current;
    const { x, y, w, h } = toCanvasCoords(e);
    const m = getFurbyStageMetrics(sim, w, h);

    // Live cursor eye-tracking relative to Furby's eyes
    const eyeWorldX = m.cx;
    const eyeWorldY = m.cy - 24 * m.scale;
    setFurbyGazeTarget(
      sim,
      (x - eyeWorldX) / (220 * m.scale),
      (y - eyeWorldY) / (190 * m.scale),
      true
    );

    const prev = lastPointerRef.current;
    const vx = prev ? (x - prev.x) / 14 : 0;
    const vy = prev ? (y - prev.y) / 14 : 0;
    lastPointerRef.current = { x, y };

    const hit = hitTestFurbyZone(sim, x, y, w, h);

    // Gentle fur parting whenever cursor brushes over Furby's plush coat on the table!
    if (
      sim.phase === 'on_table' &&
      !sim.isDragging &&
      (hit.zone === 'head' || hit.zone === 'belly' || hit.zone === 'ear_left' || hit.zone === 'ear_right')
    ) {
      if (Math.hypot(vx, vy) > 0.14) {
        applyFurbyPetting(sim, hit.localNormX, hit.localNormY, vx, vy);
      }
    }

    // Drag Furby out of the open box or reposition him across the wooden table
    if (pointerDownRef.current) {
      const dist = Math.hypot(x - pointerStartRef.current.x, y - pointerStartRef.current.y);
      if (dist > 14) {
        pointerStartRef.current.moved = true;
        const startZone = pointerStartRef.current.zone;
        if (
          (sim.phase === 'on_table' || sim.phase === 'ready_to_lift') &&
          (startZone === 'head' ||
            startZone === 'belly' ||
            startZone === 'ear_left' ||
            startZone === 'ear_right')
        ) {
          setFurbyDragged(sim, true, x / w, y / h);
        }
      }
    }
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (pausedRef.current) return;
    const sim = simRef.current;
    const { x, y, w, h } = toCanvasCoords(e);
    const hit = hitTestFurbyZone(sim, x, y, w, h);

    pointerDownRef.current = true;
    pointerStartRef.current = { x, y, moved: false, zone: hit.zone };
    lastPointerRef.current = { x, y };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const sim = simRef.current;
    const { x, y, w, h } = toCanvasCoords(e);
    const wasMoved = pointerStartRef.current.moved;
    pointerDownRef.current = false;

    if (sim.isDragging) {
      setFurbyDragged(sim, false);
      return;
    }

    if (wasMoved || pausedRef.current) return;

    const hit = hitTestFurbyZone(sim, x, y, w, h);

    if (sim.phase === 'boxed') {
      if (hit.zone !== null) {
        openFurbyBox(sim);
        setPhase(sim.phase);
      }
      return;
    }

    if (sim.phase === 'ready_to_lift') {
      if (hit.zone !== null) {
        placeFurbyOnTable(sim);
        setPhase(sim.phase);
      }
      return;
    }

    if (sim.phase === 'on_table') {
      if (hit.zone === 'beak') {
        triggerFurbyAction(sim, 'eat');
      } else if (hit.zone === 'belly') {
        triggerFurbyAction(sim, 'tickle');
      } else if (hit.zone === 'ear_left' || hit.zone === 'ear_right') {
        triggerFurbyAction(sim, 'surprised');
      } else if (hit.zone === 'head') {
        applyFurbyPetting(sim, hit.localNormX, hit.localNormY, 0.9, 0.25);
        triggerFurbyAction(sim, 'happy_pet');
      }
    }
  }, []);

  const handlePointerLeave = useCallback(() => {
    setFurbyGazeTarget(simRef.current, 0, 0, false);
    lastPointerRef.current = null;
  }, []);

  const leatherPanelStyle = {
    backgroundColor: '#1E140F',
    backgroundImage: `linear-gradient(160deg, rgba(32, 20, 14, 0.72), rgba(16, 9, 6, 0.86)), url('${AGED_LEATHER_TEXTURE}')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    border: '1.5px solid #B68F48',
    boxShadow: '0 14px 36px rgba(0, 0, 0, 0.65), inset 0 1px 0 rgba(246, 217, 152, 0.16)',
  };

  const statusLabel =
    phase === 'boxed'
      ? 'Sealed in 1999 Collector Box'
      : phase === 'opening' || phase === 'ready_to_lift'
        ? 'Box Opened · Ready to Place on Table'
        : phase === 'lifting'
          ? 'Stepping onto the Table...'
          : activity === 'sleep'
            ? 'Napping Peacefully'
            : activity === 'dance'
              ? 'Dancing on the Table'
              : activity === 'eat'
                ? 'Chomping Happily'
                : activity === 'tickle'
                  ? 'Giggling!'
                  : activity === 'happy_pet'
                    ? 'Enjoying Head Pets'
                    : 'Awake on the Table';

  return (
    <div
      data-testid="furby-stage"
      data-phase={phase}
      className="fixed inset-0 select-none overflow-hidden bg-[#160E0A]"
    >
      {/* Full-Viewport 60fps Interactive 2D Canvas */}
      <canvas
        ref={canvasRef}
        data-testid="furby-canvas"
        aria-label={`Interactive 2D Furby ${config.name} (${coat.name})`}
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        className="block w-full h-full cursor-pointer touch-none"
      />

      {/* TOP PERIMETER BAR (Pointer pass-through wrapper) */}
      <div className="pointer-events-none fixed top-0 left-0 right-0 z-20 flex items-start justify-between gap-3 p-3 sm:p-4">
        {/* Left: Collector Edition Plaque */}
        <div
          className="pointer-events-auto flex items-center gap-3 rounded-md px-4 py-2"
          style={leatherPanelStyle}
        >
          <div
            className="w-9 h-9 rounded-full border-2 border-[#D4AF37]/80 shrink-0 flex items-center justify-center"
            style={{ backgroundColor: coat.furBase }}
            aria-hidden="true"
          >
            <div className="w-4 h-3 rounded-full bg-[#FACC15] border border-[#92400E]" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs text-[#DFC592]/80">
              <span>Furby 1999</span>
              <span aria-hidden="true">·</span>
              <span>{coat.name}</span>
            </div>
            <div className="font-display text-base font-bold text-[#FAF2E1]">
              {config.name}{' '}
              <span className="font-sans text-xs font-normal text-[#E5C17B] ml-1.5">
                {statusLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Pause Utility Button */}
        <div className="pointer-events-auto rounded-md p-1" style={leatherPanelStyle}>
          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              setPaused(true);
            }}
            aria-label="Pause Furby"
            className="w-8 h-8 rounded flex items-center justify-center cursor-pointer text-[#F4E3C1] hover:bg-amber-900/40"
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* BOTTOM PERIMETER INTERACTION DOCK */}
      <div className="pointer-events-none fixed bottom-0 left-0 right-0 z-20 flex flex-col items-center gap-2 p-3 sm:p-4">
        {phase === 'boxed' && (
          <div className="pointer-events-auto flex items-center gap-3 rounded-lg p-2" style={leatherPanelStyle}>
            <button
              type="button"
              data-testid="open-box-btn"
              onClick={() => {
                openFurbyBox(simRef.current);
                setPhase(simRef.current.phase);
              }}
              className="flex items-center gap-2 px-6 py-2.5 rounded font-display text-sm font-bold tracking-wider uppercase cursor-pointer bg-[#14532D] hover:bg-[#166534] text-[#FAF2E1] border-2 border-[#D4AF37]/80 whitespace-nowrap"
            >
              <PackageOpen className="w-4 h-4" />
              <span>Open 1999 Box</span>
            </button>
          </div>
        )}

        {(phase === 'opening' || phase === 'ready_to_lift') && (
          <div className="pointer-events-auto flex items-center gap-3 rounded-lg p-2" style={leatherPanelStyle}>
            <button
              type="button"
              data-testid="place-on-table-btn"
              onClick={() => {
                placeFurbyOnTable(simRef.current);
                setPhase(simRef.current.phase);
              }}
              className="flex items-center gap-2 px-6 py-2.5 rounded font-display text-sm font-bold tracking-wider uppercase cursor-pointer bg-[#7A4A21] hover:bg-[#8E5728] text-[#FAF2E1] border-2 border-[#E5C17B]/85 whitespace-nowrap"
            >
              <Sparkles className="w-4 h-4" />
              <span>Lift Out &amp; Place on Table</span>
            </button>
          </div>
        )}

        {phase === 'on_table' && (
          <div
            data-testid="furby-action-dock"
            className="pointer-events-auto flex flex-wrap items-center justify-center gap-1.5 rounded-lg p-1.5"
            style={leatherPanelStyle}
          >
            <button
              type="button"
              onClick={() => {
                applyFurbyPetting(simRef.current, 0.15, -0.35, 1.2, 0.25);
                triggerFurbyAction(simRef.current, 'happy_pet');
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded text-xs font-semibold cursor-pointer bg-[#2C1C13] hover:bg-[#3F281C] text-[#FAF2E1] border border-[#8A6B37]/60 whitespace-nowrap"
            >
              <Hand className="w-3.5 h-3.5 text-[#F5B5D0]" />
              <span>Pet Fur</span>
            </button>

            <button
              type="button"
              onClick={() => triggerFurbyAction(simRef.current, 'tickle')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded text-xs font-semibold cursor-pointer bg-[#2C1C13] hover:bg-[#3F281C] text-[#FAF2E1] border border-[#8A6B37]/60 whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#FDE047]" />
              <span>Tickle Belly</span>
            </button>

            <button
              type="button"
              onClick={() => triggerFurbyAction(simRef.current, 'eat')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded text-xs font-semibold cursor-pointer bg-[#2C1C13] hover:bg-[#3F281C] text-[#FAF2E1] border border-[#8A6B37]/60 whitespace-nowrap"
            >
              <Utensils className="w-3.5 h-3.5 text-[#FACC15]" />
              <span>Feed Beak</span>
            </button>

            <button
              type="button"
              onClick={() => triggerFurbyAction(simRef.current, 'dance')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded text-xs font-semibold cursor-pointer bg-[#2C1C13] hover:bg-[#3F281C] text-[#FAF2E1] border border-[#8A6B37]/60 whitespace-nowrap"
            >
              <Music2 className="w-3.5 h-3.5 text-[#6EE7B7]" />
              <span>Wiggle Dance</span>
            </button>

            <button
              type="button"
              onClick={() =>
                triggerFurbyAction(
                  simRef.current,
                  activity === 'sleep' ? 'surprised' : 'yawn'
                )
              }
              className="flex items-center gap-1.5 px-3.5 py-2 rounded text-xs font-semibold cursor-pointer bg-[#2C1C13] hover:bg-[#3F281C] text-[#FAF2E1] border border-[#8A6B37]/60 whitespace-nowrap"
            >
              {activity === 'sleep' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-[#FDE68A]" />
                  <span>Wake Up</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-[#C4B5FD]" />
                  <span>Nap</span>
                </>
              )}
            </button>

            <button
              type="button"
              data-testid="return-to-box-btn"
              onClick={() => {
                returnFurbyToBox(simRef.current);
                setPhase('boxed');
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded text-xs font-semibold cursor-pointer bg-[#19100B] hover:bg-[#2C1C13] text-[#DFC592] border border-[#8A6B37]/45 whitespace-nowrap"
            >
              <Box className="w-3.5 h-3.5" />
              <span>Back in Box</span>
            </button>
          </div>
        )}

        <div className="text-[11px] text-[#DFC592]/75 tracking-wide text-center">
          {phase === 'on_table'
            ? 'Move Cursor Eye Tracking · Brush Fur to Pet · Click Beak to Feed · Click Belly to Tickle · Drag Across Table'
            : 'Click the Collector Box or Button to Unbox Your 1999 Furby onto the Wooden Table'}
        </div>
      </div>

      {/* PAUSE MODAL */}
      {paused && (
        <div
          role="dialog"
          aria-label="Furby Paused"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
        >
          <div
            className="w-full max-w-md rounded-lg p-6 text-center space-y-5"
            style={{
              ...leatherPanelStyle,
              border: '2px solid #C49E54',
              boxShadow: '0 24px 64px rgba(0,0,0,0.88)',
            }}
          >
            <div>
              <div className="text-xs tracking-[0.22em] uppercase text-[#E5C17B]">Paused</div>
              <h2 className="font-display text-3xl font-bold text-[#FAF2E1] mt-1">
                {config.name}
              </h2>
              <p className="text-xs text-[#CBB592] mt-1">{coat.name}</p>
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => setPaused(false)}
                className="w-full py-3 rounded font-semibold text-sm cursor-pointer bg-[#14532D] hover:bg-[#166534] text-[#FAF2E1] border border-[#D4AF37]/60"
              >
                Resume
              </button>
              <button
                type="button"
                onClick={() => {
                  returnFurbyToBox(simRef.current);
                  setPhase('boxed');
                  setPaused(false);
                }}
                className="w-full py-2.5 rounded font-semibold text-sm cursor-pointer bg-[#6B4220] hover:bg-[#7D4E26] text-[#FAF2E1] border border-[#C49E54]/50"
              >
                Seal Back in 1999 Box
              </button>
              <button
                type="button"
                onClick={onReturnTitle}
                className="w-full py-2.5 rounded font-semibold text-sm cursor-pointer bg-[#2B1C14] hover:bg-[#3A261B] text-[#F4E3C1] border border-[#8A6B37]/60"
              >
                Return to Game Picker
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
