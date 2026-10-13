// Risk #16 (context/foundation/test-plan.md, extended: "a change takes nothing") and FR-018/FR-019. A hold on a furnished
// slot opens the change panel; a tap, a short hold or a drifting hold opens nothing; a change never touches the star
// balance; the last purchase shows the "Pokój gotowy!" card, and the change mode of a done room changes for free.
// The reducers (roomGesture, variantPanel, roomDone) are unit-tested; this spec proves the scene seam through the real
// touch path (raw CDP touch for the hold). Runs in the chromium-hook project (read-only window.__martynkaE2E); the
// starting balance comes from the e2e-only ?e2eStars seam. Stars are asserted on the registry balance (snapshot.stars).
import { test, expect, type Page } from '@playwright/test';
import { passWelcome } from './support/welcome';
import { answerRight, answerWrong, holdTouch, phaseIs, screenIs, silenceSpeech, snapshot, tapScene, tapTarget, targets } from './support/hook';
import { balance } from '../../src/data/balance';
import { pl } from '../../src/data/pl';
import { ROOM_LAYOUT } from '../../src/data/layout';
import { SALON, SALON_PLACEHOLDERS } from '../../src/data/rooms';

const { holdMs, moveTolerance } = balance.roomHold;
const FIRST_COST = 5;

test.setTimeout(120_000);

