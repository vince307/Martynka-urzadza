// Risks #16 and #2 of context/foundation/test-plan.md for the salon with its renovation stage (S-16a, phase 10).
// #16: the stage is bought by one tap (no panel) and spends its cost once; a sofa costs only after "Wybieram"; short of stars
// nothing is bought. #2: a salon saved under the old 10-task list (?e2eSave=legacy-salon, e2e build only) is carried to the
// new list at load. The seam store is in memory and a reload would read the old save again, so "saved" is proved by the seam's
// write log (snapshot.save.store.writtenVersion) after a change, never by a reload. ?e2eArt=room queues no salon picture:
// the room stays playable on stand-ins and the parent's count is read from the hook. Costs come from the hook, not from the data.
import { test, expect, type Page } from '@playwright/test';
import { passWelcome } from './support/welcome';
import { answerRight, answerWrong, phaseIs, playRoundRight, screenIs, silenceSpeech, snapshot, tapNext, tapScene, tapTarget, targets } from './support/hook';
import { SAVE_VERSION } from '../../src/core/save';
import { ROOM_ART } from '../../src/data/roomArt';

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

/** Into the salon with no star earned on the way. */
const toRoom = async (page: Page, query: Record<string, string>): Promise<void> => {
    await silenceSpeech(page);
    await passWelcome(page, { e2eVariant: 'off', ...query });
    await solveByRetype(page);
    await tapTarget(page, 'roomSwitch');
    await screenIs(page, 'room');
};

test('#16 the stage is bought by one tap for its cost once; the sofa costs only after "Wybieram"', async ({ page }) => {
    await toRoom(page, { e2eStars: '12' });
    const start = await room(page);
    expect(start.state.stars).toBe(12);
    expect(start.room.taskKind).toBe('stage');
    const stageCost = start.room.currentTask!.cost;

    // Two quick taps on the stage button: one purchase. The second lands on the sofa's button and at most opens its panel.
    const button = (await targets(page)).taskButton;
    expect(button).not.toBeNull();
    await tapScene(page, button!);
    await tapScene(page, button!);
    await expect.poll(async () => (await room(page)).room.tasksDone).toBeGreaterThanOrEqual(1);
    const staged = await room(page);
    expect(staged.room.tasksDone).toBe(1);
    expect(staged.room.stageDone).toBe(true);
    expect(staged.room.chosen).toEqual({});
    expect(staged.state.stars).toBe(12 - stageCost);
    expect(staged.room.currentTask?.id).toBe('add-sofa');
    if (staged.room.panel.kind === 'open') {
        expect(staged.room.panel).toMatchObject({ mode: 'buy', taskId: 'add-sofa', preview: null });
    } else {
        await tapTarget(page, 'taskButton');
    }
    await expect.poll(async () => (await room(page)).room.panel.kind).toBe('open');
    const sofaCost = staged.room.currentTask!.cost;
    // Opening the panel and previewing a variant take nothing.
    expect((await snapshot(page)).stars).toBe(12 - stageCost);
    const thumbs = (await targets(page)).thumbs ?? [];
    expect(thumbs).toHaveLength(3);
    await tapScene(page, thumbs[2]);
    await expect.poll(async () => {
        const panel = (await room(page)).room.panel;
        return panel.kind === 'open' ? panel.preview : null;
    }).toBe(2);
    expect((await snapshot(page)).stars).toBe(12 - stageCost);
    await tapTarget(page, 'choose');
    await expect.poll(async () => (await room(page)).room.tasksDone).toBe(2);
    const sofa = await room(page);
    expect(sofa.state.stars).toBe(12 - stageCost - sofaCost);
    expect(sofa.state.counterText).toBe(String(12 - stageCost - sofaCost));
    expect(sofa.room.chosen).toEqual({ sofa: 2 });
});

test('#16 short of stars the stage is not bought and nothing goes below zero', async ({ page }) => {
    await toRoom(page, { e2eStars: '4' });
    const start = await room(page);
    expect(start.room.taskKind).toBe('stage');
    expect(start.room.affordable).toBe(false);
    expect(start.state.stars).toBe(4);
    await tapTarget(page, 'taskButton');
    await screenIs(page, 'task');
    const after = await snapshot(page);
    expect(after.stars).toBe(4);
    expect(after.counterText).toBe('4');
    await tapTarget(page, 'roomSwitch');
    await screenIs(page, 'room');
    const again = await room(page);
    expect(again.room.tasksDone).toBe(0);
    expect(again.room.stageDone).toBe(false);
});

test('#2 a salon saved under the old task list is carried over at load and the carried state is saved', async ({ page }) => {
    await toRoom(page, { e2eSave: 'legacy-salon' });
    const carried = await room(page);
    // 26 stars of old purchases (floor, walls, curtains, sofa) are covered by the first four new tasks: stage, sofa, rug, coffee table.
    expect(carried.room.tasksDone).toBe(4);
    expect(carried.room.stageDone).toBe(true);
    expect(carried.room.chosen).toEqual({ sofa: 2, rug: 0, 'coffee-table': 0 });
    expect(carried.state.stars).toBe(3);
    const slots = (await targets(page)).slots ?? {};
    for (const id of ['sofa', 'rug', 'coffee-table']) {
        expect(slots[id], id).toBeTruthy();
    }
    expect(carried.room.currentTask?.id).toBe('place-cabinet');

    // The carried state is written once something changes: a round pays stars and the autosaver flushes at its end. Short of
    // stars (3 of 12) the task button sends the child back to the tasks.
    await tapTarget(page, 'taskButton');
    await screenIs(page, 'task');
    await phaseIs(page, 'done');
    await tapNext(page);
    await playRoundRight(page, 4);
    await expect.poll(async () => (await snapshot(page)).save?.store?.writtenVersion ?? null).toBe(SAVE_VERSION);
    const after = await snapshot(page);
    expect(after.stars).toBeGreaterThan(3);
});

test('#16 with the salon pictures missing the room stays playable on stand-ins and the count is told', async ({ page }) => {
    await toRoom(page, { e2eArt: 'room', e2eStars: '12' });
    await expect.poll(async () => (await snapshot(page)).roomArtHealth?.total ?? 0).toBeGreaterThan(0);
    const health = (await snapshot(page)).roomArtHealth!;
    expect(health.missing).toBe(health.total);
    expect(health.total).toBe(ROOM_ART.length); // the game's own table (37 since salon-style p3 dropped furnishings-before)

    await tapTarget(page, 'taskButton');
    await expect.poll(async () => (await room(page)).room.tasksDone).toBe(1);
    await tapTarget(page, 'taskButton');
    await expect.poll(async () => (await room(page)).room.panel.kind).toBe('open');
    await tapTarget(page, 'choose');
    await expect.poll(async () => (await room(page)).room.panel.kind).toBe('open'); // no variant previewed: nothing bought
    const thumbs = (await targets(page)).thumbs ?? [];
    await tapScene(page, thumbs[0]);
    await tapTarget(page, 'choose');
    await expect.poll(async () => (await room(page)).room.tasksDone).toBe(2);
    expect((await snapshot(page)).stars).toBe(0);
    await expect(page.getByRole('button', { name: 'Zacznij od nowa' })).toHaveCount(0);
});
