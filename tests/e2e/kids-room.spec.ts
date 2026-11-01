// Risks #16 (a purchase flow renovates in stages and ends on its card, the balance is exact) and #2 (the room survives a reload and the
// house shows it) of context/foundation/test-plan.md, S-25 kids-room phase 6 (FR-033, the children's room in house 1).
// The hook build (window.__martynkaE2E); taps are page.touchscreen.tap at scene points from the hook's targets. "Visible" is judged on the
// RENDERED frame (renderedPixel), never on a texture. A test = a new browser context = a fresh device. Modelled on kitchen-room.spec.ts
// and hangar-module.spec.ts.
import { test, expect, type Page } from '@playwright/test';
import { CHILDREN, KITCHEN, SALON } from '../../src/data/rooms';
import { openHouse, renderedPixel, screenIs, snapshot, tapScene, tapTarget, targets } from './support/hook';
import { buyAllTasks, finishSalon, room } from './support/salon';

test.setTimeout(300_000);

// Literal oracle (FR-033): the nine tasks of the children's room, in order, 84 stars. Not summed from the data a regression would change too.
const CHILDREN_COSTS = [5, 6, 7, 7, 9, 10, 12, 13, 15];
const CHILDREN_TOTAL = 84;

type Rgb = readonly [number, number, number];
// Room point where consecutive backgrounds differ (the wall above the slots), measured on the rendered 1920x1080 frame.
// Rendered RGB there (measured on the WebP pictures composed with the shadows layer and the fade's end): stage 0 (children/before),
// stage 1 and 2 (the two staged pictures), then the renovated room (after). Tolerance 12 per channel.
const WALL_POINT = { x: 1200, y: 410 };
const WALL_BY_STAGE: readonly Rgb[] = [[207, 138, 90], [236, 199, 154], [248, 230, 200], [244, 207, 155]];
const near = (px: readonly number[], ref: Rgb, tol: number): boolean => ref.every((v, i) => Math.abs(px[i] - v) <= tol);
const apart = (a: readonly number[], b: readonly number[], by: number): boolean => a.some((v, i) => Math.abs(v - b[i]) >= by);

const salonTotal = SALON.tasks.reduce((sum, task) => sum + task.cost, 0);
const kitchenTotal = KITCHEN.tasks.reduce((sum, task) => sum + task.cost, 0);

/** Finishes the salon and the kitchen with stars for all three rooms; the child stands in the children's room, no task bought. */
const intoChildren = async (page: Page): Promise<void> => {
    await finishSalon(page, { e2eStars: String(salonTotal + kitchenTotal + CHILDREN_TOTAL) });
    await tapTarget(page, 'cardNext');
    await expect.poll(async () => (await room(page)).roomId).toBe('kitchen');
    await expect.poll(async () => (await room(page)).currentTask?.id, { timeout: 30_000 }).toBe(KITCHEN.tasks[0].id);
    await buyAllTasks(page, KITCHEN);
    await expect.poll(async () => (await room(page)).card, { timeout: 15_000 }).not.toBeNull();
    await tapTarget(page, 'cardNext');
    await expect.poll(async () => (await snapshot(page)).currentRoom).toBe('children');
    await expect.poll(async () => (await room(page)).roomId).toBe('children');
    await expect.poll(async () => (await room(page)).currentTask?.id, { timeout: 30_000 }).toBe(CHILDREN.tasks[0].id);
};

