// Shared arithmetic for the "+" / "−" generators (ADD_SUB, CHAIN, MISSING_OP).
import { MINUS } from './symbols';

export type Op = '+' | '-';

/**
 * Share of "a − a" among drawn subtractions (ADD_SUB, MISSING_OP). E1 teaches
 * the zero result, but a uniform pair draw on a tiny range would make it the
 * most common task.
 */
export const SAME_SHARE = 0.05;

export const applyOp = (a: number, b: number, op: Op): number => (op === '+' ? a + b : a - b);
export const opSign = (op: Op): string => (op === '+' ? '+' : MINUS);
/** "a op b = c", e.g. "13 − 6 = 7". */
export const arithLine = (a: number, b: number, op: Op): string => `${a} ${opSign(op)} ${b} = ${applyOp(a, b, op)}`;
