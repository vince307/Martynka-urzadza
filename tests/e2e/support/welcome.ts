// Shared by the round specs (risk #11 and the narrator): gets past the welcome screen the way a parent
// does, so the round starts on stage E3 with no warm-up. Not a spec itself (no .spec in the name, so
// Playwright does not collect it).
//   - "Rodzic" is tapped on the canvas (page.touchscreen.tap, position from the hook's targets).
//   - The adult gate is read from the DOM like an adult would: the product comes from the visible
//     problem text, never from the hook (the hook does not expose the answer).
//   - The panel: age 10 proposes E6 in every month, so choosing "Klasa 2, I półrocze" (E3) is an
//     override and the warm-up is skipped. No clock is pinned: the outcome does not depend on the date.
// The strings are what the parent reads (src/data/pl.ts); a change there is a change here, on purpose.
// passWelcomeAsChild is the child path (tap an age): with the warm-up it plays 6 tasks first.
import { expect, type Page } from '@playwright/test';

const PARENT_AGE = '10+';
const STAGE_LABEL = 'Klasa 2, I półrocze';
const STAGE = 'E3';

interface WelcomeHook {
    snapshot: { screen: string; stage?: string; learner: { stage: string; warmupPending?: boolean } | null };
    targets: { ages?: { age: number; x: number; y: number }[]; parent?: { x: number; y: number } };
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

const tapScene = async (page: Page, point: { x: number; y: number }): Promise<void> => {
    const box = await page.locator('#game-container canvas').boundingBox();
    expect(box).not.toBeNull();
    await page.touchscreen.tap(box!.x + (point.x / 1920) * box!.width, box!.y + (point.y / 1080) * box!.height);
};

const openWelcome = async (page: Page, search: string): Promise<void> => {
    await page.goto(`/${search}`);
    // A stale server without the hook would fail every test with an unreadable error.
    await page.waitForFunction(() => '__martynkaE2E' in window, undefined, { timeout: 15_000 });
    await expect.poll(async () => (await readHook(page, 'snapshot'))?.screen).toBe('welcome');
};

/** Parent path: gate, then age 10 and stage E3; lands on the first task of a normal (no warm-up) round of stage E3. */
export const passWelcome = async (page: Page): Promise<void> => {
    await openWelcome(page, '');
    let parent: { x: number; y: number } | undefined;
    await expect
        .poll(async () => {
            parent = (await readHook(page, 'targets'))?.parent;
            return parent !== undefined;
        })
        .toBe(true);
    await tapScene(page, parent!);

    // The gate: "Ile to jest A · B?" is read from the dialog, the product is computed here.
    const gate = page.getByRole('dialog');
    await expect(gate).toBeVisible();
    const problem = /(\d+)\s*·\s*(\d+)/.exec((await gate.textContent()) ?? '');
    expect(problem).not.toBeNull();
    const product = String(Number(problem![1]) * Number(problem![2]));
    for (const digit of product) {
        await gate.getByRole('button', { name: digit, exact: true }).tap();
    }
    await gate.getByRole('button', { name: 'OK', exact: true }).tap();

    // The panel: replaces the gate dialog once the gate has closed.
    const panel = page.getByRole('dialog', { name: 'Ustawienia startowe' });
    await expect(panel).toBeVisible();
    await panel.getByRole('button', { name: PARENT_AGE, exact: true }).tap();
    await panel.getByRole('button', { name: STAGE_LABEL, exact: true }).tap();
    await panel.getByRole('button', { name: 'Zatwierdź', exact: true }).tap();

    await expect.poll(async () => (await readHook(page, 'snapshot'))?.screen).toBe('task');
    const learner = (await readHook(page, 'snapshot'))?.learner;
    expect(learner?.stage).toBe(STAGE);
    expect(learner?.warmupPending).toBe(false);
};

/** Child path: taps `age` with the month pinned by ?e2eMonth (the e2e build only); the warm-up follows when the stage has a previous one. */
export const passWelcomeAsChild = async (page: Page, age: number, month: number): Promise<void> => {
    await openWelcome(page, `?e2eMonth=${month}`);
    let button: { x: number; y: number } | undefined;
    await expect
        .poll(async () => {
            button = (await readHook(page, 'targets'))?.ages?.find((a) => a.age === age);
            return button !== undefined;
        })
        .toBe(true);
    await tapScene(page, button!);
    await expect.poll(async () => (await readHook(page, 'snapshot'))?.screen).toBe('task');
};
