// Variant panel reducer (S-09 phase 3, test-plan risk #16). Oracle: FR-016/FR-017/US-02 AC:
// a confirmed choice spends its cost exactly once; opening, closing or a tap while short
// spends nothing; the balance never goes below 0. The test room is written out here.
import { describe, expect, it } from 'vitest';
import { createRng } from '../src/core/rng';
import { currentTask, emptyRoomState } from '../src/core/rooms';
import { earn } from '../src/core/stars';
import { stepPanel } from '../src/core/variantPanel';
import type { PanelEvent, PanelState } from '../src/core/variantPanel';
import type { RoomDef, RoomState } from '../src/core/types';
import { TEST_ROOM_PARTS, testSlot } from './roomFixtures';

const room: RoomDef = {
    id: 'test',
    ...TEST_ROOM_PARTS,
    slots: [
        testSlot('floor', 1),
        testSlot('sofa', 2),
        testSlot('lamp', 3),
    ],
    tasks: [
        { kind: 'slot', id: 't1', slot: 'floor', label: 'fixFloor', cost: 5 },
        { kind: 'slot', id: 't2', slot: 'sofa', label: 'sofa', cost: 8 },
        { kind: 'slot', id: 't3', slot: 'lamp', label: 'lamp', cost: 12 },
    ],
};

const CLOSED: PanelState = { kind: 'closed' };
const fresh = (): RoomState => emptyRoomState();

describe('opening', () => {
    it('opens for an affordable current task with an empty preview', () => {
        const r = stepPanel(CLOSED, { type: 'open' }, { room, state: fresh(), stars: 5 });
        expect(r.panel).toEqual({ kind: 'open', mode: 'buy', taskId: 't1', preview: null });
        expect(r.bought).toBeNull();
        expect(r.stars).toBe(5);
    });
    it('stays closed one star short and spends nothing', () => {
        const s = fresh();
        const r = stepPanel(CLOSED, { type: 'open' }, { room, state: s, stars: 4 });
        expect(r.panel).toEqual(CLOSED);
        expect(r.stars).toBe(4);
        expect(r.state).toBe(s);
    });
    it('is ignored after the last task', () => {
        const r = stepPanel(CLOSED, { type: 'open' }, { room, state: { tasksDone: 3, chosen: {} }, stars: 99 });
        expect(r.panel).toEqual(CLOSED);
    });
});

describe('picking and confirming', () => {
    const open = (preview: 0 | 1 | 2 | null): PanelState => ({ kind: 'open', mode: 'buy', taskId: 't1', preview });
    it('a pick sets and overrides the preview without spending', () => {
        const a = stepPanel(open(null), { type: 'pick', variant: 2 }, { room, state: fresh(), stars: 20 });
        expect(a.panel).toEqual(open(2));
        const b = stepPanel(a.panel, { type: 'pick', variant: 0 }, { room, state: fresh(), stars: 20 });
        expect(b.panel).toEqual(open(0));
        expect(b.stars).toBe(20);
        expect(b.bought).toBeNull();
    });
    it('a pick while closed is ignored', () => {
        const r = stepPanel(CLOSED, { type: 'pick', variant: 1 }, { room, state: fresh(), stars: 20 });
        expect(r.panel).toEqual(CLOSED);
    });
    it('confirm without a preview changes nothing', () => {
        const s = fresh();
        const r = stepPanel(open(null), { type: 'confirm' }, { room, state: s, stars: 20 });
        expect(r.panel).toEqual(open(null));
        expect(r.stars).toBe(20);
        expect(r.state).toBe(s);
        expect(r.bought).toBeNull();
    });
    it('confirm with a preview buys, closes the panel and returns the new balance and room', () => {
        const r = stepPanel(open(1), { type: 'confirm' }, { room, state: fresh(), stars: 7 });
        expect(r.panel).toEqual(CLOSED);
        expect(r.stars).toBe(2);
        expect(r.state).toEqual({ tasksDone: 1, chosen: { floor: 1 } });
        expect(r.bought).toEqual({ kind: 'slot', taskId: 't1', slot: 'floor', variant: 1 });
    });
    it('a balance equal to the cost buys down to zero', () => {
        const r = stepPanel(open(0), { type: 'confirm' }, { room, state: fresh(), stars: 5 });
        expect(r.stars).toBe(0);
        expect(r.bought?.taskId).toBe('t1');
    });
    it('a second confirm in a row buys nothing, even with stars for the next task', () => {
        let ctx = { room, state: fresh(), stars: 30 };
        const first = stepPanel(open(2), { type: 'confirm' }, ctx);
        ctx = { room, state: first.state, stars: first.stars };
        const second = stepPanel(first.panel, { type: 'confirm' }, ctx);
        expect(second.bought).toBeNull();
        expect(second.stars).toBe(25);
        expect(second.state.tasksDone).toBe(1);
    });
    it('a stale panel (task already bought) closes without a purchase', () => {
        const state: RoomState = { tasksDone: 1, chosen: { floor: 0 } };
        const confirm = stepPanel(open(1), { type: 'confirm' }, { room, state, stars: 50 });
        expect(confirm.panel).toEqual(CLOSED);
        expect(confirm.bought).toBeNull();
        expect(confirm.stars).toBe(50);
        expect(confirm.state.tasksDone).toBe(1);
        const pick = stepPanel(open(null), { type: 'pick', variant: 1 }, { room, state, stars: 50 });
        expect(pick.panel).toEqual(CLOSED);
    });
    it('confirm while closed is ignored', () => {
        const r = stepPanel(CLOSED, { type: 'confirm' }, { room, state: fresh(), stars: 50 });
        expect(r.panel).toEqual(CLOSED);
        expect(r.bought).toBeNull();
        expect(r.stars).toBe(50);
    });
});

