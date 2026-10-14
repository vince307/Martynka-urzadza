// Risk #11 when the picture of a task is missing (change art-stand-in-and-load-signal): the child still gets a task they can read
// and play, and the parent can see that pictures are missing. ?e2eArt (e2e build only) queues no task drawing ('missing') or
// points the coins at a file that is no image ('corrupt', which emits no loaderror). The label is read from the stand-in widget's
// own objects through the hook; the parent's line is read from the DOM like an adult would. No clock, only polls on the snapshot.
import { test, expect, type Page } from '@playwright/test';
import { openSettings, passWelcomeAsParent } from './support/welcome';
import { answerRight, phaseIs, silenceSpeech, snapshot } from './support/hook';

const STAGES = {
    E3: { age: '10+', stageLabel: 'Klasa 2, I półrocze', stage: 'E3' },
    E4: { age: '10+', stageLabel: 'Klasa 2, II półrocze', stage: 'E4' },
} as const;

const open = async (page: Page, stage: keyof typeof STAGES, art: 'missing' | 'corrupt', skill: string): Promise<void> => {
    await silenceSpeech(page);
    await passWelcomeAsParent(page, { ...STAGES[stage], query: { e2eArt: art, e2eSkills: skill } });
    await phaseIs(page, 'first');
};

/** The stand-in labels on screen: at least `min` entries, none of them a loaded texture. */
const standIns = async (page: Page, min: number): Promise<string[]> => {
    await expect.poll(async () => (await snapshot(page)).art?.length ?? 0).toBeGreaterThanOrEqual(min);
    const { art } = await snapshot(page);
    expect(art!.every((entry) => !entry.loaded)).toBe(true);
    return art!.map((entry) => entry.label ?? '');
};

test.describe.configure({ mode: 'serial' });

test('#11 a money task with missing art shows Polish values and plays to a star', async ({ page }) => {
    test.setTimeout(45_000);
    await open(page, 'E4', 'missing', 'E4.1.money_count_100');
    const labels = await standIns(page, 1);
    for (const label of labels) {
        expect(label).toMatch(/^\d+ (zł|gr)$/);
        expect(label).not.toContain('-');
    }
    await answerRight(page);
    await phaseIs(page, 'done');
    const done = await snapshot(page);
    expect(done.outcomes[0]).toBe('first');
    expect(done.starsEarned).toBeGreaterThan(0);
});

test('#11 a weight task with missing art labels every weight', async ({ page }) => {
    test.setTimeout(45_000);
    await open(page, 'E3', 'missing', 'E3.4.mass_dag_100');
    const weights = ((await snapshot(page)).visual as unknown as { weights: string[] }).weights;
    const labels = await standIns(page, weights.length);
    const withDag = labels.filter((label) => /^\d+ dag$/.test(label));
    expect(withDag.length).toBeGreaterThanOrEqual(weights.length);
});

test('#11 the parent panel counts missing pictures', async ({ page }) => {
    test.setTimeout(45_000);
    await open(page, 'E4', 'missing', 'E4.1.money_count_100');
    await expect.poll(async () => (await snapshot(page)).artHealth?.total ?? 0).toBeGreaterThan(0);
    const health = (await snapshot(page)).artHealth!;
    expect(health.missing).toBe(health.total);

    const panel = await openSettings(page);
    await expect(panel.getByText('Obrazki', { exact: true })).toBeVisible();
    await expect(panel.getByText(new RegExp(`^${health.missing} z ${health.total} obrazków `))).toBeVisible();
});

test('#11 a picture that does not decode counts as missing (S14-04)', async ({ page }) => {
    test.setTimeout(45_000);
    await open(page, 'E4', 'corrupt', 'E4.1.money_count_100');
    await expect.poll(async () => (await snapshot(page)).artHealth?.missing ?? 0).toBeGreaterThan(0);
    // The round plays on: no error card, a star for the right answer.
    await answerRight(page);
    await phaseIs(page, 'done');
    expect((await snapshot(page)).outcomes[0]).toBe('first');
    await expect(page.getByRole('button', { name: 'Zacznij od nowa' })).toHaveCount(0);
});
