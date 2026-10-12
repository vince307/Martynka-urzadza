// Task type (ZADANIA.md, section 4) → generator. Types without an entry are
// reported by scripts/sample.ts as "brak generatora" instead of failing.
import { generateAddSub } from './generators/addSub';
import { generateComplement } from './generators/complement';
import { generateMissing } from './generators/missing';
import { generateRounding } from './generators/rounding';
import type { Generator } from './types';

export const generators: Readonly<Record<string, Generator>> = {
    ADD_SUB: generateAddSub,
    MISSING: generateMissing,
    COMPLEMENT: generateComplement,
    ROUNDING: generateRounding,
};

export const getGenerator = (type: string): Generator | undefined =>
    Object.prototype.hasOwnProperty.call(generators, type) ? generators[type] : undefined;
