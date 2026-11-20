export type JeopardyRound = 'jeopardy' | 'double_jeopardy' | 'final_jeopardy';

export type JeopardyEpisodePreset = 'episode_1' | 'episode_2' | 'shuffle_28';

export type JeopardyAnswerMode = 'choices' | 'typed';

export type JeopardyPhase =
  | 'board'
  | 'daily_double_wager'
  | 'video_intro'
  | 'clue_reading'
  | 'buzzer_open'
  | 'contestant_answering'
  | 'clue_result'
  | 'round_transition'
  | 'final_wager'
  | 'final_clue'
  | 'final_reveal'
  | 'game_over';

export type HostMood =
  | 'neutral'
  | 'reading'
  | 'excited'
  | 'correct'
  | 'wrong'
  | 'daily_double'
  | 'thinking';

export interface NostalgiaMediaRef {
  /** 'wiki' resolves via Wikipedia REST API thumbnail; 'archive' resolves via Internet Archive services/img */
  source: 'wiki' | 'archive';
  /** Wikipedia article title or Internet Archive identifier */
  id: string;
  caption: string;
  /** If true, displays on the studio monitor while the clue is being asked; if false, displays on answer reveal */
  showOnClue: boolean;
}

export type VideoClueTiming = 'before_clue' | 'with_clue' | 'on_reveal';

export interface NostalgiaVideoRef {
  /** Internet Archive item identifier */
  archiveId: string;
  /** Exact MP4 filename on Internet Archive */
  file: string;
  /** Studio monitor caption */
  caption: string;
  /**
   * 'before_clue': Video plays first in full CRT monitor, then clue & buzzer follow
   * 'with_clue': Video plays live as the clue alongside the question & buzzer
   * 'on_reveal': Clue is asked first, then the Internet Archive video auto-plays on reveal
   */
  timing: VideoClueTiming;
  /** Optional start offset in seconds */
  startSec?: number;
  /** Preview duration in seconds for 'before_clue' before auto-advancing to the clue (default 8) */
  previewSec?: number;
}

export interface JeopardyClueTemplate {
  /** 1..5 difficulty tier ($200..$1000 in Round 1, $400..$2000 in Double Jeopardy) */
  tier: 1 | 2 | 3 | 4 | 5;
  prompt: string;
  correctResponse: string;
  /** Normalized phrases/keywords accepted in Classic Type-In mode */
  acceptedKeywords: string[];
  /** 4 phrased "What is / Who is ...?" choices (one matches correctResponse) */
  choices: [string, string, string, string];
  media: NostalgiaMediaRef;
  /** Optional playable Internet Archive 1990s MP4 video clip */
  video?: NostalgiaVideoRef;
}

export interface JeopardyCategoryTemplate {
  id: string;
  title: string;
  subtitle: string;
  /** Preferred default round pool so Episode 1 & Episode 2 split cleanly across all 28 categories */
  preferredRound: 'jeopardy' | 'double_jeopardy';
  clues: [
    JeopardyClueTemplate,
    JeopardyClueTemplate,
    JeopardyClueTemplate,
    JeopardyClueTemplate,
    JeopardyClueTemplate,
  ];
}

export interface JeopardyBoardClue extends JeopardyClueTemplate {
  id: string;
  categoryIndex: number;
  rowIndex: number;
  value: number;
  isDailyDouble: boolean;
  answered: boolean;
  answeredBy: string | null;
  wasCorrect: boolean | null;
}

export interface JeopardyBoardCategory {
  id: string;
  title: string;
  subtitle: string;
  clues: JeopardyBoardClue[];
}

export interface FinalJeopardyClue {
  id: string;
  category: string;
  prompt: string;
  correctResponse: string;
  acceptedKeywords: string[];
  choices: [string, string, string, string];
  media: NostalgiaMediaRef;
  video?: NostalgiaVideoRef;
}

export interface JeopardyContestant {
  id: 'player' | 'cpu_1' | 'cpu_2';
  name: string;
  isHuman: boolean;
  score: number;
  accentColor: string;
  badgeYear: string;
  /** CPU buzzer speed / knowledge ratings */
  accuracy: number;
  buzzSkill: number;
  /** Final Jeopardy locked wager & result */
  finalWager: number;
  finalResponse: string;
  finalCorrect: boolean | null;
}

export interface JeopardyLaunchConfig {
  playerName: string;
  episode: JeopardyEpisodePreset;
  answerMode: JeopardyAnswerMode;
}

export interface ActiveClueSession {
  categoryIndex: number;
  rowIndex: number;
  clue: JeopardyBoardClue;
  wager: number;
  /** Contestants who already attempted and missed this clue (cannot buzz again on rebound) */
  attemptedIds: string[];
  /** Currently buzzing / answering contestant */
  activeContestantId: 'player' | 'cpu_1' | 'cpu_2' | null;
  /** Timestamp until which the human player is locked out for buzzing before lights illuminated */
  playerLockoutUntil: number;
  lastResponseText: string | null;
  lastResponseCorrect: boolean | null;
  lastResponderName: string | null;
  lastDelta: number;
}

export interface JeopardyGameState {
  config: JeopardyLaunchConfig;
  round: JeopardyRound;
  phase: JeopardyPhase;
  contestants: [JeopardyContestant, JeopardyContestant, JeopardyContestant];
  /** Contestant currently holding board selection control */
  boardControllerId: 'player' | 'cpu_1' | 'cpu_2';
  /** 7 categories per round! */
  round1Categories: JeopardyBoardCategory[];
  round2Categories: JeopardyBoardCategory[];
  finalClue: FinalJeopardyClue;
  activeClue: ActiveClueSession | null;
  hostLine: string;
  hostMood: HostMood;
  cluesAnsweredInRound: number;
  totalCluesInRound: number;
  /** Snapshot counters for Victory/Game Over modal */
  playerCorrectCount: number;
  playerAttemptCount: number;
  dailyDoublesFound: number;
}
