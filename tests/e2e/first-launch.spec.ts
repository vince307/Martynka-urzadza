// Risk #12 (proposed in context/changes/first-launch-placement, test-plan refresh pending): the
// first launch is only real in the rendered UI and the scene seams. The child taps an age on the
// welcome screen (the month is pinned by ?e2eMonth=9, October: never a mocked clock), the placement
// warm-up plays as an ordinary round of 6 tasks, and its result may lower the stage by one. The
// stage is read from the hook's learner state; the number of tasks from the hook's round state.
// Runs in the chromium-hook project (e2e build with window.__martynkaE2E). Every tap is a
// page.touchscreen.tap. The warm-up rule itself (4 first-try answers of 6) is proved by the unit
// tests; this proves that the scenes apply it.
import { test, expect, type Page } from '@playwright/test';
import { gateProblem, openGate, passChoice, passWelcomeAsChild, typeIntoGate } from './support/welcome';
import { answerRight, answerWrong, phaseIs, screenIs, silenceSpeech, snapshot, tapNext, tapScene, targets } from './support/hook';

const OCTOBER = 9;
const WARMUP_LENGTH = 6;
const ROUND_LENGTH = 5;

/** Plays the open task: right on the first try, or (firstTryWrong) one wrong tap and then the right one. Then "Dalej". */
const playTask = async (page: Page, firstTryWrong: boolean): Promise<void> => {
    const before = (await snapshot(page)).index;
    await phaseIs(page, 'first');
    if (firstTryWrong) {
        await answerWrong(page);
        await phaseIs(page, 'second');
    }
    await answerRight(page);
    await tapNext(page);
    await expect.poll(async () => {
        const now = await snapshot(page);
        return now.screen === 'summary' || now.index === before + 1;
    }).toBe(true);
};

/** Plays a whole round of `length` tasks; the first `wrongFirst` of them with a mistake on the first try. */
const playRound = async (page: Page, length: number, wrongFirst: number): Promise<void> => {
    for (let i = 0; i < length; i++) {
        await playTask(page, i < wrongFirst);
    }
    await screenIs(page, 'summary');
};

/** Finished writes of the autosaver so far (the hook's read-only save status). */
const writesDone = async (page: Page): Promise<number> => (await snapshot(page)).save?.writes ?? 0;

/** Waits until a write that finished after `before` has landed (with `reason`, when given) and nothing is pending. */
const savedSince = async (page: Page, before: number, reason?: 'now' | 'change'): Promise<void> => {
    await expect.poll(async () => {
        const save = (await snapshot(page)).save;
        return save !== null && save !== undefined && save.writes > before && !save.dirty && (reason === undefined || save.lastReason === reason);
    }).toBe(true);
};

// One canvas at a time (see task-round.spec.ts).
test.describe.configure({ mode: 'serial' });
test.setTimeout(90_000);

test.beforeEach(async ({ page }) => {
    await silenceSpeech(page);
});

test('#12 (proposed) age 8 in October warms up on E3 with 6 tasks, a clean warm-up keeps E3, and the next round has 5 tasks', async ({ page }) => {
    await passWelcomeAsChild(page, 8, OCTOBER);
    const start = await snapshot(page);
    expect(start.learner?.stage).toBe('E3');
    expect(start.warmup).toBe(true);

    await playRound(page, WARMUP_LENGTH, 0);
    const end = await snapshot(page);
    expect(end.outcomes).toEqual(Array(WARMUP_LENGTH).fill('first'));
    expect(end.summary?.stars).toEqual(Array(WARMUP_LENGTH).fill(true));
    expect(end.learner).toMatchObject({ stage: 'E3', warmupPending: false });
    // October is the second month of the semester: rule D opens E3 at its 4th step (S-13: all 11 steps playable).
    expect(end.learner?.unlockedStep.E3).toBe(4);

    const { nextRound } = await targets(page);
    expect(nextRound).not.toBeNull();
    await tapScene(page, nextRound!);
    await expect.poll(async () => (await snapshot(page)).screen).toBe('task');
    const again = await snapshot(page);
    expect(again.warmup).toBe(false);
    expect(again.index).toBe(0);
    expect(again.learner?.stage).toBe('E3');
    await playRound(page, ROUND_LENGTH, 0);
    const second = await snapshot(page);
    expect(second.outcomes).toHaveLength(ROUND_LENGTH);
    expect(second.summary?.stars).toHaveLength(ROUND_LENGTH);
});

