import {
  Check,
  Copy,
  Pause,
  RotateCw,
  ShieldAlert,
  Shuffle,
  Trash2,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { chooseCpuShot } from '../battleship/ai';
import {
  createBattleshipGame,
  fireShot,
  FLEET_SPECS,
  generateRandomFleet,
  getSunkShips,
  isShipSunk,
  lockPlayerFleet,
  placeShipOnList,
  validateCompleteFleet,
} from '../battleship/engine';
import { navalSound } from '../battleship/sound';
import type {
  BattleshipGameState,
  BattleshipRulesConfig,
  OnlineProjectedView,
  Orientation,
  PlacedShip,
  ShipTypeId,
} from '../battleship/types';
import {
  AGED_LEATHER_TEXTURE,
  BattleshipGrid,
  WALNUT_BOARD_TEXTURE,
} from './BattleshipGrid';
import { NavalShipSvg } from './BattleshipShips';

export interface OnlineStartIntent {
  action: 'create' | 'join';
  roomCode?: string;
  playerName: string;
  bonusShotOnHit: boolean;
}

interface BattleshipGameProps {
  rulesConfig: BattleshipRulesConfig;
  onlineIntent: OnlineStartIntent | null;
  onReturnTitle: () => void;
}

/**
 * Full 2D Classic Battleship Tabletop Experience:
 * - Vs CPU (Ensign / Commander / Admiral AI)
 * - Pass & Play vs Friend (Classified Command Curtain between deployments & turns)
 * - Online vs Friend (Server-Authoritative WebSocket Room with Fog-of-War & Invite Link)
 */
export function BattleshipGame({
  rulesConfig,
  onlineIntent,
  onReturnTitle,
}: BattleshipGameProps) {
  const isOnline = rulesConfig.mode === 'online';

  // Local mode state (CPU & Pass-and-Play)
  const [localState, setLocalState] = useState<BattleshipGameState>(() =>
    createBattleshipGame(rulesConfig)
  );

  // Online mode state (Server-Authoritative Fog-of-War view)
  const [onlineView, setOnlineView] = useState<OnlineProjectedView | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [wsError, setWsError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const sessionRef = useRef<{ roomCode: string; token: string } | null>(null);

  // Shared Deployment Workbench State
  const [draftShips, setDraftShips] = useState<PlacedShip[]>([]);
  const [selectedShipId, setSelectedShipId] = useState<ShipTypeId | null>('carrier');
  const [orientation, setOrientation] = useState<Orientation>('H');

  // Shell & Juice state
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const [oceanShake, setOceanShake] = useState<{ key: number; heavy: boolean }>({
    key: 0,
    heavy: false,
  });
  const [radarShake, setRadarShake] = useState<{ key: number; heavy: boolean }>({
    key: 0,
    heavy: false,
  });
  const [justSunkOcean, setJustSunkOcean] = useState<{
    id: ShipTypeId;
    name: string;
    eventId: number;
  } | null>(null);
  const [justSunkRadar, setJustSunkRadar] = useState<{
    id: ShipTypeId;
    name: string;
    eventId: number;
  } | null>(null);
  const prevShotIdRef = useRef<number>(0);
  const oceanSinkTimerRef = useRef<number | null>(null);
  const radarSinkTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (oceanSinkTimerRef.current !== null) window.clearTimeout(oceanSinkTimerRef.current);
      if (radarSinkTimerRef.current !== null) window.clearTimeout(radarSinkTimerRef.current);
    };
  }, []);

  // Sync document.body.dataset.state cleanly
  const isGameOver = isOnline
    ? onlineView?.phase === 'gameover'
    : localState.phase === 'gameover';

  useEffect(() => {
    if (isGameOver) {
      document.body.dataset.state = 'gameover';
    } else if (paused) {
      document.body.dataset.state = 'paused';
    } else {
      document.body.dataset.state = 'playing';
    }
  }, [isGameOver, paused]);

  // Connect WebSocket when in Online mode
  useEffect(() => {
    if (!isOnline || !onlineIntent) return;
    let disposed = false;
    let reconnectTimer: number | null = null;

    const connect = () => {
      if (disposed) return;
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//${window.location.host}/ws/battleship`);
      wsRef.current = ws;

      ws.onopen = () => {
        if (disposed) return;
        setWsConnected(true);
        setWsError(null);

        if (sessionRef.current) {
          ws.send(
            JSON.stringify({
              type: 'join_room',
              roomCode: sessionRef.current.roomCode,
              playerName: onlineIntent.playerName,
              sessionToken: sessionRef.current.token,
            })
          );
        } else if (onlineIntent.action === 'create') {
          ws.send(
            JSON.stringify({
              type: 'create_room',
              playerName: onlineIntent.playerName,
              bonusShotOnHit: onlineIntent.bonusShotOnHit,
            })
          );
        } else {
          ws.send(
            JSON.stringify({
              type: 'join_room',
              roomCode: onlineIntent.roomCode ?? '',
              playerName: onlineIntent.playerName,
            })
          );
        }
      };

      ws.onmessage = (evt) => {
        if (disposed) return;
        try {
          const msg = JSON.parse(String(evt.data));
          if (msg.type === 'joined') {
            sessionRef.current = {
              roomCode: msg.roomCode,
              token: msg.sessionToken,
            };
          } else if (msg.type === 'state') {
            const view = msg.view as OnlineProjectedView;
            setOnlineView((prev) => {
              // Reset local draft workbench if transitioning into a fresh rematch deployment
              if (prev && prev.phase === 'gameover' && view.phase === 'deploy') {
                setDraftShips([]);
                setSelectedShipId('carrier');
              }
              return view;
            });
          } else if (msg.type === 'error') {
            setWsError(String(msg.message || 'Connection error'));
          }
        } catch {
          // ignore malformed messages
        }
      };

      ws.onclose = () => {
        if (disposed) return;
        setWsConnected(false);
        if (sessionRef.current) {
          reconnectTimer = window.setTimeout(connect, 1500);
        }
      };

      ws.onerror = () => {
        if (disposed) return;
        setWsConnected(false);
      };
    };

    connect();

    return () => {
      disposed = true;
      if (reconnectTimer !== null) window.clearTimeout(reconnectTimer);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [isOnline, onlineIntent]);

  // Trigger cannon fire -> water splash / fiery explosion + sinking ship FX on every new shot
  const activeLastShot = isOnline ? onlineView?.lastShot ?? null : localState.lastShot;

  useEffect(() => {
    if (!activeLastShot || activeLastShot.id === prevShotIdRef.current) return;
    prevShotIdRef.current = activeLastShot.id;

    const sunkSpec = activeLastShot.sunkShipName
      ? FLEET_SPECS.find((s) => s.name === activeLastShot.sunkShipName) ?? null
      : null;

    // Choreographed cannon broadside -> shell whistle -> water splash OR hull explosion + sinking groan
    navalSound.playSalvo(activeLastShot.result, Boolean(sunkSpec));

    const viewerRole = isOnline
      ? onlineView?.yourRole ?? 'p1'
      : localState.mode === 'pass_and_play'
        ? localState.currentTurn
        : 'p1';
    const hitYourBoard = activeLastShot.target === viewerRole;

    if (activeLastShot.result === 'hit') {
      const heavy = Boolean(sunkSpec);
      if (hitYourBoard) {
        setOceanShake((prev) => ({ key: prev.key + 1, heavy }));
      } else {
        setRadarShake((prev) => ({ key: prev.key + 1, heavy }));
      }

      if (sunkSpec) {
        const sunkEvent = {
          id: sunkSpec.id,
          name: sunkSpec.name,
          eventId: activeLastShot.id,
        };
        if (hitYourBoard) {
          if (oceanSinkTimerRef.current !== null) window.clearTimeout(oceanSinkTimerRef.current);
          setJustSunkOcean(sunkEvent);
          oceanSinkTimerRef.current = window.setTimeout(() => {
            setJustSunkOcean((cur) => (cur?.eventId === sunkEvent.eventId ? null : cur));
            oceanSinkTimerRef.current = null;
          }, 2700);
        } else {
          if (radarSinkTimerRef.current !== null) window.clearTimeout(radarSinkTimerRef.current);
          setJustSunkRadar(sunkEvent);
          radarSinkTimerRef.current = window.setTimeout(() => {
            setJustSunkRadar((cur) => (cur?.eventId === sunkEvent.eventId ? null : cur));
            radarSinkTimerRef.current = null;
          }, 2700);
        }
      }
    }
  }, [activeLastShot, isOnline, onlineView?.yourRole, localState.mode, localState.currentTurn]);

  useEffect(() => {
    if (isGameOver) {
      navalSound.playVictory();
    }
  }, [isGameOver]);

  // Automated CPU Turn Loop (in Vs CPU mode)
  useEffect(() => {
    if (isOnline || paused) return;
    if (localState.mode !== 'cpu') return;
    if (localState.phase !== 'battle' || localState.currentTurn !== 'p2') return;

    const timer = window.setTimeout(() => {
      setLocalState((prev) => {
        if (prev.phase !== 'battle' || prev.currentTurn !== 'p2') return prev;
        const sunkIds = getSunkShips(
          prev.players.p1.ships,
          prev.players.p1.incomingShots
        ).map((s) => s.id);
        const shot = chooseCpuShot(
          prev.players.p1.incomingShots,
          sunkIds,
          prev.difficulty
        );
        return fireShot(prev, 'p2', shot.row, shot.col);
      });
    }, 680);

    return () => window.clearTimeout(timer);
  }, [isOnline, paused, localState]);

  // Keyboard shortcuts: R rotate ship, P/Escape pause, M mute
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;

      if (e.key === 'r' || e.key === 'R') {
        setOrientation((o) => (o === 'H' ? 'V' : 'H'));
      } else if (e.key === 'm' || e.key === 'M') {
        setMuted((prev) => {
          navalSound.setMuted(!prev);
          return !prev;
        });
      } else if (e.code === 'Escape' || e.key === 'p' || e.key === 'P') {
        if (!isGameOver) {
          e.preventDefault();
          setPaused((v) => !v);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isGameOver]);

  // Deployment Handlers
  const selectedSpec = useMemo(
    () => FLEET_SPECS.find((s) => s.id === selectedShipId) ?? null,
    [selectedShipId]
  );

  const handleDeployClick = useCallback(
    (row: number, col: number) => {
      if (!selectedSpec) return;
      const next = placeShipOnList(draftShips, selectedSpec, row, col, orientation);
      if (!next) return;

      navalSound.playShipPlace();
      setDraftShips(next);

      // Automatically select next unplaced ship
      const placedIds = new Set(next.map((s) => s.id));
      const nextUnplaced = FLEET_SPECS.find((s) => !placedIds.has(s.id));
      setSelectedShipId(nextUnplaced ? nextUnplaced.id : null);
    },
    [draftShips, selectedSpec, orientation]
  );

  const handlePickUpShip = useCallback((ship: PlacedShip) => {
    setDraftShips((prev) => prev.filter((s) => s.id !== ship.id));
    setSelectedShipId(ship.id);
    setOrientation(ship.orientation);
    navalSound.playSonarPing();
  }, []);

  const handleAutoDeploy = useCallback(() => {
    const randomFleet = generateRandomFleet();
    setDraftShips(randomFleet);
    setSelectedShipId(null);
    navalSound.playShipPlace();
  }, []);

  const handleClearDraft = useCallback(() => {
    setDraftShips([]);
    setSelectedShipId('carrier');
  }, []);

  const handleLockFleet = useCallback(() => {
    if (!validateCompleteFleet(draftShips)) return;
    navalSound.playSonarPing();

    if (isOnline) {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'lock_fleet', ships: draftShips }));
      }
      return;
    }

    const deployingPlayer: 'p1' | 'p2' =
      localState.phase === 'deploy_p2' ? 'p2' : 'p1';
    setLocalState((prev) => lockPlayerFleet(prev, deployingPlayer, draftShips));
    setDraftShips([]);
    setSelectedShipId('carrier');
  }, [draftShips, isOnline, localState.phase]);

  // Combat Firing Handler
  const handleFire = useCallback(
    (row: number, col: number) => {
      if (paused) return;

      if (isOnline) {
        if (!onlineView || onlineView.phase !== 'battle') return;
        if (onlineView.currentTurn !== onlineView.yourRole) return;
        wsRef.current?.send(JSON.stringify({ type: 'fire', row, col }));
        return;
      }

      if (localState.phase !== 'battle') return;
      if (localState.mode === 'cpu' && localState.currentTurn !== 'p1') return;

      setLocalState((prev) => {
        const shooter = prev.currentTurn;
        const after = fireShot(prev, shooter, row, col);
        if (after === prev) return prev;

        // In Pass & Play, if turn switched to the other player and game continues, show Privacy Handoff Curtain!
        if (
          after.mode === 'pass_and_play' &&
          after.phase === 'battle' &&
          after.currentTurn !== shooter
        ) {
          return {
            ...after,
            phase: 'handoff_turn',
          };
        }
        return after;
      });
    },
    [paused, isOnline, onlineView, localState.phase, localState.mode, localState.currentTurn]
  );

  const handleRestartLocal = () => {
    setPaused(false);
    setDraftShips([]);
    setSelectedShipId('carrier');
    setOrientation('H');
    setJustSunkOcean(null);
    setJustSunkRadar(null);
    setLocalState(createBattleshipGame(rulesConfig));
    navalSound.playSonarPing();
  };

  const handleCopyInvite = () => {
    if (!onlineView) return;
    const url = `${window.location.origin}${window.location.pathname}?game=battleship&room=${onlineView.roomCode}`;
    navigator.clipboard?.writeText(url).catch(() => {});
    setCopiedLink(true);
    window.setTimeout(() => setCopiedLink(false), 2200);
  };

  // Determine unified display model across Local & Online modes
  const isDeploying = isOnline
    ? onlineView?.phase === 'deploy'
    : localState.phase === 'deploy_p1' || localState.phase === 'deploy_p2';

  const isLobby = isOnline && (!onlineView || onlineView.phase === 'lobby');
  const isWaitingPeer = isOnline && onlineView?.phase === 'waiting_peer';
  const isHandoffP2 = !isOnline && localState.phase === 'handoff_p2';
  const isHandoffTurn = !isOnline && localState.phase === 'handoff_turn';

  // Active viewer's perspective during Battle
  const viewerRole: 'p1' | 'p2' = isOnline
    ? onlineView?.yourRole ?? 'p1'
    : localState.mode === 'pass_and_play'
      ? localState.currentTurn
      : 'p1';

  const opponentRole: 'p1' | 'p2' = viewerRole === 'p1' ? 'p2' : 'p1';

  const yourName = isOnline
    ? onlineView?.yourName ?? onlineIntent?.playerName ?? 'Admiral'
    : localState.players[viewerRole].name;

  const opponentName = isOnline
    ? onlineView?.opponentName ?? 'Opponent'
    : localState.players[opponentRole].name;

  const yourShips = isOnline
    ? onlineView?.yourShips ?? []
    : localState.players[viewerRole].ships;

  const incomingShots = isOnline
    ? onlineView?.incomingShots ?? []
    : localState.players[viewerRole].incomingShots;

  const outgoingShots = isOnline
    ? onlineView?.outgoingShots ?? []
    : localState.players[opponentRole].incomingShots;

  const enemyRevealedShips = isOnline
    ? onlineView?.opponentSunkShips ?? []
    : isGameOver
      ? localState.players[opponentRole].ships
      : getSunkShips(
          localState.players[opponentRole].ships,
          localState.players[opponentRole].incomingShots
        );

  const isYourTurn = isOnline
    ? onlineView?.phase === 'battle' && onlineView.currentTurn === onlineView.yourRole
    : localState.phase === 'battle' &&
      (localState.mode === 'pass_and_play' || localState.currentTurn === 'p1');

  const yourRemainingShips = FLEET_SPECS.length - getSunkShips(yourShips, incomingShots).length;
  const enemyRemainingShips = isOnline
    ? onlineView?.opponentShipsRemaining ?? FLEET_SPECS.length
    : FLEET_SPECS.length -
      getSunkShips(
        localState.players[opponentRole].ships,
        localState.players[opponentRole].incomingShots
      ).length;

  const narrationText = isOnline
    ? wsError ?? onlineView?.lastEventText ?? 'Establishing secure naval radio link...'
    : localState.lastEventText;

  const deployingPlayerName = isOnline
    ? yourName
    : localState.phase === 'deploy_p2'
      ? localState.players.p2.name
      : localState.players.p1.name;

  const hitsLanded = outgoingShots.filter((s) => s.result === 'hit').length;
  const accuracyPct =
    outgoingShots.length > 0 ? Math.round((hitsLanded / outgoingShots.length) * 100) : 0;

  const leatherPanelStyle = {
    backgroundColor: '#1E140F',
    backgroundImage: `linear-gradient(160deg, rgba(32, 20, 14, 0.72), rgba(16, 9, 6, 0.86)), url('${AGED_LEATHER_TEXTURE}')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    border: '1.5px solid #B68F48',
    boxShadow: '0 14px 36px rgba(0, 0, 0, 0.65), inset 0 1px 0 rgba(246, 217, 152, 0.16)',
  };

  return (
    <div
      data-testid="battleship-table"
      className="fixed inset-0 flex flex-col justify-between overflow-y-auto p-3 sm:p-4"
      style={{
        backgroundColor: '#1A110C',
        backgroundImage: `radial-gradient(ellipse at 50% 40%, rgba(28, 17, 10, 0.45) 0%, rgba(14, 8, 5, 0.86) 100%), url('${WALNUT_BOARD_TEXTURE}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* TOP PERIMETER COMMAND BAR (STITCHED LEATHER & BRASS) */}
      <div className="flex flex-wrap items-center justify-between gap-3 max-w-[1360px] w-full mx-auto">
        {/* Left: Active Naval Command Plaque */}
        <div
          className="flex items-center gap-3 rounded-md px-4 py-2"
          style={leatherPanelStyle}
        >
          <div className="w-10 h-10 rounded-full bg-[#19100B] border-2 border-[#D4AF37]/80 flex items-center justify-center shrink-0 shadow-inner">
            {/* Antique Brass Compass Medallion */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="9" stroke="#D4AF37" strokeWidth="1.5" />
              <circle cx="12" cy="12" r="5" stroke="#B68F48" strokeWidth="1" opacity="0.65" />
              <polygon points="12,3.5 14,10 20.5,12 14,14 12,20.5 10,14 3.5,12 10,10" fill="#D4AF37" opacity="0.9" />
              <circle cx="12" cy="12" r="2" fill="#19100B" />
            </svg>
          </div>

          <div>
            <div className="flex items-center gap-2 text-xs text-[#DFC592]/80">
              <span>Battleship</span>
              <span aria-hidden="true">·</span>
              <span>
                {rulesConfig.mode === 'cpu'
                  ? `Vs CPU (${rulesConfig.difficulty})`
                  : rulesConfig.mode === 'pass_and_play'
                    ? 'Pass & Play'
                    : `Online Room ${onlineView?.roomCode ?? '...'}`}
              </span>
              {rulesConfig.bonusShotOnHit && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-[#F5C563]">Streak Fire</span>
                </>
              )}
            </div>
            <div className="flex items-baseline gap-3">
              <span className="font-display text-base font-bold text-[#FAF2E1]">
                {isDeploying
                  ? `${deployingPlayerName} · Fleet Deployment`
                  : isLobby
                    ? 'Waiting for Friend'
                    : isWaitingPeer
                      ? 'Fleet Locked · Standing By'
                      : isYourTurn
                        ? `${yourName}'s Broadside`
                        : `${opponentName} Firing...`}
              </span>
              {!isDeploying && !isLobby && (
                <span className="font-mono-num text-xs text-[#E5C17B]">
                  Your Fleet: {yourRemainingShips}/5 · Enemy: {enemyRemainingShips}/5
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Utility Controls */}
        <div className="flex items-center gap-2">
          {isOnline && (
            <div
              className="flex items-center gap-2 rounded-md px-3 py-2 text-xs font-mono-num"
              style={leatherPanelStyle}
            >
              {wsConnected ? (
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <WifiOff className="w-3.5 h-3.5 text-rose-400" />
              )}
              <span className="text-[#F4E3C1]">
                {onlineView?.roomCode ? `ROOM ${onlineView.roomCode}` : 'Connecting'}
              </span>
            </div>
          )}

          <div
            className="flex items-center gap-1 rounded-md p-1"
            style={leatherPanelStyle}
          >
            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                setMuted((m) => {
                  navalSound.setMuted(!m);
                  return !m;
                });
              }}
              aria-label={muted ? 'Unmute naval audio' : 'Mute naval audio'}
              className="w-8 h-8 rounded flex items-center justify-center cursor-pointer text-[#F4E3C1] hover:bg-amber-900/40"
            >
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                setPaused(true);
              }}
              aria-label="Pause Battleship"
              className="w-8 h-8 rounded flex items-center justify-center cursor-pointer text-[#F4E3C1] hover:bg-amber-900/40"
            >
              <Pause className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* CENTER WORKSPACE */}
      <div className="flex-1 flex items-center justify-center py-3 max-w-[1360px] w-full mx-auto">
        {/* CASE A: ONLINE WAITING ROOM LOBBY */}
        {isLobby && (
          <div
            data-testid="online-lobby"
            className="w-full max-w-lg rounded-lg p-7 text-center space-y-5"
            style={{
              ...leatherPanelStyle,
              border: '2px solid #C49E54',
              boxShadow: '0 28px 72px rgba(0,0,0,0.82)',
            }}
          >
            <div className="text-xs tracking-[0.24em] uppercase text-[#E5C17B] font-semibold">
              Admiralty Dispatch Room
            </div>
            <h2 className="font-display text-3xl font-bold text-[#FAF2E1]">
              {wsError ? 'Connection Issue' : 'Share Callsign With Your Friend'}
            </h2>

            {wsError ? (
              <div className="rounded bg-rose-950/75 border border-rose-500/50 p-4 text-sm text-rose-200">
                {wsError}
              </div>
            ) : (
              <>
                <div className="rounded-lg bg-[#120B08]/90 border-2 border-[#C49E54]/70 py-4 px-6">
                  <div className="text-[11px] uppercase tracking-[0.2em] text-[#DFC592]/75">
                    Room Callsign Code
                  </div>
                  <div
                    data-testid="online-room-code"
                    className="mt-1 font-mono-num text-4xl font-extrabold tracking-[0.28em] text-[#F5D38E]"
                  >
                    {onlineView?.roomCode ?? '.....'}
                  </div>
                </div>

                <p className="text-sm text-[#DDD0BE] leading-relaxed">
                  Have your friend open this app, pick <strong>Battleship → Online vs Friend</strong>,
                  and enter the callsign code above — or send them the direct invite link below.
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    disabled={!onlineView?.roomCode}
                    onClick={handleCopyInvite}
                    className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded font-semibold text-sm cursor-pointer bg-[#8A5A2B] hover:bg-[#9E6833] text-[#FAF2E1] border border-[#E5C17B]/60 disabled:opacity-40"
                  >
                    {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedLink ? 'Invite Link Copied!' : 'Copy Invite Link'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={onReturnTitle}
                    className="px-5 py-3 rounded font-semibold text-sm cursor-pointer bg-[#2B1C14] hover:bg-[#3A261B] text-[#F4E3C1] border border-[#8A6B37]/60"
                  >
                    Leave Room
                  </button>
                </div>
              </>
            )}

            {wsError && (
              <button
                type="button"
                onClick={onReturnTitle}
                className="w-full py-3 rounded font-semibold text-sm cursor-pointer bg-[#2B1C14] hover:bg-[#3A261B] text-[#F4E3C1] border border-[#8A6B37]/60"
              >
                Back to Menu
              </button>
            )}
          </div>
        )}

        {/* CASE B: ONLINE WAITING FOR OPPONENT TO LOCK FLEET */}
        {isWaitingPeer && (
          <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-[minmax(0,520px)_1fr] gap-6 items-center">
            <BattleshipGrid
              title={`${yourName}'s Fleet`}
              subtitle="Positions Secured"
              variant="ocean"
              ships={yourShips}
              shots={[]}
              interactive={false}
            />
            <div
              className="rounded-lg p-7 text-center space-y-4"
              style={leatherPanelStyle}
            >
              <div className="text-xs uppercase tracking-[0.22em] text-[#E5C17B] font-semibold">
                Fleet Locked In
              </div>
              <h2 className="font-display text-2xl font-bold text-[#FAF2E1]">
                Waiting for {opponentName}
              </h2>
              <p className="text-sm text-[#DDD0BE]">
                Your 5 naval vessels are secured on the board. Cannons will be ready as soon
                as {opponentName} finishes positioning their fleet.
              </p>
            </div>
          </div>
        )}

        {/* CASE C: PASS & PLAY CLASSIFIED PRIVACY HANDOFF CURTAIN */}
        {(isHandoffP2 || isHandoffTurn) && (
          <div
            data-testid="privacy-curtain"
            className="w-full max-w-lg rounded-lg p-8 text-center space-y-5"
            style={{
              ...leatherPanelStyle,
              border: '2px solid #C49E54',
              boxShadow: '0 28px 80px rgba(0,0,0,0.88)',
            }}
          >
            <div className="mx-auto w-14 h-14 rounded-full bg-[#2A1910] border-2 border-[#D4AF37] flex items-center justify-center text-[#F5D38E]">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div className="text-xs tracking-[0.24em] uppercase text-[#E5C17B] font-semibold">
              Classified Board Case Handoff
            </div>
            <h2 className="font-display text-3xl font-bold text-[#FAF2E1]">
              {isHandoffP2
                ? `Pass Board to ${localState.players.p2.name}`
                : `Pass Board to ${localState.players[localState.currentTurn].name}`}
            </h2>
            <p className="text-sm text-[#DDD0BE] leading-relaxed">
              {isHandoffP2
                ? `${localState.players.p1.name}'s vessels are concealed. Confirm ${localState.players.p2.name} is seated to arrange Fleet 2.`
                : `Enemy charts are concealed. Confirm ${localState.players[localState.currentTurn].name} is seated before opening your board.`}
            </p>
            <button
              type="button"
              data-testid="reveal-handoff-btn"
              onClick={() => {
                navalSound.playSonarPing();
                setLocalState((prev) => ({
                  ...prev,
                  phase: isHandoffP2 ? 'deploy_p2' : 'battle',
                }));
              }}
              className="w-full py-3.5 rounded font-display text-base font-bold tracking-wider uppercase cursor-pointer bg-[#14532D] hover:bg-[#166534] text-[#FAF2E1] border-2 border-[#D4AF37]/80"
            >
              {isHandoffP2
                ? `I Am ${localState.players.p2.name} · Deploy Fleet`
                : `I Am ${localState.players[localState.currentTurn].name} · Open Board`}
            </button>
          </div>
        )}

        {/* CASE D: FLEET DEPLOYMENT PHASE */}
        {isDeploying && (
          <div className="w-full grid grid-cols-1 lg:grid-cols-[minmax(0,540px)_1fr] gap-6 items-start">
            <BattleshipGrid
              testId="deploy-ocean-grid"
              title={`${deployingPlayerName}'s Chart`}
              subtitle="Click to place · Right-click / R rotates"
              variant="ocean"
              ships={draftShips}
              shots={[]}
              interactive
              deploySpec={selectedSpec}
              deployOrientation={orientation}
              onDeployClick={handleDeployClick}
              onPickUpShip={handlePickUpShip}
              onRotate={() => setOrientation((o) => (o === 'H' ? 'V' : 'H'))}
            />

            {/* Antique Stitched Leather Drydock Tray */}
            <div
              className="rounded-lg p-5 space-y-4"
              style={{
                ...leatherPanelStyle,
                border: '2px solid #B68F48',
              }}
            >
              <div className="flex items-center justify-between border-b border-[#B68F48]/30 pb-3">
                <div>
                  <h2 className="font-display text-lg font-bold text-[#F4E3C1]">
                    Wooden Ship Tray
                  </h2>
                  <p className="text-xs text-[#CBB592]">
                    Place all 5 warships onto your chart. Click a placed vessel to move it.
                  </p>
                </div>
                <span className="font-mono-num text-sm font-bold text-[#E5C17B] whitespace-nowrap shrink-0">
                  {draftShips.length} / 5 Placed
                </span>
              </div>

              {/* 5 Classic Ship Selector Slots */}
              <div className="space-y-2">
                {FLEET_SPECS.map((spec) => {
                  const placed = draftShips.find((s) => s.id === spec.id);
                  const isSelected = selectedShipId === spec.id;
                  return (
                    <button
                      key={spec.id}
                      type="button"
                      onClick={() => {
                        if (placed) {
                          handlePickUpShip(placed);
                        } else {
                          setSelectedShipId(spec.id);
                        }
                      }}
                      className={`w-full flex items-center justify-between gap-3 rounded px-3.5 py-2.5 cursor-pointer border transition-colors ${
                        isSelected
                          ? 'bg-[#3A2416]/95 border-[#E5C17B] text-[#FAF2E1]'
                          : placed
                            ? 'bg-[#192D24]/70 border-[#4D8B68]/55 text-[#D8F0E0] hover:border-[#E5C17B]/70'
                            : 'bg-[#160F0B]/85 border-[#6E5233]/45 text-[#E8DAC4] hover:border-[#C49E54]/70'
                      }`}
                    >
                      <div className="text-left">
                        <div className="text-sm font-semibold">
                          {spec.name}{' '}
                          <span className="font-mono-num text-xs text-[#CBB592]">
                            ({spec.length} pegs)
                          </span>
                        </div>
                        <div className="text-[11px] text-[#CBB592]/85">
                          {placed
                            ? `Deployed (${placed.orientation === 'H' ? 'Horizontal' : 'Vertical'}) — click to move`
                            : isSelected
                              ? `Ready to place (${orientation === 'H' ? 'Horizontal' : 'Vertical'})`
                              : 'Click to select'}
                        </div>
                      </div>
                      <div style={{ width: spec.length * 24, height: 24 }} className="shrink-0">
                        <NavalShipSvg shipId={spec.id} length={spec.length} orientation="H" />
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setOrientation((o) => (o === 'H' ? 'V' : 'H'))}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded text-xs font-semibold cursor-pointer bg-[#2C1C13] hover:bg-[#3B261A] text-[#F4E3C1] border border-[#8A6B37]/65 whitespace-nowrap"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Rotate ({orientation})</span>
                </button>
                <button
                  type="button"
                  data-testid="auto-deploy-btn"
                  onClick={handleAutoDeploy}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded text-xs font-semibold cursor-pointer bg-[#5C3A1D] hover:bg-[#6E4725] text-[#FAF2E1] border border-[#C49E54]/65 whitespace-nowrap"
                >
                  <Shuffle className="w-3.5 h-3.5" />
                  <span>Auto-Deploy</span>
                </button>
                <button
                  type="button"
                  onClick={handleClearDraft}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded text-xs font-semibold cursor-pointer bg-[#2C1C13] hover:bg-[#3B261A] text-[#DFC592] border border-[#8A6B37]/50 whitespace-nowrap"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              </div>

              {/* Primary Lock Fleet CTA */}
              <button
                type="button"
                data-testid="lock-fleet-btn"
                disabled={!validateCompleteFleet(draftShips)}
                onClick={handleLockFleet}
                className="w-full py-3.5 rounded font-display text-base font-bold tracking-wider uppercase cursor-pointer transition-colors bg-[#14532D] hover:bg-[#166534] text-[#FAF2E1] border-2 border-[#D4AF37]/80 disabled:opacity-35 disabled:cursor-not-allowed shadow-lg"
              >
                Lock Fleet &amp; Launch Battle
              </button>
            </div>
          </div>
        )}

        {/* CASE E: ACTIVE DUAL-GRID CLASSIC FOLDING BOARD GAME CASE */}
        {!isLobby && !isWaitingPeer && !isHandoffP2 && !isHandoffTurn && !isDeploying && (
          <div className="w-full grid grid-cols-1 lg:grid-cols-[1fr_14px_1fr] gap-4 lg:gap-2 items-start">
            {/* Left Board: Your Fleet */}
            <div className="space-y-2.5">
              <BattleshipGrid
                testId="player-ocean-grid"
                title={`${yourName}'s Fleet`}
                subtitle={`${yourRemainingShips} of 5 Afloat`}
                variant="ocean"
                ships={yourShips}
                shots={incomingShots}
                interactive={false}
                lastShotCoord={
                  activeLastShot && activeLastShot.target === viewerRole
                    ? {
                        row: activeLastShot.row,
                        col: activeLastShot.col,
                        id: activeLastShot.id,
                      }
                    : null
                }
                justSunkShip={justSunkOcean}
                shakeKey={oceanShake.key}
                shakeHeavy={oceanShake.heavy}
              />

              {/* Compact Own Fleet Ledger Strip */}
              <div
                className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 rounded text-xs"
                style={leatherPanelStyle}
              >
                {FLEET_SPECS.map((spec) => {
                  const ship = yourShips.find((s) => s.id === spec.id);
                  const sunk = ship ? isShipSunk(ship, incomingShots) : false;
                  return (
                    <span
                      key={spec.id}
                      className={
                        sunk
                          ? 'line-through text-rose-400/90 font-medium'
                          : 'text-[#F2E3C9] font-medium'
                      }
                    >
                      {spec.name.replace('Aircraft ', '')} ({spec.length})
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Antique Brass Case Spine Hinges Between the Two Wooden Boards (Desktop) */}
            <div
              aria-hidden="true"
              className="hidden lg:flex flex-col items-center justify-between self-stretch py-14"
            >
              <div className="w-2.5 h-16 rounded-sm bg-gradient-to-r from-[#7A5B26] via-[#E5C17B] to-[#6E4F1E] border border-[#3B2611] shadow-md" />
              <div className="w-1 flex-1 my-2 bg-[#140B07]/75 rounded-full" />
              <div className="w-2.5 h-16 rounded-sm bg-gradient-to-r from-[#7A5B26] via-[#E5C17B] to-[#6E4F1E] border border-[#3B2611] shadow-md" />
            </div>

            {/* Right Board: Enemy Target Chart */}
            <div className="space-y-2.5">
              <BattleshipGrid
                testId="enemy-radar-grid"
                title={`${opponentName}'s Waters`}
                subtitle={isYourTurn ? 'Aim Cannon & Fire' : 'Awaiting Enemy Cannon'}
                variant="radar"
                ships={enemyRevealedShips}
                shots={outgoingShots}
                interactive={isYourTurn && !isGameOver}
                onFireCell={handleFire}
                lastShotCoord={
                  activeLastShot && activeLastShot.shooter === viewerRole
                    ? {
                        row: activeLastShot.row,
                        col: activeLastShot.col,
                        id: activeLastShot.id,
                      }
                    : null
                }
                justSunkShip={justSunkRadar}
                shakeKey={radarShake.key}
                shakeHeavy={radarShake.heavy}
              />

              {/* Compact Enemy Confirmed Kills Ledger Strip */}
              <div
                className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 rounded text-xs"
                style={leatherPanelStyle}
              >
                {FLEET_SPECS.map((spec) => {
                  const sunk = enemyRevealedShips.some(
                    (s) => s.id === spec.id && isShipSunk(s, outgoingShots)
                  );
                  return (
                    <span
                      key={spec.id}
                      className={
                        sunk
                          ? 'line-through text-emerald-300 font-semibold'
                          : 'text-[#BFA988]'
                      }
                    >
                      {spec.name.replace('Aircraft ', '')} ({spec.length})
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM CAPTAIN'S LOG & SALVO STATS */}
      <div className="max-w-[1360px] w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
        <div
          data-testid="battleship-narration"
          className="flex items-center gap-3 rounded-md px-4 py-2 w-full sm:w-auto max-w-2xl"
          style={leatherPanelStyle}
        >
          <span className="font-mono-num text-[11px] font-bold text-[#E5C17B] uppercase whitespace-nowrap">
            Log
          </span>
          <span aria-hidden="true" className="text-[#8A6B37]">
            |
          </span>
          <span className="text-xs text-[#F5EFE6] truncate">{narrationText}</span>
        </div>

        <div
          className="flex items-center gap-4 rounded-md px-4 py-2 text-xs font-mono-num text-[#DFC592]"
          style={leatherPanelStyle}
        >
          <span>Cannons: {outgoingShots.length}</span>
          <span aria-hidden="true">·</span>
          <span>Hits: {hitsLanded}</span>
          <span aria-hidden="true">·</span>
          <span>Accuracy: {accuracyPct}%</span>
        </div>
      </div>

      {/* PAUSE MODAL */}
      {paused && !isGameOver && (
        <div
          role="dialog"
          aria-label="Battleship Paused"
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
                Captain&apos;s Quarters
              </h2>
            </div>

            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="rounded bg-[#140D09] border border-[#8A6B37]/45 p-3">
                <div className="text-[11px] text-[#CBB592]">Your Fleet</div>
                <div className="font-mono-num text-xl font-bold text-[#F5D38E]">
                  {yourRemainingShips}/5
                </div>
              </div>
              <div className="rounded bg-[#140D09] border border-[#8A6B37]/45 p-3">
                <div className="text-[11px] text-[#CBB592]">Enemy</div>
                <div className="font-mono-num text-xl font-bold text-[#F2E3C9]">
                  {enemyRemainingShips}/5
                </div>
              </div>
              <div className="rounded bg-[#140D09] border border-[#8A6B37]/45 p-3">
                <div className="text-[11px] text-[#CBB592]">Accuracy</div>
                <div className="font-mono-num text-xl font-bold text-emerald-300">
                  {accuracyPct}%
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => setPaused(false)}
                className="w-full py-3 rounded font-semibold text-sm cursor-pointer bg-[#14532D] hover:bg-[#166534] text-[#FAF2E1] border border-[#D4AF37]/60"
              >
                Resume Battle
              </button>
              {!isOnline && (
                <button
                  type="button"
                  onClick={handleRestartLocal}
                  className="w-full py-2.5 rounded font-semibold text-sm cursor-pointer bg-[#6B4220] hover:bg-[#7D4E26] text-[#FAF2E1] border border-[#C49E54]/50"
                >
                  Restart Battleship
                </button>
              )}
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

      {/* VICTORY / DEFEAT MODAL */}
      {isGameOver && (
        <div
          role="dialog"
          aria-label="Battleship Result"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
        >
          <div
            className="w-full max-w-lg rounded-lg p-7 text-center space-y-5"
            style={{
              ...leatherPanelStyle,
              border: '2px solid #D4AF37',
              boxShadow: '0 28px 80px rgba(0,0,0,0.9)',
            }}
          >
            {(() => {
              const winnerId = isOnline ? onlineView?.winner : localState.winner;
              const viewerWon = isOnline
                ? winnerId === onlineView?.yourRole
                : localState.mode === 'cpu'
                  ? winnerId === 'p1'
                  : true;
              const winnerName = isOnline
                ? winnerId === onlineView?.yourRole
                  ? yourName
                  : opponentName
                : winnerId
                  ? localState.players[winnerId].name
                  : yourName;

              const votedRematch =
                isOnline &&
                onlineView?.yourRole &&
                onlineView.rematchVotes.includes(onlineView.yourRole);

              return (
                <>
                  <div>
                    <div className="text-xs tracking-[0.25em] uppercase text-[#E5C17B] font-semibold">
                      {viewerWon ? 'Victory at Sea' : 'Fleet Lost at Sea'}
                    </div>
                    <h2 className="font-display text-3xl font-extrabold text-[#FAF2E1] mt-1">
                      {winnerName} Wins!
                    </h2>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded bg-[#140D09] border border-[#8A6B37]/45 p-3">
                      <div className="text-[11px] text-[#CBB592]">Cannons Fired</div>
                      <div className="font-mono-num text-xl font-bold text-[#F5D38E]">
                        {outgoingShots.length}
                      </div>
                    </div>
                    <div className="rounded bg-[#140D09] border border-[#8A6B37]/45 p-3">
                      <div className="text-[11px] text-[#CBB592]">Accuracy</div>
                      <div className="font-mono-num text-xl font-bold text-emerald-300">
                        {accuracyPct}%
                      </div>
                    </div>
                    <div className="rounded bg-[#140D09] border border-[#8A6B37]/45 p-3">
                      <div className="text-[11px] text-[#CBB592]">Ships Afloat</div>
                      <div className="font-mono-num text-xl font-bold text-[#F2E3C9]">
                        {yourRemainingShips}/5
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    {isOnline ? (
                      <button
                        type="button"
                        data-start="true"
                        disabled={Boolean(votedRematch)}
                        onClick={() => wsRef.current?.send(JSON.stringify({ type: 'rematch' }))}
                        className="flex-1 py-3 rounded font-semibold text-sm cursor-pointer bg-[#14532D] hover:bg-[#166534] text-[#FAF2E1] border border-[#D4AF37]/60 disabled:opacity-55"
                      >
                        {votedRematch ? 'Waiting for Friend Rematch...' : 'Vote Rematch'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        data-start="true"
                        onClick={handleRestartLocal}
                        className="flex-1 py-3 rounded font-semibold text-sm cursor-pointer bg-[#14532D] hover:bg-[#166534] text-[#FAF2E1] border border-[#D4AF37]/60"
                      >
                        Play Again
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={onReturnTitle}
                      className="flex-1 py-3 rounded font-semibold text-sm cursor-pointer bg-[#2B1C14] hover:bg-[#3A261B] text-[#F4E3C1] border border-[#8A6B37]/60"
                    >
                      Game Picker
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
