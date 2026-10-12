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
            types: ['PLACE_VALUE', 'COMPARE_NUM', 'MONEY_COUNT', 'MONEY_CHANGE', 'MASS'],
            skills: [],
        },
        {
            step: 2,
            title: '36 + 2, 47 − 5, 47 + 3, 50 − 3',
            types: ['ADD_SUB'],
            skills: [skill('E4.2.add_sub_100_units', 2, 'ADD_SUB', { max: 100, shapes: ['DU+U', 'DU-U', 'DT-U'], bridge: 'none' })],
        },
        { step: 3, title: 'Zegar z minutami, pół godziny, kwadrans', types: ['CLOCK'], skills: [] },
        {
            step: 4,
            title: 'Dopełnianie do pełnej dziesiątki, 80 − 7, 38 + 7, 45 − 7, najbliższa dziesiątka',
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
            types: ['ADD_SUB'],
            skills: [skill('E4.5.add_sub_100_tens', 5, 'ADD_SUB', { max: 100, shapes: ['DU+DT', 'DU-DT', 'DU+DU', 'DU-DU'], bridge: 'none' })],
        },
        {
            step: 6,
            title: 'Mnożenie i dzielenie do 50, nazwy (czynnik, iloczyn, dzielna…), ·5, ·10 do 100',
            types: ['MULT', 'DIV', 'MISSING'],
            skills: [skill('E4.6.missing_mult_div_50', 6, 'MISSING', { max: 50, ops: ['*', '/'] })],
        },
        {
            step: 7,
            title: 'Litry, pół litra; m i cm; mm; obwód kwadratu, prostokąta, trójkąta',
            types: ['CAPACITY', 'LENGTH', 'PERIMETER'],
            skills: [],
        },
        {
            step: 8,
            title: 'Setki do 1000, liczby trzycyfrowe, 530 + 400, 224 + 60, 553 − 50',
            types: ['PLACE_VALUE', 'ADD_SUB'],
            skills: [skill('E4.8.add_sub_1000_hundreds', 8, 'ADD_SUB', { max: 1000, shapes: ['HT+H', 'HTU+DT', 'HTU-DT'], bridge: 'none' })],
        },
    ],
};
