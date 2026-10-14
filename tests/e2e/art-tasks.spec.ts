// Risk #11 for the tasks drawn with raster art (S-14): money, balance scale, thermometer, icon groups. ?e2eSkills (e2e build
// only) forces the task type; the hook reports what the widgets themselves show (texture key and whether it is loaded, read from
// the game objects, never a layout rectangle that a hidden or stand-in image would also satisfy). The thermometer's "beside the
// keypad" layout is read from the drawing's interior rectangle against the solution lines' x. No clock, only polls on the snapshot.
import { test, expect, type Page } from '@playwright/test';
import { passWelcomeAsParent } from './support/welcome';
import { answerRight, answerWrong, phaseIs, screenIs, silenceSpeech, snapshot, tapNext, tapScene, targets, type Snapshot } from './support/hook';
import { TASK_LAYOUT } from '../../src/data/layout';

const STAGES = {
    E3: { age: '10+', stageLabel: 'Klasa 2, I półrocze', stage: 'E3' },
    E4: { age: '10+', stageLabel: 'Klasa 2, II półrocze', stage: 'E4' },
    E5: { age: '10+', stageLabel: 'Klasa 3, I półrocze', stage: 'E5' },
} as const;

const open = async (page: Page, stage: keyof typeof STAGES, skills: string[]): Promise<void> => {
    await silenceSpeech(page);
    await passWelcomeAsParent(page, { ...STAGES[stage], query: { e2eSkills: skills.join(',') } });
    await phaseIs(page, 'first');
};

/** Every image of the drawing is a loaded texture (not the stand-in box), at least `min` of them. */
const artLoaded = async (page: Page, min: number): Promise<NonNullable<Snapshot['art']>> => {
    await expect.poll(async () => (await snapshot(page)).art?.length ?? 0).toBeGreaterThanOrEqual(min);
    const { art } = await snapshot(page);
    expect(art!.every((entry) => entry.loaded)).toBe(true);
    return art!;
};

test.describe.configure({ mode: 'serial' });

test('#11 a money task shows every coin and note loaded and takes a text tile', async ({ page }) => {
    test.setTimeout(45_000);
    await open(page, 'E4', ['E4.1.money_count_zl_gr']);
    const first = await snapshot(page);
    expect(first.input).toBe('tiles');
    expect(first.visual?.kind).toBe('money');
    const items = (first.visual as unknown as { items: string[] }).items;
    const art = await artLoaded(page, items.length);
    expect(art).toHaveLength(items.length);
    expect(art.every((entry) => entry.key.startsWith('tasks/money/'))).toBe(true);

    await answerWrong(page);
    await phaseIs(page, 'second');
    expect(await artLoaded(page, items.length)).toHaveLength(items.length);

    await answerRight(page);
    await phaseIs(page, 'done');
    expect((await snapshot(page)).outcomes[0]).toBe('second');
});

test('#11 a balance scale task shows the scale, the item and every weight, and takes the keypad', async ({ page }) => {
    test.setTimeout(45_000);
    await open(page, 'E3', ['E3.4.mass_dag_100']);
    const first = await snapshot(page);
    expect(first.input).toBe('keypad');
    expect(first.visual?.kind).toBe('scale');
    const visual = first.visual as unknown as { weights: string[] };
    const art = await artLoaded(page, visual.weights.length + 2);   // the scale, the item and each weight
    expect(art.map((entry) => entry.key).some((key) => key.startsWith('tasks/measuring/'))).toBe(true);
    expect(art.length).toBe(visual.weights.length + 2);
    await answerRight(page);
    await phaseIs(page, 'done');
    expect((await snapshot(page)).outcomes[0]).toBe('first');
});

test('#11 a thermometer stays readable beside the keypad in the solution', async ({ page }) => {
    test.setTimeout(45_000);
    await open(page, 'E5', ['E5.4.temperature_read_0_30']);
    const first = await snapshot(page);
    expect(first.input).toBe('keypad');
    expect(first.visual?.kind).toBe('thermometer');
    const art = await artLoaded(page, 1);
    expect(art).toHaveLength(1);
    const before = (await targets(page)).picture;
    expect(before).toBeTruthy();

    await answerWrong(page);
    await phaseIs(page, 'second');
    await answerWrong(page);
    await phaseIs(page, 'solution');
    await artLoaded(page, 1);
    const beside = TASK_LAYOUT.picture.keypadBeside;
    await expect.poll(async () => (await targets(page)).picture).not.toBeNull();
    const picture = (await targets(page)).picture!;
    // Tall, in its own column, left of where the solution lines start.
    expect(picture.height).toBeGreaterThan(picture.width);
    expect(picture.x + picture.width).toBeLessThanOrEqual(beside.lines.x);

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
    await answerRight(page);   // retype the answer
    await phaseIs(page, 'done');
    expect((await snapshot(page)).outcomes[0]).toBe('retype');
});

test('#11 a round of art tasks plays to the summary', async ({ page }) => {
    test.setTimeout(60_000);
    const skills = ['E3.4.mass_kg_10', 'E3.9.mult_groups_result', 'E3.9.mult_groups_expr', 'E3.11.temperature_read_30', 'E3.4.mass_dag_100'];
    await open(page, 'E3', skills);
    const kinds = new Set<string>();
    for (let i = 0; i < 5; i++) {
        await expect.poll(async () => (await snapshot(page)).index).toBe(i);
        await phaseIs(page, 'first');
        const state = await snapshot(page);
        expect(['scale', 'icons', 'thermometer']).toContain(state.visual?.kind);
        kinds.add(state.visual!.kind);
        await artLoaded(page, 1);
        await answerRight(page);
        await phaseIs(page, 'done');
        await tapNext(page);
        if (i < 4) {
            await expect.poll(async () => (await snapshot(page)).index).toBe(i + 1);
        }
    }
    await screenIs(page, 'summary');
    expect(kinds).toEqual(new Set(['scale', 'icons', 'thermometer']));
});
