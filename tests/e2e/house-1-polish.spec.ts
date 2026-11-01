// Risks #16 (a purchase flow renovates in stages, the balance is exact) and #2 (a save written by version N loads in N+1) of
// context/foundation/test-plan.md, S-32 house-1-polish phase 6 (FR-033 the kitchen in three stages, FR-021 the v6 kitchen moves to v7,
// FR-038 the salon on cream in the room and in the house cross-section).
// The hook build (window.__martynkaE2E). "Visible" is judged on the RENDERED frame (renderedPixel), never on a texture. A test = a new
// browser context = a fresh device. Modelled on kids-room.spec.ts, first-building-choice.spec.ts and rooms-as-data.spec.ts.
import { test, expect } from '@playwright/test';
import saveV6Kitchen from '../fixtures/save-v6-kitchen-mid.json';
import { KITCHEN, SALON } from '../../src/data/rooms';
import { answerRight, openHouse, phaseIs, renderedPixel, screenIs, silenceSpeech, snapshot, tapScene, tapTarget, targets } from './support/hook';
import { passWelcome } from './support/welcome';
import { buyAllTasks, finishSalon, room, solveByRetype } from './support/salon';

test.setTimeout(300_000);

// Literal oracle (FR-033): the nine tasks of the kitchen, in order (5, 6, 7 are the three stages). Not summed from the data a regression changes too.
const KITCHEN_COSTS = [5, 6, 7, 7, 9, 10, 12, 13, 15];

type Rgb = readonly [number, number, number];
const near = (px: readonly number[], ref: Rgb, tol: number): boolean => ref.every((v, i) => Math.abs(px[i] - v) <= tol);
const apart = (a: readonly number[], b: readonly number[], by: number): boolean => a.some((v, i) => Math.abs(v - b[i]) >= by);
const nearest = (px: readonly number[], table: readonly Rgb[]): number => {
    const dist = table.map((ref) => ref.reduce((sum, v, i) => sum + (px[i] - v) ** 2, 0));
    return dist.indexOf(Math.min(...dist));
};

// Two kitchen wall points, rendered RGB measured in this spec's probe run (the WebP pictures composed with the shadows layer; the
// stage 3 look is the "after" picture). Stage order: before, stage 1, stage 2, renovated. Tolerance 12 per channel.
// WALL_UPPER separates before / stage 1 / stage 2 (40 and 65 apart); WALL_LOW also separates stage 2 from the renovated look (25 apart).
const WALL_UPPER = { x: 1200, y: 300 };
const WALL_UPPER_BY_STAGE: readonly Rgb[] = [[127, 67, 23], [153, 107, 63], [218, 173, 135], [237, 194, 153]];
const WALL_LOW = { x: 480, y: 580 };
const WALL_LOW_BY_STAGE: readonly Rgb[] = [[75, 83, 70], [98, 112, 98], [42, 123, 116], [67, 126, 115]];
const showsKitchenStage = async (page: import('@playwright/test').Page, stage: number): Promise<boolean> => {
    const upper = await renderedPixel(page, WALL_UPPER);
    const low = await renderedPixel(page, WALL_LOW);
    return near(upper, WALL_UPPER_BY_STAGE[stage], 12) && near(low, WALL_LOW_BY_STAGE[stage], 12)
        && nearest(low, WALL_LOW_BY_STAGE) === stage && (stage === 3 || nearest(upper, WALL_UPPER_BY_STAGE) === stage);
};

// The cream of the polish pack (the board around the room and the closed cell). The old salon board was green (197,226,159 at the
// scene corner), so cream at (100, 100) can only come from the new picture.
const CREAM: Rgb = [255, 245, 223];
const BOARD_CORNER = { x: 100, y: 100 };
// House cross-section, ground-left cell (x 252, y 636, 608 x 342): its top-left corner area is board, the room interior is not.
const CELL_BOARD = { x: 272, y: 656 };
const CELL_INTERIOR = { x: 300, y: 700 };

const salonTotal = SALON.tasks.reduce((sum, task) => sum + task.cost, 0);
const kitchenTotal = KITCHEN.tasks.reduce((sum, task) => sum + task.cost, 0);

