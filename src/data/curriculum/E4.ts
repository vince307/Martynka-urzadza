// Stage E4 (grade 2, second semester): steps from docs/ZADANIA.md, section 3.
// Skills carry the parameters of group-1 generators; the remaining types
// (clock, money, mass, length, perimeter, place value) arrive in M6.
import type { SkillDef, StageDef } from '../../core/types';

const skill = (id: string, step: number, type: string, params: SkillDef['params'], answer: SkillDef['answer'] = 'keypad'): SkillDef => ({
    id,
    stage: 'E4',
    step,
    type,
    params,
    answer,
});

export const E4: StageDef = {
    id: 'E4',
    steps: [
        {
            step: 1,
            title: 'Dziesiątki do 100, D i J, porównywanie do 100; złote i grosze; pół kilograma',
            childName: 'Porównywanie liczb do 100',
            types: ['PLACE_VALUE', 'COMPARE_NUM', 'MONEY_COUNT', 'MONEY_CHANGE', 'MASS'],
            skills: [
                skill('E4.1.compare_num_100', 1, 'COMPARE_NUM', { max: 100 }, 'tiles'),
                skill('E4.1.place_read_100', 1, 'PLACE_VALUE', { variant: 'read', min: 20, max: 99 }),
                skill('E4.1.place_decompose_100', 1, 'PLACE_VALUE', { variant: 'decompose', min: 21, max: 99 }),
            ],
        },
        {
            step: 2,
            title: '36 + 2, 47 − 5, 47 + 3, 50 − 3',
            childName: 'Działania do 100',
            types: ['ADD_SUB'],
            skills: [skill('E4.2.add_sub_100_units', 2, 'ADD_SUB', { max: 100, shapes: ['DU+U', 'DU-U', 'DT-U'], bridge: 'none' })],
        },
        {
            step: 3,
            title: 'Zegar z minutami, pół godziny, kwadrans',
            childName: 'Zegar: minuty i kwadrans',
            types: ['CLOCK'],
            skills: [
                skill('E4.3.clock_read_half', 3, 'CLOCK', { variant: 'read', minuteStep: 30 }, 'tiles'),
                skill('E4.3.clock_read_quarter', 3, 'CLOCK', { variant: 'read', minuteStep: 15 }, 'tiles'),
                skill('E4.3.clock_read_5', 3, 'CLOCK', { variant: 'read', minuteStep: 5 }, 'tiles'),
            ],
        },
        {
            step: 4,
            title: 'Dopełnianie do pełnej dziesiątki, 80 − 7, 38 + 7, 45 − 7, najbliższa dziesiątka',
            childName: 'Dopełnianie do dziesiątki',
            types: ['COMPLEMENT', 'ADD_SUB', 'ROUNDING'],
            skills: [
                skill('E4.4.complement_next_ten', 4, 'COMPLEMENT', { max: 100 }),
                skill('E4.4.sub_from_full_ten', 4, 'ADD_SUB', { max: 100, shapes: ['DT-U'], bridge: 'any' }),
                skill('E4.4.add_sub_100_bridge', 4, 'ADD_SUB', { max: 100, shapes: ['DU+U', 'DU-U'], bridge: 'ten' }),
                skill('E4.4.rounding_ten', 4, 'ROUNDING', { max: 100, to: 10 }),
            ],
        },
        {
            step: 5,
            title: 'Pełne dziesiątki (52 + 20, 72 − 50), dwie dwucyfrowe bez przekroczenia (35 + 34, 37 − 12), km',
            childName: 'Działania dwucyfrowe',
            types: ['ADD_SUB'],
            skills: [skill('E4.5.add_sub_100_tens', 5, 'ADD_SUB', { max: 100, shapes: ['DU+DT', 'DU-DT', 'DU+DU', 'DU-DU'], bridge: 'none' })],
        },
        {
            step: 6,
            title: 'Mnożenie i dzielenie do 50, nazwy (czynnik, iloczyn, dzielna…), ·5, ·10 do 100',
            childName: 'Mnożenie i dzielenie do 50',
            types: ['MULT', 'DIV', 'MISSING'],
            skills: [
                skill('E4.6.mult_50', 6, 'MULT', { maxProduct: 50, maxFactor: 10 }),
                skill('E4.6.mult_5_10', 6, 'MULT', { maxProduct: 100, maxFactor: 10, factors: [5, 10] }),
                skill('E4.6.div_50', 6, 'DIV', { maxDividend: 50, maxQuotient: 10 }),
                skill('E4.6.div_5_10', 6, 'DIV', { maxDividend: 100, maxQuotient: 10, divisors: [5, 10] }),
                skill('E4.6.missing_mult_div_50', 6, 'MISSING', { max: 50, ops: ['*', '/'] }),
            ],
        },
        {
            step: 7,
            title: 'Litry, pół litra; m i cm; mm; obwód kwadratu, prostokąta, trójkąta',
            childName: 'Metry, centymetry, milimetry',
            types: ['CAPACITY', 'LENGTH', 'PERIMETER'],
            skills: [
                skill('E4.7.length_ruler_mm_10', 7, 'LENGTH', { variant: 'ruler', unit: 'mm', lengthCm: 10, minMm: 11, maxMm: 95, startShift: 0.3 }),
                skill('E4.7.length_convert_m', 7, 'LENGTH', { variant: 'convert', maxM: 5, cmStep: 10 }),
            ],
        },
        {
            step: 8,
            title: 'Setki do 1000, liczby trzycyfrowe, 530 + 400, 224 + 60, 553 − 50',
            childName: 'Liczby trzycyfrowe',
            types: ['PLACE_VALUE', 'ADD_SUB'],
            skills: [
                skill('E4.8.add_sub_1000_hundreds', 8, 'ADD_SUB', { max: 1000, shapes: ['HT+H', 'HTU+DT', 'HTU-DT'], bridge: 'none' }),
                skill('E4.8.place_read_1000', 8, 'PLACE_VALUE', { variant: 'read', min: 100, max: 999 }),
            ],
        },
    ],
};
