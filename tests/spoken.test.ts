import { describe, expect, it } from 'vitest';
import { narrationOf, spokenTask, spokenText, type SpeechWords } from '../src/core/narration/spoken';
import { createRng } from '../src/core/rng';
import { answer, nextSolutionStep, startRound, type RoundState } from '../src/core/round';
import { getGenerator } from '../src/core/tasks/registry';
import type { Task } from '../src/core/tasks/types';
import { numberToWords } from '../src/core/text/numberWords';
import { balance } from '../src/data/balance';
import { stages } from '../src/data/curriculum';
import { pl } from '../src/data/pl';

// Spoken text of tasks and rounds (S-05 phase 2). Expected strings are written
// by hand from the kit; the invariants run over every skill of every stage.
const words = pl.speech as SpeechWords;
const NBSP = '\u00A0';
const say = (text: string) => spokenText(text, words);
const command = (task: Task) => spokenTask(task, words, pl.round.calculate);

describe('spokenText', () => {
    it('reads a bare calculation with number words and operator words', () => {
        expect(command({ skillId: 'T', prompt: '38 + 27', answer: 65, hint: [] })).toBe('Oblicz. trzydzieści osiem plus dwadzieścia siedem');
    });
    it.each([
        ['17 − 8', 'siedemnaście minus osiem'],
        ['8 · 3', 'osiem razy trzy'],
        ['17 − 8 = □', 'siedemnaście minus osiem równa się okienko'],
        ['12 : 3 = □', 'dwanaście podzielić przez trzy równa się okienko'],
        ['4 = 1 + □', 'cztery równa się jeden plus okienko'],
        ['3 < 5', 'trzy mniejsze niż pięć'],
        ['7 > 2', 'siedem większe niż dwa'],
    ])('%s', (text, spoken) => expect(say(text)).toBe(spoken));

    it('keeps a colon after a word as a pause, never as division', () => {
        const spoken = say('Uzupełnij ciąg: 2, 4, 6, □');
        expect(spoken).not.toContain('podzielić');
        expect(spoken).toContain('okienko');
        expect(spoken).not.toContain(':');
    });
    it('reads the fact family check line', () => {
        expect(say('4 · 3 = 12. Sprawdź: 12 : 3 = □')).toBe('cztery razy trzy równa się dwanaście. Sprawdź. dwanaście podzielić przez trzy równa się okienko');
    });
    it('puts a line break in a sentence boundary', () => {
        expect(say('Uzupełnij domek liczby 4.\n4 = 1 + □')).toBe('Uzupełnij domek liczby 4. cztery równa się jeden plus okienko');
    });
    it('keeps digits in a sentence but replaces symbols there', () => {
        const spoken = say('27 to 20 + 7 (dwadzieścia + siedem)');
        expect(spoken).toBe('27 to 20 plus 7, dwadzieścia plus siedem');
    });
    it('writes a long number as digits without the no-break space, never as thousands of words', () => {
        const spoken = say(`Jaki znak pasuje w okienku? 12${NBSP}345 □ 12${NBSP}354`);
        expect(spoken).toContain('12345');
        expect(spoken).toContain('12354');
        expect(spoken).not.toContain('dwanaście');
        expect(spoken).not.toContain(NBSP);
        expect(say(`Zaokrąglij 12${NBSP}345 do tysięcy`)).toBe('Zaokrąglij 12345 do tysięcy');
    });
    it('keeps the number word range: 1000 in words, 1001 in digits', () => {
        expect(say('1000 + 5')).toBe('tysiąc plus pięć');
        expect(say('1001 − 5')).toBe('1001 minus pięć');
    });
});

const skills = Object.values(stages).flatMap((stage) => stage?.steps.flatMap((step) => step.skills) ?? []);
const SEEDS = 20;
const DRAWS = 10;
const forEachTask = (check: (task: Task, where: string) => void): void => {
    for (const skill of skills) {
        const generate = getGenerator(skill.type);
        if (!generate) {
            continue;
        }
        for (let seed = 1; seed <= SEEDS; seed += 1) {
            const rng = createRng(20261013 + seed);
            for (let i = 0; i < DRAWS; i += 1) {
                const task = generate(skill, rng);
                check(task, `${skill.id} seed=${seed} draw=${i} prompt="${task.prompt}"`);
            }
        }
    }
};

const tokens = (text: string): string[] => text.replace(/(?<=\d)\u00A0(?=\d)/g, '').toLowerCase().match(/[\p{L}\p{N}<>=+−·:]+|,/gu) ?? [];
const NUMBER_WORDS = new Set(Array.from({ length: 1001 }, (_, n) => numberToWords(n)).flatMap((w) => w.split(' ')));
// A number said in words is one maximal run of number words ("siedemdziesiąt siedem" is 77, it does not contain 70).
const wordRuns = (haystack: string[]): string[][] =>
    haystack.reduce<string[][]>((runs, w, i) => {
        if (NUMBER_WORDS.has(w)) {
            if (i > 0 && NUMBER_WORDS.has(haystack[i - 1])) {
                runs[runs.length - 1].push(w);
            } else {
                runs.push([w]);
            }
        }
        return runs;
    }, []);
const containsRun = (haystack: string[], needle: string[]): boolean =>
    NUMBER_WORDS.has(needle[0])
        ? wordRuns(haystack).some((run) => run.join(' ') === needle.join(' '))
        : needle.length > 0 && haystack.some((_, k) => needle.every((w, m) => haystack[k + m] === w));

