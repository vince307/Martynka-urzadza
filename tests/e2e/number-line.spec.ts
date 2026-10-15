// Risk #11 for the number line and the arrow graph (S-14b): a round played the real touch way. ?e2eSkills (e2e build only) forces the
// skill; the hook reports the rectangles the scene itself holds (targets.picture, targets.hintPicture: null while the widget is hidden,
// read from the widget's shown() state) and the open task (snapshot.visual, snapshot.input). No clock, only polls on the hook.
//   (a) an ADD_SUB number line is a hint: absent on the first try, drawn in the hint rectangle after a miss (break p11a: the view
//       gives the hint drawing in the first phase too);
//   (b) an arrow graph is drawn and takes the keypad (break p11b: the graph widget never reports itself shown);
//   (c) the jumps of a multiplication are answered with an expression tile, and the right one is among the tiles (break p11c: the
//       right expression is dropped from the choices).
// A stage the parent picks that is not the proposal skips the warm-up: age 10+ proposes E6 (src/data/placement.ts).
import { test, expect, type Page } from '@playwright/test';
import { passWelcomeAsParent } from './support/welcome';
import { answerRight, answerWrong, phaseIs, silenceSpeech, snapshot, tapScene, targets } from './support/hook';
import { TASK_LAYOUT } from '../../src/data/layout';

const STAGES = {
    E2: { age: '10+', stageLabel: 'Klasa 1, II półrocze', stage: 'E2' },
    E3: { age: '10+', stageLabel: 'Klasa 2, I półrocze', stage: 'E3' },
} as const;

const open = async (page: Page, stage: keyof typeof STAGES, skill: string): Promise<void> => {
    await silenceSpeech(page);
    await passWelcomeAsParent(page, { ...STAGES[stage], query: { e2eSkills: skill, e2eVariant: 'off' } });
    await phaseIs(page, 'first');
};

test.describe.configure({ mode: 'serial' });

test('#11 an ADD_SUB number line shows only after a miss', async ({ page }) => {
    test.setTimeout(45_000);
    await open(page, 'E3', 'E3.8.add_sub_30_bridge');
    expect((await snapshot(page)).input).toBe('keypad');
    // First try: no hint drawing, the task has no drawing of its own either.
    expect((await targets(page)).hintPicture).toBeNull();
    expect((await snapshot(page)).visual).toBeNull();

    await answerWrong(page);
    await phaseIs(page, 'second');
    await expect.poll(async () => (await targets(page)).hintPicture).not.toBeNull();
    const hint = (await targets(page)).hintPicture!;
    expect(hint).toEqual(TASK_LAYOUT.picture.hint.keypad.picture);

    await answerRight(page);
    await phaseIs(page, 'done');
    const done = await snapshot(page);
    expect(done.outcomes[0]).toBe('second');
    expect(done.starsEarned).toBeGreaterThan(0);
});

test('#11 an arrow graph takes the keypad', async ({ page }) => {
    test.setTimeout(45_000);
    await open(page, 'E2', 'E2.6.arrow_graph_20');
    const first = await snapshot(page);
    expect(first.visual?.kind).toBe('arrows');
    expect(first.input).toBe('keypad');
    await expect.poll(async () => (await targets(page)).picture).not.toBeNull();

    await answerRight(page);
    await phaseIs(page, 'done');
    const done = await snapshot(page);
    expect(done.outcomes[0]).toBe('first');
    expect(done.starsEarned).toBeGreaterThan(0);
});

test('#11 number-line jumps take an expression tile', async ({ page }) => {
    test.setTimeout(45_000);
    await open(page, 'E3', 'E3.9.mult_groups_jumps');
    const first = await snapshot(page);
    expect(first.visual?.kind).toBe('numberLine');
    expect(first.input).toBe('tiles');
    await expect.poll(async () => (await targets(page)).picture).not.toBeNull();
    // The right expression is one of the tiles on screen, and tapping it pays.
    const { tiles } = await targets(page);
    expect(tiles.map((t) => t.value)).toContain(first.answer);
    await tapScene(page, tiles.find((t) => t.value === first.answer)!);
    await phaseIs(page, 'done');
    const done = await snapshot(page);
    expect(done.outcomes[0]).toBe('first');
    expect(done.starsEarned).toBeGreaterThan(0);
});
