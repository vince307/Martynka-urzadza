// Parent settings (plan parent-settings-progress, phases 10-11; test-plan risk #14 (proposed, refresh pending)):
// a child must not get into the settings by a tap or an ordinary press, and while the adult gate is open a tap
// must never reach the round underneath (phase 10); a stage change from the panel replaces the open round at once
// and keeps the stars, the auto-read choice lasts, and the preview shows the first-try miss (phase 11). The long press and the input switch exist only in the rendered game
// (touch gesture, DOM dialog over the canvas), so this runs in the chromium-hook project (window.__martynkaE2E).
// The finger is held with raw CDP touch events (holdTouch); the hold time is the gesture, not a wait.
import { test, expect, type Page } from '@playwright/test';
import { gateProblem, passWelcome, passWelcomeAsParent, typeIntoGate } from './support/welcome';
import { answerRight, answerWrong, holdTouch, phaseIs, playTaskRight, readHook, screenIs, silenceSpeech, snapshot, tapNext, tapScene, tapTarget, targets } from './support/hook';

const HOLD_MS = 2000; // balance.parentSettings.holdMs: the spec holds clearly under and over it
const DRIFT = 40; // scene px: over the 30 px tolerance, still inside the 96 px icon
const OCTOBER = 9;
const ROUND_LENGTH = 5;
const E3 = { age: '10+', stageLabel: 'Klasa 2, I półrocze', stage: 'E3', month: OCTOBER };

// One canvas at a time (see task-round.spec.ts).
test.describe.configure({ mode: 'serial' });
test.setTimeout(90_000);

/** Lets the game loop run n frames, so an input that did get through has been processed. */
const frames = (page: Page, n: number): Promise<void> =>
    page.evaluate(
        (count) => new Promise<void>((resolve) => {
            const step = (left: number): void => (left === 0 ? resolve() : void requestAnimationFrame(() => step(left - 1)));
            step(count);
        }),
        n,
    );

test('#14 (proposed) only a 2-second hold on the settings icon opens the adult gate, and taps under the dialog never reach the round', async ({ page }) => {
    await silenceSpeech(page);
    await passWelcome(page);
    await phaseIs(page, 'first');
    const gate = page.getByRole('dialog', { name: 'Pytanie dla rodzica' });
    const icon = (await targets(page)).settingsIcon;
    expect(icon).toBeDefined();

    // A tap, a hold under the threshold and a drifting hold over it never open anything.
    await tapScene(page, icon!);
    await expect(gate).toHaveCount(0);
    await holdTouch(page, icon!, HOLD_MS - 500);
    await expect(gate).toHaveCount(0);
    await holdTouch(page, icon!, HOLD_MS + 300, DRIFT); // over the threshold, but the finger wandered off its start
    await expect(gate).toHaveCount(0);
    expect((await snapshot(page)).inputEnabled).toBe(true);

    // A steady hold over the threshold opens the gate; lifting the finger over the dialog presses nothing.
    const before = await snapshot(page);
    await holdTouch(page, icon!, HOLD_MS + 300);
    await expect(gate).toBeVisible();
    await expect(gate.getByLabel('Wpisana liczba')).toHaveText('');
    expect((await snapshot(page)).inputEnabled).toBe(false);

    // A tap on the answer under the dialog does not reach the round.
    await answerRight(page);
    await frames(page, 5);
    const under = await snapshot(page);
    expect(under.phase).toBe('first');
    expect(under.index).toBe(before.index);
    expect(under.inputEnabled).toBe(false);

    // "Anuluj" gives the round back, and the round still takes a touch (the lost touchend left no stuck pointer).
    await gate.getByRole('button', { name: 'Anuluj', exact: true }).tap();
    await expect(gate).toHaveCount(0);
    await expect.poll(async () => (await snapshot(page)).inputEnabled).toBe(true);
    const after = await snapshot(page);
    expect(after.phase).toBe('first');
    expect(after.index).toBe(before.index);
    await answerRight(page);
    await phaseIs(page, 'done');
});

/** Holds the gear, passes the adult gate with the product read from the dialog; the settings panel is open afterwards. */
const openSettings = async (page: Page) => {
    const icon = (await targets(page)).settingsIcon;
    expect(icon).toBeDefined();
    await holdTouch(page, icon!, HOLD_MS + 300);
    await typeIntoGate(page, (await gateProblem(page)).product);
    const panel = page.getByRole('dialog', { name: 'Ustawienia rodzica' });
    await expect(panel).toBeVisible();
    return panel;
};

