// Origin: change final-sound, phase 2 (F4/F5 of the plan review). States come from the public reducers, not literals.
import { describe, expect, it } from 'vitest';
import { answer, next, nextSolutionStep, startRound, type RoundState } from '../src/core/round';
import { dragCue, panelCue } from '../src/core/sound';
import { roundCues } from '../src/core/sound';
import { stepPanel, type PanelContext, type PanelState } from '../src/core/variantPanel';
import type { Task } from '../src/core/tasks/types';
import type { RoomDef } from '../src/core/types';
import { balance } from '../src/data/balance';
import { SALON } from '../src/data/rooms';

const task = (i: number): Task => ({ skillId: `T.${i}`, prompt: `${i} + 1`, answer: i + 1, hint: [`${i} + 1 = ${i + 1}`] });
const fresh = (n = 5): RoundState => startRound(Array.from({ length: n }, (_, i) => task(i)), balance.round);
const right = (s: RoundState) => answer(s, s.tasks[s.index].answer);
const WRONG = -1;
const D = 250;
const ids = (c: readonly { id: string }[]) => c.map((x) => x.id);

describe('roundCues', () => {
    it('first-try right gives answer-right now and star after the delay', () => {
        const s = fresh();
        expect(roundCues(s, right(s), 'round', D)).toEqual([{ id: 'answer-right', delayMs: 0 }, { id: 'star', delayMs: D }]);
    });
    it('second-try right also gives a star', () => {
        const s = answer(fresh(), WRONG);
        expect(ids(roundCues(s, right(s), 'round', D))).toEqual(['answer-right', 'star']);
    });
    it('a first miss plays answer-retry', () => {
        const s = fresh();
        expect(roundCues(s, answer(s, WRONG), 'round', D)).toEqual([{ id: 'answer-retry', delayMs: 0 }]);
    });
    it('no cue for the solution, a wrong retype or a solution step', () => {
        const second = answer(fresh(), WRONG);
        const solution = answer(second, WRONG);
        expect(solution.phase).toBe('solution');
        expect(roundCues(second, solution, 'round', D)).toEqual([]);
        let walk = solution;
        while (walk.phase === 'solution') {
            const n = nextSolutionStep(walk);
            expect(roundCues(walk, n, 'round', D)).toEqual([]);
            walk = n;
        }
        expect(walk.phase).toBe('retype');
        expect(roundCues(walk, answer(walk, WRONG), 'round', D)).toEqual([]);
    });
    it('a retype is right without a star', () => {
        let s = answer(answer(fresh(), WRONG), WRONG);
        while (s.phase === 'solution') s = nextSolutionStep(s);
        expect(ids(roundCues(s, right(s), 'round', D))).toEqual(['answer-right']);
    });
    it('"Dalej" inside a round plays nothing', () => {
        const s = right(fresh());
        expect(roundCues(s, next(s), 'round', D)).toEqual([]);
    });
    const toLast = (clean: boolean): RoundState => {
        let s = fresh();
        for (let i = 0; i < 4; i++) s = next(i === 0 && !clean ? answer(answer(s, WRONG), s.tasks[s.index].answer) : right(s));
        return right(s);
    };
    it('the bonus at the round end plays round-bonus, not star', () => {
        const last = toLast(true);
        const end = next(last);
        expect(end.bonusEarned).toBeGreaterThan(0);
        expect(end.starsEarned).toBeGreaterThan(last.starsEarned);
        expect(ids(roundCues(last, end, 'round', D))).toEqual(['round-bonus']);
    });
    it('a round with a mistake ends silently', () => {
        const last = toLast(false);
        const end = next(last);
        expect(end.finished).toBe(true);
        expect(end.bonusEarned).toBe(0);
        expect(roundCues(last, end, 'round', D)).toEqual([]);
    });
    it('a finished variant plays minigame-done', () => {
        const last = toLast(true);
        for (const kind of ['puzzle', 'word', 'dice'] as const) {
            expect(ids(roundCues(last, next(last), kind, D))).toEqual(['minigame-done']);
        }
    });
    it('no change gives no cue', () => {
        const s = fresh();
        expect(roundCues(s, s, 'round', D)).toEqual([]);
    });
});