describe('closing', () => {
    it('closes without spending, whatever the preview', () => {
        const s = fresh();
        const r = stepPanel({ kind: 'open', mode: 'buy', taskId: 't1', preview: 2 }, { type: 'close' }, { room, state: s, stars: 20 });
        expect(r.panel).toEqual(CLOSED);
        expect(r.stars).toBe(20);
        expect(r.state).toBe(s);
        expect(r.bought).toBeNull();
    });
});

describe('change mode (S-10, FR-018: a change is free)', () => {
    const furnished = (): RoomState => ({ tasksDone: 2, chosen: { floor: 0, sofa: 1 } });
    const changeOpen = (slot: string, preview: 0 | 1 | 2 | null): PanelState => ({ kind: 'open', mode: 'change', slot, preview });
    it('change on a furnished slot opens the change panel with an empty preview', () => {
        const r = stepPanel(CLOSED, { type: 'change', slot: 'sofa' }, { room, state: furnished(), stars: 3 });
        expect(r.panel).toEqual(changeOpen('sofa', null));
        expect(r.stars).toBe(3);
        expect(r.bought).toBeNull();
        expect(r.changed).toBeNull();
    });
    it('change on an empty or unknown slot stays closed', () => {
        const ctx = { room, state: furnished(), stars: 3 };
        expect(stepPanel(CLOSED, { type: 'change', slot: 'lamp' }, ctx).panel).toEqual(CLOSED);
        expect(stepPanel(CLOSED, { type: 'change', slot: 'nope' }, ctx).panel).toEqual(CLOSED);
    });
    it('change while a panel is open is ignored', () => {
        const ctx = { room, state: furnished(), stars: 3 };
        const open: PanelState = { kind: 'open', mode: 'buy', taskId: 't3', preview: null };
        expect(stepPanel(open, { type: 'change', slot: 'sofa' }, ctx).panel).toEqual(open);
        const other = changeOpen('floor', 1);
        expect(stepPanel(other, { type: 'change', slot: 'sofa' }, ctx).panel).toEqual(other);
    });
    it('a buy open is ignored while the change panel is open', () => {
        const p = changeOpen('sofa', null);
        expect(stepPanel(p, { type: 'open' }, { room, state: furnished(), stars: 50 }).panel).toEqual(p);
    });
    it('confirm without a preview changes nothing', () => {
        const s = furnished();
        const r = stepPanel(changeOpen('sofa', null), { type: 'confirm' }, { room, state: s, stars: 9 });
        expect(r.panel).toEqual(changeOpen('sofa', null));
        expect(r.state).toBe(s);
        expect(r.changed).toBeNull();
    });
    it('a pick sets the preview in the change panel', () => {
        const r = stepPanel(changeOpen('sofa', null), { type: 'pick', variant: 2 }, { room, state: furnished(), stars: 9 });
        expect(r.panel).toEqual(changeOpen('sofa', 2));
    });
    it('confirm with a preview rewrites the variant and spends and counts nothing', () => {
        const before = furnished();
        const r = stepPanel(changeOpen('sofa', 2), { type: 'confirm' }, { room, state: before, stars: 9 });
        expect(r.panel).toEqual(CLOSED);
        expect(r.stars).toBe(9);
        expect(r.bought).toBeNull();
        expect(r.changed).toEqual({ slot: 'sofa', variant: 2 });
        expect(r.state).toEqual({ tasksDone: 2, chosen: { floor: 0, sofa: 2 } });
        expect(before.chosen.sofa).toBe(1);
    });
    it('a second confirm in a row changes nothing', () => {
        const first = stepPanel(changeOpen('sofa', 2), { type: 'confirm' }, { room, state: furnished(), stars: 9 });
        const second = stepPanel(first.panel, { type: 'confirm' }, { room, state: first.state, stars: first.stars });
        expect(second.changed).toBeNull();
        expect(second.state).toBe(first.state);
    });
    it('close leaves the room and the balance as they were', () => {
        const s = furnished();
        const r = stepPanel(changeOpen('sofa', 1), { type: 'close' }, { room, state: s, stars: 9 });
        expect(r.panel).toEqual(CLOSED);
        expect(r.state).toBe(s);
        expect(r.stars).toBe(9);
    });
    it('works when the room is complete and the balance is zero', () => {
        const done: RoomState = { tasksDone: 3, chosen: { floor: 0, sofa: 1, lamp: 2 } };
        const opened = stepPanel(CLOSED, { type: 'change', slot: 'lamp' }, { room, state: done, stars: 0 });
        expect(opened.panel).toEqual(changeOpen('lamp', null));
        const picked = stepPanel(opened.panel, { type: 'pick', variant: 0 }, { room, state: done, stars: 0 });
        const r = stepPanel(picked.panel, { type: 'confirm' }, { room, state: done, stars: 0 });
        expect(r.changed).toEqual({ slot: 'lamp', variant: 0 });
        expect(r.stars).toBe(0);
        expect(r.state.tasksDone).toBe(3);
    });
});

