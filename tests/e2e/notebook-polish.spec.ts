// Risks #11 (round by touch) and #12 (first launch by touch) of context/foundation/test-plan.md, for the notebook polish
// (change notebook-polish): the motion added to the round (entrance stagger, star flight, summary pops, chunky press) and
// the blurred salon behind the notebook must never stand between the child's finger and the game. Runs in the chromium-hook
// project (read-only window.__martynkaE2E). Taps go through page.touchscreen.tap at hook targets; the flight of a star
// lasts about 850 ms, so a counter read right after the task settles tells whether the number waited for the landing.
import { test, expect, type Page } from '@playwright/test';
import { passWelcome, openWelcome, passWelcomeAsChild } from './support/welcome';
import { answerRight, phaseIs, screenIs, silenceSpeech, snapshot, tapNext, tapTarget } from './support/hook';

const ROUND_LENGTH = 5;
const SALON_PURCHASE_STARS = '5'; // the renovation stage costs 5: enough for one tap in the room

test.setTimeout(90_000);

test.beforeEach(async ({ page }) => {
    await silenceSpeech(page);
});

/** Plays the open task right on the first try and presses "Dalej" (ends on the next task or on the summary). */
const cleanTask = async (page: Page): Promise<void> => {
    const before = (await snapshot(page)).index;
    await phaseIs(page, 'first');
    await answerRight(page);
    await tapNext(page);
    await expect.poll(async () => {
        const now = await snapshot(page);
        return now.screen === 'summary' || now.index === before + 1;
    }).toBe(true);
};

const playRound = async (page: Page): Promise<void> => {
    for (let guard = 0; guard < ROUND_LENGTH && (await snapshot(page)).screen === 'task'; guard++) {
        await cleanTask(page);
    }
    await screenIs(page, 'summary');
};

test('#12 the welcome screen stands over the salon backdrop and an age tap starts the game', async ({ page }) => {
    await openWelcome(page, 9);
    await expect.poll(async () => (await snapshot(page)).backdrop?.mode).toBe('salon');
    expect((await snapshot(page)).backdrop!.captures).toBeGreaterThan(0);
    await passWelcomeAsChild(page, 6, 9);
    expect((await snapshot(page)).screen).toBe('task');
});

test('#11 the counter shows the new total at once, with motion on, while the star is still flying', async ({ page }) => {
    // Age 6 plays E1, the stage of answer tiles: the first tap lands on a tile during the entrance of the task.
    await passWelcomeAsChild(page, 6, 9);
    await phaseIs(page, 'first');
    expect((await snapshot(page)).input).toBe('tiles');
    expect((await snapshot(page)).counterText).toBe('0');
    await answerRight(page);
    await phaseIs(page, 'done');
    // One read, no waiting: the flight lasts 850 ms and has not landed yet.
    expect((await snapshot(page)).counterText).toBe('1');
});

test('#11 the summary buttons answer the first tap, while the stars pop', async ({ page }) => {
    await passWelcome(page, { e2eVariant: 'off' });
    await playRound(page);
    await tapTarget(page, 'nextRound');
    await screenIs(page, 'task');
    await phaseIs(page, 'first');
    expect((await snapshot(page)).index).toBe(0);
    expect((await snapshot(page)).starsTotal).toBe(ROUND_LENGTH + 2);
});

test('#11 the backdrop is captured again after a purchase in the room', async ({ page }) => {
    await passWelcome(page, { e2eStars: SALON_PURCHASE_STARS, e2eVariant: 'off' });
    await phaseIs(page, 'first');
    const before = (await snapshot(page)).backdrop;
    expect(before?.mode).toBe('salon');
    await answerRight(page);
    await phaseIs(page, 'done');
    await tapTarget(page, 'roomSwitch');
    await screenIs(page, 'room');
    await tapTarget(page, 'taskButton');
    await expect.poll(async () => (await snapshot(page)).room?.tasksDone).toBe(1);
    await tapTarget(page, 'resume');
    await screenIs(page, 'task');
    await expect.poll(async () => (await snapshot(page)).backdrop?.captures).toBeGreaterThan(before!.captures);
    expect((await snapshot(page)).backdrop!.mode).toBe('salon');
});

test('#11 without the salon pictures the page is plain and the round still plays', async ({ page }) => {
    await passWelcome(page, { e2eArt: 'room', e2eVariant: 'off' });
    await phaseIs(page, 'first');
    expect((await snapshot(page)).backdrop?.mode).toBe('plain');
    await playRound(page);
    expect((await snapshot(page)).starsTotal).toBe(ROUND_LENGTH + 2);
});

test('#11 with reduced motion a full round pays the same stars and the task font is loaded', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await passWelcome(page, { e2eVariant: 'off' });
    await phaseIs(page, 'first');
    await answerRight(page);
    await phaseIs(page, 'done');
    expect((await snapshot(page)).counterText).toBe('1');
    await tapNext(page);
    await expect.poll(async () => (await snapshot(page)).index).toBe(1);
    for (let guard = 0; guard < ROUND_LENGTH - 1 && (await snapshot(page)).screen === 'task'; guard++) {
        await cleanTask(page);
    }
    await screenIs(page, 'summary');
    const end = await snapshot(page);
    expect(end.summary).toMatchObject({ earned: ROUND_LENGTH + 2, bonus: 2 });
    expect(end.counterText).toBe(String(ROUND_LENGTH + 2));
    expect(end.fontHealth).toBe('loaded');
});
