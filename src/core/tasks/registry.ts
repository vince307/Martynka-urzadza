// Task type (ZADANIA.md, section 4) → generator. Types without an entry are
// reported by scripts/sample.ts as "brak generatora" instead of failing.
import { generateAddSub } from './generators/addSub';
import { generateCalendar } from './generators/calendar';
import { generateCompareNum } from './generators/compareNum';
import { generateComplement } from './generators/complement';
import { generateDiv } from './generators/div';
import { generateEvenOdd } from './generators/evenOdd';
import { generateHalf } from './generators/half';
import { generateMissing } from './generators/missing';
import { generateMult } from './generators/mult';
import { generateNumberWords } from './generators/numberWords';
import { generateRoman } from './generators/roman';
import { generateRounding } from './generators/rounding';
import type { Generator } from './types';

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
};

export const getGenerator = (type: string): Generator | undefined =>
    Object.prototype.hasOwnProperty.call(generators, type) ? generators[type] : undefined;
