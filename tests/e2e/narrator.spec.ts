// Narrator (plan narrator-round-summary, phase 12; FR-009 and the PRD NFR "no voice never blocks
// the flow"; no numbered risk in context/foundation/test-plan.md yet). The browser speech
// synthesizer is replaced by a fake installed before the page scripts run: it offers the voices a
// test chooses and records every utterance. Runs in the chromium-hook project (read-only hook,
// window.__martynkaE2E). Speech needs a user gesture, so the speaker must react to the END of a
// touch (pointerup) and the game must stay silent until the child taps; the default stage (E3)
// has automatic reading off, so "Dalej" is silent too.
import { test, expect, type Page } from '@playwright/test';

interface Point { x: number; y: number }
interface Snapshot {
    phase: 'first' | 'second' | 'solution' | 'retype' | 'done';
    input: 'tiles' | 'keypad';
    answer: unknown;
    screen: 'task' | 'summary' | 'room';
    narration: string | null;
    speakerVisible: boolean;
}
interface Targets {
    tiles: (Point & { value: number | string })[];
    keys: (Point & { key: string })[];
    next: Point | null;
    speaker: Point | null;
}
interface Spoken { text: string; lang: string; rate: number }
interface FakeVoice { lang: string; localService: boolean }

const ROUND_LENGTH = 5;

/** Fake speechSynthesis + SpeechSynthesisUtterance; utterances land in window.__spoken (never in the game's hook). */
const installSpeech = async (page: Page, voices: FakeVoice[]): Promise<void> => {
    await page.addInitScript((voiceList) => {
        const spoken: { text: string; lang: string; rate: number }[] = [];
        const calls = { cancel: 0 };
        class FakeUtterance {
            voice: { lang: string } | null = null;
            lang = '';
            rate = 1;
            onend: (() => void) | null = null;
            onerror: (() => void) | null = null;
            constructor(public text: string) {}
        }
        const synth = {
            getVoices: () => voiceList,
            speak: (u: FakeUtterance) => {
                if (u.text !== '') spoken.push({ text: u.text, lang: u.voice?.lang ?? '', rate: u.rate }); // '' is the silent gesture unlock
            },
            cancel: () => void (calls.cancel += 1), // the narrator cancels synchronously when it is asked to speak
            addEventListener: () => undefined,
            removeEventListener: () => undefined,
        };
        Object.defineProperty(window, 'speechSynthesis', { value: synth, configurable: true });
        Object.defineProperty(window, 'SpeechSynthesisUtterance', { value: FakeUtterance, configurable: true });
        Object.defineProperty(window, '__spoken', { value: spoken, configurable: true });
        Object.defineProperty(window, '__calls', { value: calls, configurable: true });
    }, voices);
};

const spokenSoFar = (page: Page): Promise<Spoken[]> =>
    page.evaluate(() => [...(window as unknown as { __spoken: Spoken[] }).__spoken]);

const cancelCalls = (page: Page): Promise<number> =>
    page.evaluate(() => (window as unknown as { __calls: { cancel: number } }).__calls.cancel);

/** Lets the game loop run n frames (the narrator's own delay is 80 ms): a deterministic stand-in for sleeping. */
const frames = (page: Page, n: number): Promise<void> =>
    page.evaluate(
        (count) => new Promise<void>((resolve) => {
            const step = (left: number): void => (left === 0 ? resolve() : void requestAnimationFrame(() => step(left - 1)));
            step(count);
        }),
        n,
    );

type Hook = { snapshot: Snapshot; targets: Targets };
const fromHook = async <K extends keyof Hook>(page: Page, key: K): Promise<Hook[K]> => {
    let value: Hook[K] | null = null;
    await expect
        .poll(async () => {
            value = await page.evaluate((k) => {
                try {
                    return ((window as unknown as { __martynkaE2E?: Record<string, unknown> }).__martynkaE2E?.[k]) ?? null;
                } catch {
                    return null;
                }
            }, key) as Hook[K] | null;
            return value !== null;
        })
        .toBe(true);
    return value as unknown as Hook[K];
};
const snapshot = (page: Page): Promise<Snapshot> => fromHook(page, 'snapshot');
const targets = (page: Page): Promise<Targets> => fromHook(page, 'targets');

