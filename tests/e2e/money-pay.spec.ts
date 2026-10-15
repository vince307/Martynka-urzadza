// Risk #11 for paying with coins (S-14d phase 11): the third branch of the 'drag' mode. A coin is dragged from the tray into the
// wallet (scale FIT, so the hook's interior points are the only honest aim), a tap on a coin in the wallet takes it out, a cancelled
// touch never places a coin, and "jak najmniej monet" refuses a wallet that adds up but holds more coins than needed.
// ?e2eSkills (e2e build only) forces the skill and e2eVariant=off keeps the round ordinary. Parent path on E1 and E2 (age 10+
// proposes E6, so both are overrides: no warm-up). The task kind (pay / fewest, with or without a note) is random, so a test that
// needs one plays other tasks right until it comes up. Only polls on the snapshot, no clock.
import { test, expect, type Page } from '@playwright/test';
import { answerRight, answerWrong, cancelTouch, dragTouch, payCoins, phaseIs, screenIs, silenceSpeech, snapshot, tapNext, tapScene, targets, type Snapshot } from './support/hook';
import { passWelcomeAsParent } from './support/welcome';

const ROUND_LENGTH = 5;
const MAX_TASKS = 40;

const open = async (page: Page, stageLabel: string, stage: string, skill: string): Promise<void> => {
    await silenceSpeech(page);
    await passWelcomeAsParent(page, {
        age: '10+',
        stageLabel,
        stage,
        month: 9,
        query: { e2eSkills: skill, e2eVariant: 'off' },
    });
    await phaseIs(page, 'first');
};

const isFewest = (s: Snapshot): boolean => (s.visual as unknown as { pay?: { fewest: boolean } } | null)?.pay?.fewest === true;

/** Plays tasks right, round after round, until the open task satisfies `want`. */
const reachTask = async (page: Page, want: (s: Snapshot) => boolean): Promise<Snapshot> => {
    for (let guard = 0; guard < MAX_TASKS; guard++) {
        await expect.poll(async () => (await snapshot(page)).screen).not.toBe('welcome');
        const state = await snapshot(page);
        if (state.screen === 'summary') {
            const { nextRound } = await targets(page);
            expect(nextRound).not.toBeNull();
            await tapScene(page, nextRound!);
            continue;
        }
        if (state.screen === 'unlock') {
            const { unlockNext } = await targets(page);
            await tapScene(page, unlockNext!);
            continue;
        }
        await phaseIs(page, 'first');
        const task = await snapshot(page);
        if (want(task)) return task;
        await answerRight(page);
        await phaseIs(page, 'done');
        await tapNext(page);
    }
    throw new Error(`no task matching the wish in ${MAX_TASKS} tasks`);
};

test('#11 coins dragged into the wallet pay the amount and earn a star', async ({ page }) => {
    test.setTimeout(60_000);
    await open(page, 'Klasa 1, I półrocze', 'E1', 'E1.11.money_pay_10');
    for (let i = 0; i < ROUND_LENGTH; i++) {
        await expect.poll(async () => (await snapshot(page)).index).toBe(i);
        await phaseIs(page, 'first');
        const task = await snapshot(page);
        expect(task.input).toBe('drag');
        expect(task.dragMode).toBe('coins');
        expect(task.wallet).toEqual([]);
        await answerRight(page);
        await phaseIs(page, 'done');
        const done = await snapshot(page);
        expect(done.wallet).toEqual(task.answer);
        expect(done.outcomes[i]).toBe('first');
        expect(done.starsEarned).toBe(i + 1);
        await tapNext(page);
    }
    await screenIs(page, 'summary');
    expect((await snapshot(page)).summary).toMatchObject({ earned: ROUND_LENGTH + 2, bonus: 2, stars: Array(ROUND_LENGTH).fill(true) });
});

