// Risks #2 (progress kept across a reload) and #16 (a free change deducts nothing) of context/foundation/test-plan.md, plus the
// FR-038 / FR-039 navigation of S-23 house-cross-section phase 6 (no test-plan id for the navigation itself). The real path: room ->
// "Dom" -> the house cross-section -> a cell -> the room, and back through the notebook. Runs in the chromium-hook project (read-only
// window.__martynkaE2E); a test is a new browser context, so a fresh device. State is read through the hook only.
import { test, expect, type Page } from '@playwright/test';
import { answerRight, housePixel, openHouse, phaseIs, screenIs, snapshot, tapScene, tapTarget, targets } from './support/hook';
import { finishSalon, room, solveByRetype } from './support/salon';
import { passWelcome } from './support/welcome';
import { SALON, KITCHEN } from '../../src/data/rooms';

test.setTimeout(240_000);

const salonTotal = SALON.tasks.reduce((sum, task) => sum + task.cost, 0);
const kitchenTotal = KITCHEN.tasks.reduce((sum, task) => sum + task.cost, 0);

const cellStates = async (page: Page): Promise<string[]> => ((await snapshot(page)).houseView?.cells ?? []).map((cell) => cell.state);

const cellAt = async (page: Page, id: string) => {
    await expect.poll(async () => (await targets(page)).houseCells?.[id] ?? null).not.toBeNull();
    return (await targets(page)).houseCells![id];
};

/** A fresh device: one solved task, then the notebook's "Do pokoju" into the salon in renovation. */
const intoSalon = async (page: Page, query: Record<string, string> = {}): Promise<void> => {
    await passWelcome(page, { e2eStars: '40', e2eVariant: 'off', ...query });
    await solveByRetype(page);
    await tapTarget(page, 'roomSwitch');
    await screenIs(page, 'room');
    await expect.poll(async () => (await snapshot(page)).room?.currentTask?.id, { timeout: 30_000 }).toBeTruthy();
};

test('S-23 FR-038 the house at the start shows the salon in renovation and three closed cells', async ({ page }) => {
    await intoSalon(page);
    await openHouse(page);
    await expect.poll(async () => (await snapshot(page)).houseView?.cells.length).toBe(4);
    expect(await cellStates(page)).toEqual(['current', 'closed', 'closed', 'closed']);
    const cells = (await snapshot(page)).houseView!.cells;
    expect(cells[0]).toMatchObject({ id: 'ground-left', room: 'salon', mode: 'live' });
    // An uncaptured miniature texture is transparent; a captured one is opaque.
    await expect.poll(async () => (await housePixel(page, 'ground-left'))?.[3] ?? null, { timeout: 15_000 }).toBe(255);

    // A closed cell does nothing.
    await tapScene(page, await cellAt(page, 'upper-right'));
    await tapScene(page, await cellAt(page, 'ground-right'));
    await screenIs(page, 'house');
    expect(await cellStates(page)).toEqual(['current', 'closed', 'closed', 'closed']);

    // The back button returns to the room in renovation, not on a visit.
    await tapTarget(page, 'houseBack');
    await screenIs(page, 'room');
    expect((await room(page)).roomId).toBe('salon');
    expect((await room(page)).visiting).toBeNull();
});

