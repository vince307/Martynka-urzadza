// Stage E5 (grade 3, first semester): steps from docs/ZADANIA.md, section 3.
// Skills carry the parameters of group-1 generators; the remaining types
// (written columns, thermometer, mass, capacity, length, price) arrive later.
import type { SkillDef, StageDef } from '../../core/types';

const skill = (id: string, step: number, type: string, params: SkillDef['params'], answer: SkillDef['answer'] = 'keypad'): SkillDef => ({
    id,
    stage: 'E5',
    step,
    type,
    params,
    answer,
});

export const E5: StageDef = {
    id: 'E5',
    steps: [
        {
            step: 1,
            title: 'Powtórka do 100; 53 + 7, 84 + 8, 53 − 7',
            childName: 'Powtórka do 100',
            types: ['ADD_SUB'],
            skills: [skill('E5.1.add_sub_100_units', 1, 'ADD_SUB', { max: 100, shapes: ['DU+U', 'DU-U'], bridge: 'any' })],
        },
        {
            step: 2,
            title: 'Rzymskie I–XII; 27 + 20; 23 + 42, 65 − 42; pisemne dodawanie i odejmowanie w słupku',
            childName: 'Dwucyfrowe i cyfry rzymskie',
            types: ['ROMAN', 'ADD_SUB', 'WRITTEN'],
            skills: [
                skill('E5.2.roman_12', 2, 'ROMAN', { max: 12 }, 'tiles'),
                skill('E5.2.add_sub_100_two_digit', 2, 'ADD_SUB', { max: 100, shapes: ['DU+DT', 'DU+DU', 'DU-DU'], bridge: 'none' }),
            ],
        },
        {
            step: 3,
            title: 'Liczby słowami do 100; kalendarz; upływ czasu, lekcja 45 min',
            childName: 'Liczby słowami i kalendarz',
            types: ['NUMBER_WORDS', 'CALENDAR', 'CLOCK_ELAPSED'],
            skills: [
                skill('E5.3.number_words_100', 3, 'NUMBER_WORDS', { max: 100 }, 'tiles'),
                skill('E5.3.calendar_months', 3, 'CALENDAR', { variants: ['nextMonth', 'prevMonth', 'quarter', 'romanMonth'] }, 'tiles'),
            ],
        },
        {
            step: 4,
            title: 'Termometr; mnożenie przez 0, 1, 5, 10; mnożenie i dzielenie do 50',
            childName: 'Mnożenie przez 0, 1, 5, 10',
            types: ['TEMPERATURE', 'MULT', 'DIV'],
            skills: [
                skill('E5.4.mult_0_1_5_10', 4, 'MULT', { maxProduct: 100, factors: [0, 1, 5, 10], allowZeroOne: true }),
                skill('E5.4.div_50', 4, 'DIV', { maxDividend: 50 }),
            ],
        },
        { step: 5, title: 'Litr, ½ l, ¼ l; kg, ½ kg, ¼ kg, dag', types: ['CAPACITY', 'MASS'], skills: [] },
        {
            step: 6,
            title: '47 + 28 i 63 − 48 różnymi sposobami',
            childName: 'Liczenie różnymi sposobami',
            types: ['ADD_SUB'],
            skills: [skill('E5.6.add_sub_100_bridge', 6, 'ADD_SUB', { max: 100, shapes: ['DU+DU', 'DU-DU'], bridge: 'ten' })],
        },
        {
            step: 7,
            title: 'Gram, brutto/netto/tara; mm, cm; „o ile starszy”; sensowna jednostka',
            childName: 'O ile więcej, o ile mniej',
            types: ['MASS', 'LENGTH', 'COMPARE_DIFF', 'UNIT_CHOICE'],
            skills: [skill('E5.7.compare_diff_100', 7, 'COMPARE_DIFF', { max: 100 })],
        },
        {
            step: 8,
            title: 'Doba, rozkład jazdy; mnożenie przez 6, 7, 8, 9',
            childName: 'Mnożenie przez 6, 7, 8, 9',
            types: ['CLOCK_ELAPSED', 'MULT'],
            skills: [skill('E5.8.mult_6_9', 8, 'MULT', { maxProduct: 100, factors: [6, 7, 8, 9] })],
        },
        {
            step: 9,
            title: 'Dzielenie do 100, dzielna/dzielnik/iloraz',
            childName: 'Dzielenie do 100',
            types: ['DIV', 'FACT_FAMILY'],
            skills: [
                skill('E5.9.div_100', 9, 'DIV', { maxDividend: 100 }),
                skill('E5.9.fact_check_div_100', 9, 'FACT_FAMILY', { max: 100, variants: ['checkDiv'] }),
            ],
        },
        {
            step: 10,
            title: 'Ilość · cena = wartość; „n razy więcej/mniej”; mnożenie kilku liczb',
            childName: 'Zadania tekstowe do 100',
            types: ['WORD', 'PRICE', 'TIMES_MORE'],
            skills: [skill('E5.10.word_100', 10, 'WORD', { max: 100, kinds: ['groups', 'share', 'each', 'sum', 'left'] })],
        },
        {
            step: 11,
            title: 'Kolejność działań; miesiące 30/31 dni, kwartały',
            childName: 'Miesiące i kwartały',
            types: ['ORDER_OPS', 'CALENDAR'],
            skills: [skill('E5.11.calendar_days', 11, 'CALENDAR', { variants: ['monthDays', 'quarter'] }, 'tiles')],
        },
        { step: 12, title: 'Odcinki w mm/cm/m, skala; obwody, także odwrotne (bok z obwodu)', types: ['LENGTH', 'PERIMETER'], skills: [] },
    ],
};
