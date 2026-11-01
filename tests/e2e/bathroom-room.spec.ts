// Risks #16 (a purchase flow renovates and ends on its card, the balance is exact) and #2 (the room survives a reload and the house shows it)
// of context/foundation/test-plan.md, S-31 bathroom-room phase 6 (FR-033, FR-038, the bathroom in house 1; design gap 204, the four-tile card).
// The hook build (window.__martynkaE2E); taps are page.touchscreen.tap at scene points from the hook's targets. "Visible" is judged on the
// RENDERED frame (renderedPixel), never on a texture. A test = a new browser context = a fresh device. Modelled on kids-room.spec.ts.
import { test, expect, type Page } from '@playwright/test';
import { BATHROOM, CHILDREN, KITCHEN, SALON } from '../../src/data/rooms';
import { openHouse, renderedPixel, screenIs, snapshot, tapScene, tapTarget, targets } from './support/hook';
import { buyAllTasks, finishSalon, room } from './support/salon';

test.setTimeout(300_000);

// Literal oracle (FR-033): the seven tasks of the bathroom, in order, 71 stars. Not summed from the data a regression would change too.
const BATHROOM_COSTS = [5, 7, 9, 10, 12, 13, 15];
const BATHROOM_TOTAL = 71;

type Rgb = readonly [number, number, number];
const near = (px: readonly number[], ref: Rgb, tol: number): boolean => ref.every((v, i) => Math.abs(px[i] - v) <= tol);
const apart = (a: readonly number[], b: readonly number[], by: number): boolean => a.some((v, i) => Math.abs(v - b[i]) >= by);

// Wall/floor point clear of every slot where the before and after pictures differ most (measured on the WebP pictures: before (200,139,80), after
// (254,234,189); the neighbourhood is flat in both). Read from the rendered frame.
const FLOOR_POINT = { x: 1230, y: 810 };
// The four-tile card is 1516 wide (x 202-1718, y 220-780). (1620, 300) is card face outside the old 388-1532 card, below the hidden house button;
// (1370, 560) is the face of the fourth tile (x 1348-1688), left of its caption text and below its miniature. Card face (255,247,222), tile ivory (255,245,223).
const CARD_ONLY_POINT = { x: 1620, y: 300 };
const FOURTH_TILE_POINT = { x: 1370, y: 560 };
const CARD_COLOUR: Rgb = [255, 247, 222];
// The card's border (PLACEHOLDER_COLORS.unlockBorder) at its two outer edges, which only a card as wide as four tiles reaches (the old card ends at 388 / 1532);
// the room behind the card is the cream (255,245,223), only 2 per channel from the card face, so the border is what proves the width.
const BORDER: Rgb = [216, 188, 111];
const CARD_LEFT_EDGE = { x: 203, y: 500 };
const CARD_RIGHT_EDGE = { x: 1717, y: 500 };
const IVORY: Rgb = [255, 245, 223];
const CLOSED_CELL: Rgb = [255, 245, 223];

const salonTotal = SALON.tasks.reduce((sum, task) => sum + task.cost, 0);
const kitchenTotal = KITCHEN.tasks.reduce((sum, task) => sum + task.cost, 0);
const childrenTotal = CHILDREN.tasks.reduce((sum, task) => sum + task.cost, 0);

/** Finishes the salon, the kitchen and the children's room; the child stands in the bathroom, no task bought. */
const intoBathroom = async (page: Page): Promise<void> => {
    await finishSalon(page, { e2eStars: String(salonTotal + kitchenTotal + childrenTotal + BATHROOM_TOTAL) });
    for (const [next, def] of [['kitchen', KITCHEN], ['children', CHILDREN]] as const) {
        await tapTarget(page, 'cardNext');
        await expect.poll(async () => (await snapshot(page)).currentRoom).toBe(next);
        await expect.poll(async () => (await room(page)).roomId).toBe(next);
        await expect.poll(async () => (await room(page)).currentTask?.id, { timeout: 30_000 }).toBe(def.tasks[0].id);
        await buyAllTasks(page, def);
        await expect.poll(async () => (await room(page)).card, { timeout: 15_000 }).not.toBeNull();
    }
    await tapTarget(page, 'cardNext');
    await expect.poll(async () => (await snapshot(page)).currentRoom).toBe('bathroom');
    await expect.poll(async () => (await room(page)).roomId).toBe('bathroom');
    await expect.poll(async () => (await room(page)).currentTask?.id, { timeout: 30_000 }).toBe(BATHROOM.tasks[0].id);
};

