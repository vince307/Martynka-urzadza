// Risks #16 (room purchase by touch) and #12 (first launch behind the welcome backdrop) of context/foundation/test-plan.md for the
// salon style (change salon-style, phase 6): before the renovation stage the salon is the real furniture drawn faded (the "worn set",
// each piece through a colour grade) on the worn background; the stage removes the whole worn set and leaves the fixed pieces on soft
// contact shadows. Runs in the chromium-hook project (read-only window.__martynkaE2E: `room.worn`, `room.contactShadows`,
// `backdrop.graded`). The worn set is not furniture: `chosen` and `shown` stay empty until a purchase.
import { test, expect, type Page } from '@playwright/test';
import { openWelcome, passWelcome } from './support/welcome';
import { answerWrong, answerRight, phaseIs, screenIs, silenceSpeech, snapshot, tapScene, tapTarget, targets } from './support/hook';

test.setTimeout(120_000);

const WORN_KEYS = [
    'wall-frames', 'rug', 'cabinet', 'lamp-table', 'plant-left', 'sofa', 'plant-right', 'armchair', 'coffee-table', 'pouf',
];

const room = async (page: Page) => {
    const state = await snapshot(page);
    expect(state.room).toBeTruthy();
    return { state, room: state.room! };
};

/** Solves the open task by the long way so no star is earned on the way, then opens the salon. */
const toRoom = async (page: Page, query: Record<string, string>): Promise<void> => {
    await silenceSpeech(page);
    await passWelcome(page, { e2eVariant: 'off', ...query });
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
    await tapTarget(page, 'roomSwitch');
    await screenIs(page, 'room');
};

test('#12 salon-style the welcome backdrop of a fresh device is the graded worn salon', async ({ page }) => {
    const requested: string[] = [];
    page.on('request', (request) => requested.push(request.url()));
    await openWelcome(page, 9);
    await expect.poll(async () => (await snapshot(page)).backdrop?.drawn).toBe(true);
    const backdrop = (await snapshot(page)).backdrop!;
    expect(backdrop.mode).toBe('salon');
    expect(backdrop.blurred).toBe(true);
    expect(backdrop.graded).toBe(WORN_KEYS.length);
    // WebGL control: grading worked, so nothing was recorded as ungraded (the Canvas counterpart is canvas-renderer.spec.ts).
    expect((await snapshot(page)).artFallbacks?.worn).toBeUndefined();
    expect(requested.filter((url) => url.includes('furnishings-before'))).toEqual([]);
});

test('#16 salon-style a fresh salon shows the worn set graded and nothing interactive', async ({ page }) => {
    await toRoom(page, {});
    const { room: fresh } = await room(page);
    expect(fresh.worn.keys).toEqual(WORN_KEYS);
    expect(fresh.worn.graded).toBe(true);
    expect(fresh.contactShadows).toEqual([]);
    expect(fresh.shown).toEqual({});
    expect(fresh.chosen).toEqual({});
    expect(fresh.stageDone).toBe(false);
});

test('#16 salon-style after the stage the worn set is gone and the fixed pieces stand on contact shadows', async ({ page }) => {
    await toRoom(page, { e2eStars: '40' });
    const start = await room(page);
    expect(start.room.taskKind).toBe('stage');
    const stageCost = start.room.currentTask!.cost;

    await tapTarget(page, 'taskButton');
    await expect.poll(async () => (await room(page)).room.stageDone).toBe(true);
    const staged = await room(page);
    expect(staged.state.stars).toBe(40 - stageCost);
    expect(staged.room.worn.keys).toEqual([]);
    expect(staged.room.contactShadows).toEqual(['lamp-table', 'plant-left', 'pouf', 'plant-right']);

    // The sofa: open the panel, preview, "Wybieram".
    await tapTarget(page, 'taskButton');
    await expect.poll(async () => (await room(page)).room.panel.kind).toBe('open');
    const thumbs = (await targets(page)).thumbs ?? [];
    await tapScene(page, thumbs[0]);
    await tapTarget(page, 'choose');
    await expect.poll(async () => (await room(page)).room.tasksDone).toBe(2);
    const sofa = await room(page);
    expect(sofa.room.worn.keys).toEqual([]);
    expect(sofa.room.contactShadows).toEqual(['lamp-table', 'plant-left', 'pouf', 'plant-right']);
    expect(sofa.room.shown.sofa).toBe(0);
    await expect.poll(async () => (await room(page)).room.panel.kind).toBe('closed');

    // Back on the task screen the backdrop is the renovated salon: no graded piece.
    await tapTarget(page, 'resume');
    await screenIs(page, 'task');
    await expect.poll(async () => (await snapshot(page)).backdrop?.graded).toBe(0);
});

test('#16 salon-style with no salon pictures the before room draws no worn piece and the stage still sells', async ({ page }) => {
    await toRoom(page, { e2eArt: 'room', e2eStars: '40' });
    const start = await room(page);
    expect(start.room.worn.keys).toEqual([]);
    expect(start.room.worn.graded).toBe(false);
    expect(start.room.taskKind).toBe('stage');
    const stageCost = start.room.currentTask!.cost;
    await tapTarget(page, 'taskButton');
    await expect.poll(async () => (await room(page)).room.tasksDone).toBe(1);
    expect((await snapshot(page)).stars).toBe(40 - stageCost);
});
