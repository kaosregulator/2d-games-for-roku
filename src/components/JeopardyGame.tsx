import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  advanceAfterClueResult,
  attemptPlayerBuzz,
  createJeopardyGame,
  EARLY_BUZZ_LOCKOUT_MS,
  expireClueBuzzer,
  finishVideoIntro,
  getActiveBoardCategories,
  getDailyDoubleMaxWager,
  openBuzzer,
  pickCpuClueSelection,
  selectClue,
  startDoubleJeopardy,
  startFinalJeopardy,
  submitAnswer,
  submitDailyDoubleWager,
  submitFinalAnswer,
  submitFinalWager,
  triggerCpuBuzz,
} from '../jeopardy/engine';
import { jeopardySound } from '../jeopardy/sound';
import type {
  JeopardyContestant,
  JeopardyGameState,
  JeopardyLaunchConfig,
} from '../jeopardy/types';
import {
  JeopardyHostStage,
  NostalgiaMediaFrame,
  NostalgiaVideoMonitor,
} from './JeopardyHostStage';

interface JeopardyGameProps {
  config: JeopardyLaunchConfig;
  initialRound?: 'jeopardy' | 'double_jeopardy';
  onReturnTitle: () => void;
}

const CLUE_READ_MS = 1450;
const BUZZ_WINDOW_MS = 6500;
const ANSWER_WINDOW_MS = 12000;
const FINAL_SECONDS = 30;

function formatDollar(amount: number): string {
  if (amount < 0) {
    return `-$${Math.abs(amount).toLocaleString()}`;
  }
  return `$${amount.toLocaleString()}`;
}

