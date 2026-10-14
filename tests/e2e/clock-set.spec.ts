// Risk #11 for the clock to set (S-13b): a hand follows a finger on the canvas (the hook publishes the hand tips and the pose), the minute
// hand snaps to the task's step at FIT scale, and a touch the system cancels leaves the hands where they were. Every drag is a raw CDP
// touch (dragTouch / cancelTouch); the hook is read-only and nothing waits for time, only polls on the snapshot.
import { test, expect, type Page } from '@playwright/test';
import { passWelcomeAsParent } from './support/welcome';
import {
    answerWrong, cancelTouch, dragTouch, phaseIs, setClock, silenceSpeech, snapshot, tapClockOk, targets, type Point,
} from './support/hook';

const STAGES = {
    E3: { age: '10+', stageLabel: 'Klasa 2, I półrocze', stage: 'E3' },
    E4: { age: '10+', stageLabel: 'Klasa 2, II półrocze', stage: 'E4' },
} as const;

const open = async (page: Page, stage: keyof typeof STAGES, skill: string): Promise<void> => {
    await silenceSpeech(page);
    await passWelcomeAsParent(page, { ...STAGES[stage], query: { e2eSkills: skill } });
    await phaseIs(page, 'first');
    await expect.poll(async () => (await snapshot(page)).clock).not.toBeNull();
};

/** The point at `degrees` clockwise from 12, `radius` from `centre`. */
const onDial = (centre: Point, degrees: number, radius: number): Point => {
    const rad = (degrees * Math.PI) / 180;
    return { x: centre.x + Math.sin(rad) * radius, y: centre.y - Math.cos(rad) * radius };
};
const radiusOf = (centre: Point, tip: Point): number => Math.hypot(tip.x - centre.x, tip.y - centre.y);
const parseTime = (text: string): { hour: number; minute: number } => {
    const [hour, minute] = text.split('.').map(Number);
    return { hour, minute };
};

test.describe.configure({ mode: 'serial' });

test('#11 setting the hour hand answers a full-hour clock', async ({ page }) => {
    test.setTimeout(45_000);
    await open(page, 'E3', 'E3.3.clock_set_full');
    const first = await snapshot(page);
    expect(first.input).toBe('drag');
    expect(first.visual?.kind).toBe('clock');
    const want = parseTime(first.answer as string);
    const start = first.clock!;
    expect(start.hour).not.toBe(want.hour);

    // A full-hour clock has no minute hand to hold; the hour hand goes from its tip to the answer's angle.
    const { clock } = await targets(page);
    expect(clock?.minuteTip).toBeNull();
    await dragTouch(page, clock!.hourTip, onDial(clock!.centre, (want.hour % 12) * 30, radiusOf(clock!.centre, clock!.hourTip)), 4);
    await expect.poll(async () => (await snapshot(page)).clock?.hour).toBe(want.hour);
    expect((await snapshot(page)).clock).toMatchObject({ minute: 0, carrying: null });

    await tapClockOk(page);
    await phaseIs(page, 'done');
    const done = await snapshot(page);
    expect(done.outcomes[0]).toBe('first');
    expect(done.starsEarned).toBeGreaterThan(0);
});

test('#11 a quarter needs both hands and a wrong setting gets a hint and a second try', async ({ page }) => {
    test.setTimeout(60_000);
    await open(page, 'E4', 'E4.3.clock_set_quarter');
    const first = await snapshot(page);
    const want = parseTime(first.answer as string);
    const start = first.clock!;
    expect(start.minute).not.toBe(want.minute);
    expect((await targets(page)).clock?.minuteTip).not.toBeNull();

    await answerWrong(page);
    await phaseIs(page, 'second');
    // A wrong time sends the hands back to the start pose.
    await expect.poll(async () => (await snapshot(page)).clock).toMatchObject({ hour: start.hour, minute: start.minute, carrying: null });

    // The minute hand snaps on the canvas: a finger 1.5 degrees past the answer's mark still lands on it.
    const { clock } = await targets(page);
    await dragTouch(page, clock!.minuteTip!, onDial(clock!.centre, want.minute * 6 + 1.5, radiusOf(clock!.centre, clock!.minuteTip!)), 4);
    await expect.poll(async () => (await snapshot(page)).clock?.minute).toBe(want.minute);
    await setClock(page, first.answer as string);
    expect((await snapshot(page)).clock).toMatchObject({ hour: want.hour, minute: want.minute });

    await tapClockOk(page);
    await phaseIs(page, 'done');
    const done = await snapshot(page);
    expect(done.outcomes[0]).toBe('second');
    expect(done.starsEarned).toBeGreaterThan(0);
});

test('#11 a drag the system cancels leaves the hands where they were', async ({ page }) => {
    test.setTimeout(45_000);
    await open(page, 'E3', 'E3.3.clock_set_full');
    const start = (await snapshot(page)).clock!;
    const { clock } = await targets(page);
    const away = onDial(clock!.centre, (start.hour % 12) * 30 + 120, radiusOf(clock!.centre, clock!.hourTip));

    await cancelTouch(page, clock!.hourTip, away, 4);
    await expect.poll(async () => (await snapshot(page)).clock?.carrying).toBeNull();
    expect((await snapshot(page)).clock).toMatchObject({ hour: start.hour, minute: start.minute });

    // The cancel left nothing stuck: the same drag with a lifted finger moves the hand.
    const again = (await targets(page)).clock!;
    await dragTouch(page, again.hourTip, away, 4);
    await expect.poll(async () => (await snapshot(page)).clock?.hour).not.toBe(start.hour);
    expect((await snapshot(page)).phase).toBe('first');
});
