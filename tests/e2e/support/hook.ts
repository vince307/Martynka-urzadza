// Hook helpers for the specs that drive a round (read-only window.__martynkaE2E of the e2e build).
// Every tap is a page.touchscreen.tap at a scene point from the hook's targets (1920x1080 space).
// Shared by every spec that drives the game: Snapshot and Targets are the union of what the specs read
// (the hook publishes the fields of the screen it is on; a spec reads only what its screen has).
import { expect, type Page } from '@playwright/test';

export interface Point { x: number; y: number }
export interface Snapshot {
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
    screen: 'welcome' | 'task' | 'summary' | 'unlock' | 'room';
    summary: { earned: number; bonus: number; stars: boolean[]; roomHighlighted: boolean } | null;
    finished: boolean;
    warmup: boolean;
    narration: string | null;
    speakerVisible: boolean;
    unlock: { step: number; name: string } | null;
    /** Whether the game's input manager takes pointer events (false under the adult gate and the settings panel). */
    inputEnabled: boolean;
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
    next: Point | null;
    step: Point | null;
    nextRound: Point | null;
    toRoom: Point | null;
    unlockNext: Point | null;
    resume: Point | null;
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
export const tapTarget = async (page: Page, key: Exclude<keyof Targets, 'tiles' | 'keys' | 'ages' | 'parent' | 'settingsIcon'>): Promise<void> => {
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

/** An answer the task certainly rejects: another tile, or answer + 1 on the keypad. Returns the value given. */
export const answerWrong = async (page: Page): Promise<number | string> => {
    const state = await snapshot(page);
    if (state.input === 'tiles') {
        const { tiles } = await targets(page);
        const tile = tiles.find((t) => t.value !== state.answer)!;
        await tapScene(page, tile);
        return tile.value;
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