test('#12 (proposed) age 8 with three first-try mistakes in the warm-up drops to E2 for the next round', async ({ page }) => {
    await passWelcomeAsChild(page, 8, OCTOBER);
    expect((await snapshot(page)).learner?.stage).toBe('E3');

    await playRound(page, WARMUP_LENGTH, 3);
    const end = await snapshot(page);
    expect(end.outcomes.filter((o) => o === 'first')).toHaveLength(WARMUP_LENGTH - 3);
    // The child sees an ordinary summary: every task earned its star on a second try or better.
    expect(end.summary?.stars).toEqual(Array(WARMUP_LENGTH).fill(true));
    expect(end.learner).toMatchObject({ stage: 'E2', warmupPending: false });

    const { nextRound } = await targets(page);
    await tapScene(page, nextRound!);
    await expect.poll(async () => (await snapshot(page)).screen).toBe('task');
    const again = await snapshot(page);
    expect(again.warmup).toBe(false);
    expect(again.learner?.stage).toBe('E2');
    await playRound(page, ROUND_LENGTH, 0);
    expect((await snapshot(page)).outcomes).toHaveLength(ROUND_LENGTH);
});

test('#12 (proposed) age 6 starts on E1 with no warm-up and a round of 5 tasks', async ({ page }) => {
    await passWelcomeAsChild(page, 6, OCTOBER);
    const start = await snapshot(page);
    expect(start.learner).toMatchObject({ stage: 'E1', warmupPending: false });
    expect(start.warmup).toBe(false);

    await playRound(page, ROUND_LENGTH, 0);
    const end = await snapshot(page);
    expect(end.outcomes).toHaveLength(ROUND_LENGTH);
    expect(end.summary?.stars).toHaveLength(ROUND_LENGTH);
    expect(end.learner?.stage).toBe('E1');
});

// The parent path (risk #12, proposed): the gate and the panel are DOM dialogs above the canvas. Like
// an adult, the test reads the problem from the dialog text; the hook never exposes the answer.
const PARENT_AGE = 8;

/** Gate passed with the right product; the stage panel is open afterwards. */
const openPanel = async (page: Page): Promise<void> => {
    await openGate(page, OCTOBER);
    await typeIntoGate(page, (await gateProblem(page)).product);
    await expect(page.getByRole('dialog', { name: 'Ustawienia startowe' })).toBeVisible();
};

test('#12 (proposed) a wrong gate answer gives a calm message and a new problem without a lockout; the right one opens the panel and an overridden stage starts a plain round', async ({ page }) => {
    await openGate(page, OCTOBER);
    const gate = page.getByRole('dialog', { name: 'Pytanie dla rodzica' });
    // A wrong answer twice in a row: no lockout, the gate stays usable.
    for (let attempt = 0; attempt < 2; attempt++) {
        await typeIntoGate(page, (await gateProblem(page)).product + 1);
        await expect(gate.getByRole('status')).toHaveText('To nie ta liczba. Spróbuj z nowym działaniem.');
        await expect(gate).toBeVisible();
    }
    await typeIntoGate(page, (await gateProblem(page)).product);

    const panel = page.getByRole('dialog', { name: 'Ustawienia startowe' });
    await expect(panel).toBeVisible();
    await expect(gate).toBeHidden();
    await panel.getByRole('button', { name: String(PARENT_AGE), exact: true }).tap();
    // Age 8 in October proposes E3 and the proposal is marked.
    await expect(panel.getByRole('button', { name: /Klasa 2, I półrocze.*propozycja/ })).toBeVisible();
    await panel.getByRole('button', { name: 'Klasa 2, II półrocze', exact: true }).tap();
    await panel.getByRole('button', { name: 'Zatwierdź', exact: true }).tap();
    await passChoice(page);
    const start = await snapshot(page);
    expect(start.learner).toMatchObject({ stage: 'E4', stageOverriddenByParent: true, warmupPending: false });
    expect(start.warmup).toBe(false);
    await playRound(page, ROUND_LENGTH, 0);
    expect((await snapshot(page)).outcomes).toHaveLength(ROUND_LENGTH);
});

test('#12 (proposed) a parent who confirms the proposal gets the proposed stage and the warm-up of 6 tasks', async ({ page }) => {
    await openPanel(page);
    const panel = page.getByRole('dialog', { name: 'Ustawienia startowe' });
    await panel.getByRole('button', { name: String(PARENT_AGE), exact: true }).tap();
    await panel.getByRole('button', { name: 'Zatwierdź', exact: true }).tap();
    await passChoice(page);
    const start = await snapshot(page);
    expect(start.learner).toMatchObject({ stage: 'E3', stageOverriddenByParent: false, warmupPending: true });
    expect(start.warmup).toBe(true);
    await playRound(page, WARMUP_LENGTH, 0);
    expect((await snapshot(page)).outcomes).toHaveLength(WARMUP_LENGTH);
});

