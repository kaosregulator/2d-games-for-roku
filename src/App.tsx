import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { BattleshipRulesConfig } from './battleship/types';
import { ActionCamViewport } from './components/ActionCamViewport';
import { BattleshipGame, type OnlineStartIntent } from './components/BattleshipGame';
import { FurbyExperience, type FurbyLaunchConfig } from './components/FurbyExperience';
import { GameHud } from './components/GameHud';
import {
  AuctionModal,
  BuyPropertyModal,
  CardRevealModal,
  DeedInspectorModal,
  PauseModal,
  PropertyManagerModal,
  TradeModal,
  VictoryModal,
} from './components/GameModals';
import { TitleScreen, type TabletopGameChoice } from './components/TitleScreen';
import {
  decideAiAuctionMove,
  decideAiBuyProperty,
  decideAiJailAction,
  evaluateAiTradeOffer,
  runAiPropertyManagement,
  runAiRaiseFundsForDebt,
} from './game/ai';
import {
  BOARD_ORIGIN_X,
  BOARD_ORIGIN_Y,
  BOARD_SPACES,
  boardToWorld,
  PLAYER_ACCENTS,
  SPACE_GEOMETRIES,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from './game/boardData';
import {
  buildHouse,
  buyCurrentProperty,
  createInitialGameState,
  declareBankruptcy,
  endTurn,
  executeTrade,
  getActivePlayer,
  mortgageProperty,
  passAuction,
  payJailFine,
  placeAuctionBid,
  resolveDrawnCard,
  rollDiceAndStartMove,
  sellHouse,
  settleDebt,
  startAuction,
  stepTokenOneSpace,
  unmortgageProperty,
  useJailFreeCard,
} from './game/engine';
import { soundEngine } from './game/sound';
import type {
  CameraFocus,
  CameraMode,
  GameState,
  PlayerSetupConfig,
  TradeOffer,
} from './game/types';

type AppShellState = 'title' | 'playing' | 'paused' | 'gameover';

const DEFAULT_PLAYER_CONFIGS: PlayerSetupConfig[] = [
  { id: 'p1', name: 'Player 1', token: 'tophat', isAI: false, accentColor: PLAYER_ACCENTS[0] },
  { id: 'p2', name: 'Victoria', token: 'car', isAI: true, accentColor: PLAYER_ACCENTS[1] },
  { id: 'p3', name: 'Arthur', token: 'dog', isAI: true, accentColor: PLAYER_ACCENTS[2] },
  { id: 'p4', name: 'Clara', token: 'battleship', isAI: true, accentColor: PLAYER_ACCENTS[3] },
];

const DEFAULT_BATTLESHIP_RULES: BattleshipRulesConfig = {
  mode: 'cpu',
  difficulty: 'commander',
  bonusShotOnHit: false,
  player1Name: 'Admiral 1',
  player2Name: 'Admiral 2',
};

const DEFAULT_FURBY_CONFIG: FurbyLaunchConfig = {
  coatId: 'crystal_pink',
  name: 'May-May',
};

function computeCameraFocusForSpace(spaceIndex: number, zoom: number, label: string): CameraFocus {
  const geom = SPACE_GEOMETRIES[spaceIndex];
  const world = boardToWorld(geom.centerX, geom.centerY);
  const clampedX = Math.max(BOARD_ORIGIN_X + 120, Math.min(BOARD_ORIGIN_X + 880, world.x));
  const clampedY = Math.max(BOARD_ORIGIN_Y + 120, Math.min(BOARD_ORIGIN_Y + 880, world.y));
  return {
    worldX: clampedX,
    worldY: clampedY,
    zoom,
    label,
  };
}

export default function App() {
  const urlParams = useMemo(() => {
    if (typeof window === 'undefined') {
      return { autostart: false, game: 'monopoly' as TabletopGameChoice, room: '' };
    }
    const sp = new URLSearchParams(window.location.search);
    const room = (sp.get('room') ?? '').toUpperCase().trim();
    const gameParam = sp.get('game');
    const game: TabletopGameChoice =
      gameParam === 'furby'
        ? 'furby'
        : gameParam === 'battleship' || room
          ? 'battleship'
          : 'monopoly';
    return {
      autostart: sp.get('autostart') === '1',
      game,
      room,
    };
  }, []);

  const [selectedGame, setSelectedGame] = useState<TabletopGameChoice>(urlParams.game);
  const [activeGame, setActiveGame] = useState<TabletopGameChoice>(urlParams.game);

  const [playerConfigs, setPlayerConfigs] = useState<PlayerSetupConfig[]>(DEFAULT_PLAYER_CONFIGS);
  const [shellState, setShellState] = useState<AppShellState>(
    urlParams.autostart ? 'playing' : 'title'
  );
  const [gameState, setGameState] = useState<GameState>(() =>
    createInitialGameState(DEFAULT_PLAYER_CONFIGS)
  );

  // Battleship launch config
  const [battleshipRules, setBattleshipRules] =
    useState<BattleshipRulesConfig>(DEFAULT_BATTLESHIP_RULES);
  const [battleshipOnlineIntent, setBattleshipOnlineIntent] =
    useState<OnlineStartIntent | null>(null);
  const [battleshipInstanceKey, setBattleshipInstanceKey] = useState(1);

  // Furby launch config
  const [furbyConfig, setFurbyConfig] = useState<FurbyLaunchConfig>(DEFAULT_FURBY_CONFIG);
  const [furbyInstanceKey, setFurbyInstanceKey] = useState(1);

  // Action Cam & visual beat state (Monopoly)
  const [cameraMode, setCameraMode] = useState<CameraMode>('action');
  const [cameraOverride, setCameraOverride] = useState<CameraFocus | null>(null);
  const [diceRolling, setDiceRolling] = useState(false);
  const [steppingPlayerId, setSteppingPlayerId] = useState<string | null>(null);
  const [stepPulseKey, setStepPulseKey] = useState(0);

  // UI Utility Modals (Monopoly)
  const [muted, setMuted] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [showPropertiesModal, setShowPropertiesModal] = useState(false);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [inspectedSpace, setInspectedSpace] = useState<number | null>(null);
  const [deckToast, setDeckToast] = useState<string | null>(null);

  const rollTimeoutRef = useRef<number | null>(null);

  const isPlayingBattleship = shellState !== 'title' && activeGame === 'battleship';
  const isPlayingFurby = shellState !== 'title' && activeGame === 'furby';
  const isPlayingMonopoly = shellState !== 'title' && activeGame === 'monopoly';

  // Sync document.body.dataset.state when on Title or Monopoly (Battleship & Furby manage their own playing/paused/gameover)
  useEffect(() => {
    if (!isPlayingBattleship && !isPlayingFurby) {
      document.body.dataset.state = shellState;
    }
  }, [shellState, isPlayingBattleship, isPlayingFurby]);

  // Transition into gameover shell state when a Monopoly winner is crowned
  useEffect(() => {
    if (isPlayingMonopoly && gameState.phase === 'game_over' && shellState === 'playing') {
      soundEngine.playVictoryFanfare();
      setShellState('gameover');
    }
  }, [isPlayingMonopoly, gameState.phase, shellState]);

  const activePlayer = getActivePlayer(gameState);

  const autoCameraFocus: CameraFocus = useMemo(() => {
    if (shellState === 'title') {
      return {
        worldX: WORLD_WIDTH / 2,
        worldY: WORLD_HEIGHT / 2,
        zoom: 1.0,
        label: 'Full Table',
      };
    }

    if (cameraOverride) return cameraOverride;

    if (gameState.phase === 'moving') {
      const space = BOARD_SPACES[activePlayer.position];
      return computeCameraFocusForSpace(
        activePlayer.position,
        1.98,
        `Tracking ${activePlayer.name} · ${space.shortName}`
      );
    }

    if (gameState.phase === 'card_reveal' && gameState.drawnCard) {
      const isChance = gameState.drawnCard.card.deck === 'chance';
      const deckPos = isChance ? boardToWorld(700, 700) : boardToWorld(300, 300);
      return {
        worldX: deckPos.x,
        worldY: deckPos.y,
        zoom: 1.72,
        label: isChance ? 'Chance Deck' : 'Community Chest',
      };
    }

    if (gameState.phase === 'awaiting_buy_decision' || gameState.phase === 'auction') {
      const idx = gameState.auction?.spaceIndex ?? activePlayer.position;
      return computeCameraFocusForSpace(idx, 2.08, `Inspecting ${BOARD_SPACES[idx].shortName}`);
    }

    if (gameState.phase === 'awaiting_roll') {
      return computeCameraFocusForSpace(
        activePlayer.position,
        1.52,
        `${activePlayer.name}'s Turn`
      );
    }

    return computeCameraFocusForSpace(
      activePlayer.position,
      1.78,
      `${activePlayer.name} · ${BOARD_SPACES[activePlayer.position].shortName}`
    );
  }, [
    shellState,
    cameraOverride,
    gameState.phase,
    gameState.drawnCard,
    gameState.auction,
    activePlayer.position,
    activePlayer.name,
  ]);

  const clearPendingTimers = useCallback(() => {
    if (rollTimeoutRef.current !== null) {
      window.clearTimeout(rollTimeoutRef.current);
      rollTimeoutRef.current = null;
    }
  }, []);

  const handleStartMonopoly = useCallback(() => {
    clearPendingTimers();
    (document.activeElement as HTMLElement | null)?.blur?.();
    const fresh = createInitialGameState(playerConfigs);
    setGameState(fresh);
    setActiveGame('monopoly');
    setSelectedGame('monopoly');
    setCameraMode('action');
    setCameraOverride(null);
    setShowPropertiesModal(false);
    setShowTradeModal(false);
    setInspectedSpace(null);
    setDiceRolling(false);
    setSteppingPlayerId(null);
    setShellState('playing');
    document.body.dataset.state = 'playing';
    soundEngine.playCashChime(true);
  }, [playerConfigs, clearPendingTimers]);

  const handleStartBattleship = useCallback(
    (rules: BattleshipRulesConfig, onlineIntent: OnlineStartIntent | null) => {
      clearPendingTimers();
      (document.activeElement as HTMLElement | null)?.blur?.();
      setBattleshipRules(rules);
      setBattleshipOnlineIntent(onlineIntent);
      setBattleshipInstanceKey((k) => k + 1);
      setActiveGame('battleship');
      setSelectedGame('battleship');
      setShellState('playing');
      document.body.dataset.state = 'playing';
    },
    [clearPendingTimers]
  );

  const handleStartFurby = useCallback(
    (config: FurbyLaunchConfig) => {
      clearPendingTimers();
      (document.activeElement as HTMLElement | null)?.blur?.();
      setFurbyConfig(config);
      setFurbyInstanceKey((k) => k + 1);
      setActiveGame('furby');
      setSelectedGame('furby');
      setShellState('playing');
      document.body.dataset.state = 'playing';
    },
    [clearPendingTimers]
  );

  const handleReturnTitle = useCallback(() => {
    clearPendingTimers();
    setShowPropertiesModal(false);
    setShowTradeModal(false);
    setInspectedSpace(null);
    setShellState('title');
    document.body.dataset.state = 'title';
  }, [clearPendingTimers]);

  // Roll Dice with brief tactile Dice-Cam focus before move-by-move token stepping
  const handleRollDice = useCallback(() => {
    if (!isPlayingMonopoly || shellState !== 'playing' || diceRolling) return;
    if (gameState.phase !== 'awaiting_roll') return;

    soundEngine.playDiceRoll();
    setDiceRolling(true);
    const diceWorld = boardToWorld(300, 740);
    setCameraOverride({
      worldX: diceWorld.x,
      worldY: diceWorld.y,
      zoom: 1.55,
      label: `${activePlayer.name} Rolling Dice`,
    });

    rollTimeoutRef.current = window.setTimeout(() => {
      setDiceRolling(false);
      setCameraOverride(null);
      setGameState((prev) => {
        const next = rollDiceAndStartMove(prev);
        if (
          next.players[next.currentPlayerIndex].inJail &&
          !prev.players[prev.currentPlayerIndex].inJail
        ) {
          soundEngine.playJailClang();
        }
        return next;
      });
    }, 460);
  }, [isPlayingMonopoly, shellState, diceRolling, gameState.phase, activePlayer.name]);

  // Step-by-step Token Movement Loop (Monopoly)
  useEffect(() => {
    if (!isPlayingMonopoly || shellState !== 'playing') return;
    if (gameState.phase !== 'moving' || gameState.pendingSteps.length === 0) {
      setSteppingPlayerId(null);
      return;
    }

    const timer = window.setTimeout(() => {
      const moverId = getActivePlayer(gameState).id;
      setSteppingPlayerId(moverId);
      setStepPulseKey((k) => k + 1);
      soundEngine.playTokenStep(gameState.pendingSteps.length);

      setGameState((prev) => {
        const beforeCash = getActivePlayer(prev).cash;
        const next = stepTokenOneSpace(prev);
        const afterPlayer = getActivePlayer(next);
        if (afterPlayer.cash > beforeCash) {
          soundEngine.playCashChime(true);
        } else if (afterPlayer.cash < beforeCash) {
          soundEngine.playCashChime(false);
        }
        if (next.phase === 'card_reveal') {
          soundEngine.playCardFlip();
        }
        if (afterPlayer.inJail && !getActivePlayer(prev).inJail) {
          soundEngine.playJailClang();
        }
        return next;
      });
    }, 200);

    return () => window.clearTimeout(timer);
  }, [isPlayingMonopoly, shellState, gameState]);

  // Automated Smart CPU Opponent Turn Driver (Monopoly)
  useEffect(() => {
    if (!isPlayingMonopoly || shellState !== 'playing' || diceRolling) return;
    if (gameState.phase === 'moving' || gameState.phase === 'game_over') return;

    if (gameState.phase === 'auction' && gameState.auction) {
      const bidderId =
        gameState.auction.activeBidderIds[gameState.auction.currentTurnBidderIndex];
      const bidder = gameState.players.find((p) => p.id === bidderId);
      if (bidder?.isAI) {
        const timer = window.setTimeout(() => {
          setGameState((prev) => {
            if (!prev.auction) return prev;
            const decision = decideAiAuctionMove(prev, bidderId);
            if (decision.action === 'bid') {
              soundEngine.playCashChime(true);
              return placeAuctionBid(prev, bidderId, decision.amount);
            }
            return passAuction(prev, bidderId);
          });
        }, 560);
        return () => window.clearTimeout(timer);
      }
      return;
    }

    const active = getActivePlayer(gameState);
    if (!active?.isAI || active.bankrupt) return;

    if (gameState.phase === 'awaiting_roll') {
      const timer = window.setTimeout(() => {
        if (active.inJail) {
          const jailMove = decideAiJailAction(gameState, active.id);
          if (jailMove === 'use_card') {
            soundEngine.playCardFlip();
            setGameState((prev) => useJailFreeCard(prev));
            return;
          }
          if (jailMove === 'pay_fine') {
            soundEngine.playCashChime(false);
            setGameState((prev) => payJailFine(prev));
            return;
          }
        }
        handleRollDice();
      }, 650);
      return () => window.clearTimeout(timer);
    }

    if (gameState.phase === 'awaiting_buy_decision') {
      const timer = window.setTimeout(() => {
        setGameState((prev) => {
          if (decideAiBuyProperty(prev, active.id)) {
            soundEngine.playCashChime(false);
            return buyCurrentProperty(prev);
          }
          return startAuction(prev);
        });
      }, 720);
      return () => window.clearTimeout(timer);
    }

    if (gameState.phase === 'card_reveal') {
      const timer = window.setTimeout(() => {
        soundEngine.playCardFlip();
        setGameState((prev) => resolveDrawnCard(prev));
      }, 1150);
      return () => window.clearTimeout(timer);
    }

    if (gameState.phase === 'debt_resolution' && gameState.debt?.debtorId === active.id) {
      const timer = window.setTimeout(() => {
        setGameState((prev) => {
          const raised = runAiRaiseFundsForDebt(prev, active.id);
          const updatedActive = raised.players.find((p) => p.id === active.id);
          if (raised.debt && updatedActive && updatedActive.cash >= raised.debt.amount) {
            soundEngine.playCashChime(false);
            return settleDebt(raised);
          }
          soundEngine.playJailClang();
          return declareBankruptcy(raised, active.id);
        });
      }, 850);
      return () => window.clearTimeout(timer);
    }

    if (gameState.phase === 'turn_end') {
      const timer = window.setTimeout(() => {
        setGameState((prev) => {
          const managed = runAiPropertyManagement(prev, active.id);
          if (managed.bankHouses !== prev.bankHouses || managed.bankHotels !== prev.bankHotels) {
            soundEngine.playBuildHouse();
          }
          return endTurn(managed);
        });
      }, 780);
      return () => window.clearTimeout(timer);
    }
  }, [isPlayingMonopoly, shellState, diceRolling, gameState, handleRollDice]);

  // Unified Keyboard Shortcuts (Title Start & Monopoly Controls)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;

      if (shellState === 'title') {
        if (e.code === 'Enter' || e.code === 'Space') {
          e.preventDefault();
          if (selectedGame === 'monopoly') {
            handleStartMonopoly();
          } else if (selectedGame === 'battleship') {
            handleStartBattleship(DEFAULT_BATTLESHIP_RULES, null);
          } else {
            handleStartFurby(DEFAULT_FURBY_CONFIG);
          }
        }
        return;
      }

      if (!isPlayingMonopoly) return;

      if (e.code === 'Escape' || e.key === 'p' || e.key === 'P') {
        if (inspectedSpace !== null) {
          setInspectedSpace(null);
          return;
        }
        if (showPropertiesModal) {
          setShowPropertiesModal(false);
          return;
        }
        if (showTradeModal) {
          setShowTradeModal(false);
          return;
        }
        if (shellState === 'playing') {
          e.preventDefault();
          setShellState('paused');
        } else if (shellState === 'paused') {
          e.preventDefault();
          setShellState('playing');
        }
        return;
      }

      if (shellState !== 'playing') return;

      if (e.key === 'c' || e.key === 'C') {
        setCameraMode('action');
      } else if (e.key === 'o' || e.key === 'O') {
        setCameraMode('overview');
      } else if (e.key === 'm' || e.key === 'M') {
        setMuted((m) => {
          soundEngine.setMuted(!m);
          return !m;
        });
      } else if (e.code === 'Space') {
        const active = getActivePlayer(gameState);
        if (!active.isAI && !showPropertiesModal && !showTradeModal && inspectedSpace === null) {
          if (gameState.phase === 'awaiting_roll') {
            e.preventDefault();
            handleRollDice();
          } else if (gameState.phase === 'turn_end') {
            e.preventDefault();
            setGameState((prev) => endTurn(prev));
          } else if (gameState.phase === 'card_reveal') {
            e.preventDefault();
            soundEngine.playCardFlip();
            setGameState((prev) => resolveDrawnCard(prev));
          }
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    shellState,
    selectedGame,
    isPlayingMonopoly,
    gameState,
    showPropertiesModal,
    showTradeModal,
    inspectedSpace,
    handleStartMonopoly,
    handleStartBattleship,
    handleStartFurby,
    handleRollDice,
  ]);

  const handleToggleMute = () => {
    setMuted((prev) => {
      soundEngine.setMuted(!prev);
      return !prev;
    });
  };

  const handleSubmitTrade = (offer: TradeOffer): { accepted: boolean; message: string } => {
    const partner = gameState.players.find((p) => p.id === offer.toPlayerId);
    if (partner?.isAI) {
      const ok = evaluateAiTradeOffer(gameState, offer);
      if (!ok) {
        return {
          accepted: false,
          message: `${partner.name} declined your offer — add more cash or value to sweeten the deal.`,
        };
      }
    }
    soundEngine.playCashChime(true);
    setGameState((prev) => executeTrade(prev, offer));
    return { accepted: true, message: 'Trade completed!' };
  };

  const handleClickDeck = (deck: 'chance' | 'communityChest') => {
    const remaining =
      deck === 'chance' ? gameState.chanceDeck.length : gameState.communityDeck.length;
    const label = deck === 'chance' ? 'Chance' : 'Community Chest';
    setDeckToast(
      `${label} Deck · ${remaining} cards remaining (reshuffles automatically when empty)`
    );
    window.setTimeout(() => setDeckToast(null), 2600);
  };

  const isHumanActive = !activePlayer.isAI && !activePlayer.bankrupt;

  return (
    <main className="relative w-full h-full overflow-hidden bg-[#140e0b]">
      {/* Active Battleship Command Table, Furby Tabletop, or Monopoly Action Cam */}
      {isPlayingBattleship ? (
        <BattleshipGame
          key={battleshipInstanceKey}
          rulesConfig={battleshipRules}
          onlineIntent={battleshipOnlineIntent}
          onReturnTitle={handleReturnTitle}
        />
      ) : isPlayingFurby ? (
        <FurbyExperience
          key={furbyInstanceKey}
          config={furbyConfig}
          onReturnTitle={handleReturnTitle}
        />
      ) : (
        /* Full-Viewport 60fps Action Cam Monopoly Tabletop (also serves as live backdrop for Title Screen) */
        <ActionCamViewport
          state={gameState}
          cameraMode={shellState === 'title' ? 'overview' : cameraMode}
          cameraFocus={autoCameraFocus}
          diceRolling={diceRolling}
          steppingPlayerId={steppingPlayerId}
          stepPulseKey={stepPulseKey}
          highlightSpaceIndex={shellState === 'playing' ? activePlayer.position : null}
          onUserDragFreeCamera={() => {
            if (shellState === 'playing') setCameraMode('free');
          }}
          onSelectSpace={(idx) => {
            if (shellState === 'playing') setInspectedSpace(idx);
          }}
          onClickDeck={handleClickDeck}
        />
      )}

      {/* Title Screen Overlay with Monopoly / Battleship / Furby Game Picker */}
      {shellState === 'title' && (
        <TitleScreen
          selectedGame={selectedGame}
          onSelectGame={setSelectedGame}
          configs={playerConfigs}
          onChangeConfigs={setPlayerConfigs}
          onStartMonopoly={handleStartMonopoly}
          initialRoomCode={urlParams.room}
          onStartBattleship={handleStartBattleship}
          onStartFurby={handleStartFurby}
        />
      )}

      {/* Monopoly Playing HUD Perimeter Dock */}
      {isPlayingMonopoly && shellState === 'playing' && (
        <GameHud
          state={gameState}
          cameraMode={cameraMode}
          cameraFocus={autoCameraFocus}
          muted={muted}
          showLog={showLog}
          onRollDice={handleRollDice}
          onEndTurn={() => setGameState((prev) => endTurn(prev))}
          onPayJailFine={() => {
            soundEngine.playCashChime(false);
            setGameState((prev) => payJailFine(prev));
          }}
          onUseJailCard={() => {
            soundEngine.playCardFlip();
            setGameState((prev) => useJailFreeCard(prev));
          }}
          onSettleDebt={() => {
            soundEngine.playCashChime(false);
            setGameState((prev) => settleDebt(prev));
          }}
          onDeclareBankruptcy={() => {
            soundEngine.playJailClang();
            setGameState((prev) => declareBankruptcy(prev, activePlayer.id));
          }}
          onOpenProperties={() => setShowPropertiesModal(true)}
          onOpenTrade={() => setShowTradeModal(true)}
          onSetCameraMode={(mode) => {
            setCameraOverride(null);
            setCameraMode(mode);
          }}
          onToggleMute={handleToggleMute}
          onToggleLog={() => setShowLog((v) => !v)}
          onPause={() => setShellState('paused')}
        />
      )}

      {/* Monopoly Deck Info Toast */}
      {isPlayingMonopoly && deckToast && shellState === 'playing' && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40 rounded px-4 py-2 text-xs font-semibold text-amber-100 bg-[#1B130F] border border-amber-500/60 shadow-xl pointer-events-none">
          {deckToast}
        </div>
      )}

      {/* Monopoly Gameplay Modals */}
      {isPlayingMonopoly &&
        shellState === 'playing' &&
        gameState.phase === 'awaiting_buy_decision' &&
        isHumanActive && (
          <BuyPropertyModal
            state={gameState}
            onBuy={() => {
              soundEngine.playCashChime(false);
              setGameState((prev) => buyCurrentProperty(prev));
            }}
            onAuction={() => setGameState((prev) => startAuction(prev))}
          />
        )}

      {isPlayingMonopoly &&
        shellState === 'playing' &&
        gameState.phase === 'auction' &&
        gameState.auction && (
          <AuctionModal
            state={gameState}
            onBid={(pid, amount) => {
              soundEngine.playCashChime(true);
              setGameState((prev) => placeAuctionBid(prev, pid, amount));
            }}
            onPass={(pid) => setGameState((prev) => passAuction(prev, pid))}
          />
        )}

      {isPlayingMonopoly &&
        shellState === 'playing' &&
        gameState.phase === 'card_reveal' &&
        gameState.drawnCard && (
          <CardRevealModal
            state={gameState}
            onContinue={() => {
              soundEngine.playCardFlip();
              setGameState((prev) => resolveDrawnCard(prev));
            }}
          />
        )}

      {isPlayingMonopoly && shellState === 'playing' && showPropertiesModal && (
        <PropertyManagerModal
          state={gameState}
          playerId={activePlayer.id}
          onBuild={(idx) => {
            soundEngine.playBuildHouse();
            setGameState((prev) => buildHouse(prev, activePlayer.id, idx));
          }}
          onSell={(idx) => {
            soundEngine.playCashChime(true);
            setGameState((prev) => sellHouse(prev, activePlayer.id, idx));
          }}
          onMortgage={(idx) => {
            soundEngine.playCashChime(true);
            setGameState((prev) => mortgageProperty(prev, activePlayer.id, idx));
          }}
          onUnmortgage={(idx) => {
            soundEngine.playCashChime(false);
            setGameState((prev) => unmortgageProperty(prev, activePlayer.id, idx));
          }}
          onClose={() => setShowPropertiesModal(false)}
        />
      )}

      {isPlayingMonopoly && shellState === 'playing' && showTradeModal && (
        <TradeModal
          state={gameState}
          fromPlayerId={activePlayer.id}
          onSubmitTrade={handleSubmitTrade}
          onClose={() => setShowTradeModal(false)}
        />
      )}

      {isPlayingMonopoly && shellState === 'playing' && inspectedSpace !== null && (
        <DeedInspectorModal
          state={gameState}
          spaceIndex={inspectedSpace}
          onClose={() => setInspectedSpace(null)}
        />
      )}

      {isPlayingMonopoly && shellState === 'paused' && (
        <PauseModal
          state={gameState}
          onResume={() => setShellState('playing')}
          onRestart={handleStartMonopoly}
          onReturnTitle={handleReturnTitle}
        />
      )}

      {isPlayingMonopoly && shellState === 'gameover' && (
        <VictoryModal
          state={gameState}
          onPlayAgain={handleStartMonopoly}
          onReturnTitle={handleReturnTitle}
        />
      )}
    </main>
  );
}
