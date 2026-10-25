// Hook helpers for the specs that drive a round (read-only window.__martynkaE2E of the e2e build).
// Every tap is a page.touchscreen.tap at a scene point from the hook's targets (1920x1080 space).
// Shared by every spec that drives the game: Snapshot and Targets are the union of what the specs read
// (the hook publishes the fields of the screen it is on; a spec reads only what its screen has).
import { expect, type CDPSession, type Page } from '@playwright/test';
import type { AnswerMode } from '../../../src/core/tasks/visual';

export interface Point { x: number; y: number }
export type BlockKind = 'hundred' | 'ten' | 'one';
/** Ids of the coins and notes a payment tray can hold (the grosze each is worth sits in COIN_GROSZE). */
export type MoneyKind = 'coin-1zl' | 'coin-2zl' | 'coin-5zl' | 'note-10zl';
/** The branch of an open 'drag' task, as the hook publishes it (null while no 'drag' task is open). */
export type DragBranch = 'blocks' | 'clock' | 'coins' | null;
export interface Snapshot {
    index: number;
    solutionStep: number;
    /** The solution lines on screen overflow their room even at the smallest scale (audit WNA-04). */
    solutionOverflow?: boolean;
    phase: 'first' | 'second' | 'solution' | 'retype' | 'done';
    input: AnswerMode;
    /** The result boxes of a written column ('digits' mode): how many and the digits typed so far (from the ones); null in any other mode. */
    digits?: { count: number; filled: number[] } | null;
    answer: unknown;
    /** The tiles the task's `check` accepts (several right tiles), null for a task without `check`. */
    correctChoices?: (number | string)[] | null;
    /** The tile painted as correct now (read from the widget), null when none. */
    markedTile?: number | string | null;
    /** The drawing of the open task (a copy), null for a task without one. */
    visual?: { kind: string } | null;
    /** The art images on screen now (S-14), read from the widget's own objects: texture key and whether the texture is loaded. */
    art?: { key: string; loaded: boolean; label: string | null }[];
    /** Task pictures that did not load (texture missing or not decodable) against all that were queued; null before the load ends. */
    artHealth?: { total: number; missing: number } | null;
    /** The service worker's runtime record (phase, error name, takeover); null before the first status. */
    sw?: { phase: string; error: string | null; takenOver: boolean } | null;
    /** The same for the salon pictures (S-16a); null before the load ends. */
    roomArtHealth?: { total: number; missing: number } | null;
    /** The tiles marked in the 'select' mode. */
    selected?: (number | string)[];
    /** The blocks on the mat of the 'drag' mode, and whether a block is under a finger. */
    mat?: Record<BlockKind, number>;
    carrying?: boolean;
    /** Which branch the open task's 'drag' mode uses; null when the task is not a 'drag' task. */
    dragMode?: DragBranch;
    /** The grosze of every coin in the wallet of a payment task (largest first); null for another task. */
    wallet?: number[] | null;
    /** The hands of a clock to set ('drag' mode with a clock drawing), null for another task. */
    clock?: { hour: number; minute: number; carrying: 'hour' | 'minute' | null } | null;
    outcomes: (string | null)[];
    starsEarned: number;
    bonusEarned: number;
    starsTotal: number;
    /** The star balance of the registry (the one source; equals starsTotal). */
    stars: number;
    counterText: string;
    /** The blurred salon behind the notebook (task and welcome screens): which look it has and how many times it was captured. */
    backdrop?: { mode: 'salon' | 'plain'; captures: number; drawn: boolean; blurred: boolean; renderer: 'webgl' | 'canvas'; redraws: number; graded: number };
    /** The fox guide in the notebook corner (fox-guide). */
    guide?: { pose: 'idle' | 'cheer' | 'think' | null; requested: 'idle' | 'cheer' | 'think' | null; visible: boolean; rect: { x: number; y: number; width: number; height: number }; interactive: boolean; pops: number };
    settingsHint: boolean;
    screen: 'loading' | 'welcome' | 'task' | 'summary' | 'unlock' | 'room';
    /** The boot loading screen (BootScene still loading): its phase. */
    loading?: { phase: 'loading' | 'slow' | 'over'; art: { background: boolean; emblem: boolean } };
    /** Files the total boot limit ended and how many times BootScene.create ran; null before the first create. */
    bootLoad?: { cut: string[]; creates: number; elapsedMs: number; hiddenMs: number } | null;
    /** Whether the task font arrived (`fallback` = drawn in a system font); null before the first create. */
    fontHealth?: 'loaded' | 'fallback' | null;
    /** Which drawn fallback the child saw instead of a screen picture (wallet, notebook, miniature, loading), with the mode; runtime only. */
    artFallbacks?: Record<string, string>;
    /** The sound service (read-only): preferences, the audio lock, the last plays, effects that did not load, the music state. */
    sound?: { prefs: { effects: boolean; music: boolean }; locked: boolean; log: { id: string; outcome: 'played' | 'off' | 'locked' | 'missing' }[]; missing: string[]; music: 'off' | 'loading' | 'waiting-unlock' | 'playing' | 'missing' } | null;
    /** What the open room shows (room screen only). */
    room?: { roomId: string; tasksDone: number; chosen: Record<string, number>; shown: Record<string, number>; worn: { keys: string[]; graded: boolean }; contactShadows: string[]; currentTask: { id: string; label: string; cost: number } | null; taskKind: 'stage' | 'slot' | null; affordable: boolean; buttonText: string; panel: { kind: 'closed' } | { kind: 'open'; mode: 'buy'; taskId: string; preview: 0 | 1 | 2 | null } | { kind: 'open'; mode: 'change'; slot: string; preview: 0 | 1 | 2 | null }; hold: 'idle' | 'holding'; heldSlot: string | null; done: boolean; stageDone: boolean; mode: 'normal' | 'change'; card: { title: string; items: { kind: 'room' | 'teaser'; id: string | null; nameKey: string | null; done: boolean; unlocked: boolean }[] } | null; doneMiniature: 'live' | 'thumbnail' | 'drawn' | null; modeText: string | null; unreachable: string[] } | null;
    summary: { earned: number; bonus: number; stars: boolean[]; roomHighlighted: boolean } | null;
    finished: boolean;
    warmup: boolean;
    /** The open round is a variant (S-15): its kind, the letters uncovered so far (word; null = hidden) and the results covered (dice). Null for an ordinary round. */
    variant?: { kind: 'word' | 'dice' | 'puzzle'; puzzleId: string | null; letters: (string | null)[] | null; covered: number[] | null } | null;
    narration: string | null;
    heading: string | null;
    speakerVisible: boolean;
    unlock: { step: number; name: string } | null;
    /** Whether the game's input manager takes pointer events (false under the adult gate and the settings panel). */
    inputEnabled: boolean;
    /** Autosave status (read-only): how the save was loaded, whether writes are blocked, counters. */
    save: { load: 'fresh' | 'loaded' | 'unreadable' | 'unavailable'; blocked: boolean; blockedBy: 'unreadable' | 'unavailable' | 'newer' | 'otherTab' | 'fatal' | null; dirty: boolean; writes: number; failures: number; consecutiveFailures: number; skipped: number; lastReason: 'change' | 'now' | 'hidden' | 'migration' | null; lastError: string | null; lastWriteAt: number | null; lastFailure: { stage: 'encode' | 'backup' | 'write' | 'replace'; error: string } | null; migratedFrom: number | null; migrationWrittenAt: number | null; loadReason: 'corrupt' | 'future' | 'unknown-version' | 'migration-failed' | null; loadError: string | null; backup: 'none' | 'pending' | 'failed' | 'done' | 'skipped'; backupError: string | null; replace: 'idle' | 'writing' | 'done'; persistence: 'unknown' | 'granted' | 'denied' | 'unsupported' | 'error'; store: { ops: ('backup' | 'write')[]; writtenVersion: number | null } | null } | null;
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
    /** Interior points of a payment task: tray tiles per money id, the wallet, "OK" and the placed coins; null for another task. */
    coins?: { tray: Partial<Record<MoneyKind, Point>>; wallet: Point | null; ok: Point | null; coins: (Point & { id: MoneyKind })[]; walletArt: 'art' | 'drawn'; full: boolean } | null;
    /** Hand tips (the minute tip is null on a full-hour clock), centre, "OK" and the grab radius of a clock to set; null for another task. */
    clock?: { centre: Point; hourTip: Point; minuteTip: Point | null; ok: Point | null; radius: number } | null;
    next: Point | null;
    /** The rectangle of the drawing (null while hidden); a spec aims at its interior. */
    picture?: { x: number; y: number; width: number; height: number } | null;
    /** The rectangle of the hint number line of an ADD_SUB task (null while hidden): it shows only after a miss. */
    hintPicture?: { x: number; y: number; width: number; height: number } | null;
    step: Point | null;
    nextRound: Point | null;
    toRoom: Point | null;
    /** "Kolejna runda" / "Do pokoju" of a minigame's done card. */
    doneNext?: Point | null;
    doneRoom?: Point | null;
    unlockNext: Point | null;
    ageBack?: Point | null;
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
interface Hook { snapshot: Snapshot; targets: Targets; backdropPixel: [number, number, number, number] }

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

/**
 * A finger that starts on `from`, travels to `to` (scene space) and STAYS DOWN: the gesture is mid-way while the caller reads the hook.
 * `release(end)` moves to `end`, lifts the finger and detaches. (Not `holdTouch`, which is the long press of the room.)
 */
export const holdDrag = async (page: Page, from: Point, to: Point, steps = 4): Promise<{ release(end: Point): Promise<void> }> => {
    const cdp = await page.context().newCDPSession(page);
    try {
        const start = await toPage(page, from);
        const stop = await toPage(page, to);
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [start] });
        for (let step = 1; step <= steps; step++) {
            const at = { x: start.x + ((stop.x - start.x) * step) / steps, y: start.y + ((stop.y - start.y) * step) / steps };
            await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [at] });
        }
    } catch (error) {
        await cdp.detach();
        throw error;
    }
    return {
        release: async (end: Point): Promise<void> => {
            try {
                const at = await toPage(page, end);
                await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [at] });
                await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
            } finally {
                await cdp.detach();
            }
        },
    };
};