test('#14 (proposed) a parent stage change replaces the open round with the new stage at once and keeps the stars, and the auto-read choice survives the next stage change', async ({ page }) => {
    await silenceSpeech(page);
    await passWelcomeAsParent(page, E3);
    await phaseIs(page, 'first');
    await answerRight(page);
    await phaseIs(page, 'done');
    await expect.poll(async () => (await snapshot(page)).counterText).toBe('1');
    expect((await snapshot(page)).starsTotal).toBe(1);

    // First change: E4 with reading switched on (E4 does not read aloud by default).
    let panel = await openSettings(page);
    await panel.getByRole('button', { name: 'Klasa 2, II półrocze', exact: true }).tap();
    await panel.getByRole('button', { name: 'Włączone', exact: true }).tap();
    await panel.getByRole('button', { name: 'Zatwierdź', exact: true }).tap();
    await expect(panel).toHaveCount(0);
    await expect.poll(async () => (await snapshot(page)).stage).toBe('E4');
    const changed = await snapshot(page);
    expect(changed.learner).toMatchObject({ stage: 'E4', stageOverriddenByParent: true });
    expect(changed.index).toBe(0);
    expect(changed.phase).toBe('first');
    expect(changed.starsTotal).toBe(1);
    expect(changed.counterText).toBe('1');
    expect(changed.settings?.autoRead).toBe(true);
    expect(changed.autoRead).toBe(true);

    // Second change: back to E3 without touching the reading choice; it stays on.
    panel = await openSettings(page);
    await panel.getByRole('button', { name: 'Klasa 2, I półrocze', exact: true }).tap();
    await panel.getByRole('button', { name: 'Zatwierdź', exact: true }).tap();
    await expect(panel).toHaveCount(0);
    await expect.poll(async () => (await snapshot(page)).stage).toBe('E3');
    const back = await snapshot(page);
    expect(back.starsTotal).toBe(1);
    expect(back.settings?.autoRead).toBe(true);
    expect(back.autoRead).toBe(true);
});

test('#14 (proposed) the progress view shows the empty state, then the skill missed on the first try with its example', async ({ page }) => {
    await silenceSpeech(page);
    await passWelcomeAsParent(page, E3);
    await phaseIs(page, 'first');
    const empty = 'Za mało odpowiedzi z błędami. Zajrzyj tu po kilku rundach.';

    // A fresh learner: the preview has nothing to show yet.
    let panel = await openSettings(page);
    await expect(panel.getByText(empty)).toBeVisible();
    await panel.getByRole('button', { name: 'Anuluj', exact: true }).tap();
    await expect(panel).toHaveCount(0);
    await expect.poll(async () => (await snapshot(page)).inputEnabled).toBe(true);

    // A round with one first-try miss on its first task (put right on the second try), the rest right.
    // About 1 task in 10 comes from the previous stage, which the preview of E3 leaves out: then one more round.
    let given: number | string = '';
    for (let round = 0; round < 3; round++) {
        await phaseIs(page, 'first');
        given = await answerWrong(page);
        await phaseIs(page, 'second');
        await answerRight(page);
        await tapNext(page);
        for (let i = 1; i < ROUND_LENGTH; i++) {
            await playTaskRight(page);
        }
        await screenIs(page, 'summary');
        const history = (await readHook(page, 'snapshot'))?.learner?.history ?? [];
        if (history.some((h) => !h.firstTry && h.skillId.startsWith('E3.'))) {
            break;
        }
        await tapTarget(page, 'nextRound');
        await expect.poll(async () => (await snapshot(page)).screen).not.toBe('summary');
        if ((await snapshot(page)).screen === 'unlock') {
            await tapTarget(page, 'unlockNext');
        }
        await screenIs(page, 'task');
    }

    // The preview: exactly one skill to practise, with the value the test gave as the child's answer.
    panel = await openSettings(page);
    await expect(panel.getByText(empty)).toHaveCount(0);
    const list = panel.getByRole('list', { name: 'Do poćwiczenia' });
    await expect(list).toBeVisible();
    await expect(list.getByRole('listitem').filter({ hasText: /opanowanie \d+ z \d+/ })).toHaveCount(1);
    await expect(list).toContainText(`odpowiedź dziecka: ${given},`);
});
