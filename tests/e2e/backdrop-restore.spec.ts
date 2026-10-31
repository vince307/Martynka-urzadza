// Risks #12 (first launch by touch) and #11 (round by touch) of context/foundation/test-plan.md, for the backdrop
// restore (change audit-backdrop-fox, audit B-1): a lost and restored WebGL context empties every texture, so the blurred
// salon behind the notebook must be drawn again at once, on the welcome, on the task screen and on the sleeping task
// scene while the room is open. Runs in the chromium-hook project (read-only window.__martynkaE2E: `backdrop.redraws`
// counts the renders caused by a restore, `backdropPixel` reads a pixel of the blurred texture). Chromium logs a harmless
// INVALID_OPERATION on restore, so no console-error assertion here.
import { test, expect, type Page } from '@playwright/test';
import { openWelcome, passChoice, passWelcome } from './support/welcome';
import { answerRight, phaseIs, readHook, screenIs, silenceSpeech, snapshot, tapScene, tapTarget } from './support/hook';
import { PAGE_BACKGROUND } from '../../src/data/layout';

test.setTimeout(90_000);

test.beforeEach(async ({ page }) => {
    await silenceSpeech(page);
});

const pageRgb = (): [number, number, number] => {
    const hex = PAGE_BACKGROUND.replace('#', '');
    return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];
};

/** A drawn salon pixel: opaque and not the plain page colour (a lost texture reads [0,0,0,0]). */
const isSalonPixel = (px: [number, number, number, number] | null): boolean => {
    if (px === null || px[3] !== 255) return false;
    const [r, g, b] = pageRgb();
    return !(px[0] === r && px[1] === g && px[2] === b);
};

const expectSalonPixel = async (page: Page): Promise<void> => {
    await expect.poll(async () => isSalonPixel(await readHook(page, 'backdropPixel'))).toBe(true);
};

interface LoseHandle { gl: WebGLRenderingContext; ext: WEBGL_lose_context }

/** Loses the WebGL context of the game canvas, waits until it is lost, then restores it (the extension is kept: a lost context returns null for it). */
const loseAndRestore = async (page: Page): Promise<void> => {
    await page.evaluate(() => {
        const gl = document.querySelector('canvas')!.getContext('webgl')!;
        const ext = gl.getExtension('WEBGL_lose_context')!;
        (window as unknown as { __lose: LoseHandle }).__lose = { gl, ext };
        ext.loseContext();
    });
    await expect.poll(() => page.evaluate(() => (window as unknown as { __lose: LoseHandle }).__lose.gl.isContextLost())).toBe(true);
    await page.evaluate(() => {
        (window as unknown as { __lose: LoseHandle }).__lose.ext.restoreContext();
    });
};

test('#12 the welcome stays plain and playable after a WebGL context restore', async ({ page }) => {
    await openWelcome(page, 9);
    // S-28 (plan decision P5): a fresh install boots no room, so the welcome backdrop is the plain page colour; the restore
    // listener is still guarded by tests/backdropRestoreWiring.test.ts and the task backdrop redraw by the specs below.
    expect((await snapshot(page)).backdrop).toMatchObject({ mode: 'plain', drawn: false, redraws: 0 });
    await loseAndRestore(page);
    expect((await snapshot(page)).backdrop).toMatchObject({ mode: 'plain', drawn: false });

    // An age tap still starts the game.
    let age: { x: number; y: number } | undefined;
    await expect.poll(async () => {
        age = (await readHook(page, 'targets'))?.ages?.find((a) => a.age === 6);
        return age !== undefined;
    }).toBe(true);
    await tapScene(page, age!);
    await passChoice(page);
});

test('#11 the task backdrop is drawn again after a WebGL context restore', async ({ page }) => {
    await passWelcome(page, { e2eVariant: 'off' });
    await phaseIs(page, 'first');
    await expect.poll(async () => (await snapshot(page)).backdrop?.drawn).toBe(true);
    expect((await snapshot(page)).backdrop).toMatchObject({ mode: 'salon', blurred: true, renderer: 'webgl', redraws: 0 });
    await expectSalonPixel(page);

    await loseAndRestore(page);
    await expect.poll(async () => (await snapshot(page)).backdrop?.redraws).toBe(1);
    expect((await snapshot(page)).backdrop!.drawn).toBe(true);
    await expectSalonPixel(page);

    // The round still plays.
    await answerRight(page);
    await phaseIs(page, 'done');
});

test('#11 a restore while the room is open redraws the sleeping task backdrop', async ({ page }) => {
    await passWelcome(page, { e2eVariant: 'off' });
    await phaseIs(page, 'first');
    await expect.poll(async () => (await snapshot(page)).backdrop?.drawn).toBe(true);
    await answerRight(page);
    await phaseIs(page, 'done');
    await tapTarget(page, 'roomSwitch');
    await screenIs(page, 'room');

    await loseAndRestore(page);
    // Still in the room: the sleeping task scene drew its backdrop again.
    await expect.poll(async () => (await snapshot(page)).backdrop?.redraws).toBe(1);
    expect((await snapshot(page)).screen).toBe('room');
    await expectSalonPixel(page);

    await tapTarget(page, 'resume');
    await screenIs(page, 'task');
    await expectSalonPixel(page);
    expect((await snapshot(page)).phase).toBe('done');
});
