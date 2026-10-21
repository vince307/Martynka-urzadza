// Text for the speech synthesizer: glyphs become words ("plus", "okienko"),
// small numbers inside a calculation are spelled out, and what the narrator
// reads in each phase of a round. Pure functions; the words come as an argument.
import type { RoundState } from '../round';
import { firstHint, solutionSteps } from '../round/hints';
import { headingOf, type HeadingWords } from '../round/heading';
import type { Task } from '../tasks/types';
import { NUMBER_SOURCE, parseNumber } from '../text/formatNumber';
import { MAX_NUMBER_WORD, numberToWords } from '../text/numberWords';

/** The words the narrator says for glyphs (data/pl.ts `speech`). */
export interface SpeechWords {
    plus: string;
    minus: string;
    times: string;
    divide: string;
    equals: string;
    blank: string;
    less: string;
    greater: string;
}

// Sentence boundaries: line breaks, the space after . ? !, and a colon glued to a word.
// A colon between numbers ("12 : 3") is division and never a boundary.
const BOUNDARY = /\n+|(?<=[.?!]) +|(?<=\p{L}):\s+/u;
const SENTENCE_END = /[.?!]$/u;
const TRAILING_PUNCTUATION = /[.?!]+$/u;
const CALCULATION = /^[\d\u00A0\s+−·:()□=<>]+$/u;
const NUMBER = new RegExp(NUMBER_SOURCE, 'gu');

const isCalculation = (segment: string): boolean => /[\d□]/u.test(segment) && CALCULATION.test(segment);

const glyphsToWords = (text: string, words: SpeechWords): string =>
    text
        .replace(/(?<=[\d□)])\s*:\s*(?=[\d□(])/gu, ` ${words.divide} `)
        .replace(/\s*\+\s*/gu, ` ${words.plus} `)
        .replace(/\s*−\s*/gu, ` ${words.minus} `)
        .replace(/\s*·\s*/gu, ` ${words.times} `)
        .replace(/\s*=\s*/gu, ` ${words.equals} `)
        .replace(/\s*<\s*/gu, ` ${words.less} `)
        .replace(/\s*>\s*/gu, ` ${words.greater} `)
        .replace(/□/gu, ` ${words.blank} `)
        .replace(/\s*\(\s*/gu, ', ')
        .replace(/\s*\)/gu, '')
        .replace(/\s*;\s*/gu, ', ');

const numeral = (digits: string): string => {
    const n = parseNumber(digits);
    return n <= MAX_NUMBER_WORD ? numberToWords(n) : String(n);
};

const segmentToSpeech = (segment: string, words: SpeechWords): string => {
    const core = segment.replace(TRAILING_PUNCTUATION, '');
    const end = segment.slice(core.length);
    let text = glyphsToWords(core, words);
    // Inside a bare calculation numbers are said as words; in a sentence the synthesizer reads the digits.
    text = isCalculation(core)
        ? text.replace(NUMBER, numeral)
        : text.replace(/(?<=\d)\u00A0(?=\d)/gu, '');
    return text.replace(/\s+/gu, ' ').replace(/ ,/gu, ',').trim() + end;
};

/** Spoken form of a task text or hint: sentences kept apart, glyphs and small calculation numbers in words. */
export const spokenText = (text: string, words: SpeechWords): string => {
    const segments = text
        .split(BOUNDARY)
        .map((segment) => segment.trim())
        .filter((segment) => segment !== '')
        .map((segment) => segmentToSpeech(segment, words));
    return segments
        .map((segment, i) => (i < segments.length - 1 && !SENTENCE_END.test(segment) ? `${segment}.` : segment))
        .join(' ');
};

/**
 * What the narrator says for the task itself: the heading the screen draws (the screen and the speaker share
 * `headingOf`), then the question or prompt. `headings` null reads no heading (a word round).
 */
export const spokenTask = (task: Task, words: SpeechWords, headings: HeadingWords | null): string => {
    const spoken = spokenText(task.speak ?? task.prompt, words);
    const kind = headings === null ? null : headingOf(task);
    return headings !== null && kind !== null ? `${headings[kind]}. ${spoken}` : spoken;
};

export interface NarrationOptions {
    words: SpeechWords;
    headings: HeadingWords | null;
    tryAgain: string;
    answerLine: (answer: string) => string;
}

/** Text for the speaker in the current phase of the round, or null when nothing is shown to read. */
export const narrationOf = (state: RoundState, opts: NarrationOptions): string | null => {
    if (state.finished) {
        return null;
    }
    const task = state.tasks[state.index];
    const { words, headings, tryAgain, answerLine } = opts;
    switch (state.phase) {
        case 'first':
        case 'done':
            return spokenTask(task, words, headings);
        case 'second': {
            const hint = state.notes[state.index] ?? firstHint(task);
            return `${tryAgain}. ${hint === null ? spokenTask(task, words, headings) : spokenText(hint, words)}`;
        }
        case 'solution': {
            const steps = solutionSteps(task, answerLine);
            return spokenText(steps[Math.min(state.solutionStep, steps.length - 1)] ?? '', words);
        }
        case 'retype':
            return spokenText(solutionSteps(task, answerLine).at(-1) ?? '', words);
    }
};