const buyOne = async (page: Page, kind: string): Promise<void> => {
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

test('#16 S-31 FR-033 the bathroom is renovated and furnished to the end; the balance is exact; the card shows four done rooms inside its rendered frame, "Dom" is hidden under it, and "Dalej" stays', async ({ page }) => {
    await intoBathroom(page);
    expect((await room(page)).tasksDone).toBe(0);
    let stars = (await snapshot(page)).stars;
    expect(stars).toBe(BATHROOM_TOTAL);

    await expect.poll(async () => near(await renderedPixel(page, FLOOR_POINT), [200, 139, 80], 14), { timeout: 15_000 }).toBe(true);
    const beforeLook = await renderedPixel(page, FLOOR_POINT);
    for (let i = 0; i < BATHROOM.tasks.length; i++) {
        await buyOne(page, BATHROOM.tasks[i].kind);
        stars -= BATHROOM_COSTS[i];
        expect((await snapshot(page)).stars).toBe(stars);
        if (i === 0) {
            await expect.poll(async () => apart(await renderedPixel(page, FLOOR_POINT), beforeLook, 30), { timeout: 15_000 }).toBe(true);
        }
    }
    expect(stars).toBe(0);
    await expect.poll(async () => (await room(page)).card, { timeout: 15_000 }).not.toBeNull();
    const card = (await room(page)).card!;
    expect(card.items.map((item) => [item.kind, item.id, item.done])).toEqual([['room', 'salon', true], ['room', 'kitchen', true], ['room', 'children', true], ['room', 'bathroom', true]]);
    expect(card.items.some((item) => item.kind === 'teaser')).toBe(false);

    // The house button is hidden while the card is up (house-cross-section follow-up 21).
    expect((await targets(page)).houseButton ?? null).toBeNull();
    // The card is drawn wider than the old 1144 card: card face where only the four-tile card reaches, tile ivory in the fourth tile.
    await expect.poll(async () => near(await renderedPixel(page, CARD_RIGHT_EDGE), BORDER, 8), { timeout: 15_000 }).toBe(true);
    expect(near(await renderedPixel(page, CARD_LEFT_EDGE), BORDER, 8)).toBe(true);
    expect(near(await renderedPixel(page, CARD_ONLY_POINT), CARD_COLOUR, 6)).toBe(true);
    expect(near(await renderedPixel(page, FOURTH_TILE_POINT), IVORY, 6)).toBe(true);

    await tapTarget(page, 'cardNext');
    await expect.poll(async () => (await room(page)).card).toBeNull();
    const done = await room(page);
    expect(done.roomId).toBe('bathroom');
    expect(done.houseLabel).toBe('Dom');
    expect((await targets(page)).modeButton ?? null).not.toBeNull();
});

test('#2 S-31 FR-038 the house shows the bathroom in its upper-right cell; a reload keeps the child there', async ({ page }) => {
    await intoBathroom(page);
    await buyOne(page, 'stage');
    await expect.poll(async () => (await snapshot(page)).save?.dirty, { timeout: 15_000 }).toBe(false);

    await openHouse(page);
    await expect.poll(async () => (await snapshot(page)).houseView?.shellReady, { timeout: 20_000 }).toBe(true);
    await expect.poll(async () => (await snapshot(page)).houseView?.cells.map((cell) => cell.state)).toEqual(['done', 'done', 'done', 'current']);
    const cells = (await snapshot(page)).houseView!.cells;
    expect(cells.find((cell) => cell.id === 'upper-right')).toMatchObject({ room: 'bathroom', state: 'current' });
    const at = (await targets(page)).houseCells!['upper-right'];
    // The upper-right cell shows the bathroom miniature, not the pack's closed cream cell (255,245,223).
    await expect.poll(async () => apart(await renderedPixel(page, at), CLOSED_CELL, 40), { timeout: 15_000 }).toBe(true);
    await tapScene(page, at);
    await screenIs(page, 'room');
    await expect.poll(async () => (await room(page)).roomId, { timeout: 15_000 }).toBe('bathroom');
    expect((await room(page)).visiting).toBeNull();

    await page.reload();
    await page.waitForFunction(() => '__martynkaE2E' in window, undefined, { timeout: 15_000 });
    await screenIs(page, 'task');
    await expect.poll(async () => (await snapshot(page)).currentRoom).toBe('bathroom');
    expect((await snapshot(page)).rooms?.bathroom?.tasksDone).toBe(1);
});
