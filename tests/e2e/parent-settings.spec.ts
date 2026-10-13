// Parent settings (plan parent-settings-progress, phase 10; test-plan risk #14 (proposed, refresh pending)):
// a child must not get into the settings by a tap or an ordinary press, and while the adult gate is open a tap
// must never reach the round underneath. The long press and the input switch exist only in the rendered game
// (touch gesture, DOM dialog over the canvas), so this runs in the chromium-hook project (window.__martynkaE2E).
// The finger is held with raw CDP touch events (holdTouch); the hold time is the gesture, not a wait.
import { test, expect, type Page } from '@playwright/test';
import { passWelcome } from './support/welcome';
import { answerRight, holdTouch, phaseIs, silenceSpeech, snapshot, tapScene, targets } from './support/hook';

const HOLD_MS = 2000; // balance.parentSettings.holdMs: the spec holds clearly under and over it
const DRIFT = 40; // scene px: over the 30 px tolerance, still inside the 96 px icon

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