describe('random event sequences (risk #16)', () => {
    const seeds = Array.from({ length: 20 }, (_, i) => i + 1);
    it.each(seeds)('seed %i: balance never negative, every star accounted for', (seed) => {
        const rng = createRng(seed);
        const start = rng.int(0, 120);
        let stars = start;
        let state = fresh();
        let panel: PanelState = CLOSED;
        let earned = 0;
        let spent = 0;
        const fail = (msg: string) => `seed ${seed}: ${msg}`;
        for (let i = 0; i < 200; i++) {
            if (rng.chance(0.2)) {
                const delta = rng.int(0, 6);
                stars = earn(stars, delta);
                earned += delta;
            }
            const roll = rng.int(0, 4);
            const event: PanelEvent =
                roll === 0 ? { type: 'open' }
                : roll === 1 ? { type: 'pick', variant: rng.pick([0, 1, 2] as const) }
                : roll === 2 ? { type: 'confirm' }
                : roll === 3 ? { type: 'close' }
                : { type: 'change', slot: rng.pick(['floor', 'sofa', 'lamp', 'nope']) };
            const costBefore = currentTask(room, state)?.cost ?? 0;
            const doneBefore = state.tasksDone;
            const r = stepPanel(panel, event, { room, state, stars });
            if (r.bought) {
                expect(event.type, fail('bought only on confirm')).toBe('confirm');
                expect(r.state.tasksDone, fail('tasksDone +1')).toBe(doneBefore + 1);
                expect(r.stars, fail('cost deducted once')).toBe(stars - costBefore);
                spent += costBefore;
            } else {
                expect(r.stars, fail('no purchase, same stars')).toBe(stars);
                expect(r.state.tasksDone, fail('no purchase, same tasksDone')).toBe(doneBefore);
                if (r.changed) {
                    expect(event.type, fail('changed only on confirm')).toBe('confirm');
                    expect(r.state.chosen[r.changed.slot], fail('variant written')).toBe(r.changed.variant);
                    expect(r.state.tasksDone, fail('change does not count')).toBe(state.tasksDone);
                } else {
                    expect(r.state, fail('no purchase, same state')).toBe(state);
                }
            }
            expect(r.stars, fail('balance >= 0')).toBeGreaterThanOrEqual(0);
            stars = r.stars;
            state = r.state;
            panel = r.panel;
        }
        expect(start + earned - stars, fail('start + earned - end = spent')).toBe(spent);
    });
});

describe('background stage task (S-16a)', () => {
    const staged: RoomDef = {
        id: 'staged',
        ...TEST_ROOM_PARTS,
        slots: [testSlot('sofa', 2)],
        tasks: [
            { kind: 'stage', id: 'walls', label: 'walls', cost: 5 },
            { kind: 'slot', id: 'sofa', slot: 'sofa', label: 'sofa', cost: 8 },
        ],
    };
    it('one open buys the stage: cost once, panel stays closed, chosen untouched', () => {
        const r = stepPanel(CLOSED, { type: 'open' }, { room: staged, state: fresh(), stars: 12 });
        expect(r.panel).toEqual(CLOSED);
        expect(r.stars).toBe(7);
        expect(r.bought).toEqual({ kind: 'stage', taskId: 'walls' });
        expect(r.state).toEqual({ tasksDone: 1, chosen: {} });
    });
    it('too few stars: open does nothing', () => {
        const s = fresh();
        const r = stepPanel(CLOSED, { type: 'open' }, { room: staged, state: s, stars: 4 });
        expect(r.stars).toBe(4);
        expect(r.bought).toBeNull();
        expect(r.state).toBe(s);
    });
    it('a second open right after opens the next slot panel and spends nothing', () => {
        const first = stepPanel(CLOSED, { type: 'open' }, { room: staged, state: fresh(), stars: 20 });
        const second = stepPanel(first.panel, { type: 'open' }, { room: staged, state: first.state, stars: first.stars });
        expect(second.panel).toEqual({ kind: 'open', mode: 'buy', taskId: 'sofa', preview: null });
        expect(second.stars).toBe(15);
        expect(second.bought).toBeNull();
        expect(second.state).toBe(first.state);
    });
});