const signWord: Record<string, string> = { '<': words.less, '>': words.greater, '=': words.equals, '+': words.plus, '−': words.minus, '·': words.times, ':': words.divide };
const formsOf = (value: Task['answer']): string[][] => {
    if (Array.isArray(value)) {
        return [];
    }
    if (typeof value === 'number') {
        const forms = [tokens(String(value))];
        if (Number.isInteger(value) && value >= 0 && value <= 1000) {
            forms.push(tokens(numberToWords(value)));
        }
        return forms;
    }
    return [signWord[value] ? tokens(signWord[value]) : tokens(value)];
};

describe('speech over every skill of every stage', () => {
    it('covers skills', () => expect(skills.length).toBeGreaterThan(50));

    it('has no operator glyph, blank, no-break space or digit-colon left', () => {
        forEachTask((task, where) => {
            const spoken = command(task);
            expect(spoken, where).not.toMatch(/[−·□<>=+]/u);
            expect(spoken, where).not.toContain(NBSP);
            expect(spoken, where).not.toMatch(/\d\s*:\s*[\d□]/u);
        });
        // Walks every phase of every skill of every stage: ~5 s under full-suite load since S-14 added the art skills.
    }, 30_000);

    it('never speaks a standalone Roman numeral token', () => {
        forEachTask((task, where) => {
            expect(command(task), where).not.toMatch(/(?<![\p{L}])[IVXLCDM]+(?![\p{L}])/u);
        });
        // Same walk as above: same limit.
    }, 30_000);

    it('speech does not give away the answer: a form of the answer absent from the visible prompt is absent from the speech', () => {
        forEachTask((task, where) => {
            const visible = tokens(task.prompt);
            const spoken = tokens(command(task));
            const forms = formsOf(task.answer);
            // The answer, in any form, is already on the screen (an operand equal to it): speaking it tells nothing new.
            if (forms.some((form) => containsRun(visible, form))) {
                return;
            }
            for (const form of forms) {
                expect(containsRun(spoken, form), `${where} answer ${JSON.stringify(task.answer)} form ${form.join(' ')}`).toBe(false);
            }
        });
        // Same walk as above: same limit.
    }, 30_000);
});

describe('narrationOf', () => {
    const opts = { words, calculate: pl.round.calculate, tryAgain: pl.round.tryAgain, answerLine: pl.round.resultLine };
    const t = (prompt: string, hint: string[], answerValue: number): Task => ({ skillId: 'T.1', prompt, answer: answerValue, hint });
    const round = (): RoundState => startRound([t('38 + 27', ['30 + 20 = 50', '8 + 7 = 15', '50 + 15 = 65'], 65), t('9 − 4', ['9 − 4 = 5'], 5)], { ...balance.round, length: 2 });
    const WRONG = -1;

    it('reads the command on the first try and when the task is settled', () => {
        expect(narrationOf(round(), opts)).toBe('Oblicz. trzydzieści osiem plus dwadzieścia siedem');
        expect(narrationOf(answer(round(), 65), opts)).toBe('Oblicz. trzydzieści osiem plus dwadzieścia siedem');
    });
    it('prefers the task speak over the prompt', () => {
        const spoken = { ...t('3 □ 5', [], 0), speak: 'Jaki znak pasuje w okienku? 3 □ 5' };
        const s = startRound([spoken], { ...balance.round, length: 1 });
        expect(narrationOf(s, opts)).toBe('Jaki znak pasuje w okienku? trzy okienko pięć');
    });
    it('on the second try says try again and reads the first hint', () => {
        expect(narrationOf(answer(round(), WRONG), opts)).toBe('Spróbuj jeszcze raz. trzydzieści plus dwadzieścia równa się pięćdziesiąt');
    });
    it('on the second try without a hint repeats the command', () => {
        const s = answer(startRound([t('9 − 4', ['9 − 4 = 5'], 5), t('1 + 1', [], 2)], { ...balance.round, length: 2 }), WRONG);
        expect(narrationOf(s, opts)).toBe('Spróbuj jeszcze raz. Oblicz. dziewięć minus cztery');
    });
    it('in the solution reads the last visible step, in retype the result line', () => {
        const s = answer(answer(round(), WRONG), WRONG);
        expect(s.phase).toBe('solution');
        expect(narrationOf(s, opts)).toBe('trzydzieści plus dwadzieścia równa się pięćdziesiąt');
        const s2 = nextSolutionStep(s);
        expect(narrationOf(s2, opts)).toBe('osiem plus siedem równa się piętnaście');
        const retype = nextSolutionStep(nextSolutionStep(s2));
        expect(retype.phase).toBe('retype');
        expect(narrationOf(retype, opts)).toBe('pięćdziesiąt plus piętnaście równa się sześćdziesiąt pięć');
    });
    it('reads nothing after the round', () => {
        const done = { ...round(), finished: true };
        expect(narrationOf(done, opts)).toBeNull();
    });
    it('every phase of every task is free of operator glyphs', () => {
        forEachTask((task, where) => {
            let s = startRound([task], { ...balance.round, length: 1 });
            const seen: (string | null)[] = [narrationOf(s, opts)];
            s = answer(s, WRONG);
            seen.push(narrationOf(s, opts));
            s = answer(s, WRONG);
            for (let i = 0; i < 12 && s.phase === 'solution'; i += 1) {
                seen.push(narrationOf(s, opts));
                s = nextSolutionStep(s);
            }
            seen.push(narrationOf(s, opts));
            for (const line of seen) {
                expect(line, where).toBeTypeOf('string');
                expect(line, where).not.toMatch(/[−·□<>=+]|\u00A0/u);
            }
        });
        // Walks every phase of every skill of every stage: ~6 s on the CI runner since S-14 added the art skills.
    }, 30_000);
});
