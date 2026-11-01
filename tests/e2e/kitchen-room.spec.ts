// Risks #2 (progress kept) and #16 (a purchase deducts once, a change takes nothing) of context/foundation/test-plan.md,
// S-22 kitchen-room phase 8. The real path: the last salon purchase -> the celebration card -> "Dalej" -> the kitchen's pictures
// load at runtime -> the save is written -> a reload opens the kitchen -> kitchen purchases -> its own card -> change mode ->
// the finished salon visited from the kitchen. Runs in the chromium-hook project (read-only window.__martynkaE2E); a test is a
// new browser context, so a fresh device. State is read through the hook only (profile § 9: a test never opens IndexedDB).
import { test, expect, type Page } from '@playwright/test';
import { answerRight, openHouse, screenIs, snapshot, tapScene, tapTarget, targets, phaseIs } from './support/hook';
import { finishSalon, room } from './support/salon';
import { KITCHEN, SALON } from '../../src/data/rooms';

test.setTimeout(240_000);

const salonTotal = SALON.tasks.reduce((sum, task) => sum + task.cost, 0);
const kitchenTotal = KITCHEN.tasks.reduce((sum, task) => sum + task.cost, 0);

/** Buys one renovation task in the open room (the stage by one tap, a slot through the panel with the first look). */
const buyTask = async (page: Page, kind: 'stage' | 'slot'): Promise<void> => {
    const before = (await room(page)).tasksDone;
    await tapTarget(page, 'taskButton');
    if (kind === 'slot') {
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

/** Finishes the salon with stars for both rooms and presses "Dalej" on the celebration card: the child stands in the kitchen. */
const intoKitchen = async (page: Page): Promise<void> => {
    await finishSalon(page, { e2eStars: String(salonTotal + kitchenTotal) });
    await tapTarget(page, 'cardNext');
    await expect.poll(async () => (await snapshot(page)).currentRoom).toBe('kitchen');
    await expect.poll(async () => (await room(page)).roomId).toBe('kitchen');
    await expect.poll(async () => (await room(page)).currentTask?.id, { timeout: 30_000 }).toBe(KITCHEN.tasks[0].id);
};

/** In an open change panel: previews another look than `current` and presses "Wybieram". Returns the look chosen. */
const changeTo = async (page: Page, current: number): Promise<number> => {
    const variant = (current + 1) % 3;
    const thumbs = (await targets(page)).thumbs ?? [];
    expect(thumbs.length).toBe(3);
    await tapScene(page, thumbs[variant]);
    await expect.poll(async () => {
        const panel = (await room(page)).panel;
        return panel.kind === 'open' ? panel.preview : null;
    }, { timeout: 15_000 }).toBe(variant);
    await tapTarget(page, 'choose');
    await expect.poll(async () => (await room(page)).panel.kind).toBe('closed');
    return variant;
};

test('#2 S-22 after the salon the card celebrates and "Dalej" moves into the kitchen, kept after a reload', async ({ page }) => {
    await finishSalon(page, { e2eStars: String(salonTotal + kitchenTotal) });
    const done = await room(page);
    expect(done.card?.items.map((item) => `${item.kind}:${item.done}:${item.unlocked}`)).toEqual(['room:true:true', 'room:false:true', 'room:false:false']);
    expect(done.card?.celebration.intensity).toBe('room');
    expect(done.card?.celebration.burst).toBeGreaterThan(0);
    const before = await snapshot(page);
    expect(before.stars).toBe(kitchenTotal);
    expect(before.currentRoom).toBe('salon');

    await tapTarget(page, 'cardNext');
    await expect.poll(async () => (await snapshot(page)).currentRoom).toBe('kitchen');
    const moved = await snapshot(page);
    expect(moved.rooms?.kitchen).toEqual({ tasksDone: 0, chosen: {} });
    expect(moved.rooms?.salon).toEqual(before.rooms?.salon);
    expect(moved.stars).toBe(before.stars);
    // The kitchen's pictures arrived by the runtime load, and the move was written.
    await expect.poll(async () => (await snapshot(page)).roomLoad?.settled ?? []).toContain('kitchen');
    await expect.poll(async () => (await snapshot(page)).save?.dirty, { timeout: 15_000 }).toBe(false);

    await page.reload();
    await page.waitForFunction(() => '__martynkaE2E' in window, undefined, { timeout: 15_000 });
    await screenIs(page, 'task');
    await expect.poll(async () => (await snapshot(page)).currentRoom).toBe('kitchen');
    const after = await snapshot(page);
    expect(after.rooms?.salon?.tasksDone).toBe(SALON.tasks.length);
    expect(after.rooms?.kitchen?.tasksDone).toBe(0);
    expect(after.stars).toBe(kitchenTotal);
    await phaseIs(page, 'first');
    await answerRight(page);
    await phaseIs(page, 'done');
    await tapTarget(page, 'roomSwitch');
    await screenIs(page, 'room');
    await expect.poll(async () => (await room(page)).roomId).toBe('kitchen');
});

test('#16 S-22 S-25 the kitchen furnishes like the salon and ends with its own card', async ({ page }) => {
    await intoKitchen(page);
    let stars = (await snapshot(page)).stars;
    expect(stars).toBe(kitchenTotal);
    for (const task of KITCHEN.tasks) {
        await buyTask(page, task.kind);
        stars -= task.cost;
        // Each purchase deducts its cost once.
        expect((await snapshot(page)).stars).toBe(stars);
    }
    expect(stars).toBe(0);
    await expect.poll(async () => (await room(page)).card, { timeout: 15_000 }).not.toBeNull();
    const done = await room(page);
    expect(done.roomId).toBe('kitchen');
    expect(done.done).toBe(true);
    expect(done.card?.items.slice(0, 2).map((item) => `${item.kind}:${item.done}`)).toEqual(['room:true', 'room:true']);
    expect(done.card?.items[2]).toMatchObject({ kind: 'room', id: 'children', done: false, unlocked: true });

    // "Dalej" moves the child into the children's room (S-25), the kitchen state untouched; the free change of the done kitchen
    // is proved through a visit from the house cross-section.
    const kitchenBefore = (await snapshot(page)).rooms?.kitchen;
    await tapTarget(page, 'cardNext');
    await expect.poll(async () => (await room(page)).card).toBeNull();
    await expect.poll(async () => (await snapshot(page)).currentRoom).toBe('children');
    expect((await snapshot(page)).rooms?.kitchen).toEqual(kitchenBefore);
    await openHouse(page);
    await expect.poll(async () => (await targets(page)).houseCells?.['ground-right'] ?? null).not.toBeNull();
    await tapScene(page, (await targets(page)).houseCells!['ground-right']);
    await screenIs(page, 'room');
    await expect.poll(async () => (await room(page)).roomId, { timeout: 15_000 }).toBe('kitchen');
    expect((await room(page)).visiting).toBe('kitchen');
    await tapTarget(page, 'modeButton');
    await expect.poll(async () => (await room(page)).mode).toBe('change');
    const slot = KITCHEN.slots[0].id;
    const at = (await targets(page)).slots?.[slot];
    expect(at).toBeDefined();
    const current = (await room(page)).chosen[slot];
    await tapScene(page, at!);
    await expect.poll(async () => (await room(page)).panel.kind).toBe('open');
    expect((await room(page)).panel).toMatchObject({ mode: 'change', slot });
    const next = await changeTo(page, current);
    const changed = await snapshot(page);
    expect(changed.room?.chosen[slot]).toBe(next);
    expect(changed.rooms?.kitchen?.chosen[slot]).toBe(next);
    expect(changed.stars).toBe(0);
});

test('S-22 reduced motion: the card appears at once without a burst', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await finishSalon(page, { e2eStars: String(salonTotal) });
    const card = (await room(page)).card;
    expect(card?.celebration.intensity).toBe('room');
    expect(card?.celebration.revealMs).toBe(0);
    expect(card?.celebration.burst).toBe(0);
});

test('#16 S-22 FR-019 from the kitchen the finished salon opens for free changes and "Do pokoju" returns to the kitchen', async ({ page }) => {
    await intoKitchen(page);
    const start = await snapshot(page);
    expect(start.stars).toBe(kitchenTotal);
    await expect.poll(async () => (await targets(page)).houseButton ?? null).not.toBeNull();
    await openHouse(page);
    await expect.poll(async () => (await targets(page)).houseCells?.['ground-left'] ?? null).not.toBeNull();
    await tapScene(page, (await targets(page)).houseCells!['ground-left']);
    await screenIs(page, 'room');
    await expect.poll(async () => (await room(page)).roomId, { timeout: 15_000 }).toBe('salon');
    const visit = await room(page);
    expect(visit.visiting).toBe('salon');
    expect((await targets(page)).taskButton ?? null).toBeNull();

    // The finished salon changes for free; the change is written to the salon, the kitchen stays the room in renovation.
    await tapTarget(page, 'modeButton');
    await expect.poll(async () => (await room(page)).mode).toBe('change');
    const sofaAt = (await targets(page)).slots?.sofa;
    expect(sofaAt).toBeDefined();
    const sofaBefore = (await room(page)).chosen.sofa;
    await tapScene(page, sofaAt!);
    await expect.poll(async () => (await room(page)).panel.kind).toBe('open');
    const next = await changeTo(page, sofaBefore);
    const changed = await snapshot(page);
    expect(changed.rooms?.salon?.chosen.sofa).toBe(next);
    expect(next).not.toBe(sofaBefore);
    expect(changed.stars).toBe(kitchenTotal);
    expect(changed.currentRoom).toBe('kitchen');
    expect(changed.rooms?.kitchen?.tasksDone).toBe(0);

    // Back to the notebook and into the room again: the kitchen, not the salon that was visited.
    await tapTarget(page, 'resume');
    await screenIs(page, 'task');
    await tapTarget(page, 'roomSwitch');
    await screenIs(page, 'room');
    await expect.poll(async () => (await room(page)).roomId).toBe('kitchen');
    expect((await room(page)).visiting).toBeNull();

    // The change survived a reload, and the child still lands in the kitchen.
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