/** The same drag, but the system cancels the touch (touchCancel) instead of lifting the finger. */
export const cancelTouch = async (page: Page, from: Point, to: Point, steps = 8): Promise<void> => {
    await dragGesture(page, from, to, steps, 'touchCancel');
};

const dragGesture = async (page: Page, from: Point, to: Point, steps: number, end: 'touchEnd' | 'touchCancel'): Promise<void> => {
    const cdp = await page.context().newCDPSession(page);
    try {
        await dragOn(cdp, page, from, to, steps, end);
    } finally {
        await cdp.detach();
    }
};

/** One drag on an open CDP session (a build of many blocks reuses one session instead of opening one per block). */
const dragOn = async (cdp: CDPSession, page: Page, from: Point, to: Point, steps: number, end: 'touchEnd' | 'touchCancel'): Promise<void> => {
    const start = await toPage(page, from);
    const stop = await toPage(page, to);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [start] });
    for (let step = 1; step <= steps; step++) {
        const at = { x: start.x + ((stop.x - start.x) * step) / steps, y: start.y + ((stop.y - start.y) * step) / steps };
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [at] });
    }
    await cdp.send('Input.dispatchTouchEvent', { type: end, touchPoints: [] });
};

/** Touch-move points per block in a build: enough to pass `startDistance`, few enough that a round of builds stays fast. */
const BUILD_STEPS = 3;

