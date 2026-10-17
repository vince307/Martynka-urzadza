// Risks #2 and #10 of context/foundation/test-plan.md (progress survives an update), S-15 phase 11.
// `?e2eSave=v1` starts the e2e build with the frozen v1 fixture (tests/fixtures/save-v1.json) in an in-memory store, so the
// v4 build meets a real v1 save: the migration chain, the registry and the drawn counter are the real ones. IndexedDB is
// never opened from here; a new test = a new browser context = a fresh device. The write log is the store seam's own
// (snapshot.save.store), not the autosaver's view of itself.
// The fixture's `currentRoom` ("living") is unknown to this build and is repaired to the salon, so the room is not compared.
// The learner is compared by stage, mastery, answer history and the pending unlock (the unlocked steps may be raised by the calendar floor).
import { test, expect } from '@playwright/test';
import saveV1 from '../fixtures/save-v1.json';
import { fromHook, playRoundRight, screenIs, silenceSpeech, snapshot } from './support/hook';
import { SAVE_VERSION } from '../../src/core/save';

test.setTimeout(120_000);

const OPEN = '/?e2eSave=v1&e2eMonth=10&e2eVariant=off';

test('#10 a v1 save loads in the v4 build with the same stars, stage and learner history', async ({ page }) => {
    await silenceSpeech(page);
    await page.goto(OPEN);
    await page.waitForFunction(() => '__martynkaE2E' in window, undefined, { timeout: 15_000 });
    await fromHook(page, 'snapshot');
    // A learner came from the save: no welcome screen.
    await screenIs(page, 'task');
    const loaded = await snapshot(page);
    expect(loaded.save).toMatchObject({ load: 'loaded', migratedFrom: 1 });
    expect(loaded.stars).toBe(saveV1.stars);
    expect(loaded.counterText).toBe(String(saveV1.stars));
    expect(loaded.learner?.stage).toBe(saveV1.learner.stage);
    // The hook's learner is the whole session learner (frozen clone); its type lists only the fields most specs read.
    const learner = loaded.learner as unknown as { mastery: Record<string, number>; history: { skillId: string; firstTry: boolean }[] };
    expect(learner.mastery).toEqual(saveV1.learner.mastery);
    expect(learner.history.map((h) => ({ skillId: h.skillId, firstTry: h.firstTry }))).toEqual(
        saveV1.learner.history.map((h) => ({ skillId: h.skillId, firstTry: h.firstTry })),
    );
    expect(loaded.learner?.pendingUnlock).toBe(saveV1.learner.pendingUnlock.step);
});

test('#2 after a round the migrated save is written as v4 with the v1 backup right after it', async ({ page }) => {
    await silenceSpeech(page);
    await page.goto(OPEN);
    await page.waitForFunction(() => '__martynkaE2E' in window, undefined, { timeout: 15_000 });
    await screenIs(page, 'task');
    await playRoundRight(page, 5);
    await expect.poll(async () => (await snapshot(page)).save?.store?.writtenVersion ?? null).toBe(SAVE_VERSION);
    const store = (await snapshot(page)).save!.store!;
    expect(store.ops.slice(0, 2)).toEqual(['write', 'backup']);
    expect(store.ops.filter((op) => op === 'backup')).toHaveLength(1);
    // The write carried the balance the round earned on top of the migrated stars.
    expect((await snapshot(page)).stars).toBeGreaterThan(saveV1.stars);
});
