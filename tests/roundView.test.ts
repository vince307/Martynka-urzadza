// The view model the task scene draws: bar, input mode, dots per phase.
import { describe, expect, it } from 'vitest';
import { answer, next, nextSolutionStep, startRound, type RoundState } from '../src/core/round';
import { roundView } from '../src/core/round/view';
import type { Task } from '../src/core/tasks/types';
import { balance } from '../src/data/balance';

const line = (a: string): string => `Wynik: ${a}`;
const tile: Task = { skillId: 'T.1', prompt: '2 + 3', answer: 5, choices: [4, 5, 6, 7], hint: ['2 + 3', '2 + 3 = 5'] };
const keys: Task = { skillId: 'T.2', prompt: '20 + 5', answer: 25, hint: ['20 + 5', 'Dodaj dziesiątki i jedności', '20 + 5 = 25'] };
const leaky: Task = { skillId: 'T.3', prompt: '4 + 4', answer: 8, choices: [6, 8, 9, 10], hint: ['4 + 4 = 8', 'dwa razy cztery'] };
const rest = (n: number): Task[] => Array.from({ length: n }, (_, i) => ({ ...keys, skillId: `R.${i}` }));
const start = (first: Task): RoundState => startRound([first, ...rest(4)], balance.round);
const view = (s: RoundState) => roundView(s, line);
const wrong = (s: RoundState): RoundState => answer(s, -1);

describe('roundView', () => {
    it('first try: no bar, input active, switch hidden, dots start current/todo', () => {
        const v = view(start(tile));
        expect(v.bar).toEqual({ kind: 'none' });
        expect(v.inputActive).toBe(true);
        expect(v.switchVisible).toBe(false);
        expect(v.dots.map((d) => d.status)).toEqual(['current', 'todo', 'todo', 'todo', 'todo']);
    });

    it('input mode follows the task: tiles with choices, keypad without', () => {
        expect(view(start(tile))).toMatchObject({ input: 'tiles', choices: [4, 5, 6, 7] });
        expect(view(start(keys))).toMatchObject({ input: 'keypad', choices: [] });
    });

    it('second try shows the first hint line, or null when the line gives the result away', () => {
        expect(view(wrong(start(tile))).bar).toEqual({ kind: 'hint', line: '2 + 3' });
        expect(view(wrong(start(leaky))).bar).toEqual({ kind: 'hint', line: null });
        expect(view(wrong(start(tile))).inputActive).toBe(true);
    });

    it('solution shows lines up to the step; input is off; last step offers "gotIt"', () => {
        let s = wrong(wrong(start(keys)));
        expect(view(s)).toMatchObject({ inputActive: false, bar: { kind: 'solution', lines: ['20 + 5'], button: 'next' } });
        s = nextSolutionStep(s);
        expect(view(s).bar).toMatchObject({ kind: 'solution', lines: ['20 + 5', 'Dodaj dziesiątki i jedności'], button: 'next' });
        s = nextSolutionStep(s);
        expect(view(s).bar).toEqual({
            kind: 'solution',
            lines: ['20 + 5', 'Dodaj dziesiątki i jedności', '20 + 5 = 25'],
            button: 'gotIt',
        });
    });

    it('a solution without the result gets the answer line appended', () => {
        const open: Task = { ...keys, hint: ['20 + 5', 'dodaj'] };
        let s = wrong(wrong(start(open)));
        s = nextSolutionStep(s);
        expect(view(s).bar).toMatchObject({ kind: 'solution', lines: ['20 + 5', 'dodaj'], button: 'next' });
        s = nextSolutionStep(s);
        expect(view(s).bar).toMatchObject({ kind: 'solution', lines: ['20 + 5', 'dodaj', 'Wynik: 25'], button: 'gotIt' });
    });

    it('retype shows the last solution step and keeps input active', () => {
        let s = wrong(wrong(start(tile)));
        s = nextSolutionStep(nextSolutionStep(s));
        expect(s.phase).toBe('retype');
        expect(view(s)).toMatchObject({ inputActive: true, bar: { kind: 'retype', line: '2 + 3 = 5' } });
    });

    it('done: a star for a solved task, none after retype', () => {
        expect(view(answer(start(tile), 5)).bar).toEqual({ kind: 'correct', star: true });
        expect(view(answer(wrong(start(tile)), 5)).bar).toEqual({ kind: 'correct', star: true });
        let s = wrong(wrong(start(tile)));
        s = answer(nextSolutionStep(nextSolutionStep(s)), 5);
        expect(view(s)).toMatchObject({ inputActive: false, bar: { kind: 'correct', star: false } });
    });

    it('dots show outcomes of finished tasks and move the current marker', () => {
        const s = next(answer(start(tile), 5));
        expect(view(s).dots[0]).toEqual({ status: 'done', outcome: 'first' });
        expect(view(s).dots[1].status).toBe('current');
    });

    it('a settled task turns its dot green before "Dalej" (kit correct.png)', () => {
        const s = answer(start(tile), 5);
        expect(view(s).dots.map((d) => d.status)).toEqual(['done', 'todo', 'todo', 'todo', 'todo']);
        expect(view(s).dots[0].outcome).toBe('first');
    });

    it('round end carries the bonus, and none when the round had a mistake', () => {
        let s = start(tile);
        for (let i = 0; i < 5; i += 1) {
            s = next(answer(s, s.tasks[s.index].answer));
        }
        expect(view(s)).toMatchObject({ bar: { kind: 'roundEnd', bonus: 2 }, inputActive: false });
        let m = next(answer(wrong(start(tile)), 5));
        for (let i = 0; i < 4; i += 1) {
            m = next(answer(m, m.tasks[m.index].answer));
        }
        expect(view(m).bar).toEqual({ kind: 'roundEnd', bonus: 0 });
    });

    it('the switch stays hidden in every phase', () => {
        let s = start(tile);
        expect(view(s).switchVisible).toBe(false);
        s = wrong(wrong(s));
        expect(view(s).switchVisible).toBe(false);
        s = nextSolutionStep(nextSolutionStep(s));
        expect(view(s).switchVisible).toBe(false);
    });
});
