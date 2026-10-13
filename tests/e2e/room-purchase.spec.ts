// Risk #16 (context/foundation/test-plan.md): buying furniture is only a tap on the rendered room. A cost is taken
// exactly once, on "Wybieram", never when the panel opens, a thumbnail is previewed or the child is short of stars,
// and the balance never goes below zero. The reducer is unit-tested; this spec proves the scene wiring through the
// real touch path. Runs in the chromium-hook project (read-only window.__martynkaE2E). Stars are asserted on the
// registry balance (snapshot.stars); the drawn counter is a secondary check. Costs are read from the hook; only the
// first one (5, the first salon task) is known up front, to play the retyped task that pays nothing.
import { test, expect, type Page } from '@playwright/test';
import { passWelcome } from './support/welcome';
import { answerRight, answerWrong, phaseIs, screenIs, silenceSpeech, snapshot, tapNext, tapScene, tapTarget, targets } from './support/hook';

const ROUND_LENGTH = 5;
const MAX_ROUNDS = 4;

test.setTimeout(120_000);

const room = async (page: Page) => {
    const state = await snapshot(page);
    expect(state.room).toBeTruthy();
    return { state, room: state.room! };
};

/** Solves the open task by the long way (two misses, the solution, the retype): the retype pays no star. */
const solveByRetype = async (page: Page): Promise<void> => {
    await phaseIs(page, 'first');
    await answerWrong(page);
    await phaseIs(page, 'second');
    await answerWrong(page);
    await phaseIs(page, 'solution');
    for (let guard = 0; guard < 10 && (await snapshot(page)).phase === 'solution'; guard++) {
        const before = await snapshot(page);
        await tapTarget(page, 'step');
        await expect.poll(async () => {
            const now = await snapshot(page);
            return now.phase !== 'solution' || now.solutionStep > before.solutionStep;
        }).toBe(true);
    }
    await phaseIs(page, 'retype');
    await answerRight(page);
    await phaseIs(page, 'done');
};

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

/** Plays the remaining tasks of the round, to the summary. */
const finishRound = async (page: Page): Promise<void> => {
    for (let guard = 0; guard < ROUND_LENGTH && (await snapshot(page)).screen === 'task'; guard++) {
        await cleanTask(page);
    }
    await screenIs(page, 'summary');
};

test('#16 a confirmed choice deducts its cost exactly once; opening, cancelling, previewing or a tap while short deducts nothing', async ({ page }) => {
    await silenceSpeech(page);
    await passWelcome(page);
    await phaseIs(page, 'first');

    // A task solved by the retype pays 0 stars: the child is in the salon with an empty purse.
    await solveByRetype(page);
    expect((await snapshot(page)).stars).toBe(0);
    await tapTarget(page, 'roomSwitch');
    await screenIs(page, 'room');
    const poor = await room(page);
    expect(poor.room.affordable).toBe(false);
    expect(poor.room.buttonText).toContain('masz 0/5');
    expect(poor.room.currentTask?.cost).toBe(5);

    // Short of stars the task button sends the child back to the tasks; nothing is taken, nothing goes negative.
    await tapTarget(page, 'taskButton');
    await screenIs(page, 'task');
    expect((await snapshot(page)).stars).toBe(0);

    // Earn enough for the first two renovation tasks (a clean round pays 5 + 2): without that the double tap below
    // could not buy twice and the test would pass empty.
    // The second task, "paint-walls", costs 6 (src/data/rooms.ts); the first cost was read from the room above.
    const needed = poor.room.currentTask!.cost + 6;
    await tapNext(page);
    for (let round = 0; round < MAX_ROUNDS; round++) {
        await finishRound(page);
        if ((await snapshot(page)).stars >= needed) {
            break;
        }
        await tapTarget(page, 'nextRound');
        // A "Nowa umiejętność!" card may come before the next round.
        await expect.poll(async () => (await snapshot(page)).screen).toMatch(/task|unlock/);
        if ((await snapshot(page)).screen === 'unlock') {
            await tapTarget(page, 'unlockNext');
        }
        await screenIs(page, 'task');
    }
    const S = (await snapshot(page)).stars;
    expect(S).toBeGreaterThanOrEqual(needed); // precondition: the purse can buy both tasks
    expect((await snapshot(page)).summary?.roomHighlighted).toBe(true);

    await tapTarget(page, 'toRoom');
    await screenIs(page, 'room');
    const rich = await room(page);
    expect(rich.room.affordable).toBe(true);
    const cost = rich.room.currentTask!.cost;
    const nextTaskId = 'paint-walls';
    expect(S).toBeGreaterThanOrEqual(cost * 2 + 1);

    // Opening the panel takes nothing.
    await tapTarget(page, 'taskButton');
    await expect.poll(async () => (await room(page)).room.panel.kind).toBe('open');
    expect((await snapshot(page)).stars).toBe(S);

    // Cancelling takes nothing and leaves the task undone.
    await tapTarget(page, 'close');
    await expect.poll(async () => (await room(page)).room.panel.kind).toBe('closed');
    expect((await snapshot(page)).stars).toBe(S);
    expect((await room(page)).room.tasksDone).toBe(0);

    // "Wybieram" with no variant previewed buys nothing and keeps the panel open.
    await tapTarget(page, 'taskButton');
    await expect.poll(async () => (await room(page)).room.panel.kind).toBe('open');
    await tapTarget(page, 'choose');
    expect((await snapshot(page)).stars).toBe(S);
    expect((await room(page)).room.panel.kind).toBe('open');
    expect((await room(page)).room.tasksDone).toBe(0);

    // Previewing a thumbnail shows it in the room but takes nothing.
    const thumbs = (await targets(page)).thumbs ?? [];
    expect(thumbs.length).toBe(3);
    await tapScene(page, thumbs[1]);
    await expect.poll(async () => {
        const panel = (await room(page)).room.panel;
        return panel.kind === 'open' ? panel.preview : null;
    }).toBe(1);
    expect((await snapshot(page)).stars).toBe(S);

    // Two quick taps on "Wybieram": one purchase. The second tap lands on a closed panel (or the next task's button).
    const choose = (await targets(page)).choose;
    expect(choose).not.toBeNull();
    await tapScene(page, choose!);
    await tapScene(page, choose!);
    await expect.poll(async () => (await room(page)).room.tasksDone).toBeGreaterThanOrEqual(1);
    const after = await room(page);
    expect(after.state.stars).toBe(S - cost);
    expect(after.room.tasksDone).toBe(1);
    expect(after.room.chosen.floor).toBe(1);
    expect(after.room.panel.kind).toBe('closed');
    expect(after.room.currentTask?.id).toBe(nextTaskId);
    expect(after.state.counterText).toBe(String(S - cost));
});