test('#11 a wallet with too many coins in the fewest-coins task gives a hint, a retype pays no star', async ({ page }) => {
    test.setTimeout(90_000);
    await open(page, 'Klasa 1, I półrocze', 'E1', 'E1.11.money_pay_10');
    const task = await reachTask(page, isFewest);
    const answer = task.answer as number[];
    const stars = task.starsEarned;

    // The right sum, but the biggest coin changed into 1 zł coins: more coins than the shortest wallet.
    const spread = [...Array.from({ length: answer[0] / 100 }, () => 100), ...answer.slice(1)];
    expect(spread.length).toBeGreaterThan(answer.length);
    await payCoins(page, spread);
    await tapScene(page, (await targets(page)).coins!.ok!);
    await phaseIs(page, 'second');
    const missed = await snapshot(page);
    expect(missed.starsEarned).toBe(stars);

    // A wrong wallet stays on the table: the child takes coins out by touch until it is empty, then pays properly.
    for (let left = missed.wallet!.length; left > 0; left--) {
        const { coins } = await targets(page);
        await tapScene(page, coins!.coins[0]);
        await expect.poll(async () => (await snapshot(page)).wallet?.length).toBe(left - 1);
    }
    await answerRight(page);
    await phaseIs(page, 'done');
    const done = await snapshot(page);
    expect(done.outcomes[done.index]).toBe('second');
    expect(done.starsEarned).toBe(stars + 1);
    await tapNext(page);

    // Two misses lead through the solution to a retype that pays no star.
    await phaseIs(page, 'first');
    const before = await snapshot(page);
    await answerWrong(page);
    await phaseIs(page, 'second');
    for (let left = (await snapshot(page)).wallet!.length; left > 0; left--) {
        await tapScene(page, (await targets(page)).coins!.coins[0]);
        await expect.poll(async () => (await snapshot(page)).wallet?.length).toBe(left - 1);
    }
    await answerWrong(page);
    await phaseIs(page, 'solution');
    for (let guard = 0; guard < 10 && (await snapshot(page)).phase === 'solution'; guard++) {
        const step = (await targets(page)).step;
        expect(step).not.toBeNull();
        const was = await snapshot(page);
        await tapScene(page, step!);
        await expect.poll(async () => {
            const now = await snapshot(page);
            return now.phase !== 'solution' || now.solutionStep > was.solutionStep;
        }).toBe(true);
    }
    await phaseIs(page, 'retype');
    for (let left = (await snapshot(page)).wallet!.length; left > 0; left--) {
        await tapScene(page, (await targets(page)).coins!.coins[0]);
        await expect.poll(async () => (await snapshot(page)).wallet?.length).toBe(left - 1);
    }
    await answerRight(page);
    await phaseIs(page, 'done');
    const after = await snapshot(page);
    expect(after.outcomes[before.index]).toBe('retype');
    expect(after.starsEarned).toBe(before.starsEarned);
});

test('#11 a cancelled drag places no coin and a tap on a wallet coin takes it out', async ({ page }) => {
    test.setTimeout(60_000);
    await open(page, 'Klasa 1, I półrocze', 'E1', 'E1.11.money_pay_10');
    const { coins } = await targets(page);
    expect(coins?.tray['coin-2zl']).toBeTruthy();
    expect(coins?.wallet).toBeTruthy();
    expect((await snapshot(page)).wallet).toEqual([]);

    // The system cancels the touch over the wallet: nothing is placed.
    await cancelTouch(page, coins!.tray['coin-2zl']!, coins!.wallet!);
    // The next real drag is processed after the cancelled one, so a wallet of exactly this one coin proves the cancel placed none.
    await dragTouch(page, coins!.tray['coin-5zl']!, coins!.wallet!, 3);
    await expect.poll(async () => (await snapshot(page)).wallet).toEqual([500]);

    // A tap on the coin in the wallet takes it out again.
    const placed = (await targets(page)).coins!.coins;
    expect(placed).toHaveLength(1);
    await tapScene(page, placed[0]);
    await expect.poll(async () => (await snapshot(page)).wallet).toEqual([]);
    const state = await snapshot(page);
    expect(state.phase).toBe('first');
    expect(state.starsEarned).toBe(0);
});

test('#11 the 10 zł note is part of the E2 tray and pays like a coin', async ({ page }) => {
    test.setTimeout(90_000);
    await open(page, 'Klasa 1, II półrocze', 'E2', 'E2.2.money_pay_20');
    const task = await reachTask(page, (s) => (s.answer as number[]).includes(1000));
    const { coins } = await targets(page);
    expect(Object.keys(coins!.tray).sort()).toEqual(['coin-1zl', 'coin-2zl', 'coin-5zl', 'note-10zl']);
    const stars = task.starsEarned;
    await answerRight(page);
    await phaseIs(page, 'done');
    const done = await snapshot(page);
    expect(done.wallet).toContain(1000);
    expect(done.outcomes[done.index]).toBe('first');
    expect(done.starsEarned).toBe(stars + 1);
});
