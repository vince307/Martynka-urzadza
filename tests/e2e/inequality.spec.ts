// Risk #11 for the inequality tasks (S-14c phase 10): "5 + □ < 8" has several right tiles, so the task carries `check` and the
// canonical `answer` is only one of them. What the child sees exists only on the canvas: a right tile that is NOT the model answer
// pays the star on the first try and is the tile painted green (markedTile is read from the widget, not from the task), and a
// wrong tile gives the hint phase with a second try that still pays. ?e2eSkills forces the skill; e2eVariant=off keeps the round
// ordinary. Parent path on E1 (age 10+ proposes E6, so E1 is an override: no warm-up). No clock, only polls on the snapshot.
import { test, expect } from '@playwright/test';
import { answerRight, answerWrong, phaseIs, silenceSpeech, snapshot, tapScene, targets } from './support/hook';
import { passWelcomeAsParent } from './support/welcome';

const SKILL = 'E1.9.inequality_10';

test.beforeEach(async ({ page }) => {
    await silenceSpeech(page);
    await passWelcomeAsParent(page, {
        age: '10+',
        stageLabel: 'Klasa 1, I półrocze',
        stage: 'E1',
        month: 9,
        query: { e2eSkills: SKILL, e2eVariant: 'off' },
    });
    await phaseIs(page, 'first');
});

test('#11 an inequality takes a right tile that is not the model answer and marks the tapped tile', async ({ page }) => {
    test.setTimeout(45_000);
    const first = await snapshot(page);
    expect(first.input).toBe('tiles');
    expect(first.correctChoices!.length).toBeGreaterThanOrEqual(2);
    const other = first.correctChoices!.find((value) => value !== first.answer);
    expect(other, 'a right tile besides the model answer').toBeDefined();

    const { tiles } = await targets(page);
    await tapScene(page, tiles.find((t) => t.value === other)!);

    await phaseIs(page, 'done');
    const done = await snapshot(page);
    expect(done.outcomes[0]).toBe('first');
    expect(done.starsEarned).toBe(1);
    expect(done.markedTile).toBe(other);
});

test('#11 a wrong inequality tile gives a hint and a second try that still pays', async ({ page }) => {
    test.setTimeout(45_000);
    await answerWrong(page);
    await phaseIs(page, 'second');
    expect((await snapshot(page)).starsEarned).toBe(0);

    await answerRight(page);
    await phaseIs(page, 'done');
    const done = await snapshot(page);
    expect(done.outcomes[0]).toBe('second');
    expect(done.starsEarned).toBe(1);
});