test('#2 #16 S-23 FR-039 a done room opened from the house; "Do pokoju" from the notebook returns to the room in renovation', async ({ page }) => {
    await finishSalon(page, { e2eStars: String(salonTotal + kitchenTotal) });
    await tapTarget(page, 'cardNext');
    await expect.poll(async () => (await snapshot(page)).currentRoom).toBe('kitchen');
    await expect.poll(async () => (await room(page)).roomId).toBe('kitchen');
    await expect.poll(async () => (await room(page)).currentTask?.id, { timeout: 30_000 }).toBe(KITCHEN.tasks[0].id);

    await openHouse(page);
    await expect.poll(async () => (await snapshot(page)).houseView?.cells.length).toBe(4);
    expect(await cellStates(page)).toEqual(['done', 'current', 'closed', 'closed']);
    await tapScene(page, await cellAt(page, 'ground-left'));
    await screenIs(page, 'room');
    await expect.poll(async () => (await room(page)).roomId, { timeout: 15_000 }).toBe('salon');
    expect((await room(page)).visiting).toBe('salon');

    // A free change of the finished salon deducts nothing and is written to the salon.
    await tapTarget(page, 'modeButton');
    await expect.poll(async () => (await room(page)).mode).toBe('change');
    const sofaAt = (await targets(page)).slots?.sofa;
    expect(sofaAt).toBeDefined();
    const sofaBefore = (await room(page)).chosen.sofa;
    await tapScene(page, sofaAt!);
    await expect.poll(async () => (await room(page)).panel.kind).toBe('open');
    const next = (sofaBefore + 1) % 3;
    const thumbs = (await targets(page)).thumbs ?? [];
    expect(thumbs.length).toBe(3);
    await tapScene(page, thumbs[next]);
    await expect.poll(async () => {
        const panel = (await room(page)).panel;
        return panel.kind === 'open' ? panel.preview : null;
    }, { timeout: 15_000 }).toBe(next);
    await tapTarget(page, 'choose');
    await expect.poll(async () => (await room(page)).panel.kind).toBe('closed');
    const changed = await snapshot(page);
    expect(changed.rooms?.salon?.chosen.sofa).toBe(next);
    expect(changed.stars).toBe(kitchenTotal);

    // The notebook and "Do pokoju" lead to the room in renovation, not to the visited salon.
    await tapTarget(page, 'resume');
    await screenIs(page, 'task');
    await tapTarget(page, 'roomSwitch');
    await screenIs(page, 'room');
    await expect.poll(async () => (await room(page)).roomId).toBe('kitchen');
    expect((await room(page)).visiting).toBeNull();

    // Reload: the child lands in the kitchen and the change was kept.
    await expect.poll(async () => (await snapshot(page)).save?.dirty, { timeout: 15_000 }).toBe(false);
    await page.reload();
    await page.waitForFunction(() => '__martynkaE2E' in window, undefined, { timeout: 15_000 });
    await screenIs(page, 'task');
    await expect.poll(async () => (await snapshot(page)).currentRoom).toBe('kitchen');
    expect((await snapshot(page)).rooms?.salon?.chosen.sofa).toBe(next);
    await phaseIs(page, 'first');
    await answerRight(page);
    await phaseIs(page, 'done');
    await tapTarget(page, 'roomSwitch');
    await screenIs(page, 'room');
    await expect.poll(async () => (await room(page)).roomId).toBe('kitchen');
});

test('S-23 FR-039 the room in renovation\'s cell opens that room; "Dom" is absent while the variant panel is open', async ({ page }) => {
    await intoSalon(page);
    await openHouse(page);
    await tapScene(page, await cellAt(page, 'ground-left'));
    await screenIs(page, 'room');
    expect((await room(page)).roomId).toBe('salon');
    expect((await room(page)).visiting).toBeNull();

    // Buy the stage, then the next task opens the variant panel: the way into the house is out of the way (design gap 183).
    await expect.poll(async () => (await targets(page)).houseButton ?? null).not.toBeNull();
    await tapTarget(page, 'taskButton');
    await expect.poll(async () => (await room(page)).stageDone).toBe(true);
    await tapTarget(page, 'taskButton');
    await expect.poll(async () => (await room(page)).panel.kind, { timeout: 15_000 }).toBe('open');
    expect((await targets(page)).houseButton ?? null).toBeNull();
    await tapTarget(page, 'close');
    await expect.poll(async () => (await room(page)).panel.kind).toBe('closed');
    await expect.poll(async () => (await targets(page)).houseButton ?? null).not.toBeNull();
});

test('S-23 ?e2eArt=house the house draws the stand-in shell and records the fallback', async ({ page }) => {
    await intoSalon(page, { e2eArt: 'house' });
    await openHouse(page);
    await expect.poll(async () => (await snapshot(page)).artFallbacks?.house).toBe('drawn');
    expect((await snapshot(page)).houseView?.shellReady).toBe(false);
    // The cells stay tappable on the stand-in shell.
    await tapScene(page, await cellAt(page, 'ground-left'));
    await screenIs(page, 'room');
    expect((await room(page)).roomId).toBe('salon');
});
