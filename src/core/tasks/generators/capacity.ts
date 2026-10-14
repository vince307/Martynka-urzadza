// CAPACITY (ZADANIA.md, section 4): a row of jugs (a `jugs` drawing) and "how many litres?", or one jug and "how many of these
// fill N litres?". A row may mix the kinds the step allows, so the total is always whole litres: 1 l jugs stand alone, half-litre
// jugs come in pairs and quarter-litre jugs in fours. The answer is a whole number (the keypad has no comma); fractions only
// appear in words ("pół litra", "ćwierć litra").
import { JUGS, type JugId } from '../../../data/measures';
import { nouns } from '../../../data/nouns';
import { pl } from '../../../data/pl';
import { countNoun } from '../../text/plural';
import { TIMES } from '../symbols';
import type { Generator, Task } from '../types';

export interface CapacityParams {
    jugs: JugId[];
    variant: 'toLitres' | 'howMany';
    maxLitres: number;
}

const VARIANTS: readonly CapacityParams['variant'][] = ['toLitres', 'howMany'];
const MAX_JUGS = 10;
const ml = (id: JugId): number => JUGS.find((j) => j.id === id)?.ml ?? 0;

interface Row {
    one: number;
    half: number;
    quarter: number;
}

const litresOf = (r: Row): number => r.one + r.half / 2 + r.quarter / 4;

/** Every row of at most 10 jugs of the allowed kinds with whole litres, between 1 and `maxLitres`. */
const rowsOf = (jugs: readonly JugId[], maxLitres: number): Row[] => {
    const has = (id: JugId): boolean => jugs.includes(id);
    const out: Row[] = [];
    for (let one = 0; one <= (has('container-1l') ? MAX_JUGS : 0); one += 1) {
        for (let half = 0; half <= (has('container-half-l') ? MAX_JUGS : 0); half += 2) {
            for (let quarter = 0; quarter <= (has('container-quarter-l') ? MAX_JUGS : 0); quarter += 4) {
                const row = { one, half, quarter };
                const litres = litresOf(row);
                if (one + half + quarter <= MAX_JUGS && litres >= 1 && litres <= maxLitres) out.push(row);
            }
        }
    }
    return out;
};

export const parseCapacityParams = (params: Record<string, unknown>): CapacityParams => {
    const fail = (why: string): never => {
        throw new TypeError(`CAPACITY ${why}`);
    };
    const { jugs, variant, maxLitres } = params;
    if (!Array.isArray(jugs) || jugs.length === 0) return fail('needs a non-empty params.jugs');
    if (new Set(jugs).size !== jugs.length) fail('params.jugs has a duplicate');
    for (const id of jugs) if (!JUGS.some((j) => j.id === id)) fail(`has an unknown jug ${String(id)}`);
    if (!VARIANTS.includes(variant as CapacityParams['variant'])) fail(`params.variant must be one of ${VARIANTS.join(', ')}, got ${String(variant)}`);
    if (!Number.isInteger(maxLitres) || (maxLitres as number) < 1) fail(`needs an integer params.maxLitres >= 1, got ${String(maxLitres)}`);
    const typed = jugs as JugId[];
    const max = maxLitres as number;
    if (variant === 'howMany') {
        if (typed.length !== 1) fail('howMany needs exactly one kind of jug');
        if (typed[0] === 'container-1l') fail('howMany needs a half or quarter litre jug');
    } else if (!rowsOf(typed, max).some((r) => litresOf(r) === max)) {
        fail(`cannot reach ${max} litres with at most ${MAX_JUGS} of these jugs`);
    }
    return { jugs: typed, variant: variant as CapacityParams['variant'], maxLitres: max };
};

const rowOf = (r: Row): JugId[] => [
    ...Array<JugId>(r.one).fill('container-1l'),
    ...Array<JugId>(r.half).fill('container-half-l'),
    ...Array<JugId>(r.quarter).fill('container-quarter-l'),
];

export const generateCapacity: Generator = (skill, rng): Task => {
    const p = parseCapacityParams(skill.params);
    if (p.variant === 'howMany') {
        const id = p.jugs[0];
        const per = 1000 / ml(id);
        const litres = rng.int(1, p.maxLitres);
        const jugs = litres * per;
        const jug = id === 'container-half-l' ? 'half' : 'quarter';
        const text = countNoun(litres, nouns.litr);
        return {
            skillId: skill.id,
            prompt: pl.tasks.capacityHowMany(jug, text),
            speak: pl.tasks.capacityHowManySpeak(jug, text),
            visual: { kind: 'jugs', jugs: [id] },
            answer: jugs,
            tileRange: { min: per, max: p.maxLitres * per },
            hint: [
                jug === 'half' ? pl.tasks.capacityLitreFitsHalf : pl.tasks.capacityLitreFitsQuarter,
                `${litres} ${TIMES} ${per} = ${jugs}`,
                pl.tasks.capacityHowManyAnswerHint(countNoun(jugs, nouns.dzbanek)),
            ],
        };
    }
    const row = rng.pick(rowsOf(p.jugs, p.maxLitres));
    const litres = litresOf(row);
    const parts = [row.one, row.half / 2, row.quarter / 4].filter((x) => x > 0);
    const fact =
        row.half > 0 && row.quarter > 0
            ? `${pl.tasks.capacityHalfFact} ${pl.tasks.capacityQuarterAlso}`
            : row.half > 0
              ? pl.tasks.capacityHalfFact
              : row.quarter > 0
                ? pl.tasks.capacityQuarterFact
                : pl.tasks.capacityOneLitreFact;
    return {
        skillId: skill.id,
        prompt: pl.tasks.capacityLitresPrompt,
        speak: pl.tasks.capacityLitresSpeak,
        visual: { kind: 'jugs', jugs: rowOf(row) },
        answer: litres,
        tileRange: { min: 1, max: p.maxLitres },
        hint: [fact, ...(parts.length > 1 ? [`${parts.join(' + ')} = ${litres}`] : []), pl.tasks.capacityLitresAnswerHint(countNoun(litres, nouns.litr))],
    };
};
