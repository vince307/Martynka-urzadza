// Risk #11 for the written column ('digits' mode, S-14b): a round played the real touch way. ?e2eSkills (e2e build only) forces the
// WRITTEN skill; the hook reports the boxes the scene itself holds (snapshot.digits: how many, the digits typed so far from the ones)
// and the drawing's rectangle (targets.picture, interior points). No clock, only polls on the snapshot.
//   (a) the digits fill the boxes ones-first, one key at a time, and a full row sent with OK pays a star (break p10a: stepDigitBoxes
//       fills from the left, so the second key lands before the ones);
//   (b) a wrong row opens the hint phase and the scene empties every box (break p10b: the scene keeps the wrong digits);
//   (c) in the solution the column stays where it was and the solution lines go beside it, and a retype ends the task without a star
//       (break p10c: the solution takes the keypad layout, which moves and squeezes the column).
// A stage the parent picks that is not the proposal skips the warm-up: age 8 in September proposes E3 (src/data/placement.ts).
import { test, expect, type Page } from '@playwright/test';
import { passWelcomeAsParent } from './support/welcome';
import { answerRight, answerWrong, phaseIs, silenceSpeech, snapshot, tapScene, targets } from './support/hook';
import { TASK_LAYOUT } from '../../src/data/layout';

const SEPTEMBER = 8;
const STAGES = {
    E5: { age: '8', stageLabel: 'Klasa 3, I półrocze', stage: 'E5', month: SEPTEMBER },
    E6: { age: '8', stageLabel: 'Klasa 3, II półrocze', stage: 'E6', month: SEPTEMBER },
} as const;

const open = async (page: Page, stage: keyof typeof STAGES, skill: string): Promise<void> => {
    await silenceSpeech(page);
    await passWelcomeAsParent(page, { ...STAGES[stage], query: { e2eSkills: skill, e2eVariant: 'off' } });
    await phaseIs(page, 'first');
    expect((await snapshot(page)).input).toBe('digits');
};

test.describe.configure({ mode: 'serial' });

test('#11 a written column takes digits ones-first and pays a star', async ({ page }) => {
    test.setTimeout(45_000);
    await open(page, 'E5', 'E5.2.written_add_100');
    const first = await snapshot(page);
    expect(first.visual?.kind).toBe('column');
    expect(first.digits?.filled).toEqual([]);
    const count = first.digits!.count;
    const typed = String(first.answer as number).padStart(count, '0').split('').reverse().map(Number);

    // One key at a time: after each, the boxes hold the digits typed so far, the ones first.
    for (let i = 0; i < count; i++) {
        const { keys } = await targets(page);
        await tapScene(page, keys.find((k) => k.key === String(typed[i]))!);
        await expect.poll(async () => (await snapshot(page)).digits?.filled).toEqual(typed.slice(0, i + 1));
    }
    const { keys } = await targets(page);
    await tapScene(page, keys.find((k) => k.key === 'ok')!);
    await phaseIs(page, 'done');
    const done = await snapshot(page);
    expect(done.outcomes[0]).toBe('first');
    expect(done.starsEarned).toBeGreaterThan(0);
});

test('#11 a wrong column gets a hint and a cleared second try', async ({ page }) => {
    test.setTimeout(45_000);
    await open(page, 'E5', 'E5.2.written_add_100');
    await answerWrong(page);
    await phaseIs(page, 'second');
    // The scene empties every box, so the right digits are not given away by the wrong row.
    await expect.poll(async () => (await snapshot(page)).digits?.filled).toEqual([]);

    await answerRight(page);
    await phaseIs(page, 'done');
    const done = await snapshot(page);
    expect(done.outcomes[0]).toBe('second');
    expect(done.starsEarned).toBeGreaterThan(0);
});

test('#11 the solution keeps the column with its lines beside it and a retype ends the task', async ({ page }) => {
    test.setTimeout(60_000);
    await open(page, 'E6', 'E6.7.written_sub_1000');
    await expect.poll(async () => (await targets(page)).picture).not.toBeNull();
    const before = (await targets(page)).picture!;

    await answerWrong(page);
    await phaseIs(page, 'second');
    await answerWrong(page);
    await phaseIs(page, 'solution');
    await expect.poll(async () => (await targets(page)).picture).not.toBeNull();
    const during = (await targets(page)).picture!;
    // The column stays in its place and ends left of where the solution lines start.
    expect(during.x).toBe(before.x);
    expect(during.width).toBe(before.width);
    expect(during.x + during.width).toBeLessThanOrEqual(TASK_LAYOUT.picture.digits.lines.x);

    // Walk the solution steps until the last one hands over to the retype.
    for (let guard = 0; guard < 12 && (await snapshot(page)).phase === 'solution'; guard++) {
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
    expect(done.starsEarned).toBe(0);
});
