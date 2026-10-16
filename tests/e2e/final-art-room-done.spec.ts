// Risk #16 / FR-019 of context/foundation/test-plan.md, change final-art-p2 (S-16c): the last purchase shows "Pokój gotowy!"
// and the tile of the finished room keeps the child's own salon; with salon pictures missing it shows the pack thumbnail,
// and with that missing too the drawn miniature. The hook reports the CHOICE (snapshot.room.doneMiniature), not the look
// (the look is the visual gate). Runs in the chromium-hook project; the service worker is blocked so the aborted route
// really cuts the file. Stars come from the e2e-only ?e2eStars seam; ?e2eArt=room queues no salon picture.
import { test, expect, type Page } from '@playwright/test';
import { passWelcome } from './support/welcome';
import { answerRight, answerWrong, phaseIs, screenIs, silenceSpeech, snapshot, tapScene, tapTarget, targets } from './support/hook';
import { SALON } from '../../src/data/rooms';

test.setTimeout(180_000);
test.use({ serviceWorkers: 'block' });

const room = async (page: Page) => {
    const state = await snapshot(page);
    expect(state.room).toBeTruthy();
    return state.room!;
};

/** Solves the open task by the long way (two misses, the solution, the retype): the retype pays no star. */
const solveByRetype = async (page: Page): Promise<void> => {
    await phaseIs(page, 'first');
    await answerWrong(page);
    await phaseIs(page, 'second');
    await answerWrong(page);
    await phaseIs(page, 'solution');
    for (let guard = 0; guard < 10 && (await snapshot(page)).phase === 'solution'; guard++) {
        const before = await snapshot(page);
        await tapTarget(page, 'step');
        await expect.poll(async () => {
            const now = await snapshot(page);
            return now.phase !== 'solution' || now.solutionStep > before.solutionStep;
        }).toBe(true);
    }
    await phaseIs(page, 'retype');
    await answerRight(page);
    await phaseIs(page, 'done');
};

/** Buys every renovation task of the salon (first look each) and waits for the "Pokój gotowy!" card. */
const finishSalon = async (page: Page, query: Record<string, string>): Promise<void> => {
    const total = SALON.tasks.reduce((sum, task) => sum + task.cost, 0);
    await silenceSpeech(page);
    await passWelcome(page, { e2eStars: String(total), e2eVariant: 'off', ...query });
    await solveByRetype(page);
    await tapTarget(page, 'roomSwitch');
    await screenIs(page, 'room');
    // Pictures that arrive late must not decide the choice: wait until the room is up before buying.
    await expect.poll(async () => (await snapshot(page)).room?.currentTask?.id, { timeout: 30_000 }).toBeTruthy();
    for (const task of SALON.tasks) {
        const before = (await room(page)).tasksDone;
        await tapTarget(page, 'taskButton');
        if (task.kind !== 'stage') {
            await expect.poll(async () => (await room(page)).panel.kind, { timeout: 15_000 }).toBe('open');
            const thumbs = (await targets(page)).thumbs ?? [];
            expect(thumbs.length).toBe(3);
            await tapScene(page, thumbs[0]);
            await expect.poll(async () => {
                const panel = (await room(page)).panel;
                return panel.kind === 'open' ? panel.preview : null;
            }, { timeout: 15_000 }).toBe(0);
            await tapTarget(page, 'choose');
        }
        await expect.poll(async () => (await room(page)).tasksDone, { timeout: 15_000 }).toBe(before + 1);
    }
    await expect.poll(async () => (await room(page)).card, { timeout: 15_000 }).not.toBeNull();
};

/** "Dalej" closes the card and the miniature report goes back to null. */
const closeCard = async (page: Page): Promise<void> => {
    await tapTarget(page, 'cardNext');
    await expect.poll(async () => (await room(page)).card, { timeout: 15_000 }).toBeNull();
    expect((await room(page)).doneMiniature).toBeNull();
};

test('FR-019 S-16c the done card shows the child\'s own salon', async ({ page }) => {
    await finishSalon(page, {});
    expect((await room(page)).doneMiniature).toBe('live');
    await closeCard(page);
});

test('FR-019 S-16c with salon pictures missing the done card shows the pack thumbnail', async ({ page }) => {
    await finishSalon(page, { e2eArt: 'room' });
    expect((await room(page)).doneMiniature).toBe('thumbnail');
    await closeCard(page);
});

test('FR-019 S-16c with the thumbnail missing too the drawn miniature stays', async ({ page }) => {
    await page.route('**/assets/ui/salon-after.webp', (route) => route.abort());
    await finishSalon(page, { e2eArt: 'room' });
    expect((await room(page)).doneMiniature).toBe('drawn');
    await closeCard(page);
});
