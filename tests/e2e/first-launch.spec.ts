// Risk #12 (proposed in context/changes/first-launch-placement, test-plan refresh pending): the
// first launch is only real in the rendered UI and the scene seams. The child taps an age on the
// welcome screen (the month is pinned by ?e2eMonth=9, October: never a mocked clock), the placement
// warm-up plays as an ordinary round of 6 tasks, and its result may lower the stage by one. The
// stage is read from the hook's learner state; the number of tasks from the hook's round state.
// Runs in the chromium-hook project (e2e build with window.__martynkaE2E). Every tap is a
// page.touchscreen.tap. The warm-up rule itself (4 first-try answers of 6) is proved by the unit
// tests; this proves that the scenes apply it.
import { test, expect, type Page } from '@playwright/test';
import { passWelcomeAsChild } from './support/welcome';

interface Point { x: number; y: number }
interface Snapshot {
    index: number;
    phase: 'first' | 'second' | 'solution' | 'retype' | 'done';
    input: 'tiles' | 'keypad';
    answer: unknown;
    outcomes: (string | null)[];
    screen: 'welcome' | 'task' | 'summary' | 'room';
    summary: { earned: number; bonus: number; stars: boolean[] } | null;
    warmup: boolean;
    learner: { stage: string; warmupPending?: boolean; stageOverriddenByParent?: boolean } | null;
}
interface Targets {
    tiles: (Point & { value: number | string })[];
    keys: (Point & { key: string })[];
    next: Point | null;
    nextRound: Point | null;
    ages?: (Point & { age: number })[];
    parent?: Point;
}

const OCTOBER = 9;
const WARMUP_LENGTH = 6;
const ROUND_LENGTH = 5;

interface Hook { snapshot: Snapshot; targets: Targets }
const readHook = <K extends keyof Hook>(page: Page, key: K): Promise<Hook[K] | null> =>
    page.evaluate((k) => {
        try {
            const value = (window as unknown as { __martynkaE2E?: Record<string, unknown> }).__martynkaE2E?.[k];
            return (value as Hook[keyof Hook] | undefined) ?? null;
        } catch {
            return null;
        }
    }, key) as Promise<Hook[K] | null>;
const fromHook = async <K extends keyof Hook>(page: Page, key: K): Promise<Hook[K]> => {
    let value: Hook[K] | null = null;
    await expect
        .poll(async () => {
            value = await readHook(page, key);
            return value !== null;
        })
        .toBe(true);
    return value as unknown as Hook[K];
};
const snapshot = (page: Page): Promise<Snapshot> => fromHook(page, 'snapshot');
const targets = (page: Page): Promise<Targets> => fromHook(page, 'targets');

const tapScene = async (page: Page, point: Point): Promise<void> => {
    const box = await page.locator('#game-container canvas').boundingBox();
    expect(box).not.toBeNull();
    await page.touchscreen.tap(box!.x + (point.x / 1920) * box!.width, box!.y + (point.y / 1080) * box!.height);
};

const tapNumber = async (page: Page, value: number): Promise<void> => {
    const { keys } = await targets(page);
    for (const digit of String(value)) {
        await tapScene(page, keys.find((k) => k.key === digit)!);
    }
    await tapScene(page, keys.find((k) => k.key === 'ok')!);
};

const answerWrong = async (page: Page): Promise<void> => {
    const state = await snapshot(page);
    if (state.input === 'tiles') {
        const { tiles } = await targets(page);
        await tapScene(page, tiles.find((t) => t.value !== state.answer)!);
    } else {
        await tapNumber(page, (state.answer as number) + 1);
    }
};

const answerRight = async (page: Page): Promise<void> => {
    const state = await snapshot(page);
    if (state.input === 'tiles') {
        const { tiles } = await targets(page);
        await tapScene(page, tiles.find((t) => t.value === state.answer)!);
    } else {
        await tapNumber(page, state.answer as number);
    }
};

const phaseIs = async (page: Page, phase: Snapshot['phase']): Promise<void> => {
    await expect.poll(async () => (await snapshot(page)).phase).toBe(phase);
};

