// Task type (ZADANIA.md, section 4) → generator and params parser. Types
// without an entry are reported by scripts/sample.ts as "brak generatora"
// instead of failing. Parsers reject parameters that would have no solutions.
import { generateAddSub, parseAddSubParams } from './generators/addSub';
import { generateArrowTable, parseArrowTableParams } from './generators/arrowTable';
import { generateBonds, parseBondsParams } from './generators/bonds';
import { generateCalendar, parseCalendarParams } from './generators/calendar';
import { generateCapacity, parseCapacityParams } from './generators/capacity';
import { generateChain, parseChainParams } from './generators/chain';
import { generateClock, parseClockParams } from './generators/clock';
import { generateCompareExpr, parseCompareExprParams } from './generators/compareExpr';
import { generateCompareDiff, parseCompareDiffParams } from './generators/compareDiff';
import { generateCompareNum, parseCompareNumParams } from './generators/compareNum';
import { generateChooseOp, parseChooseOpParams } from './generators/chooseOp';
import { generateComplement, parseComplementParams } from './generators/complement';
import { generateCount, parseCountParams } from './generators/count';
import { generateData, parseDataParams } from './generators/data';
import { generateDiv, parseDivParams } from './generators/div';
import { generateEvenOdd, parseEvenOddParams } from './generators/evenOdd';
import { generateFactFamily, parseFactFamilyParams } from './generators/factFamily';
import { generateInequality, parseInequalityParams } from './generators/inequality';
import { generateHalf, parseHalfParams } from './generators/half';
import { generateGrid, parseGridParams } from './generators/grid';
import { generateLength, parseLengthParams } from './generators/length';
import { generateMass, parseMassParams } from './generators/mass';
import { generateUnitChoice, parseUnitChoiceParams } from './generators/unitChoice';
import { generateMoneyChange, generateMoneyCount, parseMoneyChangeParams, parseMoneyCountParams } from './generators/money';
import { generateMissingOp, parseMissingOpParams } from './generators/missingOp';
import { generateMissing, parseMissingParams } from './generators/missing';
import { generateMult, parseMultParams } from './generators/mult';
import { generateMultGroups, parseMultGroupsParams } from './generators/multGroups';
import { generateNumberWords, parseNumberWordsParams } from './generators/numberWords';
import { generateOrderOps, parseOrderOpsParams } from './generators/orderOps';
import { generatePerimeter, parsePerimeterParams } from './generators/perimeter';
import { generatePlaceValue, parsePlaceValueParams } from './generators/placeValue';
import { generatePrice, parsePriceParams } from './generators/price';
import { generateClockElapsed, parseClockElapsedParams } from './generators/clockElapsed';
import { generateTimeUnits, parseTimeUnitsParams } from './generators/timeUnits';
import { generatePuzzleGrid, parsePuzzleGridParams } from './generators/puzzleGrid';
import { generateRoman, parseRomanParams } from './generators/roman';
import { generateRounding, parseRoundingParams } from './generators/rounding';
import { generateSequence, parseSequenceParams } from './generators/sequence';
import { generateTemperature, parseTemperatureParams } from './generators/temperature';
import { generateTimesMore, parseTimesMoreParams } from './generators/timesMore';
import { generateWord, parseWordParams } from './generators/word';
import { generateWritten, parseWrittenParams } from './generators/written';
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
    INEQUALITY: generateInequality,
    NUMBER_WORDS: generateNumberWords,
    ROMAN: generateRoman,
    CALENDAR: generateCalendar,
    WORD: generateWord,
    COMPARE_DIFF: generateCompareDiff,
    BONDS: generateBonds,
    CHAIN: generateChain,
    MISSING_OP: generateMissingOp,
    COMPARE_EXPR: generateCompareExpr,
    SEQUENCE: generateSequence,
    FACT_FAMILY: generateFactFamily,
    CHOOSE_OP: generateChooseOp,
    CLOCK: generateClock,
    LENGTH: generateLength,
    PLACE_VALUE: generatePlaceValue,
    PUZZLE_GRID: generatePuzzleGrid,
    GRID: generateGrid,
    PERIMETER: generatePerimeter,
    DATA: generateData,
    MONEY_COUNT: generateMoneyCount,
    MONEY_CHANGE: generateMoneyChange,
    MASS: generateMass,
    CAPACITY: generateCapacity,
    TEMPERATURE: generateTemperature,
    COUNT: generateCount,
    MULT_GROUPS: generateMultGroups,
    WRITTEN: generateWritten,
    ARROW_TABLE: generateArrowTable,
    ORDER_OPS: generateOrderOps,
    TIMES_MORE: generateTimesMore,
    PRICE: generatePrice,
    CLOCK_ELAPSED: generateClockElapsed,
    TIME_UNITS: generateTimeUnits,
    UNIT_CHOICE: generateUnitChoice,
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
    INEQUALITY: parseInequalityParams,
    NUMBER_WORDS: parseNumberWordsParams,
    ROMAN: parseRomanParams,
    CALENDAR: parseCalendarParams,
    WORD: parseWordParams,
    COMPARE_DIFF: parseCompareDiffParams,
    BONDS: parseBondsParams,
    CHAIN: parseChainParams,
    MISSING_OP: parseMissingOpParams,
    COMPARE_EXPR: parseCompareExprParams,
    SEQUENCE: parseSequenceParams,
    FACT_FAMILY: parseFactFamilyParams,
    CHOOSE_OP: parseChooseOpParams,
    CLOCK: parseClockParams,
    LENGTH: parseLengthParams,
    PLACE_VALUE: parsePlaceValueParams,
    PUZZLE_GRID: parsePuzzleGridParams,
    GRID: parseGridParams,
    PERIMETER: parsePerimeterParams,
    DATA: parseDataParams,
    MONEY_COUNT: parseMoneyCountParams,
    MONEY_CHANGE: parseMoneyChangeParams,
    MASS: parseMassParams,
    CAPACITY: parseCapacityParams,
    TEMPERATURE: parseTemperatureParams,
    COUNT: parseCountParams,
    MULT_GROUPS: parseMultGroupsParams,
    WRITTEN: parseWrittenParams,
    ARROW_TABLE: parseArrowTableParams,
    ORDER_OPS: parseOrderOpsParams,
    TIMES_MORE: parseTimesMoreParams,
    PRICE: parsePriceParams,
    CLOCK_ELAPSED: parseClockElapsedParams,
    TIME_UNITS: parseTimeUnitsParams,
    UNIT_CHOICE: parseUnitChoiceParams,
};

const has = (record: Readonly<Record<string, unknown>>, type: string): boolean => Object.prototype.hasOwnProperty.call(record, type);

export const getGenerator = (type: string): Generator | undefined => (has(generators, type) ? generators[type] : undefined);
export const getParser = (type: string): ParamsParser | undefined => (has(parsers, type) ? parsers[type] : undefined);
