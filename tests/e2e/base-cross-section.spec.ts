// Risks #12 (first launch by touch), #16 (a purchase flow ends on its card) and #2 (progress survives a reload) of context/foundation/test-plan.md,
// S-29 base-cross-section phase 5 (FR-045 the base cross-section, FR-046 the finished Mostek, FR-048 each child sees her own building).
// The hook build (window.__martynkaE2E); taps are page.touchscreen.tap at scene points from the hook's targets. "Visible" is judged on the
// RENDERED frame (renderedPixel), not on a texture. A test = a new browser context = a fresh device.
// Pixel oracles (pack PNGs public/assets/house/): the stage left of the shell is the building's sky colour (base #e8efeb, house #e7f4f4); inside the
// ground-right closed cell, local (63,180) = scene (1123,816) the base closed-cell picture is cream (255,245,223) where the house one is teal (~43,111,105).
import { test, expect } from '@playwright/test';
import { BRIDGE } from '../../src/data/rooms';
import { answerRight, openHouse, phaseIs, renderedPixel, screenIs, silenceSpeech, snapshot, tapScene, tapTarget, targets } from './support/hook';
import { passChoice, passWelcome, passWelcomeAsChild } from './support/welcome';
import { buyAllTasks, room, solveByRetype } from './support/salon';

test.setTimeout(180_000);

const QUIET = { e2eVariant: 'off' };
const SKY_POINT = { x: 120, y: 600 };
const CELL_POINT = { x: 1123, y: 816 };

// Literal oracles from the designer packs (not from HOUSE_GEOMETRY, which a regression would change too): the base sky #e8efeb, the house sky #e7f4f4.
const BASE_SKY: [number, number, number] = [0xe8, 0xef, 0xeb];
const HOUSE_SKY: [number, number, number] = [0xe7, 0xf4, 0xf4];
const near = (actual: number[], expected: number[], tolerance: number): boolean => actual.every((v, i) => Math.abs(v - expected[i]) <= tolerance);

test.beforeEach(async ({ page }) => {
    await silenceSpeech(page);
});

const intoRoom = async (page: import('@playwright/test').Page): Promise<void> => {
    await solveByRetype(page);
    await tapTarget(page, 'roomSwitch');
    await screenIs(page, 'room');
    await expect.poll(async () => (await room(page)).currentTask?.id, { timeout: 30_000 }).toBeTruthy();
};

test('#12 S-29 FR-045 FR-048 a base child\'s zoom-out is "Baza" and shows the base; Mostek returns with one tap', async ({ page }) => {
    await passWelcome(page, { ...QUIET, e2eStars: '40' }, 'space');
    await intoRoom(page);
    expect((await room(page)).roomId).toBe('bridge');
    await expect.poll(async () => (await room(page)).houseLabel).toBe('Baza');

    await tapTarget(page, 'houseButton');
    await screenIs(page, 'house');
    const view = async () => (await snapshot(page)).houseView;
    await expect.poll(async () => (await view())?.cells.length).toBe(4);
    await expect.poll(async () => (await view())?.shellReady, { timeout: 20_000 }).toBe(true);
    const shot = await snapshot(page);
    expect(shot.house?.id).toBe('base-1');
    expect(shot.houseView!.cells.map((cell) => cell.state)).toEqual(['current', 'closed', 'closed', 'closed']);
    expect(shot.houseView!.cells.find((cell) => cell.id === 'ground-left')).toMatchObject({ room: 'bridge' });

    // The rendered frame is the base's: its sky, and the base's closed cell (cream where the house's is teal).
    await expect.poll(async () => near(await renderedPixel(page, SKY_POINT), BASE_SKY, 4)).toBe(true);
    await expect.poll(async () => near(await renderedPixel(page, CELL_POINT), [255, 245, 223], 30)).toBe(true);

    // A closed cell does nothing.
    await tapScene(page, (await targets(page)).houseCells!['ground-right']);
    await tapScene(page, (await targets(page)).houseCells!['upper-left']);
    await screenIs(page, 'house');

    // Mostek returns with one tap.
    await tapScene(page, (await targets(page)).houseCells!['ground-left']);
    await screenIs(page, 'room');
    expect((await room(page)).roomId).toBe('bridge');
    expect((await room(page)).visiting).toBeNull();
});

