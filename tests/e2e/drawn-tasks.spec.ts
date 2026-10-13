// Risk #11 for the drawn tasks (S-13): the drawing, the 'select' mode and the 'drag' mode are played by touch on the
// rendered page (Scale.FIT mapping, raw CDP touches). ?e2eSkills (e2e build only) fills the round with the named skills, so
// each test meets the task type it is about; the parent path starts on stage E3 with no warm-up. The hook says where things
// are (interior points) and what the state is; no clock is pinned and nothing waits for time, only polls on the snapshot.
import { test, expect, type Page } from '@playwright/test';
import { passWelcome } from './support/welcome';
import {
    answerRight, answerWrong, buildOnMat, cancelTouch, dragTouch, phaseIs, playRoundRight, screenIs, silenceSpeech, snapshot, tapScene, targets,
} from './support/hook';

const NOTEBOOK = { left: 180, top: 204, width: 1560, height: 788 };   // data/layout.ts notebook, scene space
const CLOCK = 'E3.3.clock_read_full';
const SELECT = 'E3.7.select_even_30';
const BUILD = 'E3.6.place_build_30';
const ROUND = [CLOCK, 'E3.4.data_most_10', 'E3.5.length_ruler_cm_15', BUILD, SELECT];

// Drag rounds are slow in a software-rendered browser: every test sets its own limit.
test.describe.configure({ mode: 'serial' });

const open = async (page: Page, skills: string[]): Promise<void> => {
    await silenceSpeech(page);
    await passWelcome(page, { e2eSkills: skills.join(',') });
    await phaseIs(page, 'first');
};

test('#11 a clock task shows the face and is answered by tapping a time tile', async ({ page }) => {
    test.setTimeout(60_000);
    await open(page, [CLOCK]);
    const first = await snapshot(page);
    expect(first.input).toBe('tiles');
    expect(first.visual?.kind).toBe('clock');
    const { picture } = await targets(page);
    expect(picture).toBeTruthy();
    // The drawing sits inside the notebook, not off to the side of it.
    expect(picture!.x).toBeGreaterThanOrEqual(NOTEBOOK.left);
    expect(picture!.y).toBeGreaterThanOrEqual(NOTEBOOK.top);
    expect(picture!.x + picture!.width).toBeLessThanOrEqual(NOTEBOOK.left + NOTEBOOK.width);
    expect(picture!.y + picture!.height).toBeLessThanOrEqual(NOTEBOOK.top + NOTEBOOK.height);

    await answerWrong(page);
    await phaseIs(page, 'second');
    expect((await targets(page)).picture).toBeTruthy();   // the face stays while the hint is shown
    expect((await snapshot(page)).visual?.kind).toBe('clock');
    await answerRight(page);
    await phaseIs(page, 'done');
    const done = await snapshot(page);
    expect(done.outcomes[0]).toBe('second');
    expect(done.starsTotal).toBe(1);
});

test('#11 a select task needs the whole set: a partial set gets a hint, the full set and OK earn the star', async ({ page }) => {
    test.setTimeout(60_000);
    await open(page, [SELECT]);
    const state = await snapshot(page);
    expect(state.input).toBe('select');
    const right = state.answer as number[];
    expect(right.length).toBeGreaterThan(1);   // a lone correct tile would be the whole set

    // One correct tile and "OK" is not the whole set.
    const { selectTiles, selectOk } = await targets(page);
    await tapScene(page, selectTiles!.find((t) => t.value === right[0])!);
    await expect.poll(async () => (await snapshot(page)).selected).toEqual([right[0]]);
    await tapScene(page, selectOk!);
    await phaseIs(page, 'second');
    expect((await snapshot(page)).selected).toEqual([]);   // the mistaken set is cleared
    expect((await snapshot(page)).starsTotal).toBe(0);

    await answerRight(page);
    await phaseIs(page, 'done');
    const done = await snapshot(page);
    expect(done.outcomes[0]).toBe('second');
    expect(done.starsTotal).toBe(1);
});

test('#11 a drag task builds the number on the mat by touch', async ({ page }) => {
    test.setTimeout(120_000);
    await open(page, [BUILD]);
    const state = await snapshot(page);
    expect(state.input).toBe('drag');
    const answer = state.answer as number;
    expect(answer).toBeGreaterThan(10);
    const tens = Math.floor(answer / 10);
    const ones = answer % 10;
    expect(state.mat).toEqual({ hundred: 0, ten: 0, one: 0 });

    // A ten from the tray onto the mat.
    let drag = (await targets(page)).drag!;
    await dragTouch(page, drag.tray.ten!, drag.mat!);
    await expect.poll(async () => (await snapshot(page)).mat?.ten).toBe(1);

    // A cube dropped outside the mat is not placed.
    await dragTouch(page, drag.tray.one!, { x: 700, y: 260 });
    await expect.poll(async () => (await snapshot(page)).carrying).toBe(false);
    expect((await snapshot(page)).mat).toEqual({ hundred: 0, ten: 1, one: 0 });

    // A tap on a block lying on the mat takes it back.
    drag = (await targets(page)).drag!;
    expect(drag.matBlocks).toHaveLength(1);
    await tapScene(page, drag.matBlocks[0]);
    await expect.poll(async () => (await snapshot(page)).mat?.ten).toBe(0);

    // Now the whole number, and OK.
    await buildOnMat(page, answer);
    expect((await snapshot(page)).mat).toEqual({ hundred: 0, ten: tens, one: ones });
    drag = (await targets(page)).drag!;
    await tapScene(page, drag.ok!);
    await phaseIs(page, 'done');
    const done = await snapshot(page);
    expect(done.outcomes[0]).toBe('first');
    expect(done.starsTotal).toBe(1);
});

test('#11 a cancelled touch never places a block', async ({ page }) => {
    test.setTimeout(90_000);
    await open(page, [BUILD]);
    const { drag } = await targets(page);
    await cancelTouch(page, drag!.tray.ten!, drag!.mat!);
    await expect.poll(async () => (await snapshot(page)).carrying).toBe(false);
    expect((await snapshot(page)).mat).toEqual({ hundred: 0, ten: 0, one: 0 });

    // The cancel left nothing stuck: a normal drag still places the block.
    await dragTouch(page, drag!.tray.ten!, drag!.mat!);
    await expect.poll(async () => (await snapshot(page)).mat?.ten).toBe(1);
});

test('#11 a round of drawn tasks plays to the summary', async ({ page }) => {
    test.setTimeout(240_000);
    await open(page, ROUND);
    await playRoundRight(page, 5);
    await screenIs(page, 'summary');
    const end = await snapshot(page);
    expect(end.outcomes).toEqual(Array(5).fill('first'));
    expect(end.summary).toMatchObject({ earned: 7, bonus: 2, stars: Array(5).fill(true) });
    expect(end.starsTotal).toBe(7);
    expect(end.counterText).toBe('7');
});