/** Builds `value` on the mat of a 'drag' task: each block dragged from its tray to the mat, the hook's mat count polled after each. */
export const buildOnMat = async (page: Page, value: number): Promise<void> => {
    const { drag } = await targets(page);
    expect(drag?.mat).toBeTruthy();
    const counts: Record<BlockKind, number> = { hundred: Math.floor(value / 100), ten: Math.floor(value / 10) % 10, one: value % 10 };
    const cdp = await page.context().newCDPSession(page);
    try {
        for (const kind of ['hundred', 'ten', 'one'] as const) {
            for (let i = 1; i <= counts[kind]; i++) {
                const from = drag!.tray[kind];
                expect(from, `tray block ${kind}`).toBeTruthy();
                await dragOn(cdp, page, from!, drag!.mat!, BUILD_STEPS, 'touchEnd');
                await expect.poll(async () => (await snapshot(page)).mat?.[kind]).toBe(i);
            }
        }
    } finally {
        await cdp.detach();
    }
};

/** What each tray tile is worth, in grosze: the oracle of the helpers (written here, not read from the app). */
export const COIN_GROSZE: Record<MoneyKind, number> = { 'coin-1zl': 100, 'coin-2zl': 200, 'coin-5zl': 500, 'note-10zl': 1000 };

/**
 * Pays with `grosze` (one entry per coin): each coin is dragged from its tray tile into the wallet, and the hook's wallet is polled
 * after each. One touch session for the whole payment, like buildOnMat. The caller taps "OK".
 */
