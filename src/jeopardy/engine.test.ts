import assert from 'node:assert/strict';
import test from 'node:test';
import {
  advanceAfterClueResult,
  attemptPlayerBuzz,
  CATEGORIES_PER_ROUND,
  CLUES_PER_CATEGORY,
  createJeopardyGame,
  EARLY_BUZZ_LOCKOUT_MS,
  finishVideoIntro,
  getDailyDoubleMaxWager,
  matchesJeopardyResponse,
  openBuzzer,
  selectClue,
  startDoubleJeopardy,
  startFinalJeopardy,
  submitAnswer,
  submitDailyDoubleWager,
  submitFinalAnswer,
  submitFinalWager,
  triggerCpuBuzz,
} from './engine';
import { ALL_JEOPARDY_CATEGORIES, FINAL_JEOPARDY_CLUES } from './questionBank';

test('90s question bank contains 28 unique categories (140 clues) with real media refs and 6 Final clues', () => {
  assert.equal(ALL_JEOPARDY_CATEGORIES.length, 28);
  const uniqueIds = new Set(ALL_JEOPARDY_CATEGORIES.map((c) => c.id));
  assert.equal(uniqueIds.size, 28);

  let totalClues = 0;
  let cluePhotos = 0;
  const videoTimingCounts = { before_clue: 0, with_clue: 0, on_reveal: 0 };
  for (const cat of ALL_JEOPARDY_CATEGORIES) {
    assert.equal(cat.clues.length, 5, `Category ${cat.id} must have 5 clues`);
    for (const clue of cat.clues) {
      totalClues++;
      assert.ok(clue.choices.includes(clue.correctResponse), `Missing correct choice in ${cat.id}`);
      assert.ok(clue.media.id.length > 0, `Missing media id in ${cat.id}`);
      if (clue.media.showOnClue) cluePhotos++;
      if (clue.video) {
        assert.ok(clue.video.archiveId.length > 0, `Missing archiveId in ${cat.id}`);
        assert.ok(clue.video.file.endsWith('.mp4'), `Video file must be mp4 in ${cat.id}`);
        videoTimingCounts[clue.video.timing]++;
      }
    }
  }
  assert.equal(totalClues, 140);
  assert.equal(cluePhotos, 140, 'Every clue should display a real archival image');
  assert.ok(videoTimingCounts.before_clue >= 5, 'Expected multiple before_clue Internet Archive videos');
  assert.ok(videoTimingCounts.with_clue >= 4, 'Expected multiple with_clue Internet Archive videos');
  assert.ok(videoTimingCounts.on_reveal >= 5, 'Expected multiple on_reveal Internet Archive videos');
  assert.ok(FINAL_JEOPARDY_CLUES.length >= 6);
});

test('game initializes 7 categories per round with $200-$1000 R1 (1 DD) and $400-$2000 Double Jeopardy (2 DDs)', () => {
  const game = createJeopardyGame(
    { playerName: 'Chris', episode: 'shuffle_28', answerMode: 'choices' },
    424242
  );

  assert.equal(game.round1Categories.length, CATEGORIES_PER_ROUND);
  assert.equal(game.round2Categories.length, CATEGORIES_PER_ROUND);

  // No duplicate categories between Round 1 and Round 2
  const r1Ids = new Set(game.round1Categories.map((c) => c.id));
  for (const c2 of game.round2Categories) {
    assert.equal(r1Ids.has(c2.id), false);
    assert.deepEqual(
      c2.clues.map((q) => q.value),
      [400, 800, 1200, 1600, 2000]
    );
  }

  for (const c1 of game.round1Categories) {
    assert.deepEqual(
      c1.clues.map((q) => q.value),
      [200, 400, 600, 800, 1000]
    );
  }

  const r1DDs = game.round1Categories.flatMap((c) => c.clues).filter((q) => q.isDailyDouble);
  const r2DDs = game.round2Categories.flatMap((c) => c.clues).filter((q) => q.isDailyDouble);
  assert.equal(r1DDs.length, 1);
  assert.equal(r2DDs.length, 2);
  assert.notEqual(r2DDs[0].categoryIndex, r2DDs[1].categoryIndex);
});

