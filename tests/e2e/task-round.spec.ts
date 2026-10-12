// Risk #11 (context/foundation/test-plan.md): the round logic is unit-tested, but the child
// plays it through the real touch path (Scale.FIT mapping, tiles, keypad, "Dalej"). Runs in
// the chromium-hook project against the e2e build that carries the read-only hook
// (window.__martynkaE2E). The hook says where things are and what the state is; every tap
// goes through page.touchscreen.tap. Expected stars come from the PRD (FR-006/FR-007):
// 1 star for a correct first or second try, 0 for the retype, +2 for a round without a
// mistake, never lost.
import { test, expect, type Page } from '@playwright/test';

interface Point { x: number; y: number }
interface Snapshot {
    index: number;
    solutionStep: number;
    phase: 'first' | 'second' | 'solution' | 'retype' | 'done';
    input: 'tiles' | 'keypad';
    answer: unknown;
    outcomes: (string | null)[];
    starsEarned: number;
    bonusEarned: number;
    starsTotal: number;
    counter: number;
    finished: boolean;
}
interface Targets {
    tiles: (Point & { value: number | string })[];
    keys: (Point & { key: string })[];
    next: Point | null;
    step: Point | null;
}

const ROUND_LENGTH = 5;

interface Hook { snapshot: Snapshot; targets: Targets }
/** Reads the hook once; null while the scene is not ready (the hook throws or has no round yet). */
const readHook = <K extends keyof Hook>(page: Page, key: K): Promise<Hook[K] | null> =>
    page.evaluate((k) => {
        try {
            const value = (window as unknown as { __martynkaE2E?: Record<string, unknown> }).__martynkaE2E?.[k];
            return (value as Hook[typeof k] | undefined) ?? null;
        } catch {
            return null;
        }
    }, key);
/** Waits until the round is ready (tasks exist), then returns the value: never reads a half-built scene. */
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

/** Taps a point of the 1920x1080 scene space: maps it onto the canvas as the browser draws it. */
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

/** An answer the task certainly rejects: another tile, or answer + 1 on the keypad. */
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

/** After a settled task: "Dalej" moves on (or finishes the round after the fifth task). */
const tapNext = async (page: Page): Promise<void> => {
    await phaseIs(page, 'done');
    const { next } = await targets(page);
    expect(next).not.toBeNull();
    await tapScene(page, next!);
};

/** Plays the open task correctly on the first try and moves on. */
const cleanTask = async (page: Page): Promise<void> => {
    const before = (await snapshot(page)).index;
    await phaseIs(page, 'first');
    await answerRight(page);
    await tapNext(page);
    if (before + 1 < ROUND_LENGTH) {
        await expect.poll(async () => (await snapshot(page)).index).toBe(before + 1);
    }
};

// One canvas at a time: three software-rendered 1920x1080 Phaser pages in parallel starve each
// other's frame loop and make taps time out. Tests stay independent (fresh context each).
test.describe.configure({ mode: 'serial' });
test.setTimeout(60_000);

test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // A stale server without the hook would fail every test with an unreadable error.
    await page.waitForFunction(() => '__martynkaE2E' in window, undefined, { timeout: 15_000 });
    await expect.poll(async () => (await snapshot(page)).phase).toBe('first');
});

test('#11 a clean round of 5 tapped tasks pays a star each plus the bonus', async ({ page }) => {
    for (let i = 0; i < ROUND_LENGTH; i++) {
        await cleanTask(page);
        if (i < ROUND_LENGTH - 1) {
            expect((await snapshot(page)).starsTotal).toBe(i + 1);
        }
    }
    await expect.poll(async () => (await snapshot(page)).finished).toBe(true);
    const end = await snapshot(page);
    expect(end.outcomes).toEqual(Array(ROUND_LENGTH).fill('first'));
    expect(end.bonusEarned).toBe(2);
    expect(end.starsTotal).toBe(ROUND_LENGTH + 2);
    expect(end.counter).toBe(ROUND_LENGTH + 2);
});

test('#11 a wrong tap gives a second try that still earns the star, but no bonus', async ({ page }) => {
    await answerWrong(page);
    await phaseIs(page, 'second');
    expect((await snapshot(page)).starsTotal).toBe(0); // a mistake takes nothing and gives nothing yet
    await answerRight(page);
    await phaseIs(page, 'done');
    expect((await snapshot(page)).starsTotal).toBe(1);
    expect((await snapshot(page)).outcomes[0]).toBe('second');
    await tapNext(page);
    await expect.poll(async () => (await snapshot(page)).index).toBe(1);
    for (let i = 1; i < ROUND_LENGTH; i++) {
        await cleanTask(page);
    }
    await expect.poll(async () => (await snapshot(page)).finished).toBe(true);
    const end = await snapshot(page);
    expect(end.bonusEarned).toBe(0);
    expect(end.starsTotal).toBe(ROUND_LENGTH);
    expect(end.counter).toBe(ROUND_LENGTH);
});

test('#11 two wrong taps lead through the solution to a retype that pays no star', async ({ page }) => {
    await answerWrong(page);
    await phaseIs(page, 'second');
    await answerWrong(page);
    await phaseIs(page, 'solution');
    // Walk the steps until the last one ("Już wiem") hands over to the retype.
    // The step counter in the hook proves each tap was taken before the next one.
    for (let guard = 0; guard < 10 && (await snapshot(page)).phase === 'solution'; guard++) {
        const { step } = await targets(page);
        expect(step).not.toBeNull();
        const before = await snapshot(page);
        await tapScene(page, step!);
        await expect.poll(async () => {
            const now = await snapshot(page);
            return now.phase !== 'solution' || now.solutionStep > before.solutionStep;
        }).toBe(true);
    }
    await phaseIs(page, 'retype');
    await answerRight(page);
    await phaseIs(page, 'done');
    const after = await snapshot(page);
    expect(after.outcomes[0]).toBe('retype');
    expect(after.starsTotal).toBe(0); // nothing for the retyped task, nothing taken away
    await tapNext(page);
    for (let i = 1; i < ROUND_LENGTH; i++) {
        await cleanTask(page);
    }
    await expect.poll(async () => (await snapshot(page)).finished).toBe(true);
    const end = await snapshot(page);
    expect(end.bonusEarned).toBe(0);
    expect(end.starsTotal).toBe(ROUND_LENGTH - 1);
});