test('#16 S-25 FR-033 the children\'s room renovates in three stages, each a new background in the rendered frame, then is furnished to the end; the balance is exact; the card shows three done rooms and "Dalej" stays', async ({ page }) => {
    await intoChildren(page);
    expect((await room(page)).tasksDone).toBe(0);
    expect((await room(page)).stagesDone).toBe(0);
    let stars = (await snapshot(page)).stars;
    expect(stars).toBe(CHILDREN_TOTAL);

    await expect.poll(async () => near(await renderedPixel(page, WALL_POINT), WALL_BY_STAGE[0], 12), { timeout: 15_000 }).toBe(true);
    for (let i = 0; i < CHILDREN.tasks.length; i++) {
        const task = CHILDREN.tasks[i];
        await buyAllTasksOne(page, task.kind);
        stars -= CHILDREN_COSTS[i];
        expect((await snapshot(page)).stars).toBe(stars);
        if (task.kind === 'stage') {
            const staged = i + 1;
            await expect.poll(async () => (await room(page)).stagesDone).toBe(staged);
            // The rendered pixel moved to this stage's picture (after the cross-fade), a visible step from the previous one.
            await expect.poll(async () => near(await renderedPixel(page, WALL_POINT), WALL_BY_STAGE[staged], 12), { timeout: 15_000 }).toBe(true);
            expect(apart(WALL_BY_STAGE[staged], WALL_BY_STAGE[staged - 1], 30)).toBe(true);
        }
    }
    expect(stars).toBe(0);
    await expect.poll(async () => (await room(page)).card, { timeout: 15_000 }).not.toBeNull();
    const card = (await room(page)).card!;
    expect(card.items.map((item) => [item.kind, item.id, item.done])).toEqual([['room', 'salon', true], ['room', 'kitchen', true], ['room', 'children', true]]);
    expect(card.items.some((item) => item.kind === 'teaser')).toBe(false);

    await tapTarget(page, 'cardNext');
    await expect.poll(async () => (await room(page)).card).toBeNull();
    const after = await room(page);
    expect(after.roomId).toBe('children');
    expect(after.done).toBe(true);
    expect(after.houseLabel).toBe('Dom');
    expect((await targets(page)).modeButton ?? null).not.toBeNull();
});

const buyAllTasksOne = async (page: Page, kind: string): Promise<void> => {
    const before = (await room(page)).tasksDone;
    await tapTarget(page, 'taskButton');
    if (kind !== 'stage') {
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
};

test('#2 S-25 FR-033 the house shows the children\'s room in its upper-left cell; a reload keeps the child there', async ({ page }) => {
    await intoChildren(page);
    await buyAllTasksOne(page, 'stage');
    await expect.poll(async () => (await room(page)).stagesDone).toBe(1);
    await expect.poll(async () => (await snapshot(page)).save?.dirty, { timeout: 15_000 }).toBe(false);

    await openHouse(page);
    await expect.poll(async () => (await snapshot(page)).houseView?.shellReady, { timeout: 20_000 }).toBe(true);
    await expect.poll(async () => (await snapshot(page)).houseView?.cells.map((cell) => cell.state)).toEqual(['done', 'done', 'current', 'closed']);
    const cells = (await snapshot(page)).houseView!.cells;
    expect(cells.find((cell) => cell.id === 'upper-left')).toMatchObject({ room: 'children', state: 'current' });
    const at = (await targets(page)).houseCells!['upper-left'];
    // The upper-left cell shows the stage-1 miniature (green wall at its centre, rendered (81,175,138)); the closed cell (upper-right) is
    // the pack's cream picture: the two differ by far more than 40 in a channel.
    const closedAt = (await targets(page)).houseCells!['upper-right'];
    expect(closedAt).toBeDefined();
    await expect.poll(async () => apart(await renderedPixel(page, at), await renderedPixel(page, closedAt), 40)).toBe(true);
    expect(apart(await renderedPixel(page, at), [255, 245, 223], 40)).toBe(true);
    await tapScene(page, at);
    await screenIs(page, 'room');
    await expect.poll(async () => (await room(page)).roomId, { timeout: 15_000 }).toBe('children');
    expect((await room(page)).visiting).toBeNull();

    await page.reload();
    await page.waitForFunction(() => '__martynkaE2E' in window, undefined, { timeout: 15_000 });
    await screenIs(page, 'task');
    await expect.poll(async () => (await snapshot(page)).currentRoom).toBe('children');
    expect((await snapshot(page)).rooms?.children?.tasksDone).toBe(1);
});
