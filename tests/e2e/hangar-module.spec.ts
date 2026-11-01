// Risks #2 (progress survives a reload) and #16 (a purchase flow ends on its card, the balance is exact) of context/foundation/test-plan.md,
// S-30 hangar-module phase 4 (FR-047 the Hangar, the second module of the space base).
// The hook build (window.__martynkaE2E); taps are page.touchscreen.tap at scene points from the hook's targets. "Visible" is judged on the
// RENDERED frame (renderedPixel), not on a texture. A test = a new browser context = a fresh device. Modelled on base-cross-section.spec.ts.
// Pixel oracle: inside the ground-right cell the base's closed-cell picture (public/assets/house/base-1-cell-closed.webp) is cream
// (255,245,223) at scene (1123,816); the Hangar miniature there is HANGAR_POINT_NOTE below.
import { test, expect } from '@playwright/test';
import { BRIDGE, HANGAR } from '../../src/data/rooms';
import { openHouse, renderedPixel, screenIs, silenceSpeech, snapshot, tapScene, tapTarget, targets } from './support/hook';
import { passWelcome } from './support/welcome';
import { buyAllTasks, room, solveByRetype } from './support/salon';

test.setTimeout(240_000);

const QUIET = { e2eVariant: 'off' };
// Inside the Hangar miniature's window (a dark starry sky, measured on the rendered 1920x1080 frame), far from the cream the airlock picture has.
const WINDOW_POINT = { x: 1417, y: 720 };
const CREAM: [number, number, number] = [255, 245, 223];
// Literal oracles (FR-047: both modules cost 100 stars, the ladder 6-21), not summed from the data a regression would change too.
const MOSTEK_TOTAL = 100;
const HANGAR_TOTAL = 100;

test.beforeEach(async ({ page }) => {
    await silenceSpeech(page);
});

const intoRoom = async (page: import('@playwright/test').Page): Promise<void> => {
    await solveByRetype(page);
    await tapTarget(page, 'roomSwitch');
    await screenIs(page, 'room');
    await expect.poll(async () => (await room(page)).currentTask?.id, { timeout: 30_000 }).toBeTruthy();
};

test('#2 S-30 FR-047 the base shows Mostek done and the Hangar framed in its second cell; a tap returns to the Hangar; a reload keeps it', async ({ page }) => {
    await passWelcome(page, { ...QUIET, e2eStars: String(MOSTEK_TOTAL) }, 'space');
    await intoRoom(page);
    await buyAllTasks(page, BRIDGE);
    await expect.poll(async () => (await room(page)).card, { timeout: 15_000 }).not.toBeNull();
    await tapTarget(page, 'cardNext');
    await expect.poll(async () => (await room(page)).card).toBeNull();
    expect((await room(page)).roomId).toBe('hangar');
    expect((await room(page)).tasksDone).toBe(0);

    await openHouse(page);
    await expect.poll(async () => (await snapshot(page)).houseView?.shellReady, { timeout: 20_000 }).toBe(true);
    const view = (await snapshot(page)).houseView!;
    expect(view.cells.map((cell) => cell.state)).toEqual(['done', 'current', 'closed', 'closed']);
    expect(view.cells.find((cell) => cell.id === 'ground-right')).toMatchObject({ room: 'hangar' });
    expect(view.cells.find((cell) => cell.id === 'ground-left')).toMatchObject({ room: 'bridge' });
    // The rendered frame shows the Hangar's miniature, not the closed airlock picture.
    await expect.poll(async () => (await renderedPixel(page, WINDOW_POINT)).some((v, i) => Math.abs(v - CREAM[i]) > 40)).toBe(true);

    // Mostek is visited from its cell and the Hangar returns with a tap.
    await tapScene(page, (await targets(page)).houseCells!['ground-left']);
    await screenIs(page, 'room');
    expect((await room(page)).roomId).toBe('bridge');
    expect((await room(page)).visiting).toBe('bridge');
    await openHouse(page);
    await tapScene(page, (await targets(page)).houseCells!['ground-right']);
    await screenIs(page, 'room');
    expect((await room(page)).roomId).toBe('hangar');
    expect((await room(page)).visiting).toBeNull();

    await expect.poll(async () => (await snapshot(page)).save?.dirty, { timeout: 15_000 }).toBe(false);
    await page.reload();
    await page.waitForFunction(() => '__martynkaE2E' in window, undefined, { timeout: 15_000 });
    await screenIs(page, 'task');
    await solveByRetype(page);
    await tapTarget(page, 'roomSwitch');
    await screenIs(page, 'room');
    await expect.poll(async () => (await room(page)).roomId).toBe('hangar');
});

test('#16 S-30 FR-047 the Hangar is bought to the end: the card shows Mostek and Hangar with no teaser; "Dalej" stays in the Hangar; the balance is exact', async ({ page }) => {
    await passWelcome(page, { ...QUIET, e2eStars: String(MOSTEK_TOTAL + HANGAR_TOTAL) }, 'space');
    await intoRoom(page);
    await buyAllTasks(page, BRIDGE);
    await expect.poll(async () => (await room(page)).card, { timeout: 15_000 }).not.toBeNull();
    await tapTarget(page, 'cardNext');
    await expect.poll(async () => (await room(page)).roomId).toBe('hangar');
    await expect.poll(async () => (await room(page)).card).toBeNull();
    await buyAllTasks(page, HANGAR);
    await expect.poll(async () => (await room(page)).card, { timeout: 15_000 }).not.toBeNull();

    const card = (await room(page)).card!;
    expect(card.items.map((item) => [item.kind, item.id, item.done])).toEqual([['room', 'bridge', true], ['room', 'hangar', true]]);
    // The balance is the save's star count: every star spent, none below zero.
    expect((await snapshot(page)).stars).toBe(0);

    await tapTarget(page, 'cardNext');
    await expect.poll(async () => (await room(page)).card).toBeNull();
    const after = await room(page);
    expect(after.roomId).toBe('hangar');
    expect(after.done).toBe(true);
    expect(after.houseLabel).toBe('Baza');
    expect((await targets(page)).modeButton ?? null).not.toBeNull();
});