/** Plays the open task: right on the first try, or (firstTryWrong) one wrong tap and then the right one. Then "Dalej". */
const playTask = async (page: Page, firstTryWrong: boolean): Promise<void> => {
    const before = (await snapshot(page)).index;
    await phaseIs(page, 'first');
    if (firstTryWrong) {
        await answerWrong(page);
        await phaseIs(page, 'second');
    }
    await answerRight(page);
    await phaseIs(page, 'done');
    const { next } = await targets(page);
    expect(next).not.toBeNull();
    await tapScene(page, next!);
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
    await expect.poll(async () => (await snapshot(page)).screen).toBe('summary');
};

// One canvas at a time (see task-round.spec.ts).
test.describe.configure({ mode: 'serial' });
test.setTimeout(90_000);

test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
        const silent = { getVoices: () => [], speak: () => undefined, cancel: () => undefined, addEventListener: () => undefined, removeEventListener: () => undefined };
        Object.defineProperty(window, 'speechSynthesis', { value: silent, configurable: true });
    });
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
const gateProblem = async (page: Page): Promise<{ text: string; product: number }> => {
    const prompt = page.getByRole('dialog', { name: 'Pytanie dla rodzica' }).getByText(/Ile to jest/);
    await expect(prompt).toBeVisible();
    const text = (await prompt.textContent()) ?? '';
    const factors = /(\d+)\s*·\s*(\d+)/.exec(text);
    expect(factors).not.toBeNull();
    return { text, product: Number(factors![1]) * Number(factors![2]) };
};

const typeIntoGate = async (page: Page, value: number): Promise<void> => {
    const gate = page.getByRole('dialog', { name: 'Pytanie dla rodzica' });
    for (const digit of String(value)) {
        await gate.getByRole('button', { name: digit, exact: true }).tap();
    }
    await gate.getByRole('button', { name: 'OK', exact: true }).tap();
};

/** Opens the welcome screen (month pinned to October) and taps "Rodzic": the gate is open afterwards. */
const openGate = async (page: Page): Promise<void> => {
    await page.goto(`/?e2eMonth=${OCTOBER}`);
    await page.waitForFunction(() => '__martynkaE2E' in window, undefined, { timeout: 15_000 });
    await expect.poll(async () => (await readHook(page, 'snapshot'))?.screen).toBe('welcome');
    const { parent } = await fromHook(page, 'targets');
    expect(parent).toBeDefined();
    await tapScene(page, parent!);
    await expect(page.getByRole('dialog', { name: 'Pytanie dla rodzica' })).toBeVisible();
};

/** Gate passed with the right product; the stage panel is open afterwards. */
const openPanel = async (page: Page): Promise<void> => {
    await openGate(page);
    await typeIntoGate(page, (await gateProblem(page)).product);
    await expect(page.getByRole('dialog', { name: 'Ustawienia startowe' })).toBeVisible();
};

test('#12 (proposed) a wrong gate answer gives a calm message and a new problem without a lockout; the right one opens the panel and an overridden stage starts a plain round', async ({ page }) => {
    await openGate(page);
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

    await expect.poll(async () => (await snapshot(page)).screen).toBe('task');
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

    await expect.poll(async () => (await snapshot(page)).screen).toBe('task');
    const start = await snapshot(page);
    expect(start.learner).toMatchObject({ stage: 'E3', stageOverriddenByParent: false, warmupPending: true });
    expect(start.warmup).toBe(true);
    await playRound(page, WARMUP_LENGTH, 0);
    expect((await snapshot(page)).outcomes).toHaveLength(WARMUP_LENGTH);
});

test('#12 (proposed) with the gate open a tap under the overlay on an age button does nothing; after "Anuluj" the same tap works', async ({ page }) => {
    await openGate(page);
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
    await expect.poll(async () => (await snapshot(page)).screen).toBe('task');
    expect((await snapshot(page)).learner?.stage).toBe('E3');
});
