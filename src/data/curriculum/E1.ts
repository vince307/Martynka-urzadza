// Stage E1 (grade 1, first semester): steps from docs/ZADANIA.md, section 3.
// Skills carry the parameters of group-1 generators (roadmap S-03); drawing
// and art types (shapes, counting, money, measures) arrive in M6. Numeric
// answers use the keypad; sign and choice answers use tiles.
import type { SkillDef, StageDef } from '../../core/types';

const skill = (id: string, step: number, type: string, params: SkillDef['params'], answer: SkillDef['answer'] = 'keypad'): SkillDef => ({
    id,
    stage: 'E1',
    step,
    type,
    params,
    answer,
});

const addSub = (id: string, step: number, params: SkillDef['params']): SkillDef => skill(id, step, 'ADD_SUB', params);

export const E1: StageDef = {
    id: 'E1',
    steps: [
        { step: 1, title: 'Figury, szlaczki, porównywanie liczebności, orientacja, symetria', types: ['SHAPES', 'PATTERN', 'COMPARE_QTY', 'SPATIAL', 'SYMMETRY'], skills: [] },
        {
            step: 2,
            title: 'Liczby 1–5: liczenie, „który z kolei”, znaki <, >, =',
            types: ['COUNT', 'ORDINAL', 'COMPARE_NUM'],
            skills: [skill('E1.2.compare_num_5', 2, 'COMPARE_NUM', { max: 5 }, 'tiles')],
        },
        {
            step: 3,
            title: '+ i − do 5 z obrazkami, brakujący składnik do 5',
            types: ['ADD_SUB', 'MISSING', 'BONDS', 'CHOOSE_OP'],
            skills: [
                addSub('E1.3.add_sub_5', 3, { max: 5, ops: ['+', '-'], bridge: 'any' }),
                skill('E1.3.missing_5', 3, 'MISSING', { max: 5, ops: ['+', '-'] }),
                skill('E1.3.bonds_5', 3, 'BONDS', { totals: [2, 3, 4, 5] }),
                skill('E1.3.choose_op_5', 3, 'CHOOSE_OP', { max: 5, kinds: ['sum', 'left'] }, 'tiles'),
            ],
        },
        {
            step: 4,
            title: 'Liczby 6–7, dni tygodnia, rozkłady 6 i 7',
            types: ['COUNT', 'BONDS', 'CALENDAR'],
            skills: [
                skill('E1.4.bonds_6_7', 4, 'BONDS', { totals: [6, 7] }),
                skill('E1.4.calendar_weekdays', 4, 'CALENDAR', { variants: ['nextWeekday', 'prevWeekday'] }, 'tiles'),
            ],
        },
        {
            step: 5,
            title: 'Liczby 8–9, trzy składniki, odejmowanie dwóch liczb po kolei',
            types: ['ADD_SUB', 'CHAIN', 'WORD'],
            skills: [
                addSub('E1.5.add_sub_9', 5, { max: 9, ops: ['+', '-'], bridge: 'any' }),
                skill('E1.5.chain_9', 5, 'CHAIN', { max: 9, ops: ['+', '-'], terms: 3 }),
                skill('E1.5.word_9', 5, 'WORD', { max: 9, kinds: ['sum', 'left', 'twoSteps'] }),
            ],
        },
        {
            step: 6,
            title: 'Zero, parzyste i nieparzyste',
            types: ['EVEN_ODD'],
            skills: [
                skill('E1.6.even_odd_single_10', 6, 'EVEN_ODD', { max: 10, min: 0, variant: 'single' }, 'tiles'),
                skill('E1.6.even_odd_select_10', 6, 'EVEN_ODD', { max: 10, variant: 'select' }, 'select'),
            ],
        },
        {
            step: 7,
            title: 'Liczba 10: rozkłady, dopełnianie do 10, porównywanie działań',
            types: ['BONDS', 'COMPLEMENT', 'COMPARE_EXPR'],
            skills: [
                skill('E1.7.bonds_10', 7, 'BONDS', { totals: [10] }),
                skill('E1.7.complement_10', 7, 'COMPLEMENT', { max: 10, targets: [10] }),
                skill('E1.7.compare_expr_10', 7, 'COMPARE_EXPR', { max: 10, ops: ['+', '-'] }, 'tiles'),
            ],
        },
        { step: 8, title: 'Centymetr, linijka do 10 cm', types: ['LENGTH'], skills: [] },
        {
            step: 9,
            title: 'Działania do 10 mieszane, brakujący znak + / −, nierówności',
            types: ['ADD_SUB', 'MISSING_OP', 'INEQUALITY'],
            skills: [
                addSub('E1.9.add_sub_10', 9, { max: 10, ops: ['+', '-'], bridge: 'any' }),
                skill('E1.9.missing_op_10', 9, 'MISSING_OP', { max: 10, ops: ['+', '-'] }, 'tiles'),
            ],
        },
        { step: 10, title: 'Liczby 11 i 12', types: ['COUNT', 'PLACE_VALUE'], skills: [] },
        {
            step: 11,
            title: 'Zegar — pełne godziny; miesiące; kilogram; pieniądze do 10 zł',
            types: ['CLOCK', 'CALENDAR', 'MASS', 'MONEY_COUNT', 'MONEY_PAY', 'MONEY_CHANGE'],
            skills: [skill('E1.11.calendar_months', 11, 'CALENDAR', { variants: ['nextMonth', 'prevMonth'] }, 'tiles')],
        },
    ],
};
