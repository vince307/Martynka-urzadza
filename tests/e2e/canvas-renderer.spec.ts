// Risks #12 (first launch behind the welcome backdrop), #16 (room purchase) and #14 (parent settings panel) of
// context/foundation/test-plan.md for change audit-art-renderer (phase 5, finding L-1): under Phaser's Canvas renderer there are no
// filters, so the worn salon is drawn ungraded; the game must record that once (`artFallbacks?.worn`) and the "Obrazki" section must
// name it. WebGL is switched off by Chromium launch flags so the production AUTO -> Canvas path runs (no seam). The WebGL control is
// in salon-style.spec.ts. Runs in the chromium-hook project (read-only window.__martynkaE2E).
import { test, expect, type Page } from '@playwright/test';
import { openSettings, openWelcome, passWelcome } from './support/welcome';
import { answerRight, answerWrong, housePixel, openHouse, phaseIs, screenIs, silenceSpeech, snapshot, tapTarget } from './support/hook';

test.setTimeout(120_000);
test.use({ launchOptions: { args: ['--disable-webgl', '--disable-webgl2', '--disable-3d-apis'] } });

const WORN_PLAIN = 'Przeglądarka rysuje grę w prostszym trybie, więc meble przed remontem nie wyglądają na stare.';

const watchErrors = (page: Page): string[] => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    return errors;
};

test('#12 canvas-renderer the welcome backdrop under Canvas records the ungraded worn look', async ({ page }) => {
    const errors = watchErrors(page);
    const renderer: string[] = [];
    page.on('console', (message) => {
        if (message.text().startsWith('Renderer:')) {
            renderer.push(message.text());
        }
    });
    await openWelcome(page, 9);
    await expect.poll(async () => (await snapshot(page)).backdrop?.drawn).toBe(true);
    const state = await snapshot(page);
    expect(state.backdrop?.renderer).toBe('canvas');
    await expect.poll(async () => (await snapshot(page)).artFallbacks?.worn).toBe('ungraded');
    expect(renderer.filter((line) => line.startsWith('Renderer: Canvas'))).toHaveLength(1);
    expect(errors).toEqual([]);
});

test('#16 canvas-renderer the before room under Canvas shows the worn set ungraded and still sells the stage', async ({ page }) => {
    const errors = watchErrors(page);
    await silenceSpeech(page);
    await passWelcome(page, { e2eVariant: 'off', e2eStars: '40' });
    await phaseIs(page, 'first');
    await answerWrong(page);
    await phaseIs(page, 'second');
    await answerWrong(page);
    await phaseIs(page, 'solution');
    for (let guard = 0; guard < 10 && (await snapshot(page)).phase === 'solution'; guard++) {
        const before = await snapshot(page);
        await tapTarget(page, 'step');
        await expect.poll(async () => {
            const now = await snapshot(page);
            return now.phase !== 'solution' || now.solutionStep > before.solutionStep;
        }).toBe(true);
    }
    await phaseIs(page, 'retype');
    await answerRight(page);
    await phaseIs(page, 'done');
    await tapTarget(page, 'roomSwitch');
    await screenIs(page, 'room');

    const start = (await snapshot(page)).room!;
    expect(start.worn.keys.length).toBeGreaterThan(0);
    expect(start.worn.graded).toBe(false);
    expect((await snapshot(page)).artFallbacks?.worn).toBe('ungraded');
    expect(start.taskKind).toBe('stage');
    const cost = start.currentTask!.cost;
    await tapTarget(page, 'taskButton');
    await expect.poll(async () => (await snapshot(page)).room!.stageDone).toBe(true);
    expect((await snapshot(page)).stars).toBe(40 - cost);
    expect(errors).toEqual([]);
});

test('#14 canvas-renderer the pictures section names the plain look', async ({ page }) => {
    const errors = watchErrors(page);
    await silenceSpeech(page);
    await passWelcome(page, { e2eVariant: 'off' });
    const panel = await openSettings(page);
    await expect(panel.getByText(WORN_PLAIN, { exact: true })).toBeVisible();
    await expect(panel.getByText(/^Zamiast obrazka gra rysuje/)).toHaveCount(0);
    expect(errors).toEqual([]);
});

test('S-23 canvas-renderer house miniatures are captured under Canvas', async ({ page }) => {
    const errors = watchErrors(page);
    await silenceSpeech(page);
    await passWelcome(page, { e2eVariant: 'off', e2eStars: '40' });
    await phaseIs(page, 'first');
    await answerWrong(page);
    await phaseIs(page, 'second');
    await answerWrong(page);
    await phaseIs(page, 'solution');
    for (let guard = 0; guard < 10 && (await snapshot(page)).phase === 'solution'; guard++) {
        const before = await snapshot(page);
        await tapTarget(page, 'step');
        await expect.poll(async () => {
            const now = await snapshot(page);
            return now.phase !== 'solution' || now.solutionStep > before.solutionStep;
        }).toBe(true);
    }
    await phaseIs(page, 'retype');
    await answerRight(page);
    await phaseIs(page, 'done');
    await tapTarget(page, 'roomSwitch');
    await screenIs(page, 'room');
    await openHouse(page);
    await expect.poll(async () => (await housePixel(page, 'ground-left'))?.[3] ?? null, { timeout: 15_000 }).toBe(255);
    expect(errors).toEqual([]);
});
