// Risks #13 and #11 for the year review step (S-14c phase 11).
//   (a) #13 a save imported at E6 step 10 with the step mastered unlocks the review step E6.11 through play: the round ends on the
//       unlock card ("Powtórka roku" from the data), and the review round draws from several E6 steps (or E5). The save goes in the way
//       a parent does it (settings panel, "Wczytaj z pliku", summary, "Wczytaj"); IndexedDB is never opened or written here.
//       Break p11a: stepPlayable without the `review` clause, so E6.11 is not playable and unlockReady gives nothing (no card).
//   (b) #11 a six-digit place-value answer is typed on the keypad and pays (break p11b: balance.keypad.maxDigits 5 drops the sixth digit).
// Parent path on E6 (age 8 in September proposes E3, so E6 is an override: no warm-up). e2eVariant=off keeps every round ordinary.
// No clock, only polls on the snapshot.
import { test, expect } from '@playwright/test';
import { passWelcomeAsParent } from './support/welcome';
import { chooseFile, jsonFile, openImport, reloadedBy } from './support/saveImport';
import { answerRight, phaseIs, playRoundRight, screenIs, silenceSpeech, snapshot, tapNext, tapTarget } from './support/hook';
import { pl } from '../../src/data/pl';
import { E6 } from '../../src/data/curriculum/E6';

const SEPTEMBER = 8;
const E6_LABEL = 'Klasa 3, II półrocze';
const STEP10 = ['E6.10.roman_2000', 'E6.10.compare_num_1000000', 'E6.10.place_value_1000000'];
const REVIEW_NAME = E6.steps.find((s) => s.step === 11)!.childName!;

// A v2 save the game itself could have written: E6 learner at step 10 with every skill of the step at mastery 4 (unlock at ceil(0.5 * 3) = 2).
const step10Save = () => ({
    version: 2,
    profileId: 'default',
    stars: 3,
    rooms: { salon: { tasksDone: 0, chosen: {} } },
    currentRoom: 'salon',
    settings: { autoRead: null },
    learner: {
        age: 8,
        stage: 'E6',
        stageOverriddenByParent: true,
        warmupPending: false,
        unlockedStep: { E6: 10 },
        mastery: Object.fromEntries(STEP10.map((id) => [id, 4])),
        streak: {},
        history: [],
        weakStreak: 0,
        easedRounds: 0,
        pendingUnlock: null,
    },
    variants: { roundsSince: 0, lastMinigame: null, puzzleDay: null, puzzlesDone: [] },
});

const stepOf = (skillId: string): { stage: string; step: number } => {
    const [stage, step] = skillId.split('.');
    return { stage, step: Number(step) };
};

test('#13 the year review step unlocks after E6.10 and its round draws from several E6 steps', async ({ page }) => {
    test.setTimeout(180_000);
    await silenceSpeech(page);
    await passWelcomeAsParent(page, { age: '8', stageLabel: E6_LABEL, stage: 'E6', month: SEPTEMBER, query: { e2eVariant: 'off' } });
    await phaseIs(page, 'first');

    await openImport(page);
    const dialog = page.getByRole('dialog', { name: pl.saveTransfer.importTitle });
    await chooseFile(page, pl.saveTransfer.choose, jsonFile('zapis.txt', step10Save()));
    await expect(dialog.getByRole('heading', { name: pl.saveTransfer.fromFile })).toBeVisible();
    await reloadedBy(page, () => dialog.getByRole('button', { name: pl.saveTransfer.load, exact: true }).tap());
    await screenIs(page, 'task');
    const loaded = await snapshot(page);
    expect(loaded.learner?.stage).toBe('E6');
    expect(loaded.learner?.unlockedStep.E6).toBe(10);

    // One ordinary round on step 10: the mastered step unlocks the review step, shown as the unlock card after "Kolejna runda".
    await playRoundRight(page, 5);
    await tapTarget(page, 'nextRound');
    await screenIs(page, 'unlock');
    expect((await snapshot(page)).unlock).toEqual({ step: 11, name: REVIEW_NAME });
    await tapTarget(page, 'unlockNext');
    await screenIs(page, 'task');
    expect((await snapshot(page)).learner?.unlockedStep.E6).toBe(11);

    // The review round: every task is from E6 (steps 1-10) or from the previous stage; two different E6 steps show up in up to 3 rounds.
    const seen = new Set<number>();
    for (let round = 0; round < 3 && seen.size < 2; round++) {
        const before = (await snapshot(page)).learner!.history!.length;
        await playRoundRight(page, 5);
        const history = (await snapshot(page)).learner!.history!;
        const played = history.slice(Math.max(before, history.length - 5)).map((h) => stepOf(h.skillId));
        expect(played.length).toBeGreaterThan(0);
        for (const { stage, step } of played) {
            expect(['E5', 'E6']).toContain(stage);
            if (stage === 'E6') {
                expect(step).toBeGreaterThanOrEqual(1);
                expect(step).toBeLessThanOrEqual(10);
                seen.add(step);
            }
        }
        if (seen.size < 2) {
            await tapTarget(page, 'nextRound');
            await screenIs(page, 'task');
        }
    }
    expect(seen.size).toBeGreaterThanOrEqual(2);
});

test('#11 a six-digit place-value answer is typed on the keypad', async ({ page }) => {
    test.setTimeout(150_000);
    await silenceSpeech(page);
    await passWelcomeAsParent(page, {
        age: '8',
        stageLabel: E6_LABEL,
        stage: 'E6',
        month: SEPTEMBER,
        query: { e2eSkills: 'E6.10.place_value_1000000', e2eVariant: 'off' },
    });
    await phaseIs(page, 'first');

    // Tasks until one has an answer of six or seven digits (the step's share is pinned by phase 7; at most 3 rounds).
    for (let task = 0; task < 15; task++) {
        await phaseIs(page, 'first');
        const state = await snapshot(page);
        if (state.input === 'keypad' && typeof state.answer === 'number' && state.answer >= 100_000) {
            await answerRight(page);
            await phaseIs(page, 'done');
            const done = await snapshot(page);
            expect(done.outcomes[done.index]).toBe('first');
            expect(done.starsEarned).toBeGreaterThan(0);
            return;
        }
        await answerRight(page);
        await tapNext(page);
        if ((await snapshot(page)).screen === 'summary') {
            await tapTarget(page, 'nextRound');
        }
        await screenIs(page, 'task');
    }
    throw new Error('no task with an answer of 100 000 or more in 3 rounds');
});
