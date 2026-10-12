// WORD: a word problem from data/wordTemplates.ts with numbers drawn so the
// story and the result stay inside the stage range (ZADANIA.md, section 4).
import { contexts, people, templates, type Person, type WordKind, type WordTemplate } from '../../../data/wordTemplates';
import type { Rng } from '../../rng';
import type { Generator, Task } from '../types';

export interface WordParams {
    max: number;                  // bound for every number in the story and the answer
    kinds: readonly WordKind[];
    maxFactor: number;            // for groups / share / each (default 10)
}

const KINDS: readonly WordKind[] = ['sum', 'left', 'start', 'twoSteps', 'moreBy', 'age', 'groups', 'share', 'each'];
const MAX_ATTEMPTS = 1000;

export const parseWordParams = (params: Record<string, unknown>): WordParams => {
    const { max, kinds, maxFactor = 10 } = params;
    if (!Number.isInteger(max) || (max as number) < 5) {
        throw new TypeError(`WORD params.max must be an integer >= 5, got ${String(max)}`);
    }
    if (!Array.isArray(kinds) || kinds.length === 0 || !kinds.every((k) => KINDS.includes(k))) {
        throw new TypeError(`WORD params.kinds must be a non-empty list of ${KINDS.join(', ')}, got ${JSON.stringify(kinds)}`);
    }
    if (!Number.isInteger(maxFactor) || (maxFactor as number) < 2) {
        throw new TypeError(`WORD params.maxFactor must be an integer >= 2, got ${String(maxFactor)}`);
    }
    for (const kind of kinds as WordKind[]) {
        if (!templates.some((t) => t.kind === kind)) {
            throw new TypeError(`WORD has no template of kind ${kind}`);
        }
    }
    return { max: max as number, kinds, maxFactor: maxFactor as number };
};

/** Numbers that make the story true and the answer sensible for the kind. */
const drawNumbers = (kind: WordKind, p: WordParams, rng: Rng): [number, number, number] | undefined => {
    switch (kind) {
        case 'sum':
        case 'moreBy':
        case 'start': {
            const a = rng.int(1, p.max - 1);
            return [a, rng.int(1, p.max - a), 0];
        }
        case 'left': {
            const a = rng.int(2, p.max);
            return [a, rng.int(1, a - 1), 0];
        }
        case 'twoSteps': {
            const a = rng.int(3, p.max);
            const b = rng.int(1, a - 2);
            return [a, b, rng.int(1, a - b - 1)];
        }
        case 'age': {
            // Children's ages: now 5–10, target up to 18.
            const a = rng.int(5, 10);
            return [a, rng.int(a + 1, Math.min(18, p.max)), 0];
        }
        case 'groups': {
            const a = rng.int(2, p.maxFactor);
            const b = rng.int(2, p.maxFactor);
            return a * b <= p.max ? [a, b, 0] : undefined;
        }
        default: {
            // share / each: a = b · q with q ≥ 2.
            const b = rng.int(2, p.maxFactor);
            const q = rng.int(2, p.maxFactor);
            return b * q <= p.max ? [b * q, b, 0] : undefined;
        }
    }
};

export const pickTwoPeople = (rng: Rng): [Person, Person] => {
    const first = rng.pick(people);
    const second = rng.pick(people.filter((x) => x !== first));
    return [first, second];
};

export const generateWord: Generator = (skill, rng): Task => {
    const p = parseWordParams(skill.params);
    const kind = rng.pick(p.kinds);
    const template: WordTemplate = rng.pick(templates.filter((t) => t.kind === kind));
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
        const drawn = drawNumbers(kind, p, rng);
        if (!drawn) {
            continue;
        }
        const [a, b, c] = drawn;
        const [person, other] = pickTwoPeople(rng);
        // Boxes and plates only hold small things.
        const pool = kind === 'groups' || kind === 'share' || kind === 'each' ? contexts.filter((x) => x.portable) : contexts;
        const result = template.build({ a, b, c, person, other, ctx: rng.pick(pool) });
        if (result.answer >= 0 && result.answer <= p.max) {
            return { skillId: skill.id, prompt: result.prompt, answer: result.answer, hint: result.hint };
        }
    }
    throw new Error(`WORD: no numbers for ${kind} with ${JSON.stringify(p)} after ${MAX_ATTEMPTS} draws`);
};
