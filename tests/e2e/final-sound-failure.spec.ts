// S-16b sound, test-plan risk #15 (a frozen or restart-card screen over one bad file): a sound file that is not audio makes
// decodeAudioData reject (EncodingError) with no handler in Phaser, and a sound download that never answers must not hold the
// start. (a) the bad file is skipped, no restart card, the round still answers; (b) with every sound download hanging, the
// total boot limit ends the load, all twelve effects are listed as missing and the game starts once. Service workers are
// blocked, like in load-and-tab-guard.spec.ts: page.route cannot see requests that a worker answers from its precache.
// The ?e2eArt=stallall seam switches the per-file limit off and shortens the total limit. Runs in the chromium-hook project.
import { test, expect } from '@playwright/test';
import { passWelcome } from './support/welcome';
import { answerRight, phaseIs, screenIs, silenceSpeech, snapshot } from './support/hook';
import { SOUNDS } from '../../src/data/sounds';

test.use({ serviceWorkers: 'block' });
test.setTimeout(90_000);

const EFFECT_COUNT = SOUNDS.filter((sound) => sound.id !== 'music-loop').length;

test('#15 S-16b a sound file that is not audio is skipped without the restart card', async ({ page }) => {
    await silenceSpeech(page);
    await page.route('**/assets/sounds/**/star.*', (route) => route.fulfill({ status: 200, contentType: 'audio/mp4', body: 'not audio' }));
    await passWelcome(page, { e2eSkills: 'E3.2.add_sub_20_bridge', e2eVariant: 'off' });
    await phaseIs(page, 'first');
    await expect.poll(async () => (await snapshot(page)).sound?.missing).toContain('sounds/star');
    // The page had time to raise the rejection; the card stays away.
    await expect(page.getByRole('alertdialog')).toHaveCount(0);

    await answerRight(page);
    await phaseIs(page, 'done');
    await expect.poll(async () => (await snapshot(page)).sound?.log.find((e) => e.id === 'star')?.outcome).toBe('missing');
    expect((await snapshot(page)).sound?.log.find((e) => e.id === 'answer-right')?.outcome).toBe('played');
    await expect(page.getByRole('alertdialog')).toHaveCount(0);
    expect((await snapshot(page)).screen).toBe('task');
});

test('#15 S-16b hanging sound downloads end at the total boot limit', async ({ page }) => {
    await silenceSpeech(page);
    await page.route('**/assets/sounds/**', () => {});
    await page.goto('./?e2eArt=stallall&e2eVariant=off');
    await page.waitForFunction(() => '__martynkaE2E' in window, undefined, { timeout: 15_000 });
    await expect.poll(async () => (await snapshot(page)).screen, { timeout: 15_000 }).toBe('welcome');
    const after = await snapshot(page);
    expect(after.bootLoad!.cut.some((key) => key.startsWith('sounds/'))).toBe(true);
    expect(after.sound!.missing).toHaveLength(EFFECT_COUNT);
    expect(after.bootLoad!.creates).toBe(1);
    await expect(page.getByRole('alertdialog')).toHaveCount(0);
    await screenIs(page, 'welcome');
});
