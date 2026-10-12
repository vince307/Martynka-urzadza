// Risk #11 (context/foundation/test-plan.md): the round logic is unit-tested, but the child
// plays it through the real touch path (Scale.FIT mapping, tiles, keypad, "Dalej"). Runs in
// the chromium-hook project against the e2e build that carries the read-only hook
// (window.__martynkaE2E). The hook says where things are and what the state is; every tap
// goes through page.touchscreen.tap. Expected stars come from the PRD (FR-006/FR-007):
// 1 star for a correct first or second try, 0 for the retype, +2 for a round without a
// mistake, never lost. The round ends on the summary screen ("Kolejna runda", "Do pokoju");
// the room is entered from there or from the HUD switch between tasks and left with
// "Wróć do notesu". The star total is read from the text the HUD counter draws.
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
    counterText: string;
    screen: 'task' | 'summary' | 'room';
    summary: { earned: number; bonus: number; stars: boolean[]; roomHighlighted: boolean } | null;
    finished: boolean;
}
interface Targets {
    tiles: (Point & { value: number | string })[];
    keys: (Point & { key: string })[];
    next: Point | null;
    step: Point | null;
    nextRound: Point | null;
    toRoom: Point | null;
    resume: Point | null;
    roomSwitch: Point | null;
}

const ROUND_LENGTH = 5;

interface Hook { snapshot: Snapshot; targets: Targets }
/** Reads the hook once; null while the scene is not ready (the hook throws or has no round yet). */
const readHook = <K extends keyof Hook>(page: Page, key: K): Promise<Hook[K] | null> =>
    page.evaluate((k) => {
        try {
            const value = (window as unknown as { __martynkaE2E?: Record<string, unknown> }).__martynkaE2E?.[k];
            return (value as Hook[keyof Hook] | undefined) ?? null;
        } catch {
            return null;
        }
    }, key) as Promise<Hook[K] | null>;
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

const screenIs = async (page: Page, screen: Snapshot['screen']): Promise<void> => {
    await expect.poll(async () => (await snapshot(page)).screen).toBe(screen);
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
    // The narrator button is not under test here: a device without any voice keeps it hidden,
    // whatever voices the machine running the test happens to have.
    await page.addInitScript(() => {
        const silent = { getVoices: () => [], speak: () => undefined, cancel: () => undefined, addEventListener: () => undefined, removeEventListener: () => undefined };
        Object.defineProperty(window, 'speechSynthesis', { value: silent, configurable: true });
    });
    await page.goto('/');
    // A stale server without the hook would fail every test with an unreadable error.
    await page.waitForFunction(() => '__martynkaE2E' in window, undefined, { timeout: 15_000 });
    await expect.poll(async () => (await snapshot(page)).phase).toBe('first');
});

test('#11 a clean round of 5 tapped tasks pays a star each plus the bonus, shown on the summary', async ({ page }) => {
    for (let i = 0; i < ROUND_LENGTH; i++) {
        await cleanTask(page);
        if (i < ROUND_LENGTH - 1) {
            expect((await snapshot(page)).starsTotal).toBe(i + 1);
        }
    }
    await screenIs(page, 'summary');
    const end = await snapshot(page);
    expect(end.finished).toBe(true);
    expect(end.outcomes).toEqual(Array(ROUND_LENGTH).fill('first'));
    expect(end.summary).toMatchObject({ earned: ROUND_LENGTH + 2, bonus: 2, stars: Array(ROUND_LENGTH).fill(true) });
    expect(end.starsTotal).toBe(ROUND_LENGTH + 2);
    expect(end.counterText).toBe(String(ROUND_LENGTH + 2));

    // "Kolejna runda": a fresh round, the total is kept.
    const { nextRound } = await targets(page);
    expect(nextRound).not.toBeNull();
    await tapScene(page, nextRound!);
    await screenIs(page, 'task');
    await phaseIs(page, 'first');
    const again = await snapshot(page);
    expect(again.index).toBe(0);
    expect(again.finished).toBe(false);
    expect(again.starsTotal).toBe(ROUND_LENGTH + 2);
    expect(again.counterText).toBe(String(ROUND_LENGTH + 2));
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
    await screenIs(page, 'summary');
    const end = await snapshot(page);
    expect(end.summary).toMatchObject({ earned: ROUND_LENGTH, bonus: 0, stars: Array(ROUND_LENGTH).fill(true) });
    expect(end.starsTotal).toBe(ROUND_LENGTH);
    expect(end.counterText).toBe(String(ROUND_LENGTH));
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
    expect(after.counterText).toBe('0');
    await tapNext(page);
    for (let i = 1; i < ROUND_LENGTH; i++) {
        await cleanTask(page);
    }
    await screenIs(page, 'summary');
    const end = await snapshot(page);
    expect(end.summary).toMatchObject({ earned: ROUND_LENGTH - 1, bonus: 0, stars: [false, true, true, true, true] });
    expect(end.starsTotal).toBe(ROUND_LENGTH - 1);
    expect(end.counterText).toBe(String(ROUND_LENGTH - 1));
});

test('#11 the room is reached from the HUD between tasks and from the summary, and both ways lead back to the same screen', async ({ page }) => {
    // The HUD switch is hidden while the child solves: first try and second try.
    expect((await targets(page)).roomSwitch).toBeNull();
    await answerWrong(page);
    await phaseIs(page, 'second');
    expect((await targets(page)).roomSwitch).toBeNull();
    await answerRight(page);
    await phaseIs(page, 'done');

    // After a correct answer it shows; a tap goes to the room, which hides it and keeps the total.
    await expect.poll(async () => (await targets(page)).roomSwitch).not.toBeNull();
    await tapScene(page, (await targets(page)).roomSwitch!);
    await screenIs(page, 'room');
    const inRoom = await snapshot(page);
    expect(inRoom.counterText).toBe('1');
    expect((await targets(page)).roomSwitch).toBeNull();

    // "Wróć do notesu": the same round, same task, still waiting for "Dalej".
    const { resume } = await targets(page);
    expect(resume).not.toBeNull();
    await tapScene(page, resume!);
    await screenIs(page, 'task');
    const back = await snapshot(page);
    expect(back.phase).toBe('done');
    expect(back.index).toBe(0);
    expect(back.outcomes[0]).toBe('second');
    expect(back.starsTotal).toBe(1);
    await expect.poll(async () => (await targets(page)).roomSwitch).not.toBeNull();
    await tapNext(page);
    await expect.poll(async () => (await snapshot(page)).index).toBe(1);
    expect((await targets(page)).roomSwitch).toBeNull();

    // Finish the round (a mistake on the first task: no bonus), then "Do pokoju" from the summary.
    for (let i = 1; i < ROUND_LENGTH; i++) {
        await cleanTask(page);
    }
    await screenIs(page, 'summary');
    const summary = await snapshot(page);
    expect(summary.summary).toMatchObject({ earned: ROUND_LENGTH, bonus: 0 });
    const { toRoom } = await targets(page);
    expect(toRoom).not.toBeNull();
    await tapScene(page, toRoom!);
    await screenIs(page, 'room');
    expect((await snapshot(page)).counterText).toBe(String(ROUND_LENGTH));
    await tapScene(page, (await targets(page)).resume!);
    await screenIs(page, 'summary');
    const returned = await snapshot(page);
    expect(returned.summary).toEqual(summary.summary);
    expect(returned.starsTotal).toBe(ROUND_LENGTH);
    expect(returned.counterText).toBe(String(ROUND_LENGTH));
});
