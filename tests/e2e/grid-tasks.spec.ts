// Risk #11 for the grid tasks (S-13b): a magic square drawn as number cells, a coordinate grid read through text tiles, and a perimeter
// figure that stays drawn beside the keypad while the solution runs. ?e2eSkills (e2e build only) forces the skill. The hook reports what
// the widget itself shows: targets.picture is the drawing's rectangle and is null unless the widget's shown() is true, so a drawing that
// was never drawn turns the poll red (break p11a). No clock, only polls on the snapshot.
import { test, expect, type Page } from '@playwright/test';
import { passWelcomeAsParent } from './support/welcome';
import { answerRight, answerWrong, phaseIs, silenceSpeech, snapshot, tapScene, targets } from './support/hook';
import { TASK_LAYOUT } from '../../src/data/layout';

const STAGES = {
    E3: { age: '10+', stageLabel: 'Klasa 2, I półrocze', stage: 'E3' },
    E4: { age: '10+', stageLabel: 'Klasa 2, II półrocze', stage: 'E4' },
} as const;

const open = async (page: Page, stage: keyof typeof STAGES, skill: string): Promise<void> => {
    await silenceSpeech(page);
    await passWelcomeAsParent(page, { ...STAGES[stage], query: { e2eSkills: skill } });
    await phaseIs(page, 'first');
};

test.describe.configure({ mode: 'serial' });

test('#11 a magic square shows its cells and takes the keypad after a hint', async ({ page }) => {
    test.setTimeout(45_000);
    await open(page, 'E3', 'E3.5.magic_square_30');
    const first = await snapshot(page);
    expect(first.visual?.kind).toBe('cells');
    expect(first.input).toBe('keypad');
    await expect.poll(async () => (await targets(page)).picture).not.toBeNull();

    await answerWrong(page);
    await phaseIs(page, 'second');
    await expect.poll(async () => (await targets(page)).picture).not.toBeNull();

    await answerRight(page);
    await phaseIs(page, 'done');
    const done = await snapshot(page);
    expect(done.outcomes[0]).toBe('second');
    expect(done.starsEarned).toBeGreaterThan(0);
});

test('#11 a grid task takes a text tile', async ({ page }) => {
    test.setTimeout(45_000);
    await open(page, 'E3', 'E3.7.grid_where');
    const first = await snapshot(page);
    expect(first.visual?.kind).toBe('grid');
    expect(first.input).toBe('tiles');
    expect(String(first.answer)).toMatch(/^[A-Z][1-9]$/);
    const { tiles } = await targets(page);
    expect(tiles.map((tile) => tile.value)).toContain(first.answer);
    expect(tiles.every((tile) => /^[A-Z0-9]+$/.test(String(tile.value)))).toBe(true);

    await answerRight(page);
    await phaseIs(page, 'done');
    const done = await snapshot(page);
    expect(done.outcomes[0]).toBe('first');
    expect(done.starsEarned).toBeGreaterThan(0);
});

test('#11 a perimeter figure stays drawn beside the keypad in the solution', async ({ page }) => {
    test.setTimeout(60_000);
    await open(page, 'E4', 'E4.7.perimeter_rect');
    const first = await snapshot(page);
    expect(first.visual?.kind).toBe('figure');
    expect(first.input).toBe('keypad');
    await expect.poll(async () => (await targets(page)).picture).not.toBeNull();

    await answerWrong(page);
    await phaseIs(page, 'second');
    await answerWrong(page);
    await phaseIs(page, 'solution');
    await expect.poll(async () => (await targets(page)).picture).not.toBeNull();
    const strip = TASK_LAYOUT.picture.keypadSolution;
    const picture = (await targets(page)).picture!;
    // The strip above the solution lines: inside its columns, ending above where the lines start.
    expect(picture.x).toBeGreaterThanOrEqual(strip.picture.x);
    expect(picture.x + picture.width).toBeLessThanOrEqual(strip.picture.x + strip.picture.width);
    expect(picture.y + picture.height).toBeLessThanOrEqual(strip.lines.y);

    // Walk the solution steps until the last one hands over to the retype.
    for (let guard = 0; guard < 10 && (await snapshot(page)).phase === 'solution'; guard++) {
        const { step } = await targets(page);
        expect(step).not.toBeNull();
        const prior = await snapshot(page);
        await tapScene(page, step!);
        await expect.poll(async () => {
            const now = await snapshot(page);
            return now.phase !== 'solution' || now.solutionStep > prior.solutionStep;
        }).toBe(true);
    }
    await phaseIs(page, 'retype');
    await answerRight(page);
    await phaseIs(page, 'done');
    const done = await snapshot(page);
    expect(done.outcomes[0]).toBe('retype');
    // A retype after the solution pays no star (plan § 7: no star after the second miss).
    expect(done.starsEarned).toBe(0);
});
