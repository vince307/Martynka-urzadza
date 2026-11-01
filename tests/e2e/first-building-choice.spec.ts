// Risks #12 (first launch by touch), #2 (save across versions) and #16 (a purchase deducts once) of context/foundation/test-plan.md,
// S-28 first-building-choice phase 9 (FR-042 the choice, FR-043 "Wróć", FR-044 Mostek, FR-049 a v5 save resumes).
// The hook build (window.__martynkaE2E); every tap is a page.touchscreen.tap at a scene point from the hook's targets.
// `?e2eSave=v5-salon` meets the frozen v5 fixture (tests/fixtures/save-v5-salon.json) in an in-memory store; `?e2eStars` seeds a fresh
// start. A test = a new browser context = a fresh device. Oracles come from the fixture and from data/rooms.ts, not from copies.
import { test, expect } from '@playwright/test';
import saveV5 from '../fixtures/save-v5-salon.json';
import { SAVE_VERSION } from '../../src/core/save';
import { BRIDGE } from '../../src/data/rooms';
import { answerRight, phaseIs, playRoundRight, readHook, screenIs, silenceSpeech, snapshot, tapNext, tapScene, tapTarget, targets } from './support/hook';
import { openWelcome, passChoice, passWelcome, passWelcomeAsChild } from './support/welcome';
import { room, solveByRetype } from './support/salon';

test.setTimeout(120_000);
test.describe.configure({ mode: 'serial' });

const OCTOBER = 9;
const QUIET = { e2eVariant: 'off' };

test.beforeEach(async ({ page }) => {
    await silenceSpeech(page);
});

test('#12 S-28 FR-042 child path: age, then the choice, then Baza starts the task screen in the base', async ({ page }) => {
    await openWelcome(page, OCTOBER, { ...QUIET, e2eStars: '7' });
    await expect.poll(async () => (await readHook(page, 'targets'))?.ages?.length ?? 0).toBeGreaterThan(0);
    const age = (await targets(page)).ages!.find((a) => a.age === 8)!;
    await tapScene(page, age);
    await expect.poll(async () => (await snapshot(page)).welcomeView).toBe('choice');
    const { choices } = await targets(page);
    expect(choices?.house).toBeTruthy();
    expect(choices?.space).toBeTruthy();
    await tapScene(page, choices!.space);
    await screenIs(page, 'task');
    const task = await snapshot(page);
    expect(task.house?.id).toBe('base-1');
    expect(task.currentRoom).toBe('bridge');
    expect(task.stars).toBe(7);
});

test('#12 S-28 FR-042 parent path: the child still chooses, Dom keeps the salon', async ({ page }) => {
    await passWelcome(page, QUIET, 'house');
    const task = await snapshot(page);
    expect(task.house?.id).toBe('house-1');
    expect(task.currentRoom).toBe('salon');
});

test('#12 S-28 FR-043 "Wróć" returns to the choice until the first round ends', async ({ page }) => {
    await passWelcomeAsChild(page, 8, OCTOBER, QUIET, 'house');
    expect((await snapshot(page)).house?.id).toBe('house-1');
    await expect.poll(async () => (await targets(page)).themeBack ?? null).not.toBeNull();
    await tapScene(page, (await targets(page)).themeBack!);
    await screenIs(page, 'welcome');
    await expect.poll(async () => (await snapshot(page)).welcomeView).toBe('choice');
    await passChoice(page, 'space');
    const base = await snapshot(page);
    expect(base.house?.id).toBe('base-1');
    expect(base.currentRoom).toBe('bridge');

    // The warm-up (6) and the first ordinary round (5): "Wróć" stays until the latter ends.
    await playRoundRight(page, 6);
    await tapScene(page, (await targets(page)).nextRound!);
    await screenIs(page, 'task');
    await expect.poll(async () => (await targets(page)).themeBack ?? null).not.toBeNull();
    for (let i = 0; i < 5; i++) {
        await phaseIs(page, 'first');
        await answerRight(page);
        await phaseIs(page, 'done');
        await tapNext(page);
    }
    await screenIs(page, 'summary');
    await expect.poll(async () => (await targets(page)).themeBack ?? null).toBeNull();
});

