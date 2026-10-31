// Risk #16 of context/foundation/test-plan.md, change salon-extra-slots (S-16d): the five appended renovation tasks.
// Before their purchase the lamp, the plant and the pouf show their OLD look (snapshot.room.shown, the layer record of what
// each slot draws, not pixels); a confirmed choice ("Wybieram") spends the task's cost exactly once. Runs in the
// chromium-hook project; stars come from the e2e-only ?e2eStars seam, ?e2eVariant=off keeps a puzzle or minigame out.
import { test, expect, type Page } from '@playwright/test';
import { passWelcome } from './support/welcome';
import { answerRight, answerWrong, holdTouch, phaseIs, readHook, screenIs, silenceSpeech, snapshot, tapScene, tapTarget, targets } from './support/hook';
import { SALON } from '../../src/data/rooms';
import { pl } from '../../src/data/pl';
import { balance } from '../../src/data/balance';

test.setTimeout(180_000);
test.use({ serviceWorkers: 'block' });

const OLD_TASKS = 7;   // the stage and six furniture tasks of the salon as S-16c shipped it
const NEW_SLOTS = ['curtains', 'wall-shelf', 'lamp-table', 'plant-left', 'pouf'];

const room = async (page: Page) => {
    const state = await snapshot(page);
    expect(state.room).toBeTruthy();
    return state.room!;
};

/** Solves the open task by the long way so that the room switch appears. */
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

/** Opens the variant panel of the current task and chooses variant `look` (preview first); returns nothing, waits for the purchase. */
const buy = async (page: Page, look: 0 | 1 | 2): Promise<void> => {
    const before = (await room(page)).tasksDone;
    await tapTarget(page, 'taskButton');
    await expect.poll(async () => (await room(page)).panel.kind, { timeout: 15_000 }).toBe('open');
    const thumbs = (await targets(page)).thumbs ?? [];
    expect(thumbs.length).toBe(3);
    await tapScene(page, thumbs[look]);
    await expect.poll(async () => {
        const panel = (await room(page)).panel;
        return panel.kind === 'open' ? panel.preview : null;
    }, { timeout: 15_000 }).toBe(look);
    await tapTarget(page, 'choose');
    await expect.poll(async () => (await room(page)).tasksDone, { timeout: 15_000 }).toBe(before + 1);
};

/** Starts with the whole salon's price in stars, enters the room and buys the stage and the six old tasks (first look each). */
const salonWithOldTasks = async (page: Page): Promise<void> => {
    const total = SALON.tasks.reduce((sum, task) => sum + task.cost, 0);
    await silenceSpeech(page);
    await passWelcome(page, { e2eStars: String(total), e2eVariant: 'off' });
    await solveByRetype(page);
    await tapTarget(page, 'roomSwitch');
    await screenIs(page, 'room');
    await expect.poll(async () => (await room(page)).currentTask?.id, { timeout: 30_000 }).toBeTruthy();
    for (const task of SALON.tasks.slice(0, OLD_TASKS)) {
        if (task.kind === 'stage') {
            const before = (await room(page)).tasksDone;
            await tapTarget(page, 'taskButton');
            await expect.poll(async () => (await room(page)).tasksDone, { timeout: 15_000 }).toBe(before + 1);
        } else {
            await buy(page, 0);
        }
    }
};

test('#16 S-16d the lamp, plant and pouf show their old look until »Wymień« buys a new one', async ({ page }) => {
    await salonWithOldTasks(page);
    const state = await room(page);
    expect(state.tasksDone).toBe(OLD_TASKS);
    for (const slot of ['lamp-table', 'plant-left', 'pouf']) {
        expect(state.shown[slot]).toBe(0);
        expect(state.chosen[slot]).toBeUndefined();
    }
    for (const slot of ['curtains', 'wall-shelf']) {
        expect(state.shown[slot]).toBeUndefined();
        expect(state.chosen[slot]).toBeUndefined();
    }
    expect(state.currentTask?.id).toBe('hang-curtains');
    expect(state.buttonText).toContain(pl.room.tasks.hangCurtains);
});