export const payCoins = async (page: Page, grosze: readonly number[]): Promise<void> => {
    const { coins } = await targets(page);
    expect(coins?.wallet, 'a payment wallet is open').toBeTruthy();
    // Every attempt starts from an empty wallet: the scene empties it when a task opens and after a wrong answer.
    expect((await snapshot(page)).wallet, 'the wallet is empty before paying').toEqual([]);
    const cdp = await page.context().newCDPSession(page);
    try {
        let placed = 0;
        for (const value of grosze) {
            const id = (Object.keys(COIN_GROSZE) as MoneyKind[]).find((k) => COIN_GROSZE[k] === value);
            const from = id ? coins!.tray[id] : undefined;
            expect(from, `tray tile worth ${value}`).toBeTruthy();
            await dragOn(cdp, page, from!, coins!.wallet!, BUILD_STEPS, 'touchEnd');
            placed += 1;
            await expect.poll(async () => (await snapshot(page)).wallet?.length).toBe(placed);
        }
    } finally {
        await cdp.detach();
    }
};

/** "3.15" -> hour 3, minute 15 (the answer text of a clock task). */
const parseTime = (text: string): { hour: number; minute: number } => {
    const [hour, minute] = text.split('.').map(Number);
    return { hour, minute };
};

/** The point at `degrees` clockwise from 12, `radius` from `centre`. */
const onDial = (centre: Point, degrees: number, radius: number): Point => {
    const rad = (degrees * Math.PI) / 180;
    return { x: centre.x + Math.sin(rad) * radius, y: centre.y - Math.cos(rad) * radius };
};

/**
 * Sets the hands of a 'drag' clock task to `time` ("3.15") and polls the hook for the result. The minute hand goes first (the hour
 * hand's drift depends on the minutes), each hand with one finger drag from its tip (published by the hook) to the angle it must
 * point at, at the tip's own distance from the centre. Does not press "OK".
 */
export const setClock = async (page: Page, time: string): Promise<void> => {
    const want = parseTime(time);
    const read = async (): Promise<NonNullable<Snapshot['clock']>> => {
        const clock = (await snapshot(page)).clock;
        expect(clock, 'a clock to set is open').toBeTruthy();
        return clock!;
    };
    const dist = (a: Point, b: Point): number => Math.hypot(a.x - b.x, a.y - b.y);
    if ((await read()).minute !== want.minute) {
        const { clock } = await targets(page);
        expect(clock?.minuteTip, 'minute hand can be held').toBeTruthy();
        await dragTouch(page, clock!.minuteTip!, onDial(clock!.centre, want.minute * 6, dist(clock!.centre, clock!.minuteTip!)), CLOCK_STEPS);
        await expect.poll(async () => (await read()).minute).toBe(want.minute);
    }
    if ((await read()).hour !== want.hour) {
        const { clock } = await targets(page);
        await dragTouch(page, clock!.hourTip, onDial(clock!.centre, (want.hour % 12) * 30 + want.minute * 0.5, dist(clock!.centre, clock!.hourTip)), CLOCK_STEPS);
        await expect.poll(async () => (await read()).hour).toBe(want.hour);
    }
};

