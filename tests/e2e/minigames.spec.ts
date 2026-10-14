// Risk #11 (a minigame played with a real finger), S-15 phase 12. The letter tiles, the board field under the FIT scale,
// the hint with a second try and the stars exist only on the canvas, so every answer is a page.touchscreen.tap at a point
// of the hook's targets (the board fields come from the widget's own cells, not from the layout data).
// The month is pinned and the learner starts on E1 through the parent path (no warm-up, no daily-puzzle pool: the puzzle
// is E3-E4 only), so "the fourth round" is a minigame on the real schedule.
// A minigame round pays 1 star per task and no clean-round bonus; a second try still pays; a dice round has 13 throws and
// its end is the minigame done card (the hook's screen stays 'summary'; the card's buttons are targets.doneNext/doneRoom).
// ?e2eVariant=word|dice makes EVERY ordinary round that minigame, so the "next round" of (c) is a new dice round, not an ordinary one.
import { test, expect, type Page } from '@playwright/test';
import { answerRight, answerWrong, phaseIs, playRoundRight, playTaskRight, screenIs, silenceSpeech, snapshot, tapNext, tapTarget, targets } from './support/hook';
import { passWelcomeAsParent } from './support/welcome';

test.setTimeout(150_000);

const OCTOBER = 9;
const ROUND_LENGTH = 5;
const DICE_THROWS = 13;

const startE1 = (page: Page, variant: string | null): Promise<void> =>
    passWelcomeAsParent(page, { age: '10+', stageLabel: 'Klasa 1, I półrocze', stage: 'E1', month: OCTOBER, query: variant === null ? undefined : { e2eVariant: variant } });

test.beforeEach(async ({ page }) => {
    await silenceSpeech(page);
});

test('#11 after three ordinary rounds the fourth is a minigame', async ({ page }) => {
    await startE1(page, null);
    for (let round = 0; round < 3; round++) {
        expect((await snapshot(page)).variant ?? null).toBeNull();
        await playRoundRight(page, ROUND_LENGTH);
        await tapTarget(page, 'nextRound');
        // A mastered step shows its "Nowa umiejętność!" card first; "Dalej" starts the round.
        await expect.poll(async () => (await snapshot(page)).screen).toMatch(/^(task|unlock)$/);
        if ((await snapshot(page)).screen === 'unlock') {
            await tapTarget(page, 'unlockNext');
        }
        await screenIs(page, 'task');
    }
    const fourth = await snapshot(page);
    expect(fourth.variant?.kind).toBe('word');
    expect(fourth.variant?.letters?.every((l) => l === null)).toBe(true);
});

test('#11 Hasło reveals a letter per solved task and a wrong tile gets a hint and a second try', async ({ page }) => {
    await startE1(page, 'word');
    const start = await snapshot(page);
    expect(start.variant?.kind).toBe('word');
    const length = start.variant!.letters!.length;
    expect(length).toBeGreaterThan(1);
    const revealedCount = async (): Promise<number> => (await snapshot(page)).variant!.letters!.filter((l) => l !== null).length;

    // First task: a wrong tile, the second try opens and nothing is uncovered or paid yet.
    await phaseIs(page, 'first');
    await answerWrong(page);
    await phaseIs(page, 'second');
    expect(await revealedCount()).toBe(0);
    expect((await snapshot(page)).stars).toBe(start.stars);
    // The second try is right: one letter, one star (a second try pays; only a retype after the solution does not).
    await answerRight(page);
    await phaseIs(page, 'done');
    await expect.poll(revealedCount).toBe(1);
    await expect.poll(async () => (await snapshot(page)).stars).toBe(start.stars + 1);
    await tapNext(page);

    // The rest on the first try: a letter per task.
    for (let solved = 1; solved < length; solved++) {
        await expect.poll(async () => (await snapshot(page)).index).toBe(solved);
        await playTaskRight(page);
    }
    // The card of the minigame, not the summary page: every letter shows, one star per task, no bonus.
    await screenIs(page, 'summary');
    const end = await snapshot(page);
    expect(end.variant!.letters!.every((l) => l !== null)).toBe(true);
    expect(end.summary).toMatchObject({ earned: length });
    expect(end.bonusEarned).toBe(0);
    expect(end.stars).toBe(start.stars + length);
    expect(end.counterText).toBe(String(start.stars + length));
    const { doneNext, doneRoom } = await targets(page);
    expect(doneNext).not.toBeNull();
    expect(doneRoom).not.toBeNull();
});

test('#11 Zakrywanka covers the tapped field and ends with every field covered', async ({ page }) => {
    await startE1(page, 'dice');
    const start = await snapshot(page);
    expect(start.variant?.kind).toBe('dice');
    expect(start.variant?.covered).toEqual([]);

    const done: number[] = [];
    for (let throwNo = 0; throwNo < DICE_THROWS; throwNo++) {
        await phaseIs(page, 'first');
        const answer = (await snapshot(page)).answer as number;
        await answerRight(page);
        done.push(answer);
        await expect.poll(async () => (await snapshot(page)).variant?.covered).toEqual([...done].sort((a, b) => a - b));
        await phaseIs(page, 'done');
        await tapNext(page);
    }
    await screenIs(page, 'summary');
    const end = await snapshot(page);
    expect(end.variant!.covered).toEqual(Array.from({ length: DICE_THROWS }, (_, i) => i));
    expect(end.summary).toMatchObject({ earned: DICE_THROWS });
    expect(end.bonusEarned).toBe(0);
    expect(end.stars).toBe(start.stars + DICE_THROWS);

    // "Kolejna runda" of the done card starts a fresh round (the seam makes it a new board, nothing covered).
    await tapTarget(page, 'doneNext');
    await screenIs(page, 'task');
    const next = await snapshot(page);
    expect(next.index).toBe(0);
    expect(next.variant?.covered).toEqual([]);
    expect(next.stars).toBe(end.stars);
});
