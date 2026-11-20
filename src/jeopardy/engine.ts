import { ALL_JEOPARDY_CATEGORIES, FINAL_JEOPARDY_CLUES } from './questionBank';
import type {
  ActiveClueSession,
  FinalJeopardyClue,
  JeopardyBoardCategory,
  JeopardyBoardClue,
  JeopardyCategoryTemplate,
  JeopardyContestant,
  JeopardyGameState,
  JeopardyLaunchConfig,
} from './types';

export const CATEGORIES_PER_ROUND = 7;
export const CLUES_PER_CATEGORY = 5;
export const ROUND_1_VALUES = [200, 400, 600, 800, 1000] as const;
export const ROUND_2_VALUES = [400, 800, 1200, 1600, 2000] as const;
export const EARLY_BUZZ_LOCKOUT_MS = 250;

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleWithRng<T>(items: readonly T[], rng: () => number): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Normalize a typed or selected Jeopardy response for forgiving keyword comparison */
export function normalizeJeopardyText(input: string): string {
  return input
    .toLowerCase()
    .replace(/^(what|who|where|when)\s+(is|are|was|were)\s+/i, '')
    .replace(/^(what's|who's)\s+/i, '')
    .replace(/['"`?!.,:;()*\-]/g, ' ')
    .replace(/\b(the|a|an)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Determine whether a player's typed or selected response matches a clue */
export function matchesJeopardyResponse(
  rawInput: string,
  clue: { correctResponse: string; acceptedKeywords: string[] }
): boolean {
  const trimmed = rawInput.trim();
  if (!trimmed) return false;
  if (trimmed.toLowerCase() === clue.correctResponse.toLowerCase()) return true;

  const normInput = normalizeJeopardyText(trimmed);
  if (!normInput) return false;

  const normCorrect = normalizeJeopardyText(clue.correctResponse);
  if (normInput === normCorrect) return true;

  for (const kw of clue.acceptedKeywords) {
    const normKw = normalizeJeopardyText(kw);
    if (!normKw) continue;
    if (normInput === normKw || normInput.includes(normKw)) {
      return true;
    }
  }
  return false;
}

function buildRoundBoard(
  templates: JeopardyCategoryTemplate[],
  values: readonly number[],
  dailyDoubleCount: number,
  rng: () => number,
  roundPrefix: string
): JeopardyBoardCategory[] {
  // Choose distinct categories for Daily Doubles, weighted toward rows 1..4 (classic Jeopardy distribution)
  const catOrder = shuffleWithRng(
    templates.map((_, idx) => idx),
    rng
  );
  const ddPositions = new Set<string>();
  const rowWeights = [1, 2, 2, 3, 3, 4]; // rows 1..4 ($400..$1000 or $800..$2000)
  for (let i = 0; i < Math.min(dailyDoubleCount, catOrder.length); i++) {
    const cIdx = catOrder[i];
    const rIdx = rowWeights[Math.floor(rng() * rowWeights.length)];
    ddPositions.add(`${cIdx}:${rIdx}`);
  }

  return templates.map((cat, catIdx) => {
    const clues: JeopardyBoardClue[] = cat.clues.map((tmpl, rowIdx) => {
      const shuffledChoices = shuffleWithRng(tmpl.choices, rng) as [
        string,
        string,
        string,
        string,
      ];
      return {
        ...tmpl,
        choices: shuffledChoices,
        id: `${roundPrefix}_${cat.id}_${rowIdx}`,
        categoryIndex: catIdx,
        rowIndex: rowIdx,
        value: values[rowIdx],
        isDailyDouble: ddPositions.has(`${catIdx}:${rowIdx}`),
        answered: false,
        answeredBy: null,
        wasCorrect: null,
      };
    });

    return {
      id: cat.id,
      title: cat.title,
      subtitle: cat.subtitle,
      clues,
    };
  });
}

function selectEpisodeCategories(
  episode: JeopardyLaunchConfig['episode'],
  rng: () => number
): { r1: JeopardyCategoryTemplate[]; r2: JeopardyCategoryTemplate[] } {
  const r1Pool = ALL_JEOPARDY_CATEGORIES.filter((c) => c.preferredRound === 'jeopardy');
  const r2Pool = ALL_JEOPARDY_CATEGORIES.filter((c) => c.preferredRound === 'double_jeopardy');

  if (episode === 'episode_1') {
    return {
      r1: r1Pool.slice(0, CATEGORIES_PER_ROUND),
      r2: r2Pool.slice(0, CATEGORIES_PER_ROUND),
    };
  }
  if (episode === 'episode_2') {
    return {
      r1: r1Pool.slice(CATEGORIES_PER_ROUND, CATEGORIES_PER_ROUND * 2),
      r2: r2Pool.slice(CATEGORIES_PER_ROUND, CATEGORIES_PER_ROUND * 2),
    };
  }

  // Shuffle from ALL 28 categories without duplicates!
  const allShuffled = shuffleWithRng(ALL_JEOPARDY_CATEGORIES, rng);
  return {
    r1: allShuffled.slice(0, CATEGORIES_PER_ROUND),
    r2: allShuffled.slice(CATEGORIES_PER_ROUND, CATEGORIES_PER_ROUND * 2),
  };
}

export function createJeopardyGame(
  config: JeopardyLaunchConfig,
  seed: number = Date.now()
): JeopardyGameState {
  const rng = mulberry32(seed);
  const { r1, r2 } = selectEpisodeCategories(config.episode, rng);

  const round1Categories = buildRoundBoard(r1, ROUND_1_VALUES, 1, rng, 'r1');
  const round2Categories = buildRoundBoard(r2, ROUND_2_VALUES, 2, rng, 'r2');
  const finalClue: FinalJeopardyClue =
    FINAL_JEOPARDY_CLUES[Math.floor(rng() * FINAL_JEOPARDY_CLUES.length)];

  const cleanName = config.playerName.trim() || 'Contestant 1';

  const contestants: [JeopardyContestant, JeopardyContestant, JeopardyContestant] = [
    {
      id: 'player',
      name: cleanName,
      isHuman: true,
      score: 0,
      accentColor: '#F5C242',
      badgeYear: "'95",
      accuracy: 1,
      buzzSkill: 1,
      finalWager: 0,
      finalResponse: '',
      finalCorrect: null,
    },
    {
      id: 'cpu_1',
      name: 'Brenda',
      isHuman: false,
      score: 0,
      accentColor: '#38BDF8',
      badgeYear: "'94",
      accuracy: 0.72,
      buzzSkill: 0.66,
      finalWager: 0,
      finalResponse: '',
      finalCorrect: null,
    },
    {
      id: 'cpu_2',
      name: 'Devon',
      isHuman: false,
      score: 0,
      accentColor: '#FB7185',
      badgeYear: "'98",
      accuracy: 0.65,
      buzzSkill: 0.58,
      finalWager: 0,
      finalResponse: '',
      finalCorrect: null,
    },
  ];

  return {
    config: { ...config, playerName: cleanName },
    round: 'jeopardy',
    phase: 'board',
    contestants,
    boardControllerId: 'player',
    round1Categories,
    round2Categories,
    finalClue,
    activeClue: null,
    hostLine: `Welcome to 90s Nostalgia Jeopardy!, ${cleanName}! Seven classic categories on the board—make your first selection!`,
    hostMood: 'excited',
    cluesAnsweredInRound: 0,
    totalCluesInRound: CATEGORIES_PER_ROUND * CLUES_PER_CATEGORY,
    playerCorrectCount: 0,
    playerAttemptCount: 0,
    dailyDoublesFound: 0,
  };
}

export function getActiveBoardCategories(state: JeopardyGameState): JeopardyBoardCategory[] {
  return state.round === 'double_jeopardy' ? state.round2Categories : state.round1Categories;
}

export function getRoundMaxValue(round: JeopardyGameState['round']): number {
  return round === 'double_jeopardy' ? 2000 : 1000;
}

export function getDailyDoubleMaxWager(
  state: JeopardyGameState,
  contestantId: JeopardyContestant['id']
): number {
  const c = state.contestants.find((p) => p.id === contestantId);
  const currentScore = c ? c.score : 0;
  return Math.max(currentScore, getRoundMaxValue(state.round));
}

export function selectClue(
  state: JeopardyGameState,
  categoryIndex: number,
  rowIndex: number
): JeopardyGameState {
  if (state.phase !== 'board') return state;
  const categories = getActiveBoardCategories(state);
  const cat = categories[categoryIndex];
  const clue = cat?.clues[rowIndex];
  if (!clue || clue.answered) return state;

  const controller =
    state.contestants.find((c) => c.id === state.boardControllerId) ?? state.contestants[0];

  if (clue.isDailyDouble) {
    const maxWager = getDailyDoubleMaxWager(state, controller.id);
    const activeClue: ActiveClueSession = {
      categoryIndex,
      rowIndex,
      clue,
      wager: Math.min(clue.value, maxWager),
      attemptedIds: [],
      activeContestantId: controller.id,
      playerLockoutUntil: 0,
      lastResponseText: null,
      lastResponseCorrect: null,
      lastResponderName: null,
      lastDelta: 0,
    };
    return {
      ...state,
      phase: 'daily_double_wager',
      activeClue,
      dailyDoublesFound: state.dailyDoublesFound + 1,
      hostMood: 'daily_double',
      hostLine: `Answer... DAILY DOUBLE! ${controller.name}, you can wager up to $${maxWager.toLocaleString()} in "${cat.title}"!`,
    };
  }

  const activeClue: ActiveClueSession = {
    categoryIndex,
    rowIndex,
    clue,
    wager: clue.value,
    attemptedIds: [],
    activeContestantId: null,
    playerLockoutUntil: 0,
    lastResponseText: null,
    lastResponseCorrect: null,
    lastResponderName: null,
    lastDelta: 0,
  };

  if (clue.video?.timing === 'before_clue') {
    return {
      ...state,
      phase: 'video_intro',
      activeClue,
      hostMood: 'excited',
      hostLine: `VIDEO CLUE in ${cat.title} for $${clue.value.toLocaleString()}! Watch this 90s Internet Archive clip first—the clue follows right after!`,
    };
  }

  return {
    ...state,
    phase: 'clue_reading',
    activeClue,
    hostMood: 'reading',
    hostLine: clue.video?.timing === 'with_clue'
      ? `VIDEO CLUE! ${cat.title} for $${clue.value.toLocaleString()}: "${clue.prompt}"`
      : `${cat.title} for $${clue.value.toLocaleString()}: "${clue.prompt}"`,
  };
}

export function finishVideoIntro(state: JeopardyGameState): JeopardyGameState {
  if (state.phase !== 'video_intro' || !state.activeClue) return state;
  const cat = getActiveBoardCategories(state)[state.activeClue.categoryIndex];
  const { clue } = state.activeClue;
  return {
    ...state,
    phase: 'clue_reading',
    hostMood: 'reading',
    hostLine: `${cat?.title ?? 'Video Clue'} for $${clue.value.toLocaleString()}: "${clue.prompt}"`,
  };
}

export function openBuzzer(state: JeopardyGameState): JeopardyGameState {
  if (state.phase !== 'clue_reading' || !state.activeClue) return state;
  return {
    ...state,
    phase: 'buzzer_open',
    hostMood: 'neutral',
    hostLine: 'Lights are on—ring in now!',
  };
}

export function attemptPlayerBuzz(
  state: JeopardyGameState,
  nowMs: number
): { state: JeopardyGameState; outcome: 'buzzed' | 'locked_out' | 'ignored' } {
  if (!state.activeClue) return { state, outcome: 'ignored' };
  if (state.activeClue.attemptedIds.includes('player')) {
    return { state, outcome: 'ignored' };
  }

  // Authentic Jeopardy early-buzz lockout penalty!
  if (state.phase === 'clue_reading') {
    return {
      state: {
        ...state,
        activeClue: {
          ...state.activeClue,
          playerLockoutUntil: nowMs + EARLY_BUZZ_LOCKOUT_MS,
        },
        hostLine: 'Hold on—wait for the studio buzzer lights! (250ms lockout)',
      },
      outcome: 'locked_out',
    };
  }

  if (state.phase !== 'buzzer_open') {
    return { state, outcome: 'ignored' };
  }

  if (nowMs < state.activeClue.playerLockoutUntil) {
    return { state, outcome: 'locked_out' };
  }

  const player = state.contestants[0];
  return {
    state: {
      ...state,
      phase: 'contestant_answering',
      activeClue: {
        ...state.activeClue,
        activeContestantId: 'player',
      },
      hostMood: 'neutral',
      hostLine: `${player.name}!`,
    },
    outcome: 'buzzed',
  };
}

export function triggerCpuBuzz(
  state: JeopardyGameState,
  cpuId: 'cpu_1' | 'cpu_2'
): JeopardyGameState {
  if (state.phase !== 'buzzer_open' || !state.activeClue) return state;
  if (state.activeClue.attemptedIds.includes(cpuId)) return state;
  const cpu = state.contestants.find((c) => c.id === cpuId);
  if (!cpu) return state;

  return {
    ...state,
    phase: 'contestant_answering',
    activeClue: {
      ...state.activeClue,
      activeContestantId: cpuId,
    },
    hostMood: 'neutral',
    hostLine: `${cpu.name} rings in first!`,
  };
}

export function submitDailyDoubleWager(
  state: JeopardyGameState,
  rawWager: number
): JeopardyGameState {
  if (state.phase !== 'daily_double_wager' || !state.activeClue) return state;
  const controllerId = state.activeClue.activeContestantId ?? state.boardControllerId;
  const maxWager = getDailyDoubleMaxWager(state, controllerId);
  const wager = Math.max(5, Math.min(maxWager, Math.round(rawWager)));
  const controller = state.contestants.find((c) => c.id === controllerId) ?? state.contestants[0];
  const isTrueDD = wager === controller.score && controller.score > 0;

  return {
    ...state,
    phase: 'contestant_answering',
    activeClue: {
      ...state.activeClue,
      wager,
      activeContestantId: controllerId,
    },
    hostMood: 'reading',
    hostLine: isTrueDD
      ? `A True Daily Double for $${wager.toLocaleString()}! Here is your clue...`
      : `$${wager.toLocaleString()} on the line—here is your Daily Double clue!`,
  };
}

function markActiveClueAnswered(
  state: JeopardyGameState,
  answeredBy: string | null,
  wasCorrect: boolean | null
): {
  round1Categories: JeopardyBoardCategory[];
  round2Categories: JeopardyBoardCategory[];
  cluesAnsweredInRound: number;
} {
  if (!state.activeClue) {
    return {
      round1Categories: state.round1Categories,
      round2Categories: state.round2Categories,
      cluesAnsweredInRound: state.cluesAnsweredInRound,
    };
  }
  const { categoryIndex, rowIndex } = state.activeClue;
  const updateCats = (cats: JeopardyBoardCategory[]) =>
    cats.map((cat, ci) =>
      ci !== categoryIndex
        ? cat
        : {
            ...cat,
            clues: cat.clues.map((c, ri) =>
              ri !== rowIndex ? c : { ...c, answered: true, answeredBy, wasCorrect }
            ),
          }
    );

  return {
    round1Categories:
      state.round === 'jeopardy' ? updateCats(state.round1Categories) : state.round1Categories,
    round2Categories:
      state.round === 'double_jeopardy'
        ? updateCats(state.round2Categories)
        : state.round2Categories,
    cluesAnsweredInRound: state.cluesAnsweredInRound + 1,
  };
}

export function submitAnswer(
  state: JeopardyGameState,
  rawResponse: string
): JeopardyGameState {
  if (state.phase !== 'contestant_answering' || !state.activeClue) return state;
  const responderId = state.activeClue.activeContestantId;
  if (!responderId) return state;

  const responder = state.contestants.find((c) => c.id === responderId);
  if (!responder) return state;

  const { clue, wager } = state.activeClue;
  const isCorrect = matchesJeopardyResponse(rawResponse, clue);
  const delta = isCorrect ? wager : -wager;

  const updatedContestants = state.contestants.map((c) =>
    c.id === responderId ? { ...c, score: c.score + delta } : c
  ) as [JeopardyContestant, JeopardyContestant, JeopardyContestant];

  const isPlayer = responderId === 'player';
  const nextPlayerCorrect = state.playerCorrectCount + (isPlayer && isCorrect ? 1 : 0);
  const nextPlayerAttempt = state.playerAttemptCount + (isPlayer ? 1 : 0);

  if (isCorrect) {
    const marked = markActiveClueAnswered(state, responderId, true);
    return {
      ...state,
      ...marked,
      contestants: updatedContestants,
      boardControllerId: responderId,
      phase: 'clue_result',
      playerCorrectCount: nextPlayerCorrect,
      playerAttemptCount: nextPlayerAttempt,
      hostMood: 'correct',
      hostLine: `Correct, ${responder.name}! "${clue.correctResponse}" adds $${wager.toLocaleString()}—you have control of the board!`,
      activeClue: {
        ...state.activeClue,
        lastResponseText: rawResponse.trim() || clue.correctResponse,
        lastResponseCorrect: true,
        lastResponderName: responder.name,
        lastDelta: delta,
      },
    };
  }

  // Wrong response!
  const attemptedIds = [...state.activeClue.attemptedIds, responderId];
  const isFinalAttempt = clue.isDailyDouble || attemptedIds.length >= state.contestants.length;

  if (isFinalAttempt) {
    const marked = markActiveClueAnswered(state, responderId, false);
    return {
      ...state,
      ...marked,
      contestants: updatedContestants,
      phase: 'clue_result',
      playerCorrectCount: nextPlayerCorrect,
      playerAttemptCount: nextPlayerAttempt,
      hostMood: 'wrong',
      hostLine: `Ooh, sorry ${responder.name}—that costs $${wager.toLocaleString()}. We were looking for "${clue.correctResponse}".`,
      activeClue: {
        ...state.activeClue,
        attemptedIds,
        lastResponseText: rawResponse.trim() || '(No response)',
        lastResponseCorrect: false,
        lastResponderName: responder.name,
        lastDelta: delta,
      },
    };
  }

  // Rebound! Reopen the buzzer for contestants who haven't tried yet
  return {
    ...state,
    contestants: updatedContestants,
    phase: 'buzzer_open',
    playerCorrectCount: nextPlayerCorrect,
    playerAttemptCount: nextPlayerAttempt,
    hostMood: 'wrong',
    hostLine: `Not quite, ${responder.name} (-$${wager.toLocaleString()}). Rebound—buzzer is back open!`,
    activeClue: {
      ...state.activeClue,
      attemptedIds,
      activeContestantId: null,
      lastResponseText: rawResponse.trim() || '(Time expired)',
      lastResponseCorrect: false,
      lastResponderName: responder.name,
      lastDelta: delta,
    },
  };
}

export function expireClueBuzzer(state: JeopardyGameState): JeopardyGameState {
  if (
    (state.phase !== 'buzzer_open' && state.phase !== 'clue_reading') ||
    !state.activeClue
  ) {
    return state;
  }
  const { clue } = state.activeClue;
  const marked = markActiveClueAnswered(state, null, null);
  return {
    ...state,
    ...marked,
    phase: 'clue_result',
    hostMood: 'neutral',
    hostLine: `Time's up! The response we wanted was "${clue.correctResponse}".`,
    activeClue: {
      ...state.activeClue,
      activeContestantId: null,
      lastResponseText: null,
      lastResponseCorrect: null,
      lastResponderName: null,
      lastDelta: 0,
    },
  };
}

export function startDoubleJeopardy(state: JeopardyGameState): JeopardyGameState {
  // Official Jeopardy rule: contestant with lowest score starts Double Jeopardy!
  const sorted = [...state.contestants].sort((a, b) => a.score - b.score);
  const starter = sorted[0];
  return {
    ...state,
    round: 'double_jeopardy',
    phase: 'board',
    activeClue: null,
    boardControllerId: starter.id,
    cluesAnsweredInRound: 0,
    totalCluesInRound: CATEGORIES_PER_ROUND * CLUES_PER_CATEGORY,
    hostMood: 'excited',
    hostLine: `Welcome to DOUBLE JEOPARDY! Values are doubled all the way up to $2,000, with TWO Daily Doubles hidden on the board. ${starter.name}, you select first!`,
  };
}

export function startFinalJeopardy(state: JeopardyGameState): JeopardyGameState {
  return {
    ...state,
    round: 'final_jeopardy',
    phase: 'final_wager',
    activeClue: null,
    hostMood: 'thinking',
    hostLine: `It's time for FINAL JEOPARDY! Today's category is "${state.finalClue.category}". Lock in your wager!`,
  };
}

export function advanceAfterClueResult(state: JeopardyGameState): JeopardyGameState {
  if (state.phase !== 'clue_result') return state;

  if (state.cluesAnsweredInRound >= state.totalCluesInRound) {
    if (state.round === 'jeopardy') {
      return {
        ...state,
        activeClue: null,
        phase: 'round_transition',
        hostMood: 'excited',
        hostLine: 'That clears the Jeopardy! board! Get ready—Double Jeopardy! values go all the way to $2,000!',
      };
    }
    return startFinalJeopardy(state);
  }

  const controller =
    state.contestants.find((c) => c.id === state.boardControllerId) ?? state.contestants[0];

  return {
    ...state,
    phase: 'board',
    activeClue: null,
    hostMood: 'neutral',
    hostLine: controller.isHuman
      ? `Your board, ${controller.name}! Pick a category and dollar amount.`
      : `${controller.name} has control of the board and is choosing the next clue...`,
  };
}

export function submitFinalWager(
  state: JeopardyGameState,
  rawPlayerWager: number
): JeopardyGameState {
  if (state.phase !== 'final_wager') return state;

  const contestants = state.contestants.map((c) => {
    const maxAllowed = Math.max(0, c.score);
    if (c.isHuman) {
      return {
        ...c,
        finalWager: Math.max(0, Math.min(maxAllowed, Math.round(rawPlayerWager))),
      };
    }
    // Smart CPU wager (between 40% and 85% of positive score)
    const ratio = c.id === 'cpu_1' ? 0.65 : 0.52;
    const cpuWager = maxAllowed > 0 ? Math.round((maxAllowed * ratio) / 100) * 100 : 0;
    return {
      ...c,
      finalWager: Math.min(maxAllowed, cpuWager),
    };
  }) as [JeopardyContestant, JeopardyContestant, JeopardyContestant];

  return {
    ...state,
    contestants,
    phase: 'final_clue',
    hostMood: 'reading',
    hostLine: `Wagers are locked! Here is your Final Jeopardy! clue in "${state.finalClue.category}"—good luck!`,
  };
}

export function submitFinalAnswer(
  state: JeopardyGameState,
  rawPlayerAnswer: string,
  rngSeed = Date.now()
): JeopardyGameState {
  if (state.phase !== 'final_clue') return state;
  const rng = mulberry32(rngSeed);
  const clue = state.finalClue;

  const contestants = state.contestants.map((c) => {
    if (c.isHuman) {
      const correct = matchesJeopardyResponse(rawPlayerAnswer, clue);
      return {
        ...c,
        score: c.score + (correct ? c.finalWager : -c.finalWager),
        finalResponse: rawPlayerAnswer.trim() || '(No response)',
        finalCorrect: correct,
      };
    }
    const cpuRight = rng() < c.accuracy;
    const wrongChoices = clue.choices.filter((ch) => ch !== clue.correctResponse);
    const chosen = cpuRight
      ? clue.correctResponse
      : wrongChoices[Math.floor(rng() * wrongChoices.length)] ?? 'What is... blank?';
    return {
      ...c,
      score: c.score + (cpuRight ? c.finalWager : -c.finalWager),
      finalResponse: chosen,
      finalCorrect: cpuRight,
    };
  }) as [JeopardyContestant, JeopardyContestant, JeopardyContestant];

  const sorted = [...contestants].sort((a, b) => b.score - a.score);
  const champion = sorted[0];
  const playerWon = champion.id === 'player';

  return {
    ...state,
    contestants,
    phase: 'final_reveal',
    playerCorrectCount: state.playerCorrectCount + (contestants[0].finalCorrect ? 1 : 0),
    playerAttemptCount: state.playerAttemptCount + 1,
    hostMood: playerWon ? 'excited' : 'neutral',
    hostLine: playerWon
      ? `Incredible finish! ${champion.name} is our 90s Nostalgia Jeopardy! Champion with $${champion.score.toLocaleString()}!`
      : `What a game! ${champion.name} takes the crown with $${champion.score.toLocaleString()}. Correct response: "${clue.correctResponse}".`,
  };
}

export function pickCpuClueSelection(
  state: JeopardyGameState,
  rngSeed = Date.now()
): { categoryIndex: number; rowIndex: number } | null {
  const cats = getActiveBoardCategories(state);
  const remaining: Array<{ categoryIndex: number; rowIndex: number; value: number }> = [];
  cats.forEach((cat, ci) => {
    cat.clues.forEach((clue, ri) => {
      if (!clue.answered) {
        remaining.push({ categoryIndex: ci, rowIndex: ri, value: clue.value });
      }
    });
  });
  if (remaining.length === 0) return null;
  const rng = mulberry32(rngSeed);
  // Slight preference for lower-to-mid values first like real contestants
  remaining.sort((a, b) => a.value - b.value);
  const poolSize = Math.min(remaining.length, 10);
  const pick = remaining[Math.floor(rng() * poolSize)];
  return { categoryIndex: pick.categoryIndex, rowIndex: pick.rowIndex };
}
