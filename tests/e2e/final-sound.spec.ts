// S-16b sound (test-plan risks #11, #14, #16): the cue rules, the preference toggles and the lazy music are unit-tested; this
// spec proves them in the real browser, through the real touch path, on the e2e build with the read-only hook
// (window.__martynkaE2E, snapshot.sound = prefs, locked, log, missing, music). The hook log is written by the sound service at
// every play(), so a log entry proves the request in the event, not that anything was heard (that is the [human] row).
// Service workers are blocked: the e2e hook build is a production build, so its worker would download every sound, music
// included, at install, and page.route cannot see requests the worker answers. Requests are counted at page level.
import { test, expect, type Page } from '@playwright/test';
import { openSettings, passWelcome } from './support/welcome';
import { answerRight, answerWrong, phaseIs, screenIs, silenceSpeech, snapshot, tapNext, tapScene, tapTarget, targets } from './support/hook';

const ROUND_LENGTH = 5;
// A keypad skill of E3 (a numeric answer on every draw); a pinned round is never a variant (S-15).
const PINNED_SKILL = 'E3.2.add_sub_20_bridge';
const MUSIC_REQUEST = /assets\/sounds\/(m4a|ogg)\/music-loop\./;

test.use({ serviceWorkers: 'block' });
test.describe.configure({ mode: 'serial' });
test.setTimeout(90_000);

/** The ids the sound service has logged, oldest first. */
const logged = async (page: Page): Promise<string[]> => ((await snapshot(page)).sound?.log ?? []).map((entry) => entry.id);

test('#11 S-16b a round by touch requests answer-right, star, answer-retry and round-bonus, and never the music', async ({ page }) => {
    await silenceSpeech(page);
    await passWelcome(page, { e2eSkills: PINNED_SKILL, e2eVariant: 'off' });
    await phaseIs(page, 'first');
    const start = await snapshot(page);
    expect(start.sound?.missing).toEqual([]);
    expect(start.sound?.prefs).toEqual({ effects: true, music: false });

    // A wrong first answer: the retry cue, played (the welcome taps have unlocked the audio context).
    await answerWrong(page);
    await phaseIs(page, 'second');
    await expect.poll(async () => (await snapshot(page)).sound?.log.find((e) => e.id === 'answer-retry')?.outcome).toBe('played');

    // The right second answer: answer-right, then a star 250 ms later.
    await answerRight(page);
    await phaseIs(page, 'done');
    await expect.poll(async () => (await snapshot(page)).sound?.log.find((e) => e.id === 'star')?.outcome).toBe('played');
    expect((await snapshot(page)).sound?.log.find((e) => e.id === 'answer-right')?.outcome).toBe('played');

    // A clean run of the remaining tasks and a round with a mistake pays no bonus: no round-bonus yet.
    await tapNext(page);
    for (let i = 1; i < ROUND_LENGTH; i++) {
        await expect.poll(async () => (await snapshot(page)).index).toBe(i);
        await phaseIs(page, 'first');
        await answerRight(page);
        await tapNext(page);
    }
    await screenIs(page, 'summary');
    expect(await logged(page)).not.toContain('round-bonus');

    // A clean second round ends with the bonus cue.
    await tapTarget(page, 'nextRound');
    await screenIs(page, 'task');
    for (let i = 0; i < ROUND_LENGTH; i++) {
        await phaseIs(page, 'first');
        await answerRight(page);
        await tapNext(page);
        if (i < ROUND_LENGTH - 1) {
            await expect.poll(async () => (await snapshot(page)).index).toBe(i + 1);
        }
    }
    await screenIs(page, 'summary');
    const end = await snapshot(page);
    expect(end.summary?.bonus).toBe(2);
    expect(end.sound?.log.filter((e) => e.id === 'round-bonus').map((e) => e.outcome)).toEqual(['played']);
    expect(end.sound?.log.some((e) => e.id === 'music-loop')).toBe(false);
    expect(end.sound?.music).toBe('off');
});

