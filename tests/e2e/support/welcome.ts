// Shared by the round specs (risk #11 and the narrator): gets past the welcome screen the way the
// child does, by tapping an age through page.touchscreen.tap. Not a spec itself (no .spec in the
// name, so Playwright does not collect it). The month is pinned with ?e2eMonth=N, read only in the
// e2e build: page.clock would freeze Date.now(), and Phaser 4 drives its tweens from it.
// Age 8 in October (month 9) lands on stage E3, the stage the round specs were written for.
// The child path is used while the warm-up does not exist yet (plan first-launch-placement, phase 4).
import { expect, type Page } from '@playwright/test';

const OCTOBER = 9;
const AGE = 8;
const STAGE = 'E3';

interface WelcomeHook {
    snapshot: { screen: string; stage?: string; learner: { stage: string } | null };
    targets: { ages?: { age: number; x: number; y: number }[] };
}

/** Reads the hook once; null while the game has no state to show (the hook throws then). */
const readHook = <K extends keyof WelcomeHook>(page: Page, key: K): Promise<WelcomeHook[K] | null> =>
    page.evaluate((k) => {
        try {
            const value = (window as unknown as { __martynkaE2E?: Record<string, unknown> }).__martynkaE2E?.[k];
            return (value as WelcomeHook[keyof WelcomeHook] | undefined) ?? null;
        } catch {
            return null;
        }
    }, key) as Promise<WelcomeHook[K] | null>;

/** Opens the game at the welcome screen, taps the age and waits until the first round of stage E3 is on screen. */
export const passWelcome = async (page: Page): Promise<void> => {
    await page.goto(`/?e2eMonth=${OCTOBER}`);
    // A stale server without the hook would fail every test with an unreadable error.
    await page.waitForFunction(() => '__martynkaE2E' in window, undefined, { timeout: 15_000 });
    await expect.poll(async () => (await readHook(page, 'snapshot'))?.screen).toBe('welcome');
    let button: { x: number; y: number } | undefined;
    await expect
        .poll(async () => {
            button = (await readHook(page, 'targets'))?.ages?.find((a) => a.age === AGE);
            return button !== undefined;
        })
        .toBe(true);
    const box = await page.locator('#game-container canvas').boundingBox();
    expect(box).not.toBeNull();
    await page.touchscreen.tap(box!.x + (button!.x / 1920) * box!.width, box!.y + (button!.y / 1080) * box!.height);
    await expect.poll(async () => (await readHook(page, 'snapshot'))?.screen).toBe('task');
    expect((await readHook(page, 'snapshot'))?.learner?.stage).toBe(STAGE);
};
