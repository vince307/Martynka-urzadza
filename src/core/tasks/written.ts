// The method of a written column (S-14b): where a carry is written and which digits a borrow strikes. Pure, from the operands.
import type { TaskVisual } from './visual';

export type ColumnVisual = Extract<TaskVisual, { kind: 'column' }>;

/** `col` counts from the ones (0). */
export interface ColumnMarks {
    /** Columns that receive a small "1" written above them. */
    carries: { col: number }[];
    /** A column that borrows: its digit becomes `becomes` (10 + the digit); each lender column is struck (`struck`) and rewritten (`now`). */
    borrows: { col: number; becomes: number; lenders: { col: number; struck: number; now: number }[] }[];
}

export interface ColumnStep {
    col: number;
    /** Digit of the first operand at the start, and as it stands when this column is worked (after lending). */
    top: number;
    current: number;
    bottom: number;
    /** Addition: the carry coming in. */
    carryIn: boolean;
    /** Addition: the column total reaches 10. Subtraction: this column borrows. */
    over: boolean;
    /** Digit written in the result. */
    written: number;
    marks: { carry: boolean; borrow: ColumnMarks['borrows'][number] | null };
}

const digitsOf = (n: number, count: number): number[] => Array.from({ length: count }, (_, i) => Math.floor(n / 10 ** i) % 10);

/** The column-by-column working, from the ones; the one place that knows the method. */
export const columnSteps = (v: ColumnVisual): ColumnStep[] => {
    const a = digitsOf(v.a, v.columns);
    const b = digitsOf(v.b, v.columns);
    const m = [...a];
    const steps: ColumnStep[] = [];
    let carry = false as boolean;
    for (let col = 0; col < v.columns; col += 1) {
        if (v.op === '+') {
            const total: number = a[col] + b[col] + (carry ? 1 : 0);
            steps.push({ col, top: a[col], current: a[col], bottom: b[col], carryIn: carry, over: total >= 10, written: total % 10, marks: { carry: total >= 10, borrow: null } });
            carry = total >= 10;
        } else if (m[col] < b[col]) {
            const lenders: { col: number; struck: number; now: number }[] = [];
            let j = col + 1;
            while (j < v.columns && m[j] === 0) {
                lenders.push({ col: j, struck: 0, now: 9 });
                m[j] = 9;
                j += 1;
            }
            if (j >= v.columns) {
                throw new RangeError(`columnSteps: ${v.a} ${v.op} ${v.b} borrows past the top column (a < b)`);
            }
            lenders.push({ col: j, struck: m[j], now: m[j] - 1 });
            const current = m[col];
            m[j] -= 1;
            m[col] += 10;
            steps.push({ col, top: a[col], current, bottom: b[col], carryIn: false, over: true, written: m[col] - b[col], marks: { carry: false, borrow: { col, becomes: m[col], lenders } } });
        } else {
            steps.push({ col, top: a[col], current: m[col], bottom: b[col], carryIn: false, over: false, written: m[col] - b[col], marks: { carry: false, borrow: null } });
        }
    }
    return steps;
};

/** The signs of the method to draw: none on the first try, the first carry or borrow in the hint, all of them in the solution. */
export const columnMarks = (visual: ColumnVisual, show: 'none' | 'first' | 'all'): ColumnMarks => {
    const marks: ColumnMarks = { carries: [], borrows: [] };
    if (show === 'none') {
        return marks;
    }
    for (const step of columnSteps(visual)) {
        if (step.marks.carry) marks.carries.push({ col: step.col + 1 });
        if (step.marks.borrow) marks.borrows.push(step.marks.borrow);
    }
    if (show === 'first') {
        const firstCol = Math.min(...marks.carries.map((c) => c.col - 1), ...marks.borrows.map((x) => x.col));
        marks.carries = marks.carries.filter((c) => c.col - 1 === firstCol);
        marks.borrows = marks.borrows.filter((x) => x.col === firstCol);
    }
    return marks;
};