test('#16 S-32 FR-033 the kitchen renovates in three stages, each a new background in the rendered frame, then is furnished; the balance is exact', async ({ page }) => {
    await finishSalon(page, { e2eStars: String(salonTotal + kitchenTotal) });
    await tapTarget(page, 'cardNext');
    await expect.poll(async () => (await snapshot(page)).currentRoom).toBe('kitchen');
    await expect.poll(async () => (await room(page)).currentTask?.id, { timeout: 30_000 }).toBe(KITCHEN.tasks[0].id);
    expect((await room(page)).tasksDone).toBe(0);
    let stars = (await snapshot(page)).stars;
    expect(stars).toBe(kitchenTotal);
    expect(KITCHEN.tasks.map((task) => task.cost)).toEqual(KITCHEN_COSTS);

    await expect.poll(async () => showsKitchenStage(page, 0), { timeout: 15_000 }).toBe(true);
    let previous = await renderedPixel(page, WALL_UPPER);
    for (let stage = 1; stage <= 3; stage++) {
        await tapTarget(page, 'taskButton');
        await expect.poll(async () => (await room(page)).tasksDone, { timeout: 15_000 }).toBe(stage);
        stars -= KITCHEN_COSTS[stage - 1];
        expect((await snapshot(page)).stars).toBe(stars);
        // The rendered frame moved to this stage's background (after the cross-fade), a visible step from the previous one.
        await expect.poll(async () => showsKitchenStage(page, stage), { timeout: 15_000 }).toBe(true);
        const current = await renderedPixel(page, WALL_UPPER);
        if (stage < 3) expect(apart(current, previous, 30), `stage ${stage}: ${current.join(',')} vs ${previous.join(',')}`).toBe(true);
        previous = current;
    }
    // Furnished to the end with the first look of each piece; the stars run out exactly at the last purchase.
    const furniture = { tasks: KITCHEN.tasks.slice(3) };
    await buyAllTasks(page, furniture);
    for (let i = 3; i < KITCHEN_COSTS.length; i++) stars -= KITCHEN_COSTS[i];
    expect(stars).toBe(0);
    expect((await snapshot(page)).stars).toBe(0);
    await expect.poll(async () => (await room(page)).card, { timeout: 15_000 }).not.toBeNull();
});

test('#2 S-32 FR-021 a v6 kitchen with renewed walls and two pieces opens on v7 unchanged to the eye', async ({ page }) => {
    await silenceSpeech(page);
    await page.goto('./?e2eSave=v6-kitchen&e2eMonth=9&e2eVariant=off');
    await page.waitForFunction(() => '__martynkaE2E' in window, undefined, { timeout: 15_000 });
    await screenIs(page, 'task');
    const loaded = await snapshot(page);
    expect(loaded.save).toMatchObject({ load: 'loaded', migratedFrom: 6 });
    expect(loaded.currentRoom).toBe('kitchen');
    expect(loaded.stars).toBe(saveV6Kitchen.stars);
    // Answer the open task, then look at the room the save carried over.
    await phaseIs(page, 'first');
    await answerRight(page);
    await phaseIs(page, 'done');
    await tapTarget(page, 'roomSwitch');
    await screenIs(page, 'room');
    await expect.poll(async () => (await room(page)).roomId).toBe('kitchen');
    await expect.poll(async () => (await room(page)).currentTask?.id, { timeout: 30_000 }).toBe('place-kitchen-table');
    const kitchen = await room(page);
    // v6: stage + counter + fridge bought (tasksDone 3); v7: three stages + counter + fridge (5), the same pieces.
    expect(saveV6Kitchen.rooms.kitchen.tasksDone).toBe(3);
    expect(kitchen.tasksDone).toBe(5);
    expect(kitchen.chosen).toEqual(saveV6Kitchen.rooms.kitchen.chosen);
    expect(kitchen.shown).toMatchObject(saveV6Kitchen.rooms.kitchen.chosen);
    // The wall reads the renovated look, not the neglected one and not a stage.
    await expect.poll(async () => showsKitchenStage(page, 3), { timeout: 15_000 }).toBe(true);
    // The first start after the step is written at once as v7 with the v6 copy right after it.
    await expect.poll(async () => (await snapshot(page)).save?.store?.writtenVersion ?? null, { timeout: 15_000 }).toBe(7);
    const store = (await snapshot(page)).save!.store!;
    expect(store.ops.slice(0, 2)).toEqual(['write', 'backup']);
    expect(store.ops.filter((op) => op === 'backup')).toHaveLength(1);
    await expect.poll(async () => (await snapshot(page)).save?.backup).toBe('done');
});

test('#2 S-32 FR-038 the salon stands on cream in the room and in the house cross-section', async ({ page }) => {
    await silenceSpeech(page);
    await passWelcome(page, { e2eStars: '20', e2eVariant: 'off' });
    await solveByRetype(page);
    await tapTarget(page, 'roomSwitch');
    await screenIs(page, 'room');
    await expect.poll(async () => (await room(page)).currentTask?.id, { timeout: 30_000 }).toBeTruthy();
    await expect.poll(async () => near(await renderedPixel(page, BOARD_CORNER), CREAM, 12), { timeout: 15_000 }).toBe(true);
    await tapTarget(page, 'taskButton');
    await expect.poll(async () => (await room(page)).tasksDone, { timeout: 15_000 }).toBe(1);
    await expect.poll(async () => near(await renderedPixel(page, BOARD_CORNER), CREAM, 12), { timeout: 15_000 }).toBe(true);

    await openHouse(page);
    await expect.poll(async () => (await snapshot(page)).houseView?.shellReady, { timeout: 20_000 }).toBe(true);
    const cell = (await targets(page)).houseCells!['ground-left'];
    expect(cell).toBeDefined();
    // The miniature of the salon is captured into the cell: the board corner is cream, the room interior is not.
    await expect.poll(async () => apart(await renderedPixel(page, CELL_INTERIOR), CREAM, 40), { timeout: 20_000 }).toBe(true);
    expect(near(await renderedPixel(page, CELL_BOARD), CREAM, 12)).toBe(true);
    await tapScene(page, cell);
});
