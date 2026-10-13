// Hook helpers for the specs that drive a round (read-only window.__martynkaE2E of the e2e build).
// Every tap is a page.touchscreen.tap at a scene point from the hook's targets (1920x1080 space).
// Shared by every spec that drives the game: Snapshot and Targets are the union of what the specs read
// (the hook publishes the fields of the screen it is on; a spec reads only what its screen has).
import { expect, type Page } from '@playwright/test';

export interface Point { x: number; y: number }
export type BlockKind = 'hundred' | 'ten' | 'one';
export interface Snapshot {
    index: number;
    solutionStep: number;
    phase: 'first' | 'second' | 'solution' | 'retype' | 'done';
    input: 'tiles' | 'keypad' | 'select' | 'drag';
    answer: unknown;
    /** The tiles marked in the 'select' mode. */
    selected?: (number | string)[];
    /** The blocks on the mat of the 'drag' mode, and whether a block is under a finger. */
    mat?: Record<BlockKind, number>;
    carrying?: boolean;
    outcomes: (string | null)[];
    starsEarned: number;
    bonusEarned: number;
    starsTotal: number;
    /** The star balance of the registry (the one source; equals starsTotal). */
    stars: number;
    counterText: string;
    screen: 'welcome' | 'task' | 'summary' | 'unlock' | 'room';
    /** What the open room shows (room screen only). */
    room?: { roomId: string; tasksDone: number; chosen: Record<string, number>; currentTask: { id: string; label: string; cost: number } | null; affordable: boolean; buttonText: string; panel: { kind: 'closed' } | { kind: 'open'; mode: 'buy'; taskId: string; preview: 0 | 1 | 2 | null } | { kind: 'open'; mode: 'change'; slot: string; preview: 0 | 1 | 2 | null }; hold: 'idle' | 'holding'; heldSlot: string | null; done: boolean; mode: 'normal' | 'change'; card: { title: string; items: { kind: 'room' | 'teaser'; id: string | null; nameKey: string | null; done: boolean; unlocked: boolean }[] } | null; modeText: string | null } | null;
    summary: { earned: number; bonus: number; stars: boolean[]; roomHighlighted: boolean } | null;
    finished: boolean;
    warmup: boolean;
    narration: string | null;
    speakerVisible: boolean;
    unlock: { step: number; name: string } | null;
    /** Whether the game's input manager takes pointer events (false under the adult gate and the settings panel). */
    inputEnabled: boolean;
    /** Autosave status (read-only): how the save was loaded, whether writes are blocked, counters. */
    save: { load: 'fresh' | 'loaded' | 'unreadable' | 'unavailable'; blocked: boolean; blockedBy: 'unreadable' | 'unavailable' | 'fatal' | null; dirty: boolean; writes: number; failures: number; consecutiveFailures: number; skipped: number; lastReason: 'change' | 'now' | 'hidden' | null; lastError: string | null; lastWriteAt: number | null } | null;
    /** Stage of the open round (task screens only). */
    stage?: string;
    /** Automatic reading in effect now: the parent's choice, else the stage default (task screens only). */
    autoRead?: boolean;
    /** The parent's saved choices; autoRead null = no choice yet. */
    settings?: { autoRead: boolean | null };
    learner: {
        stage: string;
        unlockedStep: Record<string, number>;
        pendingUnlock: number | null;
        warmupPending?: boolean;
        stageOverriddenByParent?: boolean;
        /** Answer history (newest last); firstTry false = a miss on the first try. */
        history?: { skillId: string; firstTry: boolean }[];
    } | null;
}
export interface Targets {
    tiles: (Point & { value: number | string })[];
    keys: (Point & { key: string })[];
    selectTiles?: (Point & { value: number | string })[];
    selectOk?: Point | null;
    /** Interior points of the 'drag' mode: tray blocks per kind, the mat, "OK" and the blocks lying on the mat. */
    drag?: { tray: Partial<Record<BlockKind, Point>>; mat: Point | null; ok: Point | null; matBlocks: (Point & { kind: BlockKind })[] };
    next: Point | null;
    step: Point | null;
    nextRound: Point | null;
    toRoom: Point | null;
    unlockNext: Point | null;
    resume: Point | null;
    taskButton?: Point | null;
    thumbs?: Point[];
    choose?: Point | null;
    close?: Point | null;
    modeButton?: Point | null;
    cardNext?: Point | null;
    slots?: Record<string, Point>;
    roomSwitch: Point | null;
    speaker: Point | null;
    ages?: (Point & { age: number })[];
    parent?: Point;
    settingsIcon?: Point;
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

/** Maps a point of the 1920x1080 scene space onto the page as the browser draws the canvas. */
export const toPage = async (page: Page, point: Point): Promise<Point> => {
    const box = await page.locator('#game-container canvas').boundingBox();
    expect(box).not.toBeNull();
    return { x: box!.x + (point.x / 1920) * box!.width, y: box!.y + (point.y / 1080) * box!.height };
};

export const tapScene = async (page: Page, point: Point): Promise<void> => {
    const at = await toPage(page, point);
    await page.touchscreen.tap(at.x, at.y);
};

/**
 * A finger held on `point` (scene space) for `ms`: raw CDP touchStart, optional drift of `drift` scene px along x
 * (5 touchMove steps), the hold itself, touchEnd. The hold is the gesture, not a synchronisation wait: it is the only
 * fixed-time wait a spec may have (a long press cannot be observed any other way).
 */
export const holdTouch = async (page: Page, point: Point, ms: number, drift = 0): Promise<void> => {
    const from = await toPage(page, point);
    const to = await toPage(page, { x: point.x + drift, y: point.y });
    const cdp = await page.context().newCDPSession(page);
    try {
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [from] });
        if (drift !== 0) {
            for (let step = 1; step <= 5; step++) {
                const at = { x: from.x + ((to.x - from.x) * step) / 5, y: from.y };
                await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [at] });
            }
        }
        await page.waitForTimeout(ms);
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    } finally {
        await cdp.detach();
    }
};