test('#2 S-28 FR-049 a v5 salon save resumes in the house with no choice screen', async ({ page }) => {
    await page.goto(`./?e2eSave=v5-salon&e2eMonth=${OCTOBER}&e2eVariant=off`);
    await page.waitForFunction(() => '__martynkaE2E' in window, undefined, { timeout: 15_000 });
    // Never the welcome screen: the first screen a stored learner reaches is the task.
    await expect.poll(async () => (await readHook(page, 'snapshot'))?.screen).toBe('task');
    const loaded = await snapshot(page);
    expect(loaded.save).toMatchObject({ load: 'loaded', migratedFrom: 5 });
    expect(loaded.house?.id).toBe('house-1');
    expect(loaded.currentRoom).toBe('salon');
    expect(loaded.stars).toBe(saveV5.stars);
    expect(loaded.rooms?.salon?.tasksDone).toBe(saveV5.rooms.salon.tasksDone);
    // The first round's end writes the current format.
    await playRoundRight(page, 5);
    await expect.poll(async () => (await snapshot(page)).save?.store?.writtenVersion ?? null).toBe(SAVE_VERSION);
    expect(SAVE_VERSION).toBe(7);
});

test('#16 #2 S-28 FR-044 Mostek: the stage then a slot are bought once each; a reload resumes in Mostek without the choice', async ({ page }) => {
    await passWelcome(page, { ...QUIET, e2eStars: '40' }, 'space');
    await solveByRetype(page);
    await tapTarget(page, 'roomSwitch');
    await screenIs(page, 'room');
    await expect.poll(async () => (await room(page)).currentTask?.id, { timeout: 30_000 }).toBeTruthy();
    expect((await room(page)).roomId).toBe('bridge');
    const [stage, console_] = BRIDGE.tasks;

    await tapTarget(page, 'taskButton');
    await expect.poll(async () => (await room(page)).tasksDone, { timeout: 15_000 }).toBe(1);
    await expect.poll(async () => (await snapshot(page)).stars).toBe(40 - stage.cost);

    await tapTarget(page, 'taskButton');
    await expect.poll(async () => (await room(page)).panel.kind, { timeout: 15_000 }).toBe('open');
    const thumbs = (await targets(page)).thumbs ?? [];
    expect(thumbs.length).toBe(3);
    await tapScene(page, thumbs[1]);
    await expect.poll(async () => {
        const panel = (await room(page)).panel;
        return panel.kind === 'open' ? panel.preview : null;
    }).toBe(1);
    await tapTarget(page, 'choose');
    await expect.poll(async () => (await room(page)).tasksDone, { timeout: 15_000 }).toBe(2);
    await expect.poll(async () => (await snapshot(page)).stars).toBe(40 - stage.cost - console_.cost);
    const slot = (console_ as { slot: string }).slot;
    expect((await room(page)).chosen[slot]).toBe(1);

    await expect.poll(async () => (await snapshot(page)).save?.dirty, { timeout: 15_000 }).toBe(false);
    await page.reload();
    await page.waitForFunction(() => '__martynkaE2E' in window, undefined, { timeout: 15_000 });
    await screenIs(page, 'task');
    const after = await snapshot(page);
    expect(after.save).toMatchObject({ load: 'loaded' });
    expect(after.house?.id).toBe('base-1');
    expect(after.currentRoom).toBe('bridge');
    expect(after.stars).toBe(40 - stage.cost - console_.cost);
    expect(after.rooms?.bridge?.tasksDone).toBe(2);
    expect(after.rooms?.bridge?.chosen[slot]).toBe(1);
});
