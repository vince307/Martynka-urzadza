// Fitting a text label in a row beside a fixed element (S-16a): the label is shrunk, never cut, so it never reaches the element.

export interface LabelRow {
    /** Left edge of the row's button and its width. */
    left: number;
    width: number;
    /** Space kept free at both ends of the row, the width reserved on the right for the element (star and cost) and the gap between label and element. */
    inset: number;
    reserved: number;
    gap: number;
}

/** Width the label may take: the button less both insets, the reserved element and the gap. */
export function labelRoom(row: LabelRow): number {
    return row.width - 2 * row.inset - row.reserved - row.gap;
}

/** Scale (at most 1) that makes a label of `labelWidth` fit in the room the row leaves; 1 when it already fits or the room is not positive. */
export function labelScale(labelWidth: number, row: LabelRow): number {
    const room = labelRoom(row);
    return labelWidth > room && labelWidth > 0 && room > 0 ? room / labelWidth : 1;
}
