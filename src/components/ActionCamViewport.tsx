import { useEffect, useRef } from 'react';
import {
  BOARD_ORIGIN_X,
  BOARD_ORIGIN_Y,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from '../game/boardData';
import type { CameraFocus, CameraMode, GameState } from '../game/types';
import { MonopolyBoard } from './MonopolyBoard';
import { BankTableTray, FlyingMoneyLayer, PlayerTableStations } from './TableMoney';

const TABLETOP_TEXTURE_URL = '/src/assets/images/mahogany_tabletop_surface_1795155167799.jpg';

interface ActionCamViewportProps {
  state: GameState;
  cameraMode: CameraMode;
  cameraFocus: CameraFocus;
  diceRolling: boolean;
  steppingPlayerId: string | null;
  stepPulseKey: number;
  highlightSpaceIndex: number | null;
  onUserDragFreeCamera: () => void;
  onSelectSpace: (spaceIndex: number) => void;
  onClickDeck: (deck: 'chance' | 'communityChest') => void;
}

/**
 * 60fps Hardware-Accelerated 2D Action Cam Viewport.
 * Mutates a single GPU-composited transform (`translate3d + scale`) inside requestAnimationFrame
 * so React never re-renders at 60Hz while the camera smoothly zooms and pans turn-by-turn
 * and move-by-move across the mahogany tabletop.
 */
export function ActionCamViewport({
  state,
  cameraMode,
  cameraFocus,
  diceRolling,
  steppingPlayerId,
  stepPulseKey,
  highlightSpaceIndex,
  onUserDragFreeCamera,
  onSelectSpace,
  onClickDeck,
}: ActionCamViewportProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const worldRef = useRef<HTMLDivElement | null>(null);

  // Live mutable camera state kept completely outside React state for 60Hz smoothness
  const camRef = useRef({
    x: WORLD_WIDTH / 2,
    y: WORLD_HEIGHT / 2,
    zoom: 1,
    targetX: WORLD_WIDTH / 2,
    targetY: WORLD_HEIGHT / 2,
    targetZoom: 1,
    viewportW: 1440,
    viewportH: 900,
    initialized: false,
  });

  const dragRef = useRef({
    dragging: false,
    lastX: 0,
    lastY: 0,
  });

  const modeRef = useRef<CameraMode>(cameraMode);
  modeRef.current = cameraMode;

  const onDragFreeRef = useRef(onUserDragFreeCamera);
  onDragFreeRef.current = onUserDragFreeCamera;

  // Compute target whenever mode or Action Cam focus changes
  useEffect(() => {
    const cam = camRef.current;
    if (cameraMode === 'overview') {
      cam.targetX = WORLD_WIDTH / 2;
      cam.targetY = WORLD_HEIGHT / 2;
      cam.targetZoom = 1.0;
    } else if (cameraMode === 'action') {
      cam.targetX = cameraFocus.worldX;
      cam.targetY = cameraFocus.worldY;
      cam.targetZoom = cameraFocus.zoom;
    }
  }, [cameraMode, cameraFocus.worldX, cameraFocus.worldY, cameraFocus.zoom]);

  // ResizeObserver + single rAF exponential damping loop
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      camRef.current.viewportW = Math.max(320, rect.width);
      camRef.current.viewportH = Math.max(240, rect.height);
    };
    updateSize();

    const ro = new ResizeObserver(updateSize);
    ro.observe(container);

    let rafId = 0;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const cam = camRef.current;
      // Compute base scale that fits the full 1820x1160 tabletop cleanly between top and bottom HUD docks
      const fitScale = Math.min(
        (cam.viewportW - 24) / WORLD_WIDTH,
        (cam.viewportH - 122) / WORLD_HEIGHT
      );

      if (!cam.initialized) {
        cam.x = cam.targetX;
        cam.y = cam.targetY;
        cam.zoom = cam.targetZoom;
        cam.initialized = true;
      } else {
        // Critically-damped smooth glide: snappy enough for move-by-move hops, silky on pans
        const lambda = dragRef.current.dragging ? 22 : 6.4;
        const alpha = 1 - Math.exp(-lambda * dt);
        cam.x += (cam.targetX - cam.x) * alpha;
        cam.y += (cam.targetY - cam.y) * alpha;
        cam.zoom += (cam.targetZoom - cam.zoom) * alpha;
      }

      const finalScale = Math.max(0.32, fitScale * cam.zoom);
      const scaledW = WORLD_WIDTH * finalScale;
      const scaledH = WORLD_HEIGHT * finalScale;

      let tx = cam.viewportW / 2 - cam.x * finalScale;
      let ty = cam.viewportH / 2 - cam.y * finalScale;

      // Keep the mahogany tabletop filling the viewport whenever zoomed in so no empty void appears
      if (scaledW > cam.viewportW) {
        const minTx = cam.viewportW - scaledW;
        tx = Math.max(minTx, Math.min(0, tx));
      } else {
        tx = (cam.viewportW - scaledW) / 2;
      }

      if (scaledH > cam.viewportH) {
        const minTy = cam.viewportH - scaledH;
        ty = Math.max(minTy, Math.min(0, ty));
      } else {
        ty = (cam.viewportH - scaledH) / 2 + 4;
      }

      if (worldRef.current) {
        worldRef.current.style.transform = `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0) scale(${finalScale.toFixed(4)})`;
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, []);

  // Mouse drag pan & scroll wheel zoom (seamlessly switches to free-look if user drags)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Do not hijack clicks on interactive buttons inside the board/table
    if ((e.target as HTMLElement).closest('button')) return;
    if (e.button !== 0) return;
    dragRef.current.dragging = true;
    dragRef.current.lastX = e.clientX;
    dragRef.current.lastY = e.clientY;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.dragging) return;
    const dx = e.clientX - dragRef.current.lastX;
    const dy = e.clientY - dragRef.current.lastY;
    dragRef.current.lastX = e.clientX;
    dragRef.current.lastY = e.clientY;

    if (Math.abs(dx) + Math.abs(dy) > 3 && modeRef.current !== 'free') {
      onDragFreeRef.current();
    }

    const cam = camRef.current;
    const fitScale = Math.min(
      (cam.viewportW - 16) / WORLD_WIDTH,
      (cam.viewportH - 88) / WORLD_HEIGHT
    );
    const currentScale = Math.max(0.32, fitScale * cam.zoom);
    cam.targetX = Math.max(200, Math.min(WORLD_WIDTH - 200, cam.targetX - dx / currentScale));
    cam.targetY = Math.max(150, Math.min(WORLD_HEIGHT - 150, cam.targetY - dy / currentScale));
  };

  const handlePointerUp = () => {
    dragRef.current.dragging = false;
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const cam = camRef.current;
    const factor = e.deltaY > 0 ? 0.88 : 1.12;
    cam.targetZoom = Math.max(0.85, Math.min(2.65, cam.targetZoom * factor));
    if (modeRef.current !== 'free') {
      onDragFreeRef.current();
    }
  };

  return (
    <div
      ref={containerRef}
      data-testid="action-cam-viewport"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onWheel={handleWheel}
      className="fixed inset-0 overflow-hidden bg-[#140e0b] cursor-grab active:cursor-grabbing"
    >
      {/* GPU-Composited Tabletop World */}
      <div
        ref={worldRef}
        className="absolute left-0 top-0 origin-top-left will-change-transform"
        style={{
          width: WORLD_WIDTH,
          height: WORLD_HEIGHT,
        }}
      >
        {/* Heirloom Mahogany & Emerald Baize Table Surface */}
        <div
          className="absolute inset-0 rounded-2xl overflow-hidden shadow-[0_30px_90px_rgba(0,0,0,0.85)]"
          style={{
            backgroundColor: '#1E140F',
            backgroundImage:
              'radial-gradient(circle at 50% 45%, #164431 0%, #0E2F21 68%, #26160E 100%)',
          }}
        >
          <img
            src={TABLETOP_TEXTURE_URL}
            alt="Heirloom mahogany and emerald felt game table"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover opacity-95 pointer-events-none"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          {/* Subtle warm parlor overhead lamp pool */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse at 50% 50%, rgba(255, 240, 200, 0.08) 0%, rgba(0, 0, 0, 0.22) 78%, rgba(0, 0, 0, 0.48) 100%)',
            }}
          />
        </div>

        {/* Left Apron: Physical Bank Money Stacks + 32 Houses & 12 Hotels */}
        <BankTableTray bankHouses={state.bankHouses} bankHotels={state.bankHotels} />

        {/* Center: Official 40-Space 2D Monopoly Board */}
        <div
          className="absolute"
          style={{
            left: BOARD_ORIGIN_X,
            top: BOARD_ORIGIN_Y,
          }}
        >
          <MonopolyBoard
            state={state}
            diceRolling={diceRolling}
            steppingPlayerId={steppingPlayerId}
            stepPulseKey={stepPulseKey}
            highlightSpaceIndex={highlightSpaceIndex}
            onSelectSpace={onSelectSpace}
            onClickDeck={onClickDeck}
          />
        </div>

        {/* Right Apron: Per-Player Tabletop Cash Piles & Title Deed Racks */}
        <PlayerTableStations state={state} onInspectDeed={onSelectSpace} />

        {/* Flying Banknotes across the table on transactions */}
        <FlyingMoneyLayer state={state} />
      </div>
    </div>
  );
}
