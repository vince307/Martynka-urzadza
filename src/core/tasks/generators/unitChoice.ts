// UNIT_CHOICE (ZADANIA.md, section 4, E5+): "Długopis ma 14 □." with the unit on tiles. The things and their number ranges
// are data (`UNIT_ITEMS`), picked so that exactly one tile unit makes sense for the number; the tiles are the answer plus
// two other units of the same quantity.
import { UNIT_ITEMS, UNIT_TILES, type UnitQuantity } from '../../../data/measures';
import { pl } from '../../../data/pl';
import type { Generator, Task } from '../types';

export interface UnitChoiceParams {
    quantities: UnitQuantity[];
}

const isQuantity = (x: unknown): x is UnitQuantity => typeof x === 'string' && Object.prototype.hasOwnProperty.call(UNIT_TILES, x);

export const parseUnitChoiceParams = (params: Record<string, unknown>): UnitChoiceParams => {
    const { quantities } = params;
    if (!Array.isArray(quantities) || quantities.length === 0 || !quantities.every(isQuantity) || new Set(quantities).size !== quantities.length) {
        throw new TypeError(`UNIT_CHOICE params.quantities must be a non-empty list of distinct ${Object.keys(UNIT_TILES).join(' ')}, got ${JSON.stringify(quantities)}`);
    }
    return { quantities };
};

export const generateUnitChoice: Generator = (skill, rng): Task => {
    const p = parseUnitChoiceParams(skill.params);
    const item = rng.pick(UNIT_ITEMS.filter((i) => p.quantities.includes(i.quantity)));
    const verb = item.quantity === 'length' ? 'ma' : 'waży';
    const n = item.min + rng.int(0, (item.max - item.min) / item.step) * item.step;
    const others = rng.shuffle(UNIT_TILES[item.quantity].filter((u) => u !== item.unit));
    const choices = rng.shuffle([item.unit, ...others.slice(0, 2)]);
    return {
        skillId: skill.id,
        prompt: pl.tasks.unitChoicePrompt(item.subject, verb, n),
        speak: pl.tasks.unitChoiceSpeak(item.subject, verb, n),
        answer: item.unit,
        choices,
        hint: [pl.tasks.unitChoiceFirst[item.quantity], pl.tasks.unitChoiceLike(item.subject, item.like), pl.tasks.unitChoiceAnswer(item.subject, verb, n, item.unit)],
    };
};