test('#16 #2 S-29 S-30 FR-046 FR-047 after the last Mostek purchase the card hides "Baza"; "Dalej" moves to the Hangar; a reload keeps it', async ({ page }) => {
    const total = BRIDGE.tasks.reduce((sum, task) => sum + task.cost, 0);
    await passWelcome(page, { ...QUIET, e2eStars: String(total) }, 'space');
    await intoRoom(page);
    await expect.poll(async () => (await targets(page)).houseButton ?? null).not.toBeNull();
    await buyAllTasks(page, BRIDGE);
    await expect.poll(async () => (await room(page)).card, { timeout: 15_000 }).not.toBeNull();
    // The card hides the way into the house.
    expect((await targets(page)).houseButton ?? null).toBeNull();

    await tapTarget(page, 'cardNext');
    await expect.poll(async () => (await room(page)).card).toBeNull();
    expect((await room(page)).roomId).toBe('hangar');
    await expect.poll(async () => (await room(page)).houseLabel).toBe('Baza');
    await tapTarget(page, 'houseButton');
    await screenIs(page, 'house');
    await expect.poll(async () => (await snapshot(page)).houseView?.cells.find((cell) => cell.id === 'ground-left')?.state).toBe('done');
    await expect.poll(async () => (await snapshot(page)).houseView?.cells.find((cell) => cell.id === 'ground-right')?.state).toBe('current');
    await tapTarget(page, 'houseBack');
    await screenIs(page, 'room');

    // Back in the notebook (the answered task stays settled).
    await tapTarget(page, 'resume');
    await screenIs(page, 'task');

    await expect.poll(async () => (await snapshot(page)).save?.dirty, { timeout: 15_000 }).toBe(false);
    await page.reload();
    await page.waitForFunction(() => '__martynkaE2E' in window, undefined, { timeout: 15_000 });
    await screenIs(page, 'task');
    await phaseIs(page, 'first');
    // FR-046: stars keep accumulating in the base after the Mostek is done.
    const starsBefore = Number((await snapshot(page)).counterText);
    await answerRight(page);
    await phaseIs(page, 'done');
    await expect.poll(async () => Number((await snapshot(page)).counterText)).toBeGreaterThan(starsBefore);
    await tapTarget(page, 'roomSwitch');
    await screenIs(page, 'room');
    await expect.poll(async () => (await room(page)).roomId).toBe('hangar');
    expect((await room(page)).done).toBe(false);
    expect((await snapshot(page)).house?.id).toBe('base-1');
    await expect.poll(async () => (await room(page)).houseLabel).toBe('Baza');
});

test('#12 S-29 FR-048 after "Wróć" from the base the house child sees "Dom" and the house pictures', async ({ page }) => {
    await passWelcomeAsChild(page, 8, 9, { ...QUIET, e2eStars: '40' }, 'space');
    await expect.poll(async () => (await snapshot(page)).house?.id).toBe('base-1');
    await intoRoom(page);
    await expect.poll(async () => (await room(page)).houseLabel).toBe('Baza');
    await openHouse(page);
    await expect.poll(async () => (await snapshot(page)).houseView?.shellReady, { timeout: 20_000 }).toBe(true);
    await tapTarget(page, 'houseBack');
    await screenIs(page, 'room');
    await tapTarget(page, 'resume');
    await screenIs(page, 'task');

    // "Wróć" to the choice, then the house.
    await expect.poll(async () => (await targets(page)).themeBack ?? null).not.toBeNull();
    await tapScene(page, (await targets(page)).themeBack!);
    await screenIs(page, 'welcome');
    await passChoice(page, 'house');
    await expect.poll(async () => (await snapshot(page)).house?.id).toBe('house-1');
    await solveByRetype(page);
    await tapTarget(page, 'roomSwitch');
    await screenIs(page, 'room');
    await expect.poll(async () => (await room(page)).houseLabel).toBe('Dom');
    await openHouse(page);
    const shot = async () => (await snapshot(page)).houseView;
    await expect.poll(async () => (await shot())?.shellReady, { timeout: 20_000 }).toBe(true);
    expect((await snapshot(page)).house?.id).toBe('house-1');
    await expect.poll(async () => near(await renderedPixel(page, SKY_POINT), HOUSE_SKY, 4)).toBe(true);
    await expect.poll(async () => near(await renderedPixel(page, CELL_POINT), [255, 245, 223], 30)).toBe(false);
});