export function JeopardyGame({
  config,
  initialRound = 'jeopardy',
  onReturnTitle,
}: JeopardyGameProps) {
  const [state, setState] = useState<JeopardyGameState>(() => {
    const initial = createJeopardyGame(config);
    return initialRound === 'double_jeopardy' ? startDoubleJeopardy(initial) : initial;
  });
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);

  // Interactive inputs
  const [ddWagerInput, setDdWagerInput] = useState<number>(400);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [finalWagerInput, setFinalWagerInput] = useState<number>(0);
  const [finalTypedAnswer, setFinalTypedAnswer] = useState('');
  const [finalSecondsLeft, setFinalSecondsLeft] = useState(FINAL_SECONDS);
  const [cpuHighlightKey, setCpuHighlightKey] = useState<string | null>(null);
  const [lockoutFlash, setLockoutFlash] = useState(false);
  const [buzzerTimePct, setBuzzerTimePct] = useState(100);
  const [videoIntroSecondsLeft, setVideoIntroSecondsLeft] = useState<number>(9);
  const [holdVideoIntro, setHoldVideoIntro] = useState(false);
  const [videoIntroPlaying, setVideoIntroPlaying] = useState(false);
  const [replayBeforeVideo, setReplayBeforeVideo] = useState(false);

  const typedInputRef = useRef<HTMLInputElement | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Sync body state attribute for accessibility & testability
  useEffect(() => {
    if (state.phase === 'game_over') {
      document.body.dataset.state = 'gameover';
    } else if (paused) {
      document.body.dataset.state = 'paused';
    } else {
      document.body.dataset.state = 'playing';
    }
  }, [state.phase, paused]);

  // Initial board-fill chime & cleanup think music on unmount
  useEffect(() => {
    jeopardySound.playBoardFill();
    return () => {
      jeopardySound.stopFinalThinkMusic();
    };
  }, []);

  // Sync mute state with sound engine
  useEffect(() => {
    jeopardySound.setMuted(muted);
  }, [muted]);

  // Stop Final Think music whenever paused or leaving final_clue
  useEffect(() => {
    if (!paused && state.phase === 'final_clue') {
      jeopardySound.startFinalThinkMusic();
    } else {
      jeopardySound.stopFinalThinkMusic();
    }
  }, [paused, state.phase]);

  // Reset wager defaults when entering Daily Double or Final Jeopardy
  useEffect(() => {
    if (state.phase === 'daily_double_wager' && state.activeClue) {
      const controllerId = state.activeClue.activeContestantId ?? state.boardControllerId;
      const maxW = getDailyDoubleMaxWager(state, controllerId);
      setDdWagerInput(Math.min(Math.max(200, state.activeClue.clue.value), maxW));
      jeopardySound.playDailyDouble();
    }
  }, [state.phase, state.activeClue?.clue.id]);

  useEffect(() => {
    if (state.phase === 'final_wager') {
      const playerMax = Math.max(0, state.contestants[0].score);
      setFinalWagerInput(Math.min(playerMax, Math.round(playerMax * 0.5 / 100) * 100));
      setFinalTypedAnswer('');
    }
    if (state.phase === 'final_clue') {
      setFinalSecondsLeft(FINAL_SECONDS);
    }
  }, [state.phase]);

  // Focus text input automatically in Classic Type-In mode
  useEffect(() => {
    if (
      !paused &&
      state.phase === 'contestant_answering' &&
      state.activeClue?.activeContestantId === 'player' &&
      state.config.answerMode === 'typed'
    ) {
      setTypedAnswer('');
      window.setTimeout(() => typedInputRef.current?.focus(), 30);
    }
  }, [paused, state.phase, state.activeClue?.activeContestantId, state.config.answerMode]);

  // Reset video intro timer & replay toggle whenever a new clue is opened
  useEffect(() => {
    setReplayBeforeVideo(false);
    setHoldVideoIntro(false);
    setVideoIntroPlaying(false);
    if (state.activeClue?.clue.video) {
      setVideoIntroSecondsLeft(state.activeClue.clue.video.previewSec ?? 9);
    }
  }, [state.activeClue?.clue.id]);

  // Countdown for "before_clue" Video Intro phase (ticks down once playing so user sees real video before question follows)
  useEffect(() => {
    if (paused || state.phase !== 'video_intro' || holdVideoIntro) return;
    if (videoIntroSecondsLeft <= 0) {
      setState((prev) => finishVideoIntro(prev));
      return;
    }
    const tickDelay = videoIntroPlaying ? 1000 : 1800;
    const timer = window.setTimeout(() => {
      setVideoIntroSecondsLeft((s) => Math.max(0, s - 1));
    }, tickDelay);
    return () => window.clearTimeout(timer);
  }, [paused, state.phase, holdVideoIntro, videoIntroPlaying, videoIntroSecondsLeft]);

  // Clue Reading -> Open Buzzer Lights transition
  useEffect(() => {
    if (paused || state.phase !== 'clue_reading') return;
    const timer = window.setTimeout(() => {
      setState((prev) => openBuzzer(prev));
    }, CLUE_READ_MS);
    return () => window.clearTimeout(timer);
  }, [paused, state.phase, state.activeClue?.clue.id]);

  // Buzzer Open Countdown + CPU Buzz-In Race
  useEffect(() => {
    if (paused || state.phase !== 'buzzer_open' || !state.activeClue) {
      setBuzzerTimePct(100);
      return;
    }

    const startedAt = Date.now();
    const tick = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      setBuzzerTimePct(Math.max(0, 100 - (elapsed / BUZZ_WINDOW_MS) * 100));
    }, 80);

    const expireTimer = window.setTimeout(() => {
      jeopardySound.playTimeUp();
      setState((prev) => expireClueBuzzer(prev));
    }, BUZZ_WINDOW_MS);

    // Eligible CPU contestants attempt to ring in with realistic human-beatable reaction times (1.15s - 3.6s)
    const attempted = new Set(state.activeClue.attemptedIds);
    const eligibleCpus = state.contestants.filter(
      (c): c is JeopardyContestant & { id: 'cpu_1' | 'cpu_2' } =>
        !c.isHuman && !attempted.has(c.id)
    );

    const cpuTimers: number[] = [];
    if (eligibleCpus.length > 0) {
      // Pick fastest eligible CPU to attempt buzzing if they know/want the clue
      const ordered = [...eligibleCpus].sort((a, b) => b.buzzSkill - a.buzzSkill);
      ordered.forEach((cpu, idx) => {
        const willTry = Math.random() < 0.78;
        if (!willTry) return;
        const delayMs = 1250 + idx * 550 + Math.round(Math.random() * 1700);
        const t = window.setTimeout(() => {
          setState((prev) => {
            if (prev.phase !== 'buzzer_open') return prev;
            const next = triggerCpuBuzz(prev, cpu.id);
            if (next !== prev) {
              jeopardySound.playBuzzIn(false);
            }
            return next;
          });
        }, delayMs);
        cpuTimers.push(t);
      });
    }

    return () => {
      window.clearInterval(tick);
      window.clearTimeout(expireTimer);
      cpuTimers.forEach((t) => window.clearTimeout(t));
    };
  }, [paused, state.phase, state.activeClue?.clue.id, state.activeClue?.attemptedIds.length]);

  // CPU Auto-Selection on Board when CPU holds Board Control
  useEffect(() => {
    if (paused || state.phase !== 'board') {
      setCpuHighlightKey(null);
      return;
    }
    if (state.boardControllerId === 'player') {
      setCpuHighlightKey(null);
      return;
    }
    const pick = pickCpuClueSelection(state);
    if (!pick) return;

    const highlightTimer = window.setTimeout(() => {
      setCpuHighlightKey(`${pick.categoryIndex}:${pick.rowIndex}`);
    }, 520);

    const selectTimer = window.setTimeout(() => {
      setCpuHighlightKey(null);
      setState((prev) => selectClue(prev, pick.categoryIndex, pick.rowIndex));
    }, 1150);

    return () => {
      window.clearTimeout(highlightTimer);
      window.clearTimeout(selectTimer);
    };
  }, [paused, state.phase, state.boardControllerId, state.cluesAnsweredInRound]);

  // CPU Daily Double Auto-Wager
  useEffect(() => {
    if (paused || state.phase !== 'daily_double_wager' || !state.activeClue) return;
    const holderId = state.activeClue.activeContestantId ?? state.boardControllerId;
    if (holderId === 'player') return;

    const timer = window.setTimeout(() => {
      setState((prev) => {
        if (prev.phase !== 'daily_double_wager' || !prev.activeClue) return prev;
        const maxW = getDailyDoubleMaxWager(prev, holderId);
        const wager = Math.min(maxW, Math.max(400, Math.round((maxW * 0.45) / 100) * 100));
        return submitDailyDoubleWager(prev, wager);
      });
    }, 1250);
    return () => window.clearTimeout(timer);
  }, [paused, state.phase, state.activeClue?.clue.id]);

  // CPU Answering + Human Answer Countdown when Contestant holds the Buzzer
  useEffect(() => {
    if (paused || state.phase !== 'contestant_answering' || !state.activeClue) return;
    const responderId = state.activeClue.activeContestantId;
    if (!responderId) return;

    if (responderId === 'player') {
      const startedAt = Date.now();
      const tick = window.setInterval(() => {
        const elapsed = Date.now() - startedAt;
        setBuzzerTimePct(Math.max(0, 100 - (elapsed / ANSWER_WINDOW_MS) * 100));
      }, 90);
      const timeout = window.setTimeout(() => {
        jeopardySound.playWrong();
        setState((prev) => submitAnswer(prev, ''));
      }, ANSWER_WINDOW_MS);
      return () => {
        window.clearInterval(tick);
        window.clearTimeout(timeout);
      };
    }

    // CPU submits answer after realistic beat
    const cpu = state.contestants.find((c) => c.id === responderId);
    const timer = window.setTimeout(() => {
      setState((prev) => {
        if (prev.phase !== 'contestant_answering' || !prev.activeClue) return prev;
        const clue = prev.activeClue.clue;
        const difficultyPenalty = (clue.tier - 1) * 0.06;
        const hitChance = Math.max(0.32, (cpu?.accuracy ?? 0.68) - difficultyPenalty);
        const right = Math.random() < hitChance;
        const wrongChoices = clue.choices.filter((ch) => ch !== clue.correctResponse);
        const response = right
          ? clue.correctResponse
          : wrongChoices[Math.floor(Math.random() * wrongChoices.length)] ?? 'What is... pass?';
        if (right) {
          jeopardySound.playCorrect();
        } else {
          jeopardySound.playWrong();
        }
        return submitAnswer(prev, response);
      });
    }, 1050);

    return () => window.clearTimeout(timer);
  }, [paused, state.phase, state.activeClue?.activeContestantId, state.activeClue?.clue.id]);

  // Final Jeopardy 30-second countdown
  useEffect(() => {
    if (paused || state.phase !== 'final_clue') return;
    if (finalSecondsLeft <= 0) {
      jeopardySound.playTimeUp();
      setState((prev) => submitFinalAnswer(prev, finalTypedAnswer));
      return;
    }
    const timer = window.setTimeout(() => {
      setFinalSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [paused, state.phase, finalSecondsLeft, finalTypedAnswer]);

  // Actions
  const handleSelectTile = useCallback((catIdx: number, rowIdx: number) => {
    setState((prev) => {
      if (prev.phase !== 'board' || prev.boardControllerId !== 'player') return prev;
      return selectClue(prev, catIdx, rowIdx);
    });
  }, []);

  const handlePlayerBuzz = useCallback(() => {
    const res = attemptPlayerBuzz(stateRef.current, Date.now());
    if (res.outcome === 'buzzed') {
      jeopardySound.playBuzzIn(true);
      setState(res.state);
    } else if (res.outcome === 'locked_out') {
      jeopardySound.playLockout();
      setLockoutFlash(true);
      setState(res.state);
      window.setTimeout(() => setLockoutFlash(false), EARLY_BUZZ_LOCKOUT_MS + 120);
    }
  }, []);

  const handlePlayerSubmitAnswer = useCallback((response: string) => {
    setState((prev) => {
      if (prev.phase !== 'contestant_answering' || prev.activeClue?.activeContestantId !== 'player') {
        return prev;
      }
      const next = submitAnswer(prev, response);
      if (next.activeClue?.lastResponseCorrect) {
        jeopardySound.playCorrect();
      } else {
        jeopardySound.playWrong();
      }
      return next;
    });
    setTypedAnswer('');
  }, []);

  const handleFinishVideoIntro = useCallback(() => {
    setState((prev) => finishVideoIntro(prev));
  }, []);

  const handleContinueAfterResult = useCallback(() => {
    setState((prev) => advanceAfterClueResult(prev));
  }, []);

  const handleStartDouble = useCallback(() => {
    jeopardySound.playBoardFill();
    setState((prev) => startDoubleJeopardy(prev));
  }, []);

  const handleJumpToDouble = useCallback(() => {
    setPaused(false);
    jeopardySound.playBoardFill();
    setState((prev) => startDoubleJeopardy(prev));
  }, []);

  const handleJumpToFinal = useCallback(() => {
    setPaused(false);
    setState((prev) => startFinalJeopardy(prev));
  }, []);

  const handleRestartShow = useCallback(() => {
    setPaused(false);
    jeopardySound.stopFinalThinkMusic();
    jeopardySound.playBoardFill();
    setState(createJeopardyGame(config));
  }, [config]);

  // Keyboard shortcuts (Space buzz/continue, 1-4 choices, M mute, P/Esc pause)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      const inInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

      if (e.code === 'Escape' || (!inInput && (e.key === 'p' || e.key === 'P'))) {
        if (stateRef.current.phase !== 'game_over') {
          e.preventDefault();
          setPaused((p) => !p);
        }
        return;
      }

      if (paused || inInput) return;

      if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        setMuted((m) => !m);
        return;
      }

      const cur = stateRef.current;
      if (e.code === 'Space') {
        if (cur.phase === 'video_intro') {
          e.preventDefault();
          handleFinishVideoIntro();
        } else if (cur.phase === 'clue_reading' || cur.phase === 'buzzer_open') {
          e.preventDefault();
          handlePlayerBuzz();
        } else if (cur.phase === 'clue_result') {
          e.preventDefault();
          handleContinueAfterResult();
        } else if (cur.phase === 'round_transition') {
          e.preventDefault();
          handleStartDouble();
        }
        return;
      }

      if (
        cur.phase === 'contestant_answering' &&
        cur.activeClue?.activeContestantId === 'player' &&
        cur.config.answerMode === 'choices'
      ) {
        const idx = ['1', '2', '3', '4'].indexOf(e.key);
        if (idx >= 0 && cur.activeClue.clue.choices[idx]) {
          e.preventDefault();
          handlePlayerSubmitAnswer(cur.activeClue.clue.choices[idx]);
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    paused,
    handleFinishVideoIntro,
    handlePlayerBuzz,
    handleContinueAfterResult,
    handleStartDouble,
    handlePlayerSubmitAnswer,
  ]);

  const activeCategories = useMemo(() => getActiveBoardCategories(state), [state]);
  const cluesLeft = Math.max(0, state.totalCluesInRound - state.cluesAnsweredInRound);
  const buzzerLightsOn = state.phase === 'buzzer_open';

  const roundHeading =
    state.round === 'jeopardy'
      ? 'JEOPARDY! · ROUND 1'
      : state.round === 'double_jeopardy'
        ? 'DOUBLE JEOPARDY! · UP TO $2,000'
        : 'FINAL JEOPARDY!';

  const episodeLabel =
    state.config.episode === 'episode_1'
      ? 'Episode 1'
      : state.config.episode === 'episode_2'
        ? 'Episode 2'
        : 'All-28 Shuffle';

  const sortedStandings = useMemo(
    () => [...state.contestants].sort((a, b) => b.score - a.score),
    [state.contestants]
  );

  const player = state.contestants[0];
  const playerAccuracyPct =
    state.playerAttemptCount > 0
      ? Math.round((state.playerCorrectCount / state.playerAttemptCount) * 100)
      : 0;

  return (
    <div
      data-testid="jeopardy-stage"
      data-round={state.round}
      data-phase={state.phase}
      className="fixed inset-0 z-20 flex flex-col bg-[#050A22] text-slate-100 select-none overflow-hidden"
      style={{
        backgroundImage:
          'radial-gradient(ellipse at 50% 0%, rgba(28, 59, 173, 0.42) 0%, rgba(5, 10, 34, 0.96) 68%)',
      }}
    >
      {/* Top Broadcast Studio Strip */}
      <header className="shrink-0 h-12 px-4 flex items-center justify-between gap-4 border-b border-[#C49E54]/45 bg-[#060D2D]/95">
        <div className="flex items-center gap-3 min-w-0">
          <div className="px-2.5 py-1 rounded bg-[#060CE9] border border-[#F5C242]/80 font-display text-xs sm:text-sm font-bold tracking-[0.14em] text-[#F5C242] uppercase whitespace-nowrap">
            {roundHeading}
          </div>
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-300/85 truncate">
            <span>90s Nostalgia Vault (28 Categories)</span>
            <span className="text-[#C49E54]">·</span>
            <span>{episodeLabel}</span>
            {state.round !== 'final_jeopardy' && (
              <>
                <span className="text-[#C49E54]">·</span>
                <span className="font-mono-num text-amber-200">{cluesLeft} clues left</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setMuted((m) => !m)}
            aria-label={muted ? 'Unmute audio' : 'Mute audio'}
            className="px-2.5 py-1.5 rounded text-xs font-semibold cursor-pointer bg-[#0B174A] hover:bg-[#132570] border border-[#3B59B8] text-slate-100 transition-colors"
          >
            {muted ? 'Unmute [M]' : 'Mute [M]'}
          </button>
          <button
            type="button"
            data-testid="jeopardy-pause-btn"
            onClick={() => setPaused((p) => !p)}
            aria-label="Pause show"
            className="px-2.5 py-1.5 rounded text-xs font-semibold cursor-pointer bg-[#0B174A] hover:bg-[#132570] border border-[#C49E54]/65 text-[#F5C242] transition-colors"
          >
            Pause [P]
          </button>
        </div>
      </header>

      {/* Main Broadcast Stage: Host Desk (Left) + 7-Column Monitor Wall / Clue Stage (Right) */}
      <div className="flex-1 min-h-0 flex gap-3.5 px-4 py-3 overflow-hidden">
        {/* Left Host Desk & Buzzer Telemetry */}
        <aside className="hidden lg:flex w-[226px] shrink-0 flex-col gap-2.5">
          <JeopardyHostStage
            mood={state.hostMood}
            hostLine={state.hostLine}
            roundLabel={
              state.round === 'jeopardy'
                ? 'Round 1'
                : state.round === 'double_jeopardy'
                  ? 'Double'
                  : 'Final'
            }
            buzzerLightsOn={buzzerLightsOn}
          />

          {/* Compact Studio Signaling Status */}
          <div className="rounded-lg border border-[#2C469C] bg-[#070F33] px-3 py-2.5 flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-display uppercase tracking-[0.14em] text-slate-400 whitespace-nowrap">
                Buzzer
              </span>
              <span
                className={`text-[10px] font-display font-bold uppercase tracking-wider whitespace-nowrap ${
                  lockoutFlash
                    ? 'text-rose-400'
                    : buzzerLightsOn
                      ? 'text-cyan-300'
                      : state.phase === 'clue_reading'
                        ? 'text-amber-300'
                        : 'text-slate-400'
                }`}
              >
                {lockoutFlash
                  ? 'LOCKED OUT'
                  : buzzerLightsOn
                    ? 'LIGHTS ON!'
                    : state.phase === 'video_intro'
                      ? 'VIDEO ROLLING'
                      : state.phase === 'clue_reading'
                        ? 'WAIT FOR LIGHTS'
                        : state.phase === 'contestant_answering'
                          ? 'BUZZED IN'
                          : 'READY'}
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-[#0D1A52] overflow-hidden">
              <div
                className={`h-full transition-all duration-100 ${
                  lockoutFlash
                    ? 'bg-rose-500'
                    : buzzerLightsOn
                      ? 'bg-cyan-300'
                      : state.phase === 'contestant_answering'
                        ? 'bg-[#F5C242]'
                        : 'bg-[#1D4ED8]'
                }`}
                style={{
                  width:
                    buzzerLightsOn || state.phase === 'contestant_answering'
                      ? `${buzzerTimePct}%`
                      : state.phase === 'clue_reading'
                        ? '100%'
                        : '0%',
                }}
              />
            </div>
            <div className="text-[11px] text-slate-300/80">
              Mode:{' '}
              <span className="text-amber-200 font-medium">
                {state.config.answerMode === 'choices' ? 'Multiple Choice (1–4)' : 'Classic Type-In'}
              </span>
            </div>
          </div>
        </aside>

        {/* Center/Right Main Broadcast Wall */}
        <section className="flex-1 min-w-0 min-h-0 flex flex-col">
          {/* PHASE 1: 7-COLUMN × 5-ROW GLOWING JEOPARDY MONITOR WALL */}
          {state.phase === 'board' && (
            <div
              data-testid="jeopardy-board"
              className="flex-1 min-h-0 rounded-lg p-2 bg-[#020512] border-2 border-[#C49E54]/70 shadow-[0_20px_50px_rgba(0,0,0,0.85)] grid grid-cols-7 grid-rows-[1.12fr_repeat(5,1fr)] gap-1.5"
            >
              {/* 7 Category Header Monitors */}
              {activeCategories.map((cat) => (
                <div
                  key={cat.id}
                  data-testid="jeopardy-category-header"
                  className="rounded-sm bg-[#060CE9] border border-[#2C47C8] px-1.5 py-1 flex flex-col items-center justify-center text-center shadow-[inset_0_0_18px_rgba(0,0,0,0.45)]"
                >
                  <div className="font-display text-[11px] sm:text-xs xl:text-[13px] font-bold uppercase tracking-wide text-white leading-tight drop-shadow-[0_2px_2px_rgba(0,0,0,0.9)]">
                    {cat.title}
                  </div>
                </div>
              ))}

              {/* 5 Rows × 7 Columns = 35 Dollar Monitor Tiles */}
              {[0, 1, 2, 3, 4].map((rowIdx) =>
                activeCategories.map((cat, catIdx) => {
                  const clue = cat.clues[rowIdx];
                  const tileKey = `${catIdx}:${rowIdx}`;
                  const isCpuPicking = cpuHighlightKey === tileKey;
                  const canHumanClick = !clue.answered && state.boardControllerId === 'player';

                  return (
                    <button
                      key={clue.id}
                      type="button"
                      data-testid={`clue-${catIdx}-${rowIdx}`}
                      data-has-video={clue.video ? clue.video.timing : 'none'}
                      disabled={!canHumanClick}
                      aria-label={
                        clue.answered
                          ? `${cat.title} $${clue.value} already answered`
                          : clue.video
                            ? `${cat.title} for $${clue.value} (Video Clue)`
                            : `${cat.title} for $${clue.value}`
                      }
                      onClick={() => handleSelectTile(catIdx, rowIdx)}
                      className={`relative rounded-sm flex items-center justify-center font-display font-bold tabular-nums transition-all duration-150 ${
                        clue.answered
                          ? 'bg-[#040924] border border-[#121D54] text-transparent cursor-default shadow-inner'
                          : isCpuPicking
                            ? 'bg-[#1D4ED8] border-2 border-[#FDE047] text-[#FDE047] scale-[1.03] shadow-[0_0_24px_rgba(253,224,71,0.5)]'
                            : canHumanClick
                              ? 'bg-[#060CE9] hover:bg-[#1122FF] border border-[#2B48D6] hover:border-[#F5C242] text-[#F5C242] cursor-pointer shadow-[inset_0_0_18px_rgba(0,0,0,0.45)]'
                              : 'bg-[#060CE9]/90 border border-[#253EB5] text-[#F5C242]/80 cursor-default'
                      }`}
                    >
                      {!clue.answered && clue.video && (
                        <span
                          aria-hidden="true"
                          className="absolute top-1 right-1 px-1.5 py-[1px] rounded-[2px] bg-[#040942]/90 border border-[#F5C242]/65 text-[8px] font-display font-bold uppercase tracking-wider text-sky-200 leading-tight"
                        >
                          {clue.video.timing === 'on_reveal' ? '▶ CLIP' : '▶ VIDEO'}
                        </span>
                      )}
                      {!clue.answered && (
                        <span
                          className="text-xl sm:text-2xl xl:text-[30px] tracking-tight"
                          style={{ textShadow: '0 3px 0 rgba(0, 0, 0, 0.85)' }}
                        >
                          ${clue.value.toLocaleString()}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          )}

          {/* PHASE 1B: VIDEO INTRO ("WATCH CLIP FIRST — QUESTION FOLLOWS") */}
          {state.phase === 'video_intro' && state.activeClue?.clue.video && (
            <div
              data-testid="jeopardy-video-intro"
              className="flex-1 min-h-0 rounded-lg border-2 border-[#F5C242] bg-[#060CE9] shadow-[0_24px_60px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden"
            >
              {/* Video Clue Broadcast Banner */}
              <div className="shrink-0 px-5 py-2.5 bg-[#040978] border-b border-[#3454D1] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="px-2 py-0.5 rounded bg-[#F5C242] text-[#050A22] font-display text-[11px] font-bold uppercase tracking-widest shrink-0">
                    VIDEO CLUE
                  </span>
                  <span className="font-display text-sm sm:text-base font-bold uppercase tracking-wider text-white truncate">
                    {activeCategories[state.activeClue.categoryIndex]?.title}
                  </span>
                  <span className="text-[#F5C242]">·</span>
                  <span className="font-display text-sm sm:text-base font-bold tabular-nums text-[#F5C242] whitespace-nowrap">
                    ${state.activeClue.clue.value.toLocaleString()}
                  </span>
                </div>

                <div className="text-xs font-display font-semibold uppercase tracking-widest text-amber-200 whitespace-nowrap">
                  Watch Clip — Question Follows
                </div>
              </div>

              {/* Center Large Internet Archive CRT Video Player */}
              <div className="flex-1 min-h-0 px-5 py-3 flex flex-col items-center justify-center gap-3 overflow-y-auto">
                <NostalgiaVideoMonitor
                  large
                  video={state.activeClue.clue.video}
                  studioMuted={muted}
                  paused={paused}
                  badgeLabel="90s ARCHIVE TAPE · WATCH FIRST"
                  fallbackMedia={state.activeClue.clue.media}
                  onPlaying={() => setVideoIntroPlaying(true)}
                  onEnded={handleFinishVideoIntro}
                />
              </div>

              {/* Video Intro Action Bar */}
              <div className="shrink-0 px-5 py-3 bg-[#040958]/95 border-t border-[#2E4BC8] flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-sky-100/90 flex items-center gap-2">
                  {holdVideoIntro ? (
                    <span className="text-amber-200 font-semibold">
                      Watching full clip — click Show Clue whenever you&apos;re ready!
                    </span>
                  ) : (
                    <span>
                      Clue follows automatically in{' '}
                      <span className="font-mono-num font-bold text-[#F5C242]">
                        {videoIntroSecondsLeft}s
                      </span>{' '}
                      (or press Space now)
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    data-testid="video-hold-btn"
                    onClick={() => setHoldVideoIntro((h) => !h)}
                    className={`px-3.5 py-2 rounded text-xs font-semibold cursor-pointer border transition-colors ${
                      holdVideoIntro
                        ? 'bg-[#1D3598] border-[#F5C242] text-[#FDE047]'
                        : 'bg-[#0B175A] hover:bg-[#142685] border-[#3C5BC9] text-slate-100'
                    }`}
                  >
                    {holdVideoIntro ? 'Resume Auto-Clue' : 'Keep Watching'}
                  </button>
                  <button
                    type="button"
                    data-testid="video-continue-to-clue-btn"
                    onClick={handleFinishVideoIntro}
                    className="px-6 py-2 rounded font-display text-sm font-bold uppercase tracking-wider cursor-pointer bg-[#F5C242] hover:bg-[#FBD160] text-[#050A22] shadow-lg whitespace-nowrap"
                  >
                    Show Clue &amp; Arm Buzzer [Space]
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* PHASE 2: DAILY DOUBLE WAGER MONITOR */}
          {state.phase === 'daily_double_wager' && state.activeClue && (
            <div
              data-testid="daily-double-screen"
              className="flex-1 min-h-0 rounded-lg border-2 border-[#F5C242] bg-[#060CE9] p-6 flex flex-col items-center justify-center text-center shadow-[0_24px_60px_rgba(0,0,0,0.85)] relative overflow-hidden"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 50% 35%, rgba(245, 194, 66, 0.24) 0%, rgba(6, 12, 233, 0.96) 58%, rgba(4, 9, 78, 1) 100%)',
              }}
            >
              <div className="px-4 py-1 rounded bg-[#050A22]/85 border border-[#F5C242]/80 text-xs font-display font-bold uppercase tracking-[0.26em] text-[#F5C242]">
                {activeCategories[state.activeClue.categoryIndex]?.title}
              </div>

              <h2
                className="mt-3 font-display text-5xl sm:text-6xl font-bold uppercase tracking-[0.08em] text-[#F5C242]"
                style={{ textShadow: '0 5px 0 #050A22, 0 0 28px rgba(245,194,66,0.45)' }}
              >
                DAILY DOUBLE!
              </h2>

              {state.activeClue.activeContestantId === 'player' ? (
                (() => {
                  const maxWager = getDailyDoubleMaxWager(state, 'player');
                  const clamped = Math.max(5, Math.min(maxWager, ddWagerInput));
                  return (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        setState((prev) => submitDailyDoubleWager(prev, clamped));
                      }}
                      className="mt-6 w-full max-w-md rounded-lg bg-[#050A26]/90 border border-[#C49E54]/70 p-5 space-y-4"
                    >
                      <div className="flex items-center justify-between text-xs text-slate-200">
                        <span>Wager Amount ($5 – ${maxWager.toLocaleString()})</span>
                        <span className="font-mono-num text-base font-bold text-[#F5C242]">
                          ${clamped.toLocaleString()}
                        </span>
                      </div>

                      <input
                        type="range"
                        min={5}
                        max={maxWager}
                        step={5}
                        aria-label="Daily Double wager slider"
                        value={clamped}
                        onChange={(e) => setDdWagerInput(Number(e.target.value))}
                        className="w-full accent-[#F5C242]"
                      />

                      <div className="flex items-center gap-2">
                        <label htmlFor="dd-wager-num" className="sr-only">
                          Daily Double Wager
                        </label>
                        <input
                          id="dd-wager-num"
                          type="number"
                          min={5}
                          max={maxWager}
                          value={ddWagerInput}
                          onChange={(e) => setDdWagerInput(Number(e.target.value) || 5)}
                          className="w-28 rounded bg-[#0A1342] border border-[#3B59B8] px-3 py-1.5 font-mono-num text-sm font-bold text-[#F5C242] focus:outline-none focus:border-[#F5C242]"
                        />
                        <div className="flex-1 flex items-center justify-end gap-1.5">
                          {[500, 1000, maxWager].map((preset, i) => {
                            const val = Math.min(maxWager, preset);
                            const lbl =
                              i === 2
                                ? player.score >= maxWager && player.score > 0
                                  ? 'True DD!'
                                  : `Max $${val.toLocaleString()}`
                                : `$${val.toLocaleString()}`;
                            return (
                              <button
                                key={`${i}-${val}`}
                                type="button"
                                onClick={() => setDdWagerInput(val)}
                                className="px-2.5 py-1.5 rounded text-xs font-semibold cursor-pointer bg-[#122268] hover:bg-[#1D3598] border border-[#3B59B8] text-amber-100 whitespace-nowrap"
                              >
                                {lbl}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <button
                        type="submit"
                        data-testid="lock-dd-wager-btn"
                        className="w-full py-2.5 rounded font-display text-base font-bold uppercase tracking-wider cursor-pointer bg-[#F5C242] hover:bg-[#FBD160] text-[#050A22] shadow-lg"
                      >
                        Lock Wager &amp; Reveal Clue
                      </button>
                    </form>
                  );
                })()
              ) : (
                <div className="mt-6 rounded-lg bg-[#050A26]/85 border border-[#C49E54]/60 px-6 py-4 text-sm text-amber-100">
                  {state.contestants.find((c) => c.id === state.activeClue?.activeContestantId)?.name}{' '}
                  is deciding their Daily Double wager...
                </div>
              )}
            </div>
          )}

          {/* PHASE 3: ACTIVE CLUE MONITOR WITH STUDIO BUZZER LOCKOUT LIGHT BARS */}
          {(state.phase === 'clue_reading' ||
            state.phase === 'buzzer_open' ||
            state.phase === 'contestant_answering' ||
            state.phase === 'clue_result') &&
            state.activeClue && (
              <div
                data-testid="jeopardy-clue-monitor"
                className="flex-1 min-h-0 flex items-stretch gap-2.5"
              >
                {/* Left Vertical Studio Buzzer Lockout Light Bar */}
                <div
                  aria-hidden="true"
                  data-testid="buzzer-lights-left"
                  data-lit={buzzerLightsOn ? 'true' : 'false'}
                  className={`w-3.5 rounded-full border transition-all duration-150 ${
                    buzzerLightsOn
                      ? 'bg-[#F8FAFC] border-cyan-200 shadow-[0_0_24px_#7DD3FC]'
                      : 'bg-[#0A133B] border-[#1F3482]'
                  }`}
                />

                {/* Royal Blue Broadcast Clue Screen */}
                <div className="flex-1 min-w-0 rounded-lg border-2 border-[#C49E54]/80 bg-[#060CE9] shadow-[0_24px_60px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden">
                  {/* Clue Header Banner */}
                  <div className="shrink-0 px-5 py-2.5 bg-[#040978] border-b border-[#3454D1] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="font-display text-sm sm:text-base font-bold uppercase tracking-wider text-white truncate">
                        {activeCategories[state.activeClue.categoryIndex]?.title}
                      </span>
                      <span className="text-[#F5C242]">·</span>
                      <span className="font-display text-sm sm:text-base font-bold tabular-nums text-[#F5C242] whitespace-nowrap">
                        {state.activeClue.clue.isDailyDouble
                          ? `DAILY DOUBLE · $${state.activeClue.wager.toLocaleString()}`
                          : `$${state.activeClue.clue.value.toLocaleString()}`}
                      </span>
                    </div>

                    <div className="text-xs font-display font-semibold uppercase tracking-widest text-sky-200 whitespace-nowrap">
                      {state.phase === 'clue_reading'
                        ? 'Listen to Clue...'
                        : state.phase === 'buzzer_open'
                          ? 'Lights On — Buzz In!'
                          : state.phase === 'contestant_answering'
                            ? `${
                                state.contestants.find(
                                  (c) => c.id === state.activeClue?.activeContestantId
                                )?.name
                              } Answering`
                            : 'Clue Resolved'}
                    </div>
                  </div>

                  {/* Center Clue Text + Real Wikimedia/Internet Archive CRT Photo */}
                  <div className="flex-1 min-h-0 px-6 py-4 flex flex-col md:flex-row items-center justify-center gap-6 overflow-y-auto">
                    <div className="flex-1 min-w-0 flex flex-col items-center justify-center text-center">
                      <p
                        data-testid="clue-prompt-text"
                        className="font-display text-xl sm:text-2xl xl:text-[28px] font-bold uppercase tracking-wide leading-snug text-white max-w-2xl"
                        style={{ textShadow: '0 3px 0 rgba(0, 0, 0, 0.85)' }}
                      >
                        {state.activeClue.clue.prompt}
                      </p>

                      {state.phase === 'clue_result' && (
                        <div className="mt-4 px-4 py-2.5 rounded-md bg-[#04084E]/90 border border-[#F5C242]/80 max-w-xl">
                          <div className="text-[11px] font-display uppercase tracking-[0.2em] text-sky-200">
                            Correct Response
                          </div>
                          <div className="mt-0.5 font-display text-lg sm:text-xl font-bold text-[#F5C242]">
                            {state.activeClue.clue.correctResponse}
                          </div>
                          {state.activeClue.lastResponderName && (
                            <div
                              className={`mt-1 text-xs font-semibold ${
                                state.activeClue.lastResponseCorrect
                                  ? 'text-emerald-300'
                                  : 'text-rose-300'
                              }`}
                            >
                              {state.activeClue.lastResponderName}:{' '}
                              {state.activeClue.lastResponseCorrect ? 'Correct' : 'Incorrect'} (
                              {state.activeClue.lastDelta >= 0 ? '+' : ''}
                              {formatDollar(state.activeClue.lastDelta)})
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Right Monitor: Live Internet Archive Video (with_clue / Daily Double / on_reveal / replay) OR Archival Image */}
                    {(() => {
                      const clue = state.activeClue.clue;
                      const vid = clue.video;
                      const showLiveVideo =
                        Boolean(vid) &&
                        (vid!.timing === 'with_clue' ||
                          (vid!.timing === 'on_reveal' && state.phase === 'clue_result') ||
                          (vid!.timing === 'before_clue' &&
                            (replayBeforeVideo || clue.isDailyDouble)));

                      if (showLiveVideo && vid) {
                        const badge =
                          state.phase === 'clue_result'
                            ? '90s VIDEO REVEAL'
                            : vid.timing === 'with_clue'
                              ? 'VIDEO CLUE · LIVE'
                              : 'ARCHIVE CLIP REPLAY';
                        return (
                          <NostalgiaVideoMonitor
                            video={vid}
                            studioMuted={muted}
                            paused={paused}
                            badgeLabel={badge}
                            fallbackMedia={clue.media}
                          />
                        );
                      }

                      if (clue.media.showOnClue || state.phase === 'clue_result') {
                        return (
                          <div className="flex flex-col items-center gap-2 shrink-0">
                            <NostalgiaMediaFrame media={clue.media} />
                            {vid && vid.timing === 'before_clue' && (
                              <button
                                type="button"
                                data-testid="replay-intro-video-btn"
                                onClick={() => setReplayBeforeVideo(true)}
                                className="px-3 py-1 rounded text-[11px] font-display font-bold uppercase tracking-wider cursor-pointer bg-[#0B175A] hover:bg-[#172D8C] border border-[#F5C242]/70 text-[#F5C242]"
                              >
                                ▶ Replay Archive Video Clip
                              </button>
                            )}
                            {vid &&
                              vid.timing === 'on_reveal' &&
                              state.phase !== 'clue_result' && (
                                <span className="text-[10px] font-display font-semibold uppercase tracking-widest text-amber-200/90">
                                  ▶ 90s Archive Video Plays on Reveal
                                </span>
                              )}
                          </div>
                        );
                      }

                      return null;
                    })()}
                  </div>

                  {/* Bottom Interactive Deck inside Clue Monitor */}
                  <div className="shrink-0 px-5 py-3.5 bg-[#040958]/95 border-t border-[#2E4BC8]">
                    {/* BUZZER DECK */}
                    {(state.phase === 'clue_reading' || state.phase === 'buzzer_open') && (
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="text-xs text-sky-100/90">
                          {state.activeClue.attemptedIds.includes('player') ? (
                            <span className="text-rose-300 font-semibold">
                              You already attempted this clue — watching rebound...
                            </span>
                          ) : lockoutFlash ? (
                            <span className="text-rose-300 font-bold">
                              Early buzz penalty! Wait for the side lights to illuminate!
                            </span>
                          ) : state.phase === 'clue_reading' ? (
                            <span>Wait for the side studio lights to turn white before ringing in!</span>
                          ) : (
                            <span className="text-cyan-200 font-semibold">
                              Side lights are illuminated — hit BUZZ IN or press Space now!
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0">
                          {state.phase === 'buzzer_open' && (
                            <button
                              type="button"
                              onClick={() => {
                                jeopardySound.playTimeUp();
                                setState((prev) => expireClueBuzzer(prev));
                              }}
                              className="px-3.5 py-2.5 rounded text-xs font-semibold cursor-pointer bg-[#0B175A] hover:bg-[#142685] border border-[#3C5BC9] text-slate-200"
                            >
                              Skip / Reveal
                            </button>
                          )}

                          <button
                            type="button"
                            data-testid="buzzer-btn"
                            disabled={state.activeClue.attemptedIds.includes('player')}
                            onClick={handlePlayerBuzz}
                            className={`px-7 py-2.5 rounded font-display text-base font-bold uppercase tracking-[0.14em] cursor-pointer transition-all border-2 whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed ${
                              lockoutFlash
                                ? 'bg-stone-800 border-rose-500 text-rose-300'
                                : buzzerLightsOn
                                  ? 'bg-[#DC2626] hover:bg-[#EF4444] border-[#FDE047] text-white shadow-[0_0_24px_rgba(239,68,68,0.65)]'
                                  : 'bg-[#7F1D1D] hover:bg-[#991B1B] border-[#FCA5A5]/50 text-rose-100'
                            }`}
                          >
                            {lockoutFlash
                              ? 'LOCKED OUT...'
                              : buzzerLightsOn
                                ? 'BUZZ IN [SPACE]'
                                : 'ARM BUZZER'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* HUMAN RESPONSE DECK (4 CHOICES OR CLASSIC TYPE-IN) */}
                    {state.phase === 'contestant_answering' &&
                      state.activeClue.activeContestantId === 'player' &&
                      (state.config.answerMode === 'choices' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {state.activeClue.clue.choices.map((choice, idx) => (
                            <button
                              key={choice}
                              type="button"
                              data-testid={`choice-${idx}`}
                              onClick={() => handlePlayerSubmitAnswer(choice)}
                              className="px-3.5 py-2.5 rounded text-left cursor-pointer bg-[#0A1878] hover:bg-[#1630B8] border border-[#4E70E8] hover:border-[#F5C242] text-sm font-semibold text-white transition-colors flex items-center gap-2.5"
                            >
                              <span className="w-6 h-6 rounded bg-[#050A26] border border-[#F5C242]/75 text-[#F5C242] font-mono-num text-xs font-bold flex items-center justify-center shrink-0">
                                {idx + 1}
                              </span>
                              <span className="leading-snug">{choice}</span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            handlePlayerSubmitAnswer(typedAnswer);
                          }}
                          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
                        >
                          <label htmlFor="jeopardy-typed-answer" className="sr-only">
                            Type your response in the form of a question
                          </label>
                          <input
                            ref={typedInputRef}
                            id="jeopardy-typed-answer"
                            type="text"
                            placeholder="What is / Who is ...?"
                            value={typedAnswer}
                            onChange={(e) => setTypedAnswer(e.target.value)}
                            className="flex-1 rounded bg-[#050A28] border-2 border-[#4B6BE6] px-3.5 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-[#F5C242]"
                          />
                          <button
                            type="submit"
                            className="px-6 py-2 rounded font-display text-sm font-bold uppercase tracking-wider cursor-pointer bg-[#F5C242] hover:bg-[#FBD160] text-[#050A22] whitespace-nowrap"
                          >
                            Submit Response
                          </button>
                        </form>
                      ))}

                    {/* CPU ANSWERING STATUS */}
                    {state.phase === 'contestant_answering' &&
                      state.activeClue.activeContestantId !== 'player' && (
                        <div className="flex items-center justify-center gap-2.5 py-1.5 text-sm font-semibold text-amber-200">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#F5C242] animate-pulse" />
                          <span>
                            {
                              state.contestants.find(
                                (c) => c.id === state.activeClue?.activeContestantId
                              )?.name
                            }{' '}
                            buzzed in and is answering...
                          </span>
                        </div>
                      )}

                    {/* CLUE RESULT CONTINUE */}
                    {state.phase === 'clue_result' && (
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-xs text-slate-300">
                          Board control:{' '}
                          <span className="text-[#F5C242] font-semibold">
                            {
                              state.contestants.find((c) => c.id === state.boardControllerId)
                                ?.name
                            }
                          </span>
                        </div>
                        <button
                          type="button"
                          data-testid="clue-continue-btn"
                          onClick={handleContinueAfterResult}
                          className="px-6 py-2 rounded font-display text-sm font-bold uppercase tracking-wider cursor-pointer bg-[#F5C242] hover:bg-[#FBD160] text-[#050A22]"
                        >
                          Continue to Board [Space]
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Vertical Studio Buzzer Lockout Light Bar */}
                <div
                  aria-hidden="true"
                  data-testid="buzzer-lights-right"
                  data-lit={buzzerLightsOn ? 'true' : 'false'}
                  className={`w-3.5 rounded-full border transition-all duration-150 ${
                    buzzerLightsOn
                      ? 'bg-[#F8FAFC] border-cyan-200 shadow-[0_0_24px_#7DD3FC]'
                      : 'bg-[#0A133B] border-[#1F3482]'
                  }`}
                />
              </div>
            )}

          {/* PHASE 4: ROUND TRANSITION -> DOUBLE JEOPARDY! ($400 TO $2,000) */}
          {state.phase === 'round_transition' && (
            <div className="flex-1 min-h-0 rounded-lg border-2 border-[#F5C242] bg-[#060CE9] p-6 flex flex-col items-center justify-center text-center shadow-[0_24px_60px_rgba(0,0,0,0.85)]">
              <div className="text-xs font-display font-bold uppercase tracking-[0.28em] text-sky-200">
                Round 1 Complete · Stakes Doubled
              </div>
              <h2
                className="mt-2 font-display text-5xl sm:text-6xl font-bold uppercase tracking-wider text-[#F5C242]"
                style={{ textShadow: '0 5px 0 #050A22' }}
              >
                DOUBLE JEOPARDY!
              </h2>
              <p className="mt-3 max-w-lg text-sm sm:text-base text-slate-100">
                Seven brand-new 90s nostalgia categories with clue values from{' '}
                <span className="font-bold text-[#F5C242]">$400 all the way to $2,000</span> and{' '}
                <span className="font-bold text-[#F5C242]">two Daily Doubles</span> hidden on the
                board!
              </p>
              <button
                type="button"
                data-testid="start-double-jeopardy-btn"
                onClick={handleStartDouble}
                className="mt-6 px-8 py-3 rounded font-display text-base font-bold uppercase tracking-wider cursor-pointer bg-[#F5C242] hover:bg-[#FBD160] text-[#050A22] shadow-xl"
              >
                Start Double Jeopardy! [Space]
              </button>
            </div>
          )}

          {/* PHASE 5: FINAL JEOPARDY! WAGER / CLUE / REVEAL */}
          {(state.phase === 'final_wager' ||
            state.phase === 'final_clue' ||
            state.phase === 'final_reveal') && (
            <div
              data-testid="final-jeopardy-stage"
              className="flex-1 min-h-0 rounded-lg border-2 border-[#F5C242] bg-[#060CE9] p-5 flex flex-col justify-between shadow-[0_24px_60px_rgba(0,0,0,0.85)] overflow-y-auto"
            >
              <div className="text-center">
                <div className="text-xs font-display font-bold uppercase tracking-[0.28em] text-sky-200">
                  FINAL JEOPARDY! · 90s NOSTALGIA CATEGORY
                </div>
                <h2
                  className="mt-1 font-display text-3xl sm:text-4xl font-bold uppercase tracking-wider text-[#F5C242]"
                  style={{ textShadow: '0 4px 0 #050A22' }}
                >
                  {state.finalClue.category}
                </h2>
              </div>

              {state.phase === 'final_wager' && (
                <div className="my-auto flex flex-col items-center">
                  {player.score <= 0 ? (
                    <div className="max-w-md rounded-lg bg-[#050A26]/90 border border-[#C49E54]/70 p-5 text-center space-y-3">
                      <p className="text-sm text-amber-100">
                        Your current score is {formatDollar(player.score)}, so your Final Jeopardy!
                        wager is locked at $0—you can still answer for pride!
                      </p>
                      <button
                        type="button"
                        data-testid="lock-final-wager-btn"
                        onClick={() => setState((prev) => submitFinalWager(prev, 0))}
                        className="px-6 py-2.5 rounded font-display text-sm font-bold uppercase tracking-wider cursor-pointer bg-[#F5C242] hover:bg-[#FBD160] text-[#050A22]"
                      >
                        Reveal Final Clue
                      </button>
                    </div>
                  ) : (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        setState((prev) => submitFinalWager(prev, finalWagerInput));
                      }}
                      className="w-full max-w-md rounded-lg bg-[#050A26]/90 border border-[#C49E54]/70 p-5 space-y-4"
                    >
                      <div className="flex items-center justify-between text-xs text-slate-200">
                        <span>Your Final Wager ($0 – ${player.score.toLocaleString()})</span>
                        <span className="font-mono-num text-base font-bold text-[#F5C242]">
                          ${Math.min(player.score, Math.max(0, finalWagerInput)).toLocaleString()}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={player.score}
                        step={100}
                        aria-label="Final Jeopardy wager"
                        value={Math.min(player.score, Math.max(0, finalWagerInput))}
                        onChange={(e) => setFinalWagerInput(Number(e.target.value))}
                        className="w-full accent-[#F5C242]"
                      />
                      <div className="flex items-center justify-between gap-2">
                        {[0, Math.round(player.score / 2), player.score].map((amt, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setFinalWagerInput(amt)}
                            className="flex-1 py-1.5 rounded text-xs font-semibold cursor-pointer bg-[#122268] hover:bg-[#1D3598] border border-[#3B59B8] text-amber-100"
                          >
                            {idx === 0 ? '$0 Safe' : idx === 1 ? '50%' : 'All In!'}
                          </button>
                        ))}
                      </div>
                      <button
                        type="submit"
                        data-testid="lock-final-wager-btn"
                        className="w-full py-2.5 rounded font-display text-base font-bold uppercase tracking-wider cursor-pointer bg-[#F5C242] hover:bg-[#FBD160] text-[#050A22]"
                      >
                        Lock Final Wager
                      </button>
                    </form>
                  )}
                </div>
              )}

              {state.phase === 'final_clue' && (
                <div className="my-auto flex flex-col items-center gap-4">
                  <div className="px-3.5 py-1 rounded bg-[#050A26]/90 border border-[#F5C242]/70 font-mono-num text-sm font-bold text-[#F5C242]">
                    {finalSecondsLeft}s remaining
                  </div>

                  <div className="flex flex-col md:flex-row items-center justify-center gap-5 max-w-3xl">
                    <p
                      className="font-display text-xl sm:text-2xl font-bold uppercase tracking-wide text-center md:text-left text-white max-w-xl"
                      style={{ textShadow: '0 3px 0 rgba(0,0,0,0.85)' }}
                    >
                      {state.finalClue.prompt}
                    </p>
                    <NostalgiaMediaFrame media={state.finalClue.media} compact />
                  </div>

                  {state.config.answerMode === 'choices' ? (
                    <div className="w-full max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {state.finalClue.choices.map((ch, idx) => (
                        <button
                          key={ch}
                          type="button"
                          data-testid={`final-choice-${idx}`}
                          onClick={() => {
                            jeopardySound.stopFinalThinkMusic();
                            setState((prev) => submitFinalAnswer(prev, ch));
                          }}
                          className="px-4 py-2.5 rounded text-left cursor-pointer bg-[#0A1878] hover:bg-[#1630B8] border border-[#4E70E8] hover:border-[#F5C242] text-sm font-semibold text-white"
                        >
                          {ch}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        jeopardySound.stopFinalThinkMusic();
                        setState((prev) => submitFinalAnswer(prev, finalTypedAnswer));
                      }}
                      className="w-full max-w-xl flex flex-col sm:flex-row gap-2.5"
                    >
                      <label htmlFor="final-typed-input" className="sr-only">
                        Your Final Jeopardy Response
                      </label>
                      <input
                        id="final-typed-input"
                        type="text"
                        placeholder="What is / Who is ...?"
                        value={finalTypedAnswer}
                        onChange={(e) => setFinalTypedAnswer(e.target.value)}
                        className="flex-1 rounded bg-[#050A28] border-2 border-[#4B6BE6] px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#F5C242]"
                      />
                      <button
                        type="submit"
                        className="px-6 py-2 rounded font-display text-sm font-bold uppercase tracking-wider cursor-pointer bg-[#F5C242] hover:bg-[#FBD160] text-[#050A22]"
                      >
                        Lock Final Answer
                      </button>
                    </form>
                  )}
                </div>
              )}

              {state.phase === 'final_reveal' && (
                <div className="my-auto flex flex-col items-center gap-4">
                  <div className="flex flex-col md:flex-row items-center gap-5">
                    <div className="text-center md:text-left">
                      <div className="text-xs font-display uppercase tracking-widest text-sky-200">
                        Official Response
                      </div>
                      <div className="font-display text-2xl font-bold text-[#F5C242]">
                        {state.finalClue.correctResponse}
                      </div>
                    </div>
                    {state.finalClue.video ? (
                      <NostalgiaVideoMonitor
                        compact
                        video={state.finalClue.video}
                        studioMuted={muted}
                        paused={paused}
                        badgeLabel="FINAL VIDEO REVEAL"
                        fallbackMedia={state.finalClue.media}
                      />
                    ) : (
                      <NostalgiaMediaFrame media={state.finalClue.media} compact />
                    )}
                  </div>

                  <div className="w-full max-w-3xl grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {state.contestants.map((c) => (
                      <div
                        key={c.id}
                        className="rounded-md bg-[#050A26]/90 border border-[#3B59B8] p-3 text-center"
                      >
                        <div className="font-display text-sm font-bold uppercase text-white">
                          {c.name}
                        </div>
                        <div className="mt-1 text-xs text-slate-300 italic truncate">
                          &ldquo;{c.finalResponse}&rdquo;
                        </div>
                        <div
                          className={`mt-1.5 text-xs font-bold ${
                            c.finalCorrect ? 'text-emerald-300' : 'text-rose-300'
                          }`}
                        >
                          {c.finalCorrect ? 'CORRECT' : 'INCORRECT'} (
                          {c.finalCorrect ? '+' : '-'}${c.finalWager.toLocaleString()})
                        </div>
                        <div className="mt-1 font-mono-num text-lg font-bold text-[#F5C242]">
                          {formatDollar(c.score)}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    data-testid="view-final-results-btn"
                    onClick={() => {
                      jeopardySound.playVictoryFanfare();
                      setState((prev) => ({ ...prev, phase: 'game_over' }));
                    }}
                    className="px-7 py-2.5 rounded font-display text-sm font-bold uppercase tracking-wider cursor-pointer bg-[#F5C242] hover:bg-[#FBD160] text-[#050A22]"
                  >
                    Crown Champion &amp; View Results
                  </button>
                </div>
              )}

              <div className="h-1" />
            </div>
          )}
        </section>
      </div>

      {/* Bottom 3-Contestant Illuminated Studio Lecterns */}
      <footer
        data-testid="jeopardy-lecterns"
        className="shrink-0 px-4 pb-3 pt-1 grid grid-cols-3 gap-3 max-w-5xl w-full mx-auto"
      >
        {state.contestants.map((c) => {
          const isController = state.boardControllerId === c.id && state.phase === 'board';
          const isBuzzedIn =
            state.phase === 'contestant_answering' && state.activeClue?.activeContestantId === c.id;
          const alreadyMissed = state.activeClue?.attemptedIds.includes(c.id) ?? false;

          const statusText = isBuzzedIn
            ? 'BUZZED IN!'
            : isController
              ? 'BOARD CONTROL'
              : alreadyMissed
                ? 'ATTEMPTED'
                : c.isHuman
                  ? 'YOU'
                  : `CLASS OF ${c.badgeYear}`;

          return (
            <div
              key={c.id}
              data-testid={`lectern-${c.id}`}
              className={`rounded-md px-3.5 py-2 border-2 transition-all flex items-center justify-between gap-2 ${
                isBuzzedIn
                  ? 'bg-[#0F2478] border-[#FDE047] shadow-[0_0_24px_rgba(253,224,71,0.45)]'
                  : isController
                    ? 'bg-[#0A1854] border-[#C49E54]'
                    : 'bg-[#071038] border-[#1F3482]'
              }`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: c.accentColor }}
                  />
                  <span className="font-display text-sm sm:text-base font-bold tracking-wide text-white truncate">
                    {c.name}
                  </span>
                </div>
                <div
                  className={`text-[10px] font-display font-bold uppercase tracking-[0.16em] mt-0.5 ${
                    isBuzzedIn
                      ? 'text-[#FDE047]'
                      : isController
                        ? 'text-sky-300'
                        : alreadyMissed
                          ? 'text-rose-300/80'
                          : 'text-slate-400'
                  }`}
                >
                  {statusText}
                </div>
              </div>

              {/* Illuminated Studio LED Score Display */}
              <div
                data-testid={`score-${c.id}`}
                className={`px-3 py-1 rounded bg-[#03071E] border border-[#2A44A8] font-mono-num text-base sm:text-xl font-bold tabular-nums shrink-0 ${
                  c.score < 0 ? 'text-rose-400' : 'text-[#F5C242]'
                }`}
              >
                {formatDollar(c.score)}
              </div>
            </div>
          );
        })}
      </footer>

      {/* PAUSE MODAL */}
      {paused && state.phase !== 'game_over' && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Show Paused"
          className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4"
        >
          <div className="w-full max-w-sm rounded-lg bg-[#081036] border-2 border-[#C49E54] p-6 shadow-2xl space-y-3">
            <h2 className="font-display text-2xl font-bold uppercase tracking-wider text-[#F5C242] text-center">
              Show Paused
            </h2>
            <p className="text-xs text-slate-300 text-center">
              {roundHeading} · {episodeLabel}
            </p>

            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={() => setPaused(false)}
                className="w-full py-2.5 rounded font-display text-sm font-bold uppercase tracking-wider cursor-pointer bg-[#F5C242] hover:bg-[#FBD160] text-[#050A22]"
              >
                Resume Show
              </button>

              {state.round === 'jeopardy' && (
                <button
                  type="button"
                  data-testid="jump-double-jeopardy-btn"
                  onClick={handleJumpToDouble}
                  className="w-full py-2 rounded text-xs font-bold uppercase tracking-wider cursor-pointer bg-[#0F247A] hover:bg-[#1935A8] border border-[#4E70E8] text-sky-100"
                >
                  Jump to Double Jeopardy! ($2,000)
                </button>
              )}

              {state.round !== 'final_jeopardy' && (
                <button
                  type="button"
                  data-testid="jump-final-jeopardy-btn"
                  onClick={handleJumpToFinal}
                  className="w-full py-2 rounded text-xs font-bold uppercase tracking-wider cursor-pointer bg-[#0F247A] hover:bg-[#1935A8] border border-[#4E70E8] text-sky-100"
                >
                  Jump to Final Jeopardy!
                </button>
              )}

              <button
                type="button"
                onClick={handleRestartShow}
                className="w-full py-2 rounded text-xs font-semibold uppercase tracking-wider cursor-pointer bg-[#0A1340] hover:bg-[#132268] border border-[#2C47A8] text-slate-200"
              >
                Restart Episode
              </button>

              <button
                type="button"
                onClick={onReturnTitle}
                className="w-full py-2 rounded text-xs font-semibold uppercase tracking-wider cursor-pointer bg-transparent hover:bg-rose-950/50 border border-rose-500/50 text-rose-200"
              >
                Return to Game Picker
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VICTORY / GAME OVER MODAL */}
      {state.phase === 'game_over' && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Final Jeopardy Results"
          data-testid="jeopardy-gameover-modal"
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
        >
          <div className="w-full max-w-lg rounded-lg bg-[#081036] border-2 border-[#F5C242] p-6 shadow-2xl text-center">
            <div className="text-xs font-display font-bold uppercase tracking-[0.26em] text-sky-300">
              90s Nostalgia Jeopardy! · Final Standings
            </div>
            <h2 className="mt-1 font-display text-3xl sm:text-4xl font-bold uppercase text-[#F5C242]">
              {sortedStandings[0]?.id === 'player'
                ? 'You Are Champion!'
                : `${sortedStandings[0]?.name} Wins!`}
            </h2>

            <div className="mt-4 space-y-2 text-left">
              {sortedStandings.map((c, idx) => (
                <div
                  key={c.id}
                  className={`flex items-center justify-between px-4 py-2.5 rounded border ${
                    idx === 0
                      ? 'bg-[#10247A] border-[#F5C242]'
                      : 'bg-[#060C2B] border-[#243B94]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono-num text-sm font-bold text-[#F5C242]">
                      #{idx + 1}
                    </span>
                    <span className="font-display text-base font-bold text-white">{c.name}</span>
                  </div>
                  <span
                    className={`font-mono-num text-lg font-bold ${
                      c.score < 0 ? 'text-rose-400' : 'text-[#F5C242]'
                    }`}
                  >
                    {formatDollar(c.score)}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded bg-[#050A26] border border-[#243B94] p-2.5">
                <div className="text-[10px] uppercase tracking-wider text-slate-400">Your Score</div>
                <div className="font-mono-num text-sm font-bold text-[#F5C242] mt-0.5">
                  {formatDollar(player.score)}
                </div>
              </div>
              <div className="rounded bg-[#050A26] border border-[#243B94] p-2.5">
                <div className="text-[10px] uppercase tracking-wider text-slate-400">Accuracy</div>
                <div className="font-mono-num text-sm font-bold text-emerald-300 mt-0.5">
                  {playerAccuracyPct}% ({state.playerCorrectCount}/{state.playerAttemptCount})
                </div>
              </div>
              <div className="rounded bg-[#050A26] border border-[#243B94] p-2.5">
                <div className="text-[10px] uppercase tracking-wider text-slate-400">
                  Daily Doubles
                </div>
                <div className="font-mono-num text-sm font-bold text-sky-300 mt-0.5">
                  {state.dailyDoublesFound}
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                data-start="true"
                onClick={handleRestartShow}
                className="flex-1 py-2.5 rounded font-display text-sm font-bold uppercase tracking-wider cursor-pointer bg-[#F5C242] hover:bg-[#FBD160] text-[#050A22]"
              >
                Play Again
              </button>
              <button
                type="button"
                onClick={onReturnTitle}
                className="flex-1 py-2.5 rounded font-display text-sm font-bold uppercase tracking-wider cursor-pointer bg-[#0B1750] hover:bg-[#14277D] border border-[#3B59B8] text-slate-100"
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
