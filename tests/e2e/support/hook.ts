// Hook helpers for the specs that drive a round (read-only window.__martynkaE2E of the e2e build).
// Every tap is a page.touchscreen.tap at a scene point from the hook's targets (1920x1080 space).
// Older specs keep their own copies until they migrate (follow-up).
import { expect, type Page } from '@playwright/test';

export interface Point { x: number; y: number }
export interface Snapshot {
    index: number;
    phase: 'first' | 'second' | 'solution' | 'retype' | 'done';
    input: 'tiles' | 'keypad';
    answer: unknown;
    outcomes: (string | null)[];
    screen: 'welcome' | 'task' | 'summary' | 'unlock' | 'room';
    unlock: { step: number; name: string } | null;
    learner: {
        stage: string;
        unlockedStep: Record<string, number>;
        pendingUnlock: number | null;
    } | null;
}
export interface Targets {
    tiles: (Point & { value: number | string })[];
    keys: (Point & { key: string })[];
    next: Point | null;
    nextRound: Point | null;
    toRoom: Point | null;
    unlockNext: Point | null;
    resume: Point | null;
}
interface Hook { snapshot: Snapshot; targets: Targets }

export const readHook = <K extends keyof Hook>(page: Page, key: K): Promise<Hook[K] | null> =>
    page.evaluate((k) => {
        try {
            const value = (window as unknown as { __martynkaE2E?: Record<string, unknown> }).__martynkaE2E?.[k];
            return (value as Hook[keyof Hook] | undefined) ?? null;
        } catch {
            return null;
        }
    }, key) as Promise<Hook[K] | null>;

export const fromHook = async <K extends keyof Hook>(page: Page, key: K): Promise<Hook[K]> => {
    let value: Hook[K] | null = null;
    await expect
        .poll(async () => {
            value = await readHook(page, key);
            return value !== null;
        })
        .toBe(true);
    return value as unknown as Hook[K];
};
export const snapshot = (page: Page): Promise<Snapshot> => fromHook(page, 'snapshot');
export const targets = (page: Page): Promise<Targets> => fromHook(page, 'targets');

export const tapScene = async (page: Page, point: Point): Promise<void> => {
    const box = await page.locator('#game-container canvas').boundingBox();
    expect(box).not.toBeNull();
    await page.touchscreen.tap(box!.x + (point.x / 1920) * box!.width, box!.y + (point.y / 1080) * box!.height);
};

export const screenIs = async (page: Page, screen: Snapshot['screen']): Promise<void> => {
    await expect.poll(async () => (await snapshot(page)).screen).toBe(screen);
};

/** Taps `point` once the hook has published it (targets are null while the thing is not on screen). */
export const tapTarget = async (page: Page, key: Exclude<keyof Targets, 'tiles' | 'keys'>): Promise<void> => {
    await expect.poll(async () => (await targets(page))[key]).not.toBeNull();
    await tapScene(page, (await targets(page))[key]!);
};

const tapNumber = async (page: Page, value: number): Promise<void> => {
    const { keys } = await targets(page);
    for (const digit of String(value)) {
        await tapScene(page, keys.find((k) => k.key === digit)!);
    }
    await tapScene(page, keys.find((k) => k.key === 'ok')!);
};

export const answerRight = async (page: Page): Promise<void> => {
    const state = await snapshot(page);
    if (state.input === 'tiles') {
        const { tiles } = await targets(page);
        await tapScene(page, tiles.find((t) => t.value === state.answer)!);
    } else {
        await tapNumber(page, state.answer as number);
    }
};

/** Plays the open task right on the first try, then "Dalej"; ends on the next task or on the summary. */
export const playTaskRight = async (page: Page): Promise<void> => {
    const before = (await snapshot(page)).index;
    await expect.poll(async () => (await snapshot(page)).phase).toBe('first');
    await answerRight(page);
    await expect.poll(async () => (await snapshot(page)).phase).toBe('done');
    await tapTarget(page, 'next');
    await expect.poll(async () => {
        const now = await snapshot(page);
        return now.screen === 'summary' || now.index === before + 1;
    }).toBe(true);
};

/** Plays a whole round of `length` tasks right on the first try; ends on the summary. */
export const playRoundRight = async (page: Page, length: number): Promise<void> => {
    for (let i = 0; i < length; i++) {
        await playTaskRight(page);
    }
    await screenIs(page, 'summary');
};
