// Risks #2 (progress written at the wrong moment survives a close) and #11 (the round is playable on screen) of
// context/foundation/test-plan.md, change child-flow-guards phase 14.
// (a) SV2-10: the puzzle round is counted when the LAST answer is given, so a close before "Dalej" cannot pay the day's puzzle again.
//     ?e2eVariant=puzzle asks for a puzzle every round, ?e2eDay pins the day; a reload keeps IndexedDB, so what the new session knows
//     can only come from the SAVE (IndexedDB is never opened here). Nothing taps "Dalej".
// (b) WNA-04: the solution lines of a drawn task (E6.3 composite perimeter, ?e2eSkills) are measured with real Phaser text metrics;
//     the hook reports the scene's own overflow flag, which the unit tests cannot compute without a renderer.
import { test, expect } from '@playwright/test';
import { answerRight, answerWrong, fromHook, phaseIs, screenIs, silenceSpeech, snapshot, tapScene, targets } from './support/hook';
import { passWelcomeAsParent } from './support/welcome';

test.setTimeout(120_000);

const OCTOBER = 9;
const DAY = '2026-10-14';
const PUZZLE_STARS = 2;

test('#2 SV2-10 a puzzle answered and closed before Dalej is not paid again the same day', async ({ page }) => {
    await silenceSpeech(page);
    await passWelcomeAsParent(page, {
        age: '10+',
        stageLabel: 'Klasa 2, II półrocze',
        stage: 'E4',
        month: OCTOBER,
        query: { e2eVariant: 'puzzle', e2eDay: DAY },
    });
    const start = await snapshot(page);
    expect(start.variant?.kind).toBe('puzzle');
    await phaseIs(page, 'first');
    await answerRight(page);
    await phaseIs(page, 'done');
    await expect.poll(async () => (await snapshot(page)).stars).toBe(start.stars + PUZZLE_STARS);
    // The write of the answer itself, with no "Dalej" tap: the save is clean and has been written.
    await expect.poll(async () => (await snapshot(page)).save).toMatchObject({ dirty: false, blocked: false });
    await expect.poll(async () => (await snapshot(page)).save?.writes ?? 0).toBeGreaterThan(0);
    const before = await snapshot(page);

    await page.goto(`/?e2eVariant=puzzle&e2eDay=${DAY}&e2eMonth=10`);
    await fromHook(page, 'snapshot');
    await screenIs(page, 'task');
    const after = await snapshot(page);
    expect(after.save?.load).toBe('loaded');
    expect(after.stars).toBe(before.stars);
    expect(after.variant?.kind).not.toBe('puzzle');
    expect(after.variant?.puzzleId).toBeNull();
});

test('#11 WNA-04 the solution lines of a drawn task fit on the screen', async ({ page }) => {
    await silenceSpeech(page);
    await passWelcomeAsParent(page, {
        age: '8',
        stageLabel: 'Klasa 3, II półrocze',
        stage: 'E6',
        query: { e2eSkills: 'E6.3.perimeter_composite', e2eVariant: 'off' },
    });
    await phaseIs(page, 'first');
    expect((await snapshot(page)).visual?.kind).toBe('figure');
    await answerWrong(page);
    await phaseIs(page, 'second');
    await answerWrong(page);
    await phaseIs(page, 'solution');
    // Every step of the solution, read from the scene's measured flag.
    for (let guard = 0; guard < 10 && (await snapshot(page)).phase === 'solution'; guard++) {
        const prior = await snapshot(page);
        expect(prior.solutionOverflow).toBe(false);
        const { step } = await targets(page);
        expect(step).not.toBeNull();
        await tapScene(page, step!);
        await expect.poll(async () => {
            const now = await snapshot(page);
            return now.phase !== 'solution' || now.solutionStep > prior.solutionStep;
        }).toBe(true);
    }
    await phaseIs(page, 'retype');
    await answerRight(page);
    await phaseIs(page, 'done');
});