/** Maps a point of the 1920x1080 scene space onto the page as the browser draws the canvas. */
const toPage = async (page: Page, point: Point): Promise<Point> => {
    const box = await page.locator('#game-container canvas').boundingBox();
    expect(box).not.toBeNull();
    return { x: box!.x + (point.x / 1920) * box!.width, y: box!.y + (point.y / 1080) * box!.height };
};
const tapScene = async (page: Page, point: Point): Promise<void> => {
    const at = await toPage(page, point);
    await page.touchscreen.tap(at.x, at.y);
};
const phaseIs = async (page: Page, phase: Snapshot['phase']): Promise<void> => {
    await expect.poll(async () => (await snapshot(page)).phase).toBe(phase);
};
const tapNumber = async (page: Page, value: number): Promise<void> => {
    const { keys } = await targets(page);
    for (const digit of String(value)) await tapScene(page, keys.find((k) => k.key === digit)!);
    await tapScene(page, keys.find((k) => k.key === 'ok')!);
};
const answer = async (page: Page, right: boolean): Promise<void> => {
    const state = await snapshot(page);
    if (state.input === 'tiles') {
        const { tiles } = await targets(page);
        await tapScene(page, tiles.find((t) => (t.value === state.answer) === right)!);
    } else {
        await tapNumber(page, (state.answer as number) + (right ? 0 : 1));
    }
};
const tapNext = async (page: Page): Promise<void> => {
    await phaseIs(page, 'done');
    const { next } = await targets(page);
    expect(next).not.toBeNull();
    await tapScene(page, next!);
};

test.describe.configure({ mode: 'serial' });
test.setTimeout(60_000);

const openGame = async (page: Page): Promise<void> => {
    await page.goto('/');
    await page.waitForFunction(() => '__martynkaE2E' in window, undefined, { timeout: 15_000 });
    await phaseIs(page, 'first');
};

test.describe('narrator with a Polish voice', () => {
    test.beforeEach(async ({ page }) => {
        await installSpeech(page, [{ lang: 'en-US', localService: true }, { lang: 'pl_PL', localService: true }]);
        await openGame(page);
    });

    test('#narrator the game is silent at a cold start and "Dalej" stays silent on the default stage', async ({ page }) => {
        await expect.poll(async () => (await snapshot(page)).speakerVisible).toBe(true);
        await frames(page, 30); // negative check: a wrongly started speech would have been spoken by now
        expect(await spokenSoFar(page)).toEqual([]);
        await answer(page, true);
        await tapNext(page);
        await expect.poll(async () => (await snapshot(page)).phase).toBe('first');
        await frames(page, 30);
        expect(await spokenSoFar(page)).toEqual([]); // the default stage E3 has automatic reading off
    });

    test('#narrator the speaker reads the narration on pointerup only, in Polish, without the answer; a wrong answer reads the retry prompt', async ({ page }) => {
        const speaker = (await targets(page)).speaker;
        expect(speaker).not.toBeNull();
        const at = await toPage(page, speaker!);
        const cdp = await page.context().newCDPSession(page);
        await frames(page, 30);
        const cancelsBefore = await cancelCalls(page);

        // Finger down: nothing is spoken yet.
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: at.x, y: at.y }] });
        await frames(page, 30); // the game loop has seen the press (and the narrator's 80 ms delay has passed)
        expect(await spokenSoFar(page)).toEqual([]);
        expect(await cancelCalls(page)).toBe(cancelsBefore); // no speak request either: the narrator cancels first on every request
        // Finger up: the narration is read.
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        await expect.poll(async () => (await spokenSoFar(page)).length).toBe(1);
        const [first] = await spokenSoFar(page);
        const task = await snapshot(page);
        expect(task.narration).not.toBeNull();
        expect(first.text).toBe(task.narration);
        expect(first.lang).toMatch(/^pl/i);
        expect(first.text).toMatch(/\p{L}{3,}/u); // Polish words, not a bare number
        expect(first.text).not.toMatch(/[□−·\u00A0]/u); // the drawn symbols are spelled out for the ear
        if (task.input === 'tiles') {
            // The correct tile's value is never announced as the whole spoken text.
            expect(first.text.trim()).not.toBe(String(task.answer));
        }

        // A wrong answer: the speaker now reads the retry prompt.
        await answer(page, false);
        await phaseIs(page, 'second');
        const retry = await snapshot(page);
        expect(retry.narration).toContain('Spróbuj jeszcze raz');
        await tapScene(page, (await targets(page)).speaker!);
        await expect.poll(async () => (await spokenSoFar(page)).length).toBe(2);
        const all = await spokenSoFar(page);
        expect(all[1].text).toBe(retry.narration);
        expect(all[1].lang).toMatch(/^pl/i);
    });
});

test('#narrator without a Polish voice the speaker stays hidden, nothing is spoken and the round still plays to the summary', async ({ page }) => {
    await installSpeech(page, [{ lang: 'en-US', localService: true }]);
    await openGame(page);
    // The narrator polls for voices for a few seconds before it gives up; the speaker must not appear at any point of the round.
    for (let i = 0; i < ROUND_LENGTH; i++) {
        await phaseIs(page, 'first');
        expect((await targets(page)).speaker).toBeNull();
        expect((await snapshot(page)).speakerVisible).toBe(false);
        await answer(page, true);
        await tapNext(page);
    }
    await expect.poll(async () => (await snapshot(page)).screen).toBe('summary');
    expect(await spokenSoFar(page)).toEqual([]);
});