test('early buzzer lockout enforces 250ms penalty and rebound reopens buzzer on wrong answer', () => {
  let state = createJeopardyGame(
    { playerName: 'Alex', episode: 'episode_1', answerMode: 'choices' },
    101
  );

  // Pick a non-Daily Double clue without a before_clue video intro
  let pickCat = 0;
  let pickRow = 0;
  for (let c = 0; c < CATEGORIES_PER_ROUND; c++) {
    for (let r = 0; r < CLUES_PER_CATEGORY; r++) {
      const candidate = state.round1Categories[c].clues[r];
      if (!candidate.isDailyDouble && candidate.video?.timing !== 'before_clue') {
        pickCat = c;
        pickRow = r;
        break;
      }
    }
  }

  state = selectClue(state, pickCat, pickRow);
  assert.equal(state.phase, 'clue_reading');

  // Buzzing early locks player out for 250ms
  const early = attemptPlayerBuzz(state, 1000);
  assert.equal(early.outcome, 'locked_out');
  state = early.state;

  // Lights turn on at 1100ms — player still locked out until 1250ms
  state = openBuzzer(state);
  const stillLocked = attemptPlayerBuzz(state, 1150);
  assert.equal(stillLocked.outcome, 'locked_out');

  // After lockout expires, buzz succeeds
  const validBuzz = attemptPlayerBuzz(state, 1000 + EARLY_BUZZ_LOCKOUT_MS + 10);
  assert.equal(validBuzz.outcome, 'buzzed');
  state = validBuzz.state;
  assert.equal(state.phase, 'contestant_answering');
  assert.equal(state.activeClue?.activeContestantId, 'player');

  // Wrong answer deducts points and reopens buzzer for rebound!
  const clueValue = state.activeClue!.clue.value;
  state = submitAnswer(state, 'What is definitely wrong?');
  assert.equal(state.contestants[0].score, -clueValue);
  assert.equal(state.phase, 'buzzer_open');

  // Rival CPU buzzes in on rebound and answers correctly
  state = triggerCpuBuzz(state, 'cpu_1');
  state = submitAnswer(state, state.activeClue!.clue.correctResponse);
  assert.equal(state.contestants[1].score, clueValue);
  assert.equal(state.phase, 'clue_result');
  assert.equal(state.boardControllerId, 'cpu_1');
});

test('Daily Double wager limits, Double Jeopardy $2,000 cap, fuzzy typing, and Final Jeopardy work cleanly', () => {
  let state = createJeopardyGame(
    { playerName: 'Sam', episode: 'episode_2', answerMode: 'typed' },
    999
  );
  state = startDoubleJeopardy(state);
  assert.equal(state.round, 'double_jeopardy');

  // Find a Double Jeopardy Daily Double
  const dd = state.round2Categories
    .flatMap((c) => c.clues)
    .find((q) => q.isDailyDouble);
  assert.ok(dd);

  state = selectClue(state, dd.categoryIndex, dd.rowIndex);
  assert.equal(state.phase, 'daily_double_wager');
  assert.equal(getDailyDoubleMaxWager(state, state.boardControllerId), 2000);

  // Attempting to wager over max ($5000) clamps to $2000
  state = submitDailyDoubleWager(state, 5000);
  assert.equal(state.activeClue?.wager, 2000);
  assert.equal(state.phase, 'contestant_answering');

  // Fuzzy keyword match accepts plain answer without "What is"
  assert.equal(matchesJeopardyResponse(dd.acceptedKeywords[0], dd), true);
  state = submitAnswer(state, dd.acceptedKeywords[0]);
  assert.equal(state.phase, 'clue_result');

  // Advance and jump to Final Jeopardy
  state = advanceAfterClueResult(state);
  state = startFinalJeopardy(state);
  assert.equal(state.phase, 'final_wager');

  state = submitFinalWager(state, 1000);
  assert.equal(state.phase, 'final_clue');

  state = submitFinalAnswer(state, state.finalClue.correctResponse, 777);
  assert.equal(state.phase, 'final_reveal');
  assert.equal(state.contestants[0].finalCorrect, true);
});

test('before_clue Internet Archive video clues play video_intro first then transition cleanly to clue_reading and buzzer', () => {
  let state = createJeopardyGame(
    { playerName: 'Jamie', episode: 'episode_1', answerMode: 'choices' },
    31415
  );

  // Locate a non-Daily Double clue with timing === 'before_clue'
  const videoBefore = state.round1Categories
    .flatMap((c) => c.clues)
    .find((q) => !q.isDailyDouble && q.video?.timing === 'before_clue');
  assert.ok(videoBefore, 'Expected a before_clue video clue in Round 1 Episode 1');

  state = selectClue(state, videoBefore.categoryIndex, videoBefore.rowIndex);
  assert.equal(state.phase, 'video_intro');
  assert.equal(state.activeClue?.clue.video?.timing, 'before_clue');

  // Finishing video intro transitions cleanly to clue_reading -> buzzer_open
  state = finishVideoIntro(state);
  assert.equal(state.phase, 'clue_reading');
  state = openBuzzer(state);
  assert.equal(state.phase, 'buzzer_open');
});
