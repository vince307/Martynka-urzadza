// Risk #11 (context/foundation/test-plan.md): the round logic is unit-tested, but the child
// plays it through the real touch path (Scale.FIT mapping, tiles, keypad, "Dalej"). Runs in
// the chromium-hook project against the e2e build that carries the read-only hook
// (window.__martynkaE2E). The hook says where things are and what the state is; every tap
// goes through page.touchscreen.tap. Expected stars come from the PRD (FR-006/FR-007):
// 1 star for a correct first or second try, 0 for the retype, +2 for a round without a
// mistake, never lost. The round ends on the summary screen ("Kolejna runda", "Do pokoju");
// the room is entered from there or from the HUD switch between tasks and left with
// "Wróć do notesu". The star total is read from the text the HUD counter draws.
import { test, expect, type Page } from '@playwright/test';
import { passWelcome } from './support/welcome';
import { answerRight, answerWrong, phaseIs, screenIs, silenceSpeech, snapshot, tapNext, tapScene, targets } from './support/hook';

const ROUND_LENGTH = 5;

/** Plays the open task correctly on the first try and moves on. */
const cleanTask = async (page: Page): Promise<void> => {
    const before = (await snapshot(page)).index;
    await phaseIs(page, 'first');
    await answerRight(page);
    await tapNext(page);
    if (before + 1 < ROUND_LENGTH) {
        await expect.poll(async () => (await snapshot(page)).index).toBe(before + 1);
    }
};

// One canvas at a time: three software-rendered 1920x1080 Phaser pages in parallel starve each
// other's frame loop and make taps time out. Tests stay independent (fresh context each).
test.describe.configure({ mode: 'serial' });
test.setTimeout(60_000);

test.beforeEach(async ({ page }) => {
    // The narrator button is not under test here: a device without any voice keeps it hidden,
    // whatever voices the machine running the test happens to have.
    await silenceSpeech(page);
    await passWelcome(page);
    await expect.poll(async () => (await snapshot(page)).phase).toBe('first');
});

test('#11 a clean round of 5 tapped tasks pays a star each plus the bonus, shown on the summary', async ({ page }) => {
    for (let i = 0; i < ROUND_LENGTH; i++) {
        await cleanTask(page);
        if (i < ROUND_LENGTH - 1) {
            expect((await snapshot(page)).starsTotal).toBe(i + 1);
        }
    }
    await screenIs(page, 'summary');
    const end = await snapshot(page);
    expect(end.finished).toBe(true);
    expect(end.outcomes).toEqual(Array(ROUND_LENGTH).fill('first'));
    expect(end.summary).toMatchObject({ earned: ROUND_LENGTH + 2, bonus: 2, stars: Array(ROUND_LENGTH).fill(true) });
    expect(end.starsTotal).toBe(ROUND_LENGTH + 2);
    expect(end.counterText).toBe(String(ROUND_LENGTH + 2));

    // "Kolejna runda": a fresh round, the total is kept.
    const { nextRound } = await targets(page);
    expect(nextRound).not.toBeNull();
    await tapScene(page, nextRound!);
    await screenIs(page, 'task');
    await phaseIs(page, 'first');
    const again = await snapshot(page);
    expect(again.index).toBe(0);
    expect(again.finished).toBe(false);
    expect(again.starsTotal).toBe(ROUND_LENGTH + 2);
    expect(again.counterText).toBe(String(ROUND_LENGTH + 2));
});

test('#11 a wrong tap gives a second try that still earns the star, but no bonus', async ({ page }) => {
    await answerWrong(page);
    await phaseIs(page, 'second');
    expect((await snapshot(page)).starsTotal).toBe(0); // a mistake takes nothing and gives nothing yet
    await answerRight(page);
    await phaseIs(page, 'done');
    expect((await snapshot(page)).starsTotal).toBe(1);
    expect((await snapshot(page)).outcomes[0]).toBe('second');
    await tapNext(page);
    await expect.poll(async () => (await snapshot(page)).index).toBe(1);
    for (let i = 1; i < ROUND_LENGTH; i++) {
        await cleanTask(page);
    }
    await screenIs(page, 'summary');
    const end = await snapshot(page);
    expect(end.summary).toMatchObject({ earned: ROUND_LENGTH, bonus: 0, stars: Array(ROUND_LENGTH).fill(true) });
    expect(end.starsTotal).toBe(ROUND_LENGTH);
    expect(end.counterText).toBe(String(ROUND_LENGTH));
});

