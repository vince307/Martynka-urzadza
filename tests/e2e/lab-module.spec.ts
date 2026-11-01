// Risks #2 (progress survives a reload) and #16 (a purchase flow ends on its card, the balance is exact) of context/foundation/test-plan.md,
// S-33 lab-module phase 5 (FR-046 the Laboratorium, the base's third module; FR-045 the base wears its own cell frame).
// The hook build (window.__martynkaE2E); taps are page.touchscreen.tap at scene points from the hook's targets. "Visible" is judged on the
// RENDERED frame (renderedPixel), not on a texture. A test = a new browser context = a fresh device. Modelled on hangar-module.spec.ts.
// Pixel oracle: the current cell's frame at frame-local (8,187), i.e. scene (244,407) for upper-left, is the base's mint (85,204,181);
// house 1's frame there is butter (248,210,106) (research section 2).
import { test, expect } from '@playwright/test';
import { BRIDGE, HANGAR, LAB } from '../../src/data/rooms';
import { openHouse, renderedPixel, screenIs, silenceSpeech, snapshot, tapScene, tapTarget, targets } from './support/hook';
import { passWelcome } from './support/welcome';
import { buyAllTasks, room, solveByRetype } from './support/salon';

test.setTimeout(300_000);

const QUIET = { e2eVariant: 'off' };
const FRAME_POINT = { x: 244, y: 407 };
const MINT: [number, number, number] = [85, 204, 181];
const BUTTER: [number, number, number] = [248, 210, 106];
const near = (px: readonly number[], ref: readonly number[]): boolean => ref.every((v, i) => Math.abs(px[i] - v) <= 30);
// Literal oracles (the three modules cost 100 stars each), not summed from data a regression would change too.
const MODULE_TOTAL = 100;

test.beforeEach(async ({ page }) => {
    await silenceSpeech(page);
});

const intoRoom = async (page: import('@playwright/test').Page): Promise<void> => {
    await solveByRetype(page);
    await tapTarget(page, 'roomSwitch');
    await screenIs(page, 'room');
    await expect.poll(async () => (await room(page)).currentTask?.id, { timeout: 30_000 }).toBeTruthy();
};

const finishAndNext = async (page: import('@playwright/test').Page, def: typeof BRIDGE, next: string): Promise<void> => {
    await buyAllTasks(page, def);
    await expect.poll(async () => (await room(page)).card, { timeout: 15_000 }).not.toBeNull();
    await tapTarget(page, 'cardNext');
    await expect.poll(async () => (await room(page)).card).toBeNull();
    expect((await room(page)).roomId).toBe(next);
};

test('#2 S-33 FR-046 FR-045 the base shows Mostek and Hangar done and the Laboratorium in its upper-left cell in the base frame; a reload keeps it', async ({ page }) => {
    await passWelcome(page, { ...QUIET, e2eStars: String(2 * MODULE_TOTAL) }, 'space');
    await intoRoom(page);
    await finishAndNext(page, BRIDGE, 'hangar');
    await finishAndNext(page, HANGAR, 'lab');
    expect((await room(page)).tasksDone).toBe(0);

    await openHouse(page);
    await expect.poll(async () => (await snapshot(page)).houseView?.shellReady, { timeout: 20_000 }).toBe(true);
    // The rendered frame of the current cell is the base's mint, not house 1's butter.
    await expect.poll(async () => near(await renderedPixel(page, FRAME_POINT), MINT), { timeout: 15_000 }).toBe(true);
    expect(near(await renderedPixel(page, FRAME_POINT), BUTTER)).toBe(false);
    const view = (await snapshot(page)).houseView!;
    const state = (id: string): string | undefined => view.cells.find((cell) => cell.id === id)?.state;
    expect(state('ground-left')).toBe('done');
    expect(state('ground-right')).toBe('done');
    expect(state('upper-left')).toBe('current');
    expect(state('upper-right')).toBe('closed');
    expect(view.cells.find((cell) => cell.id === 'upper-left')).toMatchObject({ room: 'lab' });

    await tapScene(page, (await targets(page)).houseCells!['upper-left']);
    await screenIs(page, 'room');
    expect((await room(page)).roomId).toBe('lab');
    expect((await room(page)).visiting).toBeNull();

    await expect.poll(async () => (await snapshot(page)).save?.dirty, { timeout: 15_000 }).toBe(false);
    await page.reload();
    await page.waitForFunction(() => '__martynkaE2E' in window, undefined, { timeout: 15_000 });
    await screenIs(page, 'task');
    await solveByRetype(page);
    await tapTarget(page, 'roomSwitch');
    await screenIs(page, 'room');
    await expect.poll(async () => (await room(page)).roomId).toBe('lab');
});

test('#16 S-33 FR-046 the Laboratorium is bought to the end: three done tiles, no teaser; "Dalej" stays in the Laboratorium with change mode and "Baza"; the balance is exact', async ({ page }) => {
    await passWelcome(page, { ...QUIET, e2eStars: String(3 * MODULE_TOTAL) }, 'space');
    await intoRoom(page);
    await finishAndNext(page, BRIDGE, 'hangar');
    await finishAndNext(page, HANGAR, 'lab');
    await buyAllTasks(page, LAB);
    await expect.poll(async () => (await room(page)).card, { timeout: 15_000 }).not.toBeNull();

    const card = (await room(page)).card!;
    expect(card.items.map((item) => [item.kind, item.id, item.done])).toEqual([['room', 'bridge', true], ['room', 'hangar', true], ['room', 'lab', true]]);
    expect(card.items.some((item) => item.kind === 'teaser')).toBe(false);
    // The balance is the save's star count: every star spent, none below zero.
    expect((await snapshot(page)).stars).toBe(0);

    await tapTarget(page, 'cardNext');
    await expect.poll(async () => (await room(page)).card).toBeNull();
    const after = await room(page);
    expect(after.roomId).toBe('lab');
    expect(after.houseLabel).toBe('Baza');
    expect((await targets(page)).modeButton).toBeTruthy();
});