const room = async (page: Page) => {
    const state = await snapshot(page);
    expect(state.room).toBeTruthy();
    return { state, room: state.room! };
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

/** The HUD room switch exists only between tasks: the first task is retyped (pays nothing), so the balance stays at the seed. */
const toRoom = async (page: Page): Promise<void> => {
    await solveByRetype(page);
    await tapTarget(page, 'roomSwitch');
    await screenIs(page, 'room');
};

/** Opens the purchase panel of the current task, previews thumbnail `variant` and presses "Wybieram"; waits for the purchase. */
const buy = async (page: Page, variant: 0 | 1 | 2): Promise<void> => {
    const before = (await room(page)).room.tasksDone;
    await tapTarget(page, 'taskButton');
    await expect.poll(async () => (await room(page)).room.panel.kind).toBe('open');
    const thumbs = (await targets(page)).thumbs ?? [];
    expect(thumbs.length).toBe(3);
    await tapScene(page, thumbs[variant]);
    await expect.poll(async () => {
        const panel = (await room(page)).room.panel;
        return panel.kind === 'open' ? panel.preview : null;
    }).toBe(variant);
    await tapTarget(page, 'choose');
    await expect.poll(async () => (await room(page)).room.tasksDone).toBe(before + 1);
};

/** In an open change panel: previews a thumbnail other than `current` and presses "Wybieram". Returns the variant chosen. */
const changeTo = async (page: Page, current: number): Promise<0 | 1 | 2> => {
    const variant = (current === 2 ? 0 : current + 1) as 0 | 1 | 2;
    const thumbs = (await targets(page)).thumbs ?? [];
    expect(thumbs.length).toBe(3);
    await tapScene(page, thumbs[variant]);
    await expect.poll(async () => {
        const panel = (await room(page)).room.panel;
        return panel.kind === 'open' ? panel.preview : null;
    }).toBe(variant);
    await tapTarget(page, 'choose');
    return variant;
};

test('#16 a hold on a furnished slot changes it for free; a tap, a short or a drifting hold opens nothing; lifting the finger over a thumbnail picks nothing', async ({ page }) => {
    await silenceSpeech(page);
    await passWelcome(page, { e2eStars: '20' });
    await toRoom(page);
    expect((await snapshot(page)).stars).toBe(20);

    // The floor is bought by the usual route: 5 stars.
    await buy(page, 1);
    const S = 20 - FIRST_COST;
    const bought = await room(page);
    expect(bought.state.stars).toBe(S);
    expect(bought.room.chosen.floor).toBe(1);
    expect(bought.room.currentTask?.id).toBe('paint-walls');
    const floorAt = (await targets(page)).slots?.floor;
    expect(floorAt).toBeDefined();

    // A tap, a short hold and a hold that wanders off its start open nothing.
    await tapScene(page, floorAt!);
    expect((await room(page)).room.panel.kind).toBe('closed');
    expect((await room(page)).room.hold).toBe('idle');
    await holdTouch(page, floorAt!, holdMs / 3);
    expect((await room(page)).room.panel.kind).toBe('closed');
    await holdTouch(page, floorAt!, holdMs + 400, moveTolerance * 3);
    expect((await room(page)).room.panel.kind).toBe('closed');
    expect((await snapshot(page)).stars).toBe(S);

    // A full hold opens the panel in the change mode of that slot; nothing is taken.
    await holdTouch(page, floorAt!, holdMs + 400);
    await expect.poll(async () => (await room(page)).room.panel.kind).toBe('open');
    const opened = (await room(page)).room.panel;
    expect(opened).toMatchObject({ kind: 'open', mode: 'change', slot: 'floor' });
    expect((await snapshot(page)).stars).toBe(S);

    // Another look, confirmed: the room changes, the balance and the task progress do not.
    const next = await changeTo(page, bought.room.chosen.floor);
    await expect.poll(async () => (await room(page)).room.panel.kind).toBe('closed');
    const changed = await room(page);
    expect(changed.room.chosen.floor).toBe(next);
    expect(changed.room.chosen.floor).not.toBe(bought.room.chosen.floor);
    expect(changed.state.stars).toBe(S);
    expect(changed.state.counterText).toBe(String(S));
    expect(changed.room.tasksDone).toBe(1);
    expect(changed.room.currentTask?.id).toBe('paint-walls');

    // A hold that is lifted over a thumbnail of the panel it just opened picks nothing: the press began on the room.
    const { thumbs } = ROOM_LAYOUT;
    const overThumb = { x: thumbs.left + thumbs.size / 2, y: thumbs.top + 16 };
    const floor = SALON.slots.find((slot) => slot.id === 'floor')!;
    const look = SALON_PLACEHOLDERS.floor;
    expect(Math.abs(overThumb.x - floor.x)).toBeLessThan(look.width / 2); // precondition: the point is on the floor...
    expect(Math.abs(overThumb.y - floor.y)).toBeLessThan(look.height / 2);
    await holdTouch(page, overThumb, holdMs + 400);
    await expect.poll(async () => (await room(page)).room.panel.kind).toBe('open');
    const held = (await room(page)).room.panel;
    expect(held).toMatchObject({ kind: 'open', mode: 'change', slot: 'floor' });
    expect(held.kind === 'open' ? held.preview : 'x').toBeNull();
    expect((await room(page)).room.chosen.floor).toBe(next);
    expect((await snapshot(page)).stars).toBe(S);

    // "Zamknij" closes it, and a hold on an empty slot (curtains are not bought) opens nothing.
    await tapTarget(page, 'close');
    await expect.poll(async () => (await room(page)).room.panel.kind).toBe('closed');
    const curtains = SALON.slots.find((slot) => slot.id === 'curtains')!;
    await holdTouch(page, { x: curtains.x, y: curtains.y }, holdMs + 400);
    expect((await room(page)).room.panel.kind).toBe('closed');
    expect((await room(page)).room.hold).toBe('idle');
    expect((await snapshot(page)).stars).toBe(S);
});

test('FR-019 the last purchase shows »Pokój gotowy!« and the change mode of the done room changes for free', async ({ page }) => {
    await silenceSpeech(page);
    const total = SALON.tasks.reduce((sum, task) => sum + task.cost, 0);
    await passWelcome(page, { e2eStars: String(total) });
    await toRoom(page);
    expect((await snapshot(page)).stars).toBe(total);

    // Ten renovation tasks, each bought with the first look; the card comes with the last one.
    for (let i = 0; i < SALON.tasks.length; i++) {
        await buy(page, 0);
    }
    await expect.poll(async () => (await room(page)).room.card).not.toBeNull();
    const done = await room(page);
    expect(done.state.stars).toBe(0);
    expect(done.room.done).toBe(true);
    expect(done.room.card?.items).toHaveLength(2);
    expect(done.room.card?.items[0]).toMatchObject({ kind: 'room', id: 'salon', done: true });
    expect(done.room.card?.items[1]).toMatchObject({ kind: 'teaser', unlocked: true });
    expect((await targets(page)).resume).toBeNull(); // the way out is hidden behind the card

    // "Dalej" closes the card and the done room offers the change mode.
    await tapTarget(page, 'cardNext');
    await expect.poll(async () => (await room(page)).room.card).toBeNull();
    await expect.poll(async () => (await room(page)).room.modeText).toBe(pl.room.change.enter);
    await tapTarget(page, 'modeButton');
    await expect.poll(async () => (await room(page)).room.mode).toBe('change');

    // In the change mode a plain tap on a furnished slot opens its panel; the change costs nothing.
    const sofaAt = (await targets(page)).slots?.sofa;
    expect(sofaAt).toBeDefined();
    const before = (await room(page)).room.chosen.sofa;
    await tapScene(page, sofaAt!);
    await expect.poll(async () => (await room(page)).room.panel).toMatchObject({ kind: 'open', mode: 'change', slot: 'sofa' });
    const next = await changeTo(page, before);
    await expect.poll(async () => (await room(page)).room.panel.kind).toBe('closed');
    const changed = await room(page);
    expect(changed.room.chosen.sofa).toBe(next);
    expect(changed.room.chosen.sofa).not.toBe(before);
    expect(changed.state.stars).toBe(0);
    expect(changed.room.mode).toBe('change');

    // "Gotowe" leaves the mode.
    await tapTarget(page, 'modeButton');
    await expect.poll(async () => (await room(page)).room.mode).toBe('normal');
    expect((await room(page)).room.modeText).toBe(pl.room.change.enter);
});
