// Risks #10 and #2 of context/foundation/test-plan.md (progress survives an update), F-04 rooms-as-data phase 7.
// `?e2eSave=v4-salon` starts the e2e build with the frozen v4 fixture (tests/fixtures/save-v4-salon.json: a salon in progress, no
// house) in an in-memory store, so the current build meets a real v4 save: the migration chain, the registry, the drawn room and
// the autosave write are the real ones. A new test = a new browser context = a fresh device. The oracles are read from the fixture.
import { test, expect, type Page } from '@playwright/test';
import saveV4 from '../fixtures/save-v4-salon.json';
import { answerRight, fromHook, phaseIs, playRoundRight, screenIs, silenceSpeech, snapshot, tapTarget } from './support/hook';
import { finishSalon, room } from './support/salon';
import { SAVE_VERSION } from '../../src/core/save';
import { SALON } from '../../src/data/rooms';

test.setTimeout(180_000);

const OPEN = './?e2eSave=v4-salon&e2eMonth=10&e2eVariant=off';
const HOUSE = { id: 'house-1', rooms: [{ room: 'salon', floor: 0, place: 0 }, { room: 'kitchen', floor: 0, place: 1 }] };

const open = async (page: Page): Promise<void> => {
    await silenceSpeech(page);
    await page.goto(OPEN);
    await page.waitForFunction(() => '__martynkaE2E' in window, undefined, { timeout: 15_000 });
    await fromHook(page, 'snapshot');
    await screenIs(page, 'task');
};

test('#10 rooms-as-data a v4 salon save opens in the v5 build with the same room, variants and stars', async ({ page }) => {
    await open(page);
    const loaded = await snapshot(page);
    expect(loaded.save).toMatchObject({ load: 'loaded', migratedFrom: 4 });
    expect(loaded.stars).toBe(saveV4.stars);
    expect(loaded.counterText).toBe(String(saveV4.stars));
    expect(loaded.house).toEqual(HOUSE);
    expect(loaded.currentRoom).toBe('salon');
    // Answer the open task, then look at the room the save carried over.
    await phaseIs(page, 'first');
    await answerRight(page);
    await phaseIs(page, 'done');
    await tapTarget(page, 'roomSwitch');
    await screenIs(page, 'room');
    await expect.poll(async () => (await room(page)).roomId).toBe('salon');
    const salon = await room(page);
    expect(salon.tasksDone).toBe(saveV4.rooms.salon.tasksDone);
    expect(salon.chosen).toEqual(saveV4.rooms.salon.chosen);
    expect(salon.stageDone).toBe(true);
    expect(salon.shown).toMatchObject(saveV4.rooms.salon.chosen);
});

test('#2 rooms-as-data after a round the save is written as v6 with the house and the v4 copy right after it', async ({ page }) => {
    await open(page);
    await playRoundRight(page, 5);
    await expect.poll(async () => (await snapshot(page)).save?.store?.writtenVersion ?? null).toBe(SAVE_VERSION);
    const store = (await snapshot(page)).save!.store!;
    expect(SAVE_VERSION).toBe(6);
    expect(store.writtenHouse).toEqual(HOUSE);
    expect(store.ops.slice(0, 2)).toEqual(['write', 'backup']);
    expect(store.ops.filter((op) => op === 'backup')).toHaveLength(1);
});

test('#10 rooms-as-data a finished salon reloads into the kitchen (S-22), the salon state kept and the kitchen empty', async ({ page }) => {
    await finishSalon(page, {});
    const done = await room(page);
    expect(done.card?.items.map((item) => `${item.kind}:${item.done}:${item.unlocked}`)).toEqual(['room:true:true', 'room:false:true']);
    expect(done.doneMiniature).toBe('live');
    // The purchases are flushed at once; wait for the real IndexedDB write before the reload.
    await expect.poll(async () => (await snapshot(page)).save?.dirty, { timeout: 15_000 }).toBe(false);
    await page.reload();
    await page.waitForFunction(() => '__martynkaE2E' in window, undefined, { timeout: 15_000 });
    await screenIs(page, 'task');
    await expect.poll(async () => (await snapshot(page)).currentRoom).toBe('kitchen');
    // Read back through the hook only (profile § 9: a test never opens IndexedDB): the reloaded page loaded the stored save, and
    // its registry is what the load path made of it.
    const after = await snapshot(page);
    expect(after.save).toMatchObject({ load: 'loaded', migratedFrom: null });
    expect(after.house).toEqual(HOUSE);
    expect(after.rooms?.salon?.tasksDone).toBe(SALON.tasks.length);
    expect(Object.keys(after.rooms ?? {})).toEqual(['salon', 'kitchen']);
    expect(after.rooms?.kitchen?.tasksDone).toBe(0);
});