test('#16 S-16b opening the variant panel, a preview and Wybieram request panel-open, variant-pick and purchase, in that order', async ({ page }) => {
    await silenceSpeech(page);
    await passWelcome(page, { e2eStars: '40', e2eVariant: 'off', e2eSkills: PINNED_SKILL });
    await phaseIs(page, 'first');
    await answerRight(page);
    await phaseIs(page, 'done');
    await tapTarget(page, 'roomSwitch');
    await screenIs(page, 'room');

    // The stage first (one tap, a purchase cue, no panel); then the sofa through the panel.
    await tapTarget(page, 'taskButton');
    await expect.poll(async () => (await snapshot(page)).room?.stageDone).toBe(true);
    await expect.poll(async () => (await snapshot(page)).room?.currentTask?.id).toBe('add-sofa');
    const base = (await logged(page)).length;
    const stagePurchases = (await logged(page)).filter((id) => id === 'purchase').length;

    await tapTarget(page, 'taskButton');
    await expect.poll(async () => (await snapshot(page)).room?.panel.kind).toBe('open');
    const thumbs = (await targets(page)).thumbs ?? [];
    expect(thumbs.length).toBe(3);
    await tapScene(page, thumbs[1]);
    await expect.poll(async () => {
        const panel = (await snapshot(page)).room?.panel;
        return panel?.kind === 'open' ? panel.preview : null;
    }).toBe(1);
    await tapTarget(page, 'choose');
    await expect.poll(async () => (await snapshot(page)).room?.tasksDone).toBe(2);

    const fresh = (await snapshot(page)).sound!.log.slice(base);   // the log keeps 50 entries; this test adds far fewer
    const cues = fresh.map((entry) => entry.id);
    expect(cues.filter((id) => ['panel-open', 'variant-pick', 'purchase'].includes(id))).toEqual(['panel-open', 'variant-pick', 'purchase']);
    expect((await logged(page)).filter((id) => id === 'purchase').length).toBe(stagePurchases + 1);
    expect(fresh.every((entry) => entry.outcome === 'played')).toBe(true);
});

test('#14 S-16b the parent turns effects off and music on; the music is requested only after Zatwierdź and the choice survives a reload', async ({ page, browser }) => {
    await silenceSpeech(page);
    const requests: string[] = [];
    page.on('request', (request) => {
        if (MUSIC_REQUEST.test(request.url())) {
            requests.push(request.url());
        }
    });
    await passWelcome(page, { e2eSkills: PINNED_SKILL, e2eVariant: 'off' });
    await phaseIs(page, 'first');
    expect((await snapshot(page)).sound?.prefs).toEqual({ effects: true, music: false });
    expect(requests).toEqual([]);

    const panel = await openSettings(page);
    await expect(panel.getByRole('heading', { name: 'Dźwięki', exact: true })).toBeVisible();
    await panel.getByRole('group', { name: 'Efekty dźwiękowe', exact: true }).getByRole('button', { name: 'Wyłączone', exact: true }).tap();
    await panel.getByRole('group', { name: 'Muzyka', exact: true }).getByRole('button', { name: 'Włączone', exact: true }).tap();
    expect(requests).toEqual([]);   // choosing is not applying
    await panel.getByRole('button', { name: 'Zatwierdź', exact: true }).tap();
    await expect(panel).toHaveCount(0);

    await expect.poll(() => requests.length).toBeGreaterThan(0);
    await expect.poll(async () => (await snapshot(page)).sound?.music).toMatch(/loading|playing/);
    expect((await snapshot(page)).sound?.prefs).toEqual({ effects: false, music: true });

    // The next answer is logged as switched off.
    await answerRight(page);
    await phaseIs(page, 'done');
    await expect.poll(async () => (await snapshot(page)).sound?.log.find((e) => e.id === 'answer-right')?.outcome).toBe('off');

    // A reload in the same context keeps the choice, and the music is requested again with no panel opened.
    requests.length = 0;
    await page.reload();
    await page.waitForFunction(() => '__martynkaE2E' in window, undefined, { timeout: 15_000 });
    await expect.poll(async () => (await snapshot(page)).sound?.prefs).toEqual({ effects: false, music: true });
    await expect.poll(() => requests.length).toBeGreaterThan(0);

    // Another device (a new context) has the defaults and asks for no music.
    const other = await browser.newContext({ serviceWorkers: 'block', hasTouch: true, viewport: { width: 1280, height: 720 }, baseURL: test.info().project.use.baseURL });
    try {
        const second = await other.newPage();
        const otherRequests: string[] = [];
        second.on('request', (request) => {
            if (MUSIC_REQUEST.test(request.url())) {
                otherRequests.push(request.url());
            }
        });
        await silenceSpeech(second);
        await second.goto('/');
        await second.waitForFunction(() => '__martynkaE2E' in window, undefined, { timeout: 15_000 });
        await expect.poll(async () => (await snapshot(second)).screen).toBe('welcome');
        expect((await snapshot(second)).sound?.prefs).toEqual({ effects: true, music: false });
        expect(otherRequests).toEqual([]);
    } finally {
        await other.close();
    }
});
