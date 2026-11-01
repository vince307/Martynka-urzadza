// Shared by the salon specs: buys every renovation task of the salon so the "Pokój gotowy!" card is up.
import { expect, type Page } from '@playwright/test';
import { passWelcome } from './welcome';
import { answerRight, answerWrong, phaseIs, screenIs, silenceSpeech, snapshot, tapScene, tapTarget, targets } from './hook';
import { SALON } from '../../../src/data/rooms';

export const room = async (page: Page) => {
    const state = await snapshot(page);
    expect(state.room).toBeTruthy();
    return state.room!;
};

/** Solves the open task by the long way (two misses, the solution, the retype): the retype pays no star. */
export const solveByRetype = async (page: Page): Promise<void> => {
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

/** Buys every renovation task of the salon (first look each) and waits for the "Pokój gotowy!" card. */
export const finishSalon = async (page: Page, query: Record<string, string>): Promise<void> => {
    const total = SALON.tasks.reduce((sum, task) => sum + task.cost, 0);
    await silenceSpeech(page);
    await passWelcome(page, { e2eStars: String(total), e2eVariant: 'off', ...query });
    await solveByRetype(page);
    await tapTarget(page, 'roomSwitch');
    await screenIs(page, 'room');
    // Pictures that arrive late must not decide the choice: wait until the room is up before buying.
    await expect.poll(async () => (await snapshot(page)).room?.currentTask?.id, { timeout: 30_000 }).toBeTruthy();
    for (const task of SALON.tasks) {
        const before = (await room(page)).tasksDone;
        await tapTarget(page, 'taskButton');
        if (task.kind !== 'stage') {
            await expect.poll(async () => (await room(page)).panel.kind, { timeout: 15_000 }).toBe('open');
            const thumbs = (await targets(page)).thumbs ?? [];
            expect(thumbs.length).toBe(3);
            await tapScene(page, thumbs[0]);
            await expect.poll(async () => {
                const panel = (await room(page)).panel;
                return panel.kind === 'open' ? panel.preview : null;
            }, { timeout: 15_000 }).toBe(0);
            await tapTarget(page, 'choose');
        }
        await expect.poll(async () => (await room(page)).tasksDone, { timeout: 15_000 }).toBe(before + 1);
    }
    await expect.poll(async () => (await room(page)).card, { timeout: 15_000 }).not.toBeNull();
};


/** Buys every renovation task of `def` (first look each, "Wybieram") in the open room; polls `tasksDone` after each. The card is the caller's to read. */
export const buyAllTasks = async (page: Page, def: { tasks: readonly { kind: string }[] }): Promise<void> => {
    for (const task of def.tasks) {
        const before = (await room(page)).tasksDone;
        await tapTarget(page, 'taskButton');
        if (task.kind !== 'stage') {
            await expect.poll(async () => (await room(page)).panel.kind, { timeout: 15_000 }).toBe('open');
            const thumbs = (await targets(page)).thumbs ?? [];
            expect(thumbs.length).toBe(3);
            await tapScene(page, thumbs[0]);
            await expect.poll(async () => {
                const panel = (await room(page)).panel;
                return panel.kind === 'open' ? panel.preview : null;
            }, { timeout: 15_000 }).toBe(0);
            await tapTarget(page, 'choose');
        }
        await expect.poll(async () => (await room(page)).tasksDone, { timeout: 15_000 }).toBe(before + 1);
    }
};