/** Taps "OK" of the clock to set once the hook has published it. */
export const tapClockOk = async (page: Page): Promise<void> => {
    await expect.poll(async () => (await targets(page)).clock?.ok ?? null).not.toBeNull();
    await tapScene(page, (await targets(page)).clock!.ok!);
};

/** Touch-move points per hand: enough to pass `startDistance`, few enough to stay fast. */
const CLOCK_STEPS = 4;

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
export const tapTarget = async (page: Page, key: Exclude<keyof Targets, 'tiles' | 'keys' | 'selectTiles' | 'drag' | 'clock' | 'coins' | 'ages' | 'parent' | 'settingsIcon' | 'thumbs' | 'slots'>): Promise<void> => {
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

/** Types `value` into the boxes of a written column ('digits' mode): the digits from the ones to the highest column, then OK. */
export const typeDigits = async (page: Page, value: number, columns: number): Promise<void> => {
    const { keys } = await targets(page);
    const digits = String(value).padStart(columns, '0').split('').reverse();
    for (const digit of digits) {
        await tapScene(page, keys.find((k) => k.key === digit)!);
    }
    await tapScene(page, keys.find((k) => k.key === 'ok')!);
};

/** The number of result boxes of the open 'digits' task. */
const boxCount = async (page: Page): Promise<number> => {
    const digits = (await snapshot(page)).digits;
    expect(digits, 'a written column is open').toBeTruthy();
    return digits!.count;
};

/** Never reached for a mode the helper handles; a new answer mode is a type error here until it is answered. */
const unanswerable = (mode: never): never => {
    throw new Error(`no e2e answer for mode ${String(mode)}`);
};

/**
 * An answer the task certainly rejects: another tile, answer + 1 on the keypad or on the mat (drag), or one marked tile that is not in the
 * answer set (select; never depends on the tile order). Returns the value given.
 */
export const answerWrong = async (page: Page): Promise<number | string | (number | string)[]> => {
    const state = await snapshot(page);
    if (state.input === 'tiles') {
        const { tiles } = await targets(page);
        const right = state.correctChoices ?? [state.answer as number | string];
        const tile = tiles.find((t) => !right.includes(t.value))!;
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
    if (state.input === 'drag' && state.dragMode === 'coins') {
        // The right wallet with one more 1 zł coin: the sum is a złoty too high, so every variant (also "fewest") refuses it.
        const given = [...(state.answer as number[]), 100];
        await payCoins(page, given);
        await tapScene(page, (await targets(page)).coins!.ok!);
        return given;
    }
    if (state.input === 'drag' && state.clock) {
        // The hour one later on the same minutes (12 wraps to 1): a time the task certainly rejects.
        const right = parseTime(state.answer as string);
        const given = `${(right.hour % 12) + 1}.${String(right.minute).padStart(2, '0')}`;
        await setClock(page, given);
        await tapClockOk(page);
        return given;
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
    if (state.input === 'digits') {
        // Same number of digits: one more, or one less when the answer is the top of the range (never a carry into a new column).
        const right = state.answer as number;
        const given = String(right + 1).length === String(right).length ? right + 1 : right - 1;
        await typeDigits(page, given, await boxCount(page));
        return given;
    }
    if (state.input !== 'keypad') {
        return unanswerable(state.input);
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
        // Exhaustive over the branches of 'drag': a new branch is a type error here until it can be answered.
        const branch = state.dragMode;
        switch (branch) {
            case 'clock':
                await setClock(page, state.answer as string);
                await tapClockOk(page);
                break;
            case 'coins':
                await payCoins(page, state.answer as number[]);
                await tapScene(page, (await targets(page)).coins!.ok!);
                break;
            case 'blocks':
                await buildOnMat(page, state.answer as number);
                await tapScene(page, (await targets(page)).drag!.ok!);
                break;
            case null: case undefined:
                throw new Error('a drag task without a dragMode in the hook snapshot');
            default:
                unanswerable(branch);
        }
    } else if (state.input === 'digits') {
        await typeDigits(page, state.answer as number, await boxCount(page));
    } else if (state.input === 'keypad') {
        await tapNumber(page, state.answer as number);
    } else {
        unanswerable(state.input);
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