test('#12 (proposed) with the gate open a tap under the overlay on an age button does nothing; after "Anuluj" the same tap works', async ({ page }) => {
    await openGate(page, OCTOBER);
    const { ages } = await targets(page);
    const age = ages?.find((a) => a.age === PARENT_AGE);
    expect(age).toBeDefined();

    await tapScene(page, age!);
    // Two frames so Phaser has handled the touch, if it were going to.
    await page.evaluate(() => new Promise<void>((done) => requestAnimationFrame(() => requestAnimationFrame(() => done()))));
    const blocked = await snapshot(page);
    expect(blocked.learner).toBeNull();
    expect(blocked.screen).toBe('welcome');
    await expect(page.getByRole('dialog', { name: 'Pytanie dla rodzica' })).toBeVisible();

    await page.getByRole('dialog', { name: 'Pytanie dla rodzica' }).getByRole('button', { name: 'Anuluj', exact: true }).tap();
    await expect(page.getByRole('dialog')).toBeHidden();
    await tapScene(page, age!);
    await passChoice(page);
    expect((await snapshot(page)).learner?.stage).toBe('E3');
});

// Risk #12 (playtest F-02 b): a child who tapped the wrong age can go back to the age choice, but only
// until her first ordinary round is finished. The way back is a canvas button (hook target `ageBack`);
// the saved learner is cleared and flushed at once, so a reload after the new age shows the new stage.
// Origin: context/changes/playtest-fixes-f01-f03 phase 8. The pure rule (ageBackOffered) is proved by tests/ageBack.test.ts.
test('#12 "Wróć" returns to the age choice keeping the stars, survives a reload, and disappears after the first ordinary round', async ({ page }) => {
    await passWelcomeAsChild(page, 8, OCTOBER);
    expect((await snapshot(page)).learner?.stage).toBe('E3');
    expect((await snapshot(page)).warmup).toBe(true);

    await playTask(page, false);
    expect((await snapshot(page)).stars).toBe(1);

    // Back to the age choice and an older age: the warm-up is of E5, the earned star stays.
    const first = await targets(page);
    expect(first.ageBack).toBeTruthy();
    const beforeBack = await writesDone(page);
    await tapScene(page, first.ageBack!);
    await screenIs(page, 'welcome');
    // "Wróć" writes at once: the next finished write carries the reason 'now' (flush), never 'change' (the 500 ms debounce).
    // Nothing else in the warm-up flushes before the round ends, so without the flush this stays red (visual gate: the
    // earlier `dirty` read flaked when a later registry write marked the state dirty again).
    await expect.poll(async () => {
        const save = (await snapshot(page)).save;
        return (save?.writes ?? 0) > beforeBack ? save?.lastReason : null;
    }, { intervals: [50] }).toBe('now');
    const age9 = (await targets(page)).ages?.find((a) => a.age === 9);
    expect(age9).toBeDefined();
    const afterBack = await writesDone(page);
    await tapScene(page, age9!);
    await passChoice(page);
    const older = await snapshot(page);
    expect(older.learner?.stage).toBe('E5');
    expect(older.warmup).toBe(true);
    expect(older.stars).toBe(1);

    // The choice is saved: a reload resumes the E5 warm-up and still offers "Wróć". `dirty` turns false when a write
    // starts, so the reload waits for a write that FINISHED after the choice (writes counts finished writes).
    await savedSince(page, afterBack);
    await page.reload();
    await screenIs(page, 'task');
    const reloaded = await snapshot(page);
    expect(reloaded.learner?.stage).toBe('E5');
    expect(reloaded.stars).toBe(1);
    await expect.poll(async () => (await targets(page)).ageBack ?? null).not.toBeNull();

    // The warm-up and the first ordinary round: after them the way back is gone, also after a reload.
    await playRound(page, WARMUP_LENGTH, 0);
    const { nextRound } = await targets(page);
    await tapScene(page, nextRound!);
    await screenIs(page, 'task');
    const beforeEnd = await writesDone(page);
    await playRound(page, ROUND_LENGTH, 0);
    await expect.poll(async () => (await targets(page)).ageBack ?? null).toBeNull();
    await savedSince(page, beforeEnd, 'now');   // the round end flushes at once, after its last registry write
    await page.reload();
    await screenIs(page, 'task');
    await expect.poll(async () => (await targets(page)).ageBack ?? null).toBeNull();
});