test('#11 two wrong taps lead through the solution to a retype that pays no star', async ({ page }) => {
    await answerWrong(page);
    await phaseIs(page, 'second');
    await answerWrong(page);
    await phaseIs(page, 'solution');
    // Walk the steps until the last one ("Już wiem") hands over to the retype.
    // The step counter in the hook proves each tap was taken before the next one.
    for (let guard = 0; guard < 10 && (await snapshot(page)).phase === 'solution'; guard++) {
        const { step } = await targets(page);
        expect(step).not.toBeNull();
        const before = await snapshot(page);
        await tapScene(page, step!);
        await expect.poll(async () => {
            const now = await snapshot(page);
            return now.phase !== 'solution' || now.solutionStep > before.solutionStep;
        }).toBe(true);
    }
    await phaseIs(page, 'retype');
    await answerRight(page);
    await phaseIs(page, 'done');
    const after = await snapshot(page);
    expect(after.outcomes[0]).toBe('retype');
    expect(after.starsTotal).toBe(0); // nothing for the retyped task, nothing taken away
    expect(after.counterText).toBe('0');
    await tapNext(page);
    for (let i = 1; i < ROUND_LENGTH; i++) {
        await cleanTask(page);
    }
    await screenIs(page, 'summary');
    const end = await snapshot(page);
    expect(end.summary).toMatchObject({ earned: ROUND_LENGTH - 1, bonus: 0, stars: [false, true, true, true, true] });
    expect(end.starsTotal).toBe(ROUND_LENGTH - 1);
    expect(end.counterText).toBe(String(ROUND_LENGTH - 1));
});

test('#11 the room is reached from the HUD between tasks and from the summary, and both ways lead back to the same screen', async ({ page }) => {
    // The HUD switch is hidden while the child solves: first try and second try.
    expect((await targets(page)).roomSwitch).toBeNull();
    await answerWrong(page);
    await phaseIs(page, 'second');
    expect((await targets(page)).roomSwitch).toBeNull();
    await answerRight(page);
    await phaseIs(page, 'done');

    // After a correct answer it shows; a tap goes to the room, which hides it and keeps the total.
    await expect.poll(async () => (await targets(page)).roomSwitch).not.toBeNull();
    await tapScene(page, (await targets(page)).roomSwitch!);
    await screenIs(page, 'room');
    const inRoom = await snapshot(page);
    expect(inRoom.counterText).toBe('1');
    expect((await targets(page)).roomSwitch).toBeNull();

    // "Wróć do notesu": the same round, same task, still waiting for "Dalej".
    const { resume } = await targets(page);
    expect(resume).not.toBeNull();
    await tapScene(page, resume!);
    await screenIs(page, 'task');
    const back = await snapshot(page);
    expect(back.phase).toBe('done');
    expect(back.index).toBe(0);
    expect(back.outcomes[0]).toBe('second');
    expect(back.starsTotal).toBe(1);
    await expect.poll(async () => (await targets(page)).roomSwitch).not.toBeNull();
    await tapNext(page);
    await expect.poll(async () => (await snapshot(page)).index).toBe(1);
    expect((await targets(page)).roomSwitch).toBeNull();

    // Finish the round (a mistake on the first task: no bonus), then "Do pokoju" from the summary.
    for (let i = 1; i < ROUND_LENGTH; i++) {
        await cleanTask(page);
    }
    await screenIs(page, 'summary');
    const summary = await snapshot(page);
    expect(summary.summary).toMatchObject({ earned: ROUND_LENGTH, bonus: 0 });
    const { toRoom } = await targets(page);
    expect(toRoom).not.toBeNull();
    await tapScene(page, toRoom!);
    await screenIs(page, 'room');
    expect((await snapshot(page)).counterText).toBe(String(ROUND_LENGTH));
    await tapScene(page, (await targets(page)).resume!);
    await screenIs(page, 'summary');
    const returned = await snapshot(page);
    expect(returned.summary).toEqual(summary.summary);
    expect(returned.starsTotal).toBe(ROUND_LENGTH);
    expect(returned.counterText).toBe(String(ROUND_LENGTH));
});
