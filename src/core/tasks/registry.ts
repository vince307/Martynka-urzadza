// Task type (ZADANIA.md, section 4) → generator and params parser. Types
// without an entry are reported by scripts/sample.ts as "brak generatora"
// instead of failing. Parsers reject parameters that would have no solutions.
import { generateAddSub, parseAddSubParams } from './generators/addSub';
import { generateCalendar, parseCalendarParams } from './generators/calendar';
import { generateCompareDiff, parseCompareDiffParams } from './generators/compareDiff';
import { generateCompareNum, parseCompareNumParams } from './generators/compareNum';
import { generateComplement, parseComplementParams } from './generators/complement';
import { generateDiv, parseDivParams } from './generators/div';
import { generateEvenOdd, parseEvenOddParams } from './generators/evenOdd';
import { generateHalf, parseHalfParams } from './generators/half';
import { generateMissing, parseMissingParams } from './generators/missing';
import { generateMult, parseMultParams } from './generators/mult';
import { generateNumberWords, parseNumberWordsParams } from './generators/numberWords';
import { generateRoman, parseRomanParams } from './generators/roman';
import { generateRounding, parseRoundingParams } from './generators/rounding';
import { generateWord, parseWordParams } from './generators/word';
import type { Generator } from './types';

export type ParamsParser = (params: Record<string, unknown>) => unknown;

export const generators: Readonly<Record<string, Generator>> = {
    ADD_SUB: generateAddSub,
    MISSING: generateMissing,
    COMPLEMENT: generateComplement,
    ROUNDING: generateRounding,
    MULT: generateMult,
    DIV: generateDiv,
    HALF: generateHalf,
    COMPARE_NUM: generateCompareNum,
    EVEN_ODD: generateEvenOdd,
    NUMBER_WORDS: generateNumberWords,
    ROMAN: generateRoman,
    CALENDAR: generateCalendar,
    WORD: generateWord,
    COMPARE_DIFF: generateCompareDiff,
};

export const parsers: Readonly<Record<string, ParamsParser>> = {
    ADD_SUB: parseAddSubParams,
    MISSING: parseMissingParams,
    COMPLEMENT: parseComplementParams,
    ROUNDING: parseRoundingParams,
    MULT: parseMultParams,
    DIV: parseDivParams,
    HALF: parseHalfParams,
    COMPARE_NUM: parseCompareNumParams,
    EVEN_ODD: parseEvenOddParams,
    NUMBER_WORDS: parseNumberWordsParams,
    ROMAN: parseRomanParams,
    CALENDAR: parseCalendarParams,
    WORD: parseWordParams,
    COMPARE_DIFF: parseCompareDiffParams,
};

const has = (record: Readonly<Record<string, unknown>>, type: string): boolean => Object.prototype.hasOwnProperty.call(record, type);

export const getGenerator = (type: string): Generator | undefined => (has(generators, type) ? generators[type] : undefined);
export const getParser = (type: string): ParamsParser | undefined => (has(parsers, type) ? parsers[type] : undefined);
