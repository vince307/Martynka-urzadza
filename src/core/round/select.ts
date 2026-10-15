// State of the multi-select answer mode (S-13 phase 7): which tiles the child has marked.
export type SelectValue = number | string;

/**
 * Marks `value` when it is not marked, unmarks it when it is. The result follows the order of `choices` (the tiles
 * on screen), never the order of the taps, so the same set always reads the same.
 */
export const toggleSelected = (
    selected: readonly SelectValue[],
    value: SelectValue,
    choices: readonly SelectValue[],
): SelectValue[] => {
    const next = new Set(selected);
    if (next.has(value)) {
        next.delete(value);
    } else {
        next.add(value);
    }
    return choices.filter((choice) => next.has(choice));
};

/**
 * What "OK" hands to the task: the marked numbers ascending, then the marked texts (face codes) in the order of the tiles
 * they were given in. An empty set is an ordinary (usually wrong) answer.
 */
export const selectionAnswer = (selected: readonly SelectValue[]): SelectValue[] => [
    ...selected.filter((value): value is number => typeof value === 'number').sort((a, b) => a - b),
    ...selected.filter((value): value is string => typeof value === 'string'),
];
