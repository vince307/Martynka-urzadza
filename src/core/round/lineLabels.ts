// Rows of the numbers under a number line (S-14b visual gate: "10" and "11" on neighbouring ticks of a dense line ran into "1011").

/**
 * Row per label, in the order given: 0 = the label row, 1 = a row lower. On a dense line a label on the tick right after
 * the previous label (in value order) drops to the lower row, unless that one already dropped; a sparse line keeps one row.
 */
export const labelRows = (labels: readonly number[], tick: number, dense: boolean): number[] => {
    const rowOf = new Map<number, number>();
    let last: { value: number; row: number } | null = null;
    for (const value of [...labels].sort((a, b) => a - b)) {
        const row: number = dense && last !== null && last.row === 0 && value - last.value === tick ? 1 : 0;
        rowOf.set(value, row);
        last = { value, row };
    }
    return labels.map((value) => rowOf.get(value) ?? 0);
};