/**
 * A finger dragging from `from` to `to` (scene space): raw CDP touchStart, `steps` touchMove points along the line,
 * then touchEnd. The drag is the gesture; there is no wait, and the caller polls the hook for the result.
 */
export const dragTouch = async (page: Page, from: Point, to: Point, steps = 8): Promise<void> => {
    await dragGesture(page, from, to, steps, 'touchEnd');
};

/** The same drag, but the system cancels the touch (touchCancel) instead of lifting the finger. */
export const cancelTouch = async (page: Page, from: Point, to: Point, steps = 8): Promise<void> => {
    await dragGesture(page, from, to, steps, 'touchCancel');
};

const dragGesture = async (page: Page, from: Point, to: Point, steps: number, end: 'touchEnd' | 'touchCancel'): Promise<void> => {
    const start = await toPage(page, from);
    const stop = await toPage(page, to);
    const cdp = await page.context().newCDPSession(page);
    try {
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [start] });
        for (let step = 1; step <= steps; step++) {
            const at = { x: start.x + ((stop.x - start.x) * step) / steps, y: start.y + ((stop.y - start.y) * step) / steps };
            await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [at] });
        }
        await cdp.send('Input.dispatchTouchEvent', { type: end, touchPoints: [] });
    } finally {
        await cdp.detach();
    }
};

/** Builds `value` on the mat of a 'drag' task: each block dragged from its tray to the mat, the hook's mat count polled after each. */
export const buildOnMat = async (page: Page, value: number): Promise<void> => {
    const { drag } = await targets(page);
    expect(drag?.mat).toBeTruthy();
    const counts: Record<BlockKind, number> = { hundred: Math.floor(value / 100), ten: Math.floor(value / 10) % 10, one: value % 10 };
    for (const kind of ['hundred', 'ten', 'one'] as const) {
        for (let i = 1; i <= counts[kind]; i++) {
            const from = drag!.tray[kind];
            expect(from, `tray block ${kind}`).toBeTruthy();
            await dragTouch(page, from!, drag!.mat!);
            await expect.poll(async () => (await snapshot(page)).mat?.[kind]).toBe(i);
        }
    }
};

export const screenIs = async (page: Page, screen: Snapshot['screen']): Promise<void> => {
    await expect.poll(async () => (await snapshot(page)).screen).toBe(screen);
};

export const phaseIs = async (page: Page, phase: Snapshot['phase']): Promise<void> => {
    await expect.poll(async () => (await snapshot(page)).phase).toBe(phase);
};