const room: RoomDef = SALON;
// tasksDone 1: the first task (renovate) is a one-tap stage; the next is a slot task with the variant panel.
const ctx = (over: Partial<PanelContext> = {}): PanelContext => ({ room, state: { tasksDone: 1, chosen: {} }, stars: 999, ...over });
const closed: PanelState = { kind: 'closed' };

describe('panelCue', () => {
    it('opening the panel plays panel-open', () => {
        const step = stepPanel(closed, { type: 'open' }, ctx());
        if (step.panel.kind !== 'open') throw new Error('test needs the first task to be a slot task');
        expect(panelCue(closed, step, { type: 'open' })).toBe('panel-open');
    });
    it('a one-tap stage purchase plays purchase', () => {
        const c = ctx({ state: { tasksDone: 0, chosen: {} } });
        const step = stepPanel(closed, { type: 'open' }, c);
        expect(step.bought).not.toBeNull();
        expect(panelCue(closed, step, { type: 'open' })).toBe('purchase');
    });
    it('a tap that does not open stays silent', () => {
        const step = stepPanel(closed, { type: 'open' }, ctx({ stars: 0 }));
        expect(panelCue(closed, step, { type: 'open' })).toBeNull();
    });
    it('picking a variant plays variant-pick', () => {
        const open = stepPanel(closed, { type: 'open' }, ctx()).panel;
        const step = stepPanel(open, { type: 'pick', variant: 1 }, ctx());
        expect(panelCue(open, step, { type: 'pick', variant: 1 })).toBe('variant-pick');
    });
    it('"Wybieram" with no preview is silent, with a preview plays purchase', () => {
        const open = stepPanel(closed, { type: 'open' }, ctx()).panel;
        expect(panelCue(open, stepPanel(open, { type: 'confirm' }, ctx()), { type: 'confirm' })).toBeNull();
        const picked = stepPanel(open, { type: 'pick', variant: 0 }, ctx()).panel;
        const buy = stepPanel(picked, { type: 'confirm' }, ctx());
        expect(buy.bought).not.toBeNull();
        expect(panelCue(picked, buy, { type: 'confirm' })).toBe('purchase');
    });
    it('a free change plays purchase', () => {
        const slot = room.slots[0].id;
        const c = ctx({ state: { tasksDone: 2, chosen: { [slot]: 0 } } });
        const open = stepPanel(closed, { type: 'change', slot }, c).panel;
        expect(open.kind).toBe('open');
        const picked = stepPanel(open, { type: 'pick', variant: 2 }, c).panel;
        const step = stepPanel(picked, { type: 'confirm' }, c);
        expect(step.changed).not.toBeNull();
        expect(panelCue(picked, step, { type: 'confirm' })).toBe('purchase');
    });
    it('closing is silent', () => {
        const open = stepPanel(closed, { type: 'open' }, ctx()).panel;
        expect(panelCue(open, stepPanel(open, { type: 'close' }, ctx()), { type: 'close' })).toBeNull();
    });
});

describe('dragCue', () => {
    const carry = { pointerId: 1, kind: 'a' };
    const mat = (n: number) => ({ a: n, b: 0 });
    it('putting an item on the mat plays coin for blocks and coins', () => {
        for (const mode of ['blocks', 'coins'] as const) {
            expect(dragCue({ carrying: carry, mat: mat(0) }, { carrying: null, mat: mat(1) }, mode)).toBe('coin');
        }
    });
    it('a cancel or a drop back to the tray keeps the mat and stays silent', () => {
        expect(dragCue({ carrying: carry, mat: mat(1) }, { carrying: null, mat: mat(1) }, 'blocks')).toBeNull();
    });
    it('taking an item off the mat stays silent', () => {
        expect(dragCue({ carrying: carry, mat: mat(2) }, { carrying: null, mat: mat(1) }, 'coins')).toBeNull();
    });
    it('picking up (carrying appears) and the clock stay silent', () => {
        expect(dragCue({ carrying: null, mat: mat(0) }, { carrying: carry, mat: mat(0) }, 'blocks')).toBeNull();
        expect(dragCue({ carrying: carry, mat: mat(0) }, { carrying: null, mat: mat(1) }, 'clock')).toBeNull();
    });
});
