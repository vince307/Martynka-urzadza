// Risk #11 (a round played to the end by touch) of context/foundation/test-plan.md, for the fox guide (change fox-guide, PRD FR-037):
// the fox in the notebook corner follows the round with its pose and must never take a tap, show a stand-in when its art is
// missing, or animate under reduced motion. Runs in the chromium-hook project (read-only window.__martynkaE2E, `guide`).
// Taps go through page.touchscreen.tap; the expected body rect comes from guideRect() so the spec has no fixed coordinates.
import { test, expect, type Page } from '@playwright/test';
import { openSettings, passWelcomeAsChild, passWelcomeAsParent } from './support/welcome';
import { answerRight, answerWrong, phaseIs, playRoundRight, screenIs, silenceSpeech, snapshot, tapNext, tapScene, tapTarget, targets } from './support/hook';
import { guideRect } from '../../src/core/guideLayout';
import { pl } from '../../src/data/pl';
import { UI_ART } from '../../src/data/uiArt';

const TILE_SKILL = 'E1.1.compare_qty_10'; // an E1 skill answered with tiles (src/data/curriculum/E1.ts)

test.setTimeout(120_000);

test.beforeEach(async ({ page }) => {
    await silenceSpeech(page);
});

const startTiles = async (page: Page, query: Record<string, string> = {}): Promise<void> => {
    await passWelcomeAsChild(page, 6, 9, { e2eSkills: TILE_SKILL, e2eVariant: 'off', ...query });
    await phaseIs(page, 'first');
};

const pose = async (page: Page) => (await snapshot(page)).guide?.pose;

test('#11 the fox follows the round: idle, cheer, idle, think through the solution and retype, cheer on the summary', async ({ page }) => {
    await startTiles(page);
    expect((await snapshot(page)).guide).toMatchObject({ visible: true, pose: 'idle' });

    await answerRight(page);
    await phaseIs(page, 'done');
    await expect.poll(() => pose(page)).toBe('cheer');
    await tapNext(page);
    await expect.poll(async () => (await snapshot(page)).index).toBe(1);
    await phaseIs(page, 'first');
    await expect.poll(() => pose(page)).toBe('idle');

    await answerWrong(page);
    await phaseIs(page, 'second');
    await expect.poll(() => pose(page)).toBe('think');
    await answerWrong(page);
    await phaseIs(page, 'solution');
    expect(await pose(page)).toBe('think');
    for (let guard = 0; guard < 10 && (await snapshot(page)).phase === 'solution'; guard++) {
        const before = await snapshot(page);
        await tapScene(page, (await targets(page)).step!);
        await expect.poll(async () => {
            const now = await snapshot(page);
            return now.phase !== 'solution' || now.solutionStep > before.solutionStep;
        }).toBe(true);
    }
    await phaseIs(page, 'retype');
    expect(await pose(page)).toBe('think');
    await answerRight(page);
    await phaseIs(page, 'done');
    await tapNext(page);
    await expect.poll(async () => (await snapshot(page)).index).toBe(2);

    for (let guard = 0; guard < 3 && (await snapshot(page)).screen === 'task'; guard++) {
        await phaseIs(page, 'first');
        await answerRight(page);
        await tapNext(page);
        await expect.poll(async () => (await snapshot(page)).screen === 'summary' || (await snapshot(page)).index > 2 + guard).toBe(true);
    }
    await screenIs(page, 'summary');
    expect(await snapshot(page).then((s) => s.guide)).toMatchObject({ visible: true, pose: 'cheer' });
});

test('#11 a tap on the fox changes nothing', async ({ page }) => {
    await startTiles(page);
    const { guide } = await snapshot(page);
    expect(guide!.interactive).toBe(false);
    const want = guideRect();
    expect(guide!.rect).toEqual({ x: want.x, y: want.y, width: want.width, height: want.height });
    const before = await snapshot(page);
    await tapScene(page, { x: want.x + want.width / 2, y: want.y + want.height / 2 });
    // The tap lands on the canvas; wait for a frame, then compare the round.
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const after = await snapshot(page);
    expect({ phase: after.phase, index: after.index, counter: after.counterText, screen: after.screen })
        .toEqual({ phase: before.phase, index: before.index, counter: before.counterText, screen: before.screen });
    expect(after.guide!.interactive).toBe(false);
});

