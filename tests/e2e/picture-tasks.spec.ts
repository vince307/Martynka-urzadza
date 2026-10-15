// Risk #11 for the E1 tasks drawn as pictures (S-14d phase 10): shape tiles drawn as figures, the multi-select of figures, a pattern
// strip, two groups to compare and an icon row. What the child touches exists only on the canvas, so every answer is a touch at a
// hook target. ?e2eSkills (e2e build only) fills the round cyclically with the listed skills (odd tasks = first id) and
// e2eVariant=off keeps the round ordinary. Parent path on E1 (age 10+ proposes E6, so E1 is an override: no warm-up).
// Only polls on the snapshot, no clock.
import { test, expect, type Page } from '@playwright/test';
import { answerRight, answerWrong, phaseIs, screenIs, silenceSpeech, snapshot, tapNext } from './support/hook';
import { passWelcomeAsParent } from './support/welcome';

const ROUND_LENGTH = 5;

const open = async (page: Page, skills: string[]): Promise<void> => {
    await silenceSpeech(page);
    await passWelcomeAsParent(page, {
        age: '10+',
        stageLabel: 'Klasa 1, I półrocze',
        stage: 'E1',
        month: 9,
        query: { e2eSkills: skills.join(','), e2eVariant: 'off' },
    });
    await phaseIs(page, 'first');
};

/** Plays the open task right on the first try, then "Dalej"; returns the drawing kind it showed. */
const playRight = async (page: Page, i: number): Promise<string | undefined> => {
    await expect.poll(async () => (await snapshot(page)).index).toBe(i);
    await phaseIs(page, 'first');
    const kind = (await snapshot(page)).visual?.kind;
    await answerRight(page);
    await phaseIs(page, 'done');
    expect((await snapshot(page)).outcomes[i]).toBe('first');
    await tapNext(page);
    return kind;
};

test('#11 a shape tile drawn as a figure is tapped and pays a star', async ({ page }) => {
    test.setTimeout(60_000);
    await open(page, ['E1.1.shapes_pick', 'E1.1.pattern']);
    const first = await snapshot(page);
    expect(first.input).toBe('tiles');

    // A tile that is not the answer: the hint phase, then the right tile still pays the star.
    await answerWrong(page);
    await phaseIs(page, 'second');
    expect((await snapshot(page)).starsEarned).toBe(0);
    await answerRight(page);
    await phaseIs(page, 'done');
    const done = await snapshot(page);
    expect(done.outcomes[0]).toBe('second');
    expect(done.starsEarned).toBe(1);
    await tapNext(page);

    const kinds = new Set<string | undefined>();
    for (let i = 1; i < ROUND_LENGTH; i++) {
        kinds.add(await playRight(page, i));
    }
    await screenIs(page, 'summary');
    expect(kinds.has('pattern')).toBe(true);
});

test('#11 select all circles and compare two groups by touch', async ({ page }) => {
    test.setTimeout(60_000);
    await open(page, ['E1.1.shapes_all', 'E1.1.compare_qty_10']);
    const inputs = new Set<string>();
    for (let i = 0; i < ROUND_LENGTH; i++) {
        await expect.poll(async () => (await snapshot(page)).index).toBe(i);
        await phaseIs(page, 'first');
        inputs.add((await snapshot(page)).input);
        await playRight(page, i);
    }
    await screenIs(page, 'summary');
    expect(inputs).toEqual(new Set(['select', 'tiles']));
    expect((await snapshot(page)).summary).toMatchObject({ earned: ROUND_LENGTH + 2, bonus: 2, stars: Array(ROUND_LENGTH).fill(true) });
});

test('#11 which one in the row is answered on number tiles', async ({ page }) => {
    test.setTimeout(60_000);
    await open(page, ['E1.2.ordinal_5', 'E1.3.choose_op_picture_5']);
    const kinds = new Set<string | undefined>();
    for (let i = 0; i < ROUND_LENGTH; i++) {
        await expect.poll(async () => (await snapshot(page)).index).toBe(i);
        await phaseIs(page, 'first');
        expect((await snapshot(page)).input).toBe('tiles');
        kinds.add(await playRight(page, i));
    }
    await screenIs(page, 'summary');
    expect(kinds).toEqual(new Set(['row', 'icons']));
});