test('#16 S-16d each of the five new tasks costs its price once, after »Wybieram«', async ({ page }) => {
    await salonWithOldTasks(page);
    for (const slot of NEW_SLOTS) {
        const task = SALON.tasks.find((t) => t.kind === 'slot' && t.slot === slot)!;
        const starsBefore = (await snapshot(page)).stars;
        expect((await room(page)).currentTask?.id).toBe(task.id);

        await tapTarget(page, 'taskButton');
        await expect.poll(async () => (await room(page)).panel.kind, { timeout: 15_000 }).toBe('open');
        expect((await snapshot(page)).stars).toBe(starsBefore);

        const thumbs = (await targets(page)).thumbs ?? [];
        expect(thumbs.length).toBe(3);
        await tapScene(page, thumbs[1]);
        await expect.poll(async () => (await readHook(page, 'snapshot'))?.room?.shown[slot], { timeout: 15_000 }).toBe(1);
        expect((await snapshot(page)).stars).toBe(starsBefore);
        expect((await room(page)).chosen[slot]).toBeUndefined();

        await tapTarget(page, 'choose');
        await expect.poll(async () => (await room(page)).chosen[slot], { timeout: 15_000 }).toBe(1);
        const after = await room(page);
        expect(after.shown[slot]).toBe(1);
        expect((await snapshot(page)).stars).toBe(starsBefore - task.cost);
    }
    const end = await room(page);
    expect(end.done).toBe(true);
    await expect.poll(async () => (await room(page)).card, { timeout: 15_000 }).not.toBeNull();
});

test('#2 FR-019 S-16d a salon finished with seven tasks gets the five new ones and the done card again at the twelfth', async ({ page }) => {
    await salonWithOldTasks(page);
    const saved = await room(page);
    expect(saved.tasksDone).toBe(OLD_TASKS);
    const chosenBefore = saved.chosen;
    // A purchase is saved at once (not by the debounce); only then does a reload prove the SAVE.
    await expect.poll(async () => (await snapshot(page)).save, { timeout: 15_000 }).toMatchObject({ lastReason: 'now', dirty: false });

    await page.reload();
    await screenIs(page, 'task');
    expect((await snapshot(page)).save?.load).toBe('loaded');
    await solveByRetype(page);
    await tapTarget(page, 'roomSwitch');
    await screenIs(page, 'room');
    await expect.poll(async () => (await room(page)).currentTask?.id, { timeout: 30_000 }).toBe('hang-curtains');

    const reopened = await room(page);
    expect(reopened.tasksDone).toBe(OLD_TASKS);
    expect(reopened.done).toBe(false);
    expect(reopened.card).toBeNull();
    expect(reopened.modeText).toBeNull();
    expect(reopened.chosen).toEqual(chosenBefore);

    for (const task of SALON.tasks.slice(OLD_TASKS)) {
        await buy(page, 0);
        if (task !== SALON.tasks[SALON.tasks.length - 1]) expect((await room(page)).card).toBeNull();
    }
    await expect.poll(async () => (await room(page)).card, { timeout: 15_000 }).not.toBeNull();
    const done = await room(page);
    expect(done.done).toBe(true);
    expect(done.card?.items[0]).toMatchObject({ kind: 'room', id: 'salon', done: true });
    expect(done.card?.items[1]).toMatchObject({ kind: 'room', id: 'kitchen', done: false, unlocked: true });

    // "Dalej" moves the child into the kitchen (S-22): the card closes and the kitchen, not yet furnished, has no change mode.
    await tapTarget(page, 'cardNext');
    await expect.poll(async () => (await room(page)).card, { timeout: 15_000 }).toBeNull();
    await expect.poll(async () => (await snapshot(page)).currentRoom, { timeout: 15_000 }).toBe('kitchen');
    expect((await room(page)).modeText).toBeNull();
});

test('#16 S-16d the curtains reaching above the scene are held for a free change', async ({ page }) => {
    await salonWithOldTasks(page);
    await buy(page, 0);
    const bought = await room(page);
    expect(bought.chosen.curtains).toBe(0);
    const starsBefore = (await snapshot(page)).stars;

    // The curtains picture starts above the canvas: the hold target must lie on the canvas, in the band only they cover.
    const at = (await targets(page)).slots?.curtains;
    expect(at).toBeDefined();
    expect(at!.y).toBeGreaterThan(0);
    expect(at!.y).toBeLessThan(200);

    await holdTouch(page, at!, balance.roomHold.holdMs + 400);
    await expect.poll(async () => (await room(page)).panel, { timeout: 15_000 }).toMatchObject({ kind: 'open', mode: 'change', slot: 'curtains' });
    expect((await snapshot(page)).stars).toBe(starsBefore);

    const thumbs = (await targets(page)).thumbs ?? [];
    expect(thumbs.length).toBe(3);
    await tapScene(page, thumbs[2]);
    await expect.poll(async () => {
        const panel = (await room(page)).panel;
        return panel.kind === 'open' ? panel.preview : null;
    }, { timeout: 15_000 }).toBe(2);
    await tapTarget(page, 'choose');
    await expect.poll(async () => (await room(page)).chosen.curtains, { timeout: 15_000 }).toBe(2);
    const after = await room(page);
    expect(after.shown.curtains).toBe(2);
    expect(after.tasksDone).toBe(bought.tasksDone);
    expect((await snapshot(page)).stars).toBe(starsBefore);
});