/** After a settled task: "Dalej" moves on (or finishes the round after the last task). Checks once, no polling (see tapTarget). */
export const tapNext = async (page: Page): Promise<void> => {
    await phaseIs(page, 'done');
    const { next } = await targets(page);
    expect(next).not.toBeNull();
    await tapScene(page, next!);
};

/** Taps `point` once the hook has published it (targets are null while the thing is not on screen). */
export const tapTarget = async (page: Page, key: Exclude<keyof Targets, 'tiles' | 'keys' | 'selectTiles' | 'drag' | 'ages' | 'parent' | 'settingsIcon' | 'thumbs' | 'slots'>): Promise<void> => {
    await expect.poll(async () => (await targets(page))[key]).not.toBeNull();
    await tapScene(page, (await targets(page))[key]!);
};

export const tapNumber = async (page: Page, value: number): Promise<void> => {
    const { keys } = await targets(page);
    for (const digit of String(value)) {
        await tapScene(page, keys.find((k) => k.key === digit)!);
    }
    await tapScene(page, keys.find((k) => k.key === 'ok')!);
};

/**
 * An answer the task certainly rejects: another tile, answer + 1 on the keypad or on the mat (drag), or one marked tile that is not in the
 * answer set (select; never depends on the tile order). Returns the value given.
 */
export const answerWrong = async (page: Page): Promise<number | string | (number | string)[]> => {
    const state = await snapshot(page);
    if (state.input === 'tiles') {
        const { tiles } = await targets(page);
        const tile = tiles.find((t) => t.value !== state.answer)!;
        await tapScene(page, tile);
        return tile.value;
    }
    if (state.input === 'select') {
        const { selectTiles, selectOk } = await targets(page);
        const right = state.answer as number[];
        const tile = selectTiles!.find((t) => !right.includes(t.value as number))!;
        await tapScene(page, tile);
        await tapScene(page, selectOk!);
        return [tile.value];
    }
    if (state.input === 'drag') {
        // Builds the answer + 1 (one cube more), or the answer - 1 when the ones are already 9 (a cube less, never a 10th cube).
        const { drag } = await targets(page);
        const right = state.answer as number;
        const given = right % 10 === 9 ? right - 1 : right + 1;
        await buildOnMat(page, given);
        await tapScene(page, drag!.ok!);
        return given;
    }
    const given = (state.answer as number) + 1;
    await tapNumber(page, given);
    return given;
};

export const answerRight = async (page: Page): Promise<void> => {
    const state = await snapshot(page);
    if (state.input === 'tiles') {
        const { tiles } = await targets(page);
        await tapScene(page, tiles.find((t) => t.value === state.answer)!);
    } else if (state.input === 'select') {
        const { selectTiles, selectOk } = await targets(page);
        for (const value of state.answer as number[]) {
            await tapScene(page, selectTiles!.find((t) => t.value === value)!);
        }
        await tapScene(page, selectOk!);
    } else if (state.input === 'drag') {
        const { drag } = await targets(page);
        await buildOnMat(page, state.answer as number);
        await tapScene(page, drag!.ok!);
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

/** A device without any voice: hides the narrator button whatever voices the machine running the test has. Call before the page loads. */
export const silenceSpeech = async (page: Page): Promise<void> => {
    await page.addInitScript(() => {
        const silent = { getVoices: () => [], speak: () => undefined, cancel: () => undefined, addEventListener: () => undefined, removeEventListener: () => undefined };
        Object.defineProperty(window, 'speechSynthesis', { value: silent, configurable: true });
    });
};

/** A device with a Polish voice: the narrator finds it at once. Call before the page loads. */
export const fakePolishVoice = async (page: Page): Promise<void> => {
    await page.addInitScript(() => {
        class FakeUtterance {
            voice: { lang: string } | null = null;
            lang = '';
            rate = 1;
            onend: (() => void) | null = null;
            onerror: (() => void) | null = null;
            constructor(public text: string) {}
        }
        const synth = {
            getVoices: () => [{ lang: 'pl-PL', localService: true }],
            speak: () => undefined,
            cancel: () => undefined,
            addEventListener: () => undefined,
            removeEventListener: () => undefined,
        };
        Object.defineProperty(window, 'speechSynthesis', { value: synth, configurable: true });
        Object.defineProperty(window, 'SpeechSynthesisUtterance', { value: FakeUtterance, configurable: true });
    });
};
