// Risks #11 (the daily puzzle pays double) and #2 (the day rule survives a restart) of context/foundation/test-plan.md, S-15 phase 13.
// ?e2eVariant=puzzle makes every ordinary round a puzzle round, but the DAY RULE still applies: once the puzzle of a day is done
// (puzzleDay === today, saved with the learner) the next variant is a minigame. ?e2eDay pins the calendar day (e2e build only).
// The learner starts on E4 through the parent path (E4 has a puzzle pool; its proposal for age 10 is E6, so no warm-up).
// A reload keeps IndexedDB, so what the new session knows about the puzzle can only come from the SAVE; IndexedDB is never opened here.
// The puzzle is one task paying 2 stars (a first or a second try), no clean-round bonus.
import { test, expect, type Page } from '@playwright/test';
import { answerRight, answerWrong, fromHook, phaseIs, screenIs, silenceSpeech, snapshot, tapNext } from './support/hook';
import { passWelcomeAsParent } from './support/welcome';

test.setTimeout(120_000);

const OCTOBER = 9;
const DAY_ONE = '2026-10-14';
const DAY_TWO = '2026-10-15';
const PUZZLE_STARS = 2;

const address = (day: string): string => `/?e2eVariant=puzzle&e2eDay=${day}&e2eMonth=10`;

const startE4 = (page: Page, day: string): Promise<void> =>
    passWelcomeAsParent(page, {
        age: '10+',
        stageLabel: 'Klasa 2, II półrocze',
        stage: 'E4',
        month: OCTOBER,
        query: { e2eVariant: 'puzzle', e2eDay: day },
    });

/** Finishes the open puzzle ("Dalej" ends the round) and waits for the save of the round end. */
const finishPuzzle = async (page: Page, wrongFirst: boolean): Promise<void> => {
    await phaseIs(page, 'first');
    if (wrongFirst) {
        await answerWrong(page);
        await phaseIs(page, 'second');
    }
    await answerRight(page);
    await phaseIs(page, 'done');
    await tapNext(page);
    await screenIs(page, 'summary');
    await expect.poll(async () => (await snapshot(page)).save).toMatchObject({ lastReason: 'now', dirty: false });
};

const reopen = async (page: Page, day: string): Promise<void> => {
    await page.goto(address(day));
    await fromHook(page, 'snapshot');
    await screenIs(page, 'task');
};

test('#11 the daily puzzle pays two stars for a second try', async ({ page }) => {
    await silenceSpeech(page);
    await startE4(page, DAY_ONE);
    const start = await snapshot(page);
    expect(start.variant?.kind).toBe('puzzle');
    expect(start.variant?.puzzleId).not.toBeNull();
    await phaseIs(page, 'first');
    await answerWrong(page);
    await phaseIs(page, 'second');
    expect((await snapshot(page)).stars).toBe(start.stars);
    await answerRight(page);
    await phaseIs(page, 'done');
    await expect.poll(async () => (await snapshot(page)).stars).toBe(start.stars + PUZZLE_STARS);
    await expect.poll(async () => (await snapshot(page)).counterText).toBe(String(start.stars + PUZZLE_STARS));
    await tapNext(page);
    await screenIs(page, 'summary');
    const end = await snapshot(page);
    expect(end.summary).toMatchObject({ earned: PUZZLE_STARS });
    expect(end.bonusEarned).toBe(0);
});

test('#2 the same day after a reload gives a minigame, not the puzzle again', async ({ page }) => {
    await silenceSpeech(page);
    await startE4(page, DAY_ONE);
    expect((await snapshot(page)).variant?.kind).toBe('puzzle');
    await finishPuzzle(page, false);
    const before = await snapshot(page);

    await reopen(page, DAY_ONE);
    const after = await snapshot(page);
    expect(after.save?.load).toBe('loaded');
    expect(after.stars).toBe(before.stars);
    // The seam still asks for a puzzle, but the saved day says it was played: a minigame takes the round.
    expect(after.variant).not.toBeNull();
    expect(after.variant?.kind).not.toBe('puzzle');
    expect(after.variant?.puzzleId).toBeNull();
});

test('#11 the next day brings the puzzle back, a different one', async ({ page }) => {
    await silenceSpeech(page);
    await startE4(page, DAY_ONE);
    const first = (await snapshot(page)).variant?.puzzleId;
    expect(first).toBeTruthy();
    await finishPuzzle(page, true);

    await reopen(page, DAY_TWO);
    const next = await snapshot(page);
    expect(next.variant?.kind).toBe('puzzle');
    expect(next.variant?.puzzleId).toBeTruthy();
    expect(next.variant?.puzzleId).not.toBe(first);
});
