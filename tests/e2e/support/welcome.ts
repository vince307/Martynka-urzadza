// Shared by the round specs (risk #11, the narrator and the adaptive spec #13): gets past the welcome screen
// the way a parent does. passWelcome starts on stage E3 with no warm-up; passWelcomeAsParent takes the age,
// stage and month. Not a spec itself (no .spec in the name, so
// Playwright does not collect it).
//   - "Rodzic" is tapped on the canvas (page.touchscreen.tap, position from the hook's targets).
//   - The adult gate is read from the DOM like an adult would: the product comes from the visible
//     problem text, never from the hook (the hook does not expose the answer).
//   - The panel: age 10 proposes E6 in every month, so choosing "Klasa 2, I półrocze" (E3) is an
//     override and the warm-up is skipped. No clock is pinned: the outcome does not depend on the date.
// The strings are what the parent reads (src/data/pl.ts); a change there is a change here, on purpose.
// passWelcomeAsChild is the child path (tap an age): with the warm-up it plays 6 tasks first.
import { expect, type Page } from '@playwright/test';
import { fromHook, readHook, tapScene } from './hook';

const PARENT_AGE = '10+';
const STAGE_LABEL = 'Klasa 2, I półrocze';
const STAGE = 'E3';

/** Loads the game (the month may be pinned by ?e2eMonth, the e2e build only) and waits for the welcome screen. */
export const openWelcome = async (page: Page, month?: number): Promise<void> => {
    await page.goto(month === undefined ? '/' : `/?e2eMonth=${month}`);
    // A stale server without the hook would fail every test with an unreadable error.
    await page.waitForFunction(() => '__martynkaE2E' in window, undefined, { timeout: 15_000 });
    await expect.poll(async () => (await readHook(page, 'snapshot'))?.screen).toBe('welcome');
};

/** Reads the adult gate's problem from the dialog text like an adult would; the hook never exposes the answer. */
export const gateProblem = async (page: Page): Promise<{ text: string; product: number }> => {
    const prompt = page.getByRole('dialog', { name: 'Pytanie dla rodzica' }).getByText(/Ile to jest/);
    await expect(prompt).toBeVisible();
    const text = (await prompt.textContent()) ?? '';
    const factors = /(\d+)\s*·\s*(\d+)/.exec(text);
    expect(factors).not.toBeNull();
    return { text, product: Number(factors![1]) * Number(factors![2]) };
};

export const typeIntoGate = async (page: Page, value: number): Promise<void> => {
    const gate = page.getByRole('dialog', { name: 'Pytanie dla rodzica' });
    for (const digit of String(value)) {
        await gate.getByRole('button', { name: digit, exact: true }).tap();
    }
    await gate.getByRole('button', { name: 'OK', exact: true }).tap();
};

/** Opens the welcome screen and taps "Rodzic": the gate is open afterwards. */
export const openGate = async (page: Page, month?: number): Promise<void> => {
    await openWelcome(page, month);
    const { parent } = await fromHook(page, 'targets');
    expect(parent).toBeDefined();
    await tapScene(page, parent!);
    await expect(page.getByRole('dialog', { name: 'Pytanie dla rodzica' })).toBeVisible();
};

export interface ParentChoice {
    /** The age button as the parent reads it ("8", "10+"). */
    age: string;
    /** The stage button as the parent reads it ("Klasa 2, II półrocze"). */
    stageLabel: string;
    /** The stage the learner must have afterwards (E3, E4). */
    stage: string;
    /** Month pinned by ?e2eMonth (the e2e build only); undefined = the real clock. */
    month?: number;
}

/** Parent path: gate, then the chosen age and stage; lands on the first task of a normal (no warm-up) round. The stage must differ from the proposal, or the warm-up would follow. */
export const passWelcomeAsParent = async (page: Page, choice: ParentChoice): Promise<void> => {
    await openGate(page, choice.month);
    // The gate: the product is computed here from the visible problem.
    await typeIntoGate(page, (await gateProblem(page)).product);

    // The panel: replaces the gate dialog once the gate has closed.
    const panel = page.getByRole('dialog', { name: 'Ustawienia startowe' });
    await expect(panel).toBeVisible();
    await panel.getByRole('button', { name: choice.age, exact: true }).tap();
    await panel.getByRole('button', { name: choice.stageLabel, exact: true }).tap();
    await panel.getByRole('button', { name: 'Zatwierdź', exact: true }).tap();

    await expect.poll(async () => (await readHook(page, 'snapshot'))?.screen).toBe('task');
    const learner = (await readHook(page, 'snapshot'))?.learner;
    expect(learner?.stage).toBe(choice.stage);
    expect(learner?.warmupPending).toBe(false);
};

/** Parent path, age 10 and stage E3 in every month (the proposal is E6, so E3 is an override). */
export const passWelcome = (page: Page): Promise<void> =>
    passWelcomeAsParent(page, { age: PARENT_AGE, stageLabel: STAGE_LABEL, stage: STAGE });

/** Child path: taps `age` with the month pinned by ?e2eMonth (the e2e build only); the warm-up follows when the stage has a previous one. */
export const passWelcomeAsChild = async (page: Page, age: number, month: number): Promise<void> => {
    await openWelcome(page, month);
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