test('#11 no fox without its art, and the round still plays to the summary', async ({ page }) => {
    await passWelcomeAsChild(page, 6, 9, { e2eArt: 'ui', e2eVariant: 'off' });
    await phaseIs(page, 'first');
    expect((await snapshot(page)).guide!.visible).toBe(false);
    await playRoundRight(page, 5);
    expect((await snapshot(page)).guide!.visible).toBe(false);
});

test('#11 no fox on the unlock card, back after it', async ({ page }) => {
    // The road of health-lines.spec.ts #14 U-1: E4 in September, rounds right until a step unlocks.
    await passWelcomeAsParent(page, { age: '8', stageLabel: 'Klasa 2, II półrocze', stage: 'E4', month: 8, query: { e2eVariant: 'off' } });
    for (let round = 0; round < 12 && (await snapshot(page)).learner?.pendingUnlock == null; round++) {
        await playRoundRight(page, 5);
        if ((await snapshot(page)).learner?.pendingUnlock != null) break;
        await tapTarget(page, 'nextRound');
        await screenIs(page, 'task');
    }
    await tapTarget(page, 'nextRound');
    await screenIs(page, 'unlock');
    expect((await snapshot(page)).guide!.visible).toBe(false);
    await tapTarget(page, 'unlockNext');
    await screenIs(page, 'task');
    await expect.poll(async () => (await snapshot(page)).guide).toMatchObject({ visible: true, pose: 'idle' });
});

test('#11 reduced motion swaps the pose without a pop; with motion the same answer pops', async ({ page, browser }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await startTiles(page);
    await answerRight(page);
    await phaseIs(page, 'done');
    await expect.poll(() => pose(page)).toBe('cheer');
    expect((await snapshot(page)).guide!.pops).toBe(0);

    // Control page: the same answer without the emulation counts a pop (proves the counter counts).
    const control = await (await browser.newContext({ viewport: { width: 1280, height: 720 }, hasTouch: true, baseURL: test.info().project.use.baseURL })).newPage();
    await silenceSpeech(control);
    await startTiles(control);
    await answerRight(control);
    await phaseIs(control, 'done');
    await expect.poll(async () => (await snapshot(control)).guide!.pops).toBeGreaterThanOrEqual(1);
    await control.context().close();
});

// Audit finding G-1/G-2 (change audit-backdrop-fox): one of the three fox pictures does not load. The fox then stays hidden for the whole
// session (no stand-in box, no pose that blinks in and out) and the parent's pictures section says so. The abort is a network failure, so the
// section also carries cause/advice lines for it: the checks name single sentences, never the whole line list.
test.describe('one pose missing', () => {
    test.use({ serviceWorkers: 'block' });

    test.beforeEach(async ({ page }) => {
        await page.route('**/assets/ui/fox-think.webp', (route) => route.abort());
    });

    test('#11 one missing pose hides the fox in every phase', async ({ page }) => {
        await startTiles(page);
        const hidden = async () => expect((await snapshot(page)).guide).toMatchObject({ visible: false });
        await hidden();
        expect((await snapshot(page)).guide!.requested).toBe('idle');
        expect((await snapshot(page)).artFallbacks?.guide).toBe('none');

        await answerWrong(page);
        await phaseIs(page, 'second');
        await expect.poll(async () => (await snapshot(page)).guide!.requested).toBe('think');
        await hidden();

        await answerRight(page);
        await phaseIs(page, 'done');
        await expect.poll(async () => (await snapshot(page)).guide!.requested).toBe('cheer');
        await hidden();

        await tapNext(page);
        await playRoundRight(page, 4);
        await screenIs(page, 'summary');
        await hidden();
    });

    test('#14 the pictures section names the missing fox', async ({ page }) => {
        await startTiles(page);
        const panel = await openSettings(page);
        await expect(panel.getByText(pl.settings.guideMissing, { exact: true })).toBeVisible();
        await expect(panel.getByText(pl.settings.uiArtMissing(1, UI_ART.length, false), { exact: true })).toBeVisible();
        await expect(panel.getByText('napis lub rysunek')).toHaveCount(0);
        await expect(panel.getByText('Zamiast obrazka gra rysuje', { exact: false })).toHaveCount(0);
    });
});
