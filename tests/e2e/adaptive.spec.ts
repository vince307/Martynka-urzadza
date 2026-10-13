// Risk #13 (proposed in context/changes/adaptive-curriculum, test-plan refresh pending): the
// "Nowa umiejętność!" card exists only in the rendered scene flow. A step unlocked at the end of a
// round must show on the card after "Kolejna runda" (also when the child went to the room and back
// in between), and "Dalej" must clear it and start a round, so the card never blocks later rounds.
// The parent sets E4 in September (?e2eMonth=8, the e2e build only: never page.clock, it freezes
// Phaser's tweens), so the calendar floor puts the learner on step 2 and the child masters it by
// playing right on the first try. The unlock itself (share of mastered skills, one step per round) is proved by the
// unit tests; this proves that the scenes show it and clear it. Runs in the chromium-hook project.
import { test, expect } from '@playwright/test';
import { E4 } from '../../src/data/curriculum/E4';
import { passWelcomeAsParent } from './support/welcome';
import { playRoundRight, screenIs, silenceSpeech, snapshot, tapTarget } from './support/hook';

const SEPTEMBER = 8;
const ROUND_LENGTH = 5;
const MAX_ROUNDS = 12;
const START_STEP = 2;

test.setTimeout(180_000);

test.beforeEach(async ({ page }) => {
    await silenceSpeech(page);
});

test('#13 (proposed, test-plan refresh pending) mastering the current step shows "Nowa umiejętność!" after "Kolejna runda", the card waits through "Do pokoju", and "Dalej" starts a round on the unlocked step', async ({ page }) => {
    // Age 8 in September proposes E3; E4 is an override, so there is no warm-up.
    await passWelcomeAsParent(page, { age: '8', stageLabel: 'Klasa 2, II półrocze', stage: 'E4', month: SEPTEMBER });
    const start = await snapshot(page);
    expect(start.learner?.unlockedStep.E4).toBe(START_STEP);
    expect(start.learner?.pendingUnlock).toBeNull();

    // Rounds played right on the first try until the end of a round sets pendingUnlock.
    let unlockedAfter = START_STEP;
    for (let round = 0; round < MAX_ROUNDS; round++) {
        await playRoundRight(page, ROUND_LENGTH);
        const end = await snapshot(page);
        if (end.learner?.pendingUnlock != null) {
            unlockedAfter = end.learner.unlockedStep.E4;
            break;
        }
        expect(end.learner?.unlockedStep.E4).toBe(START_STEP);
        await tapTarget(page, 'nextRound');
        await screenIs(page, 'task');
    }
    const summary = await snapshot(page);
    expect(summary.screen).toBe('summary');
    const unlocked = summary.learner!.pendingUnlock!;
    expect(unlocked).toBeGreaterThan(START_STEP);
    expect(unlockedAfter).toBe(unlocked);
    const expectedName = E4.steps.find((s) => s.step === unlocked)?.childName;
    expect(expectedName).toBeTruthy();

    // The card waits through "Do pokoju" and back.
    await tapTarget(page, 'toRoom');
    await screenIs(page, 'room');
    await tapTarget(page, 'resume');
    await screenIs(page, 'summary');
    expect((await snapshot(page)).learner?.pendingUnlock).toBe(unlocked);

    // "Kolejna runda" shows the card with the unlocked step's name.
    await tapTarget(page, 'nextRound');
    await screenIs(page, 'unlock');
    const card = await snapshot(page);
    expect(card.unlock).toEqual({ step: unlocked, name: expectedName });
    expect(card.learner?.unlockedStep.E4).toBe(unlocked);

    // "Dalej" clears the pending unlock and starts a round.
    await tapTarget(page, 'unlockNext');
    await screenIs(page, 'task');
    const round = await snapshot(page);
    expect(round.index).toBe(0);
    expect(round.unlock).toBeNull();
    expect(round.learner?.pendingUnlock).toBeNull();
    expect(round.learner?.unlockedStep.E4).toBe(unlocked);

    // The card does not come back: the next "Kolejna runda" starts a plain round.
    await playRoundRight(page, ROUND_LENGTH);
    await tapTarget(page, 'nextRound');
    await screenIs(page, 'task');
    expect((await snapshot(page)).index).toBe(0);
});
