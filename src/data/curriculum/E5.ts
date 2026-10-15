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
            childName: 'Dwucyfrowe, rzymskie, słupek',
            types: ['ROMAN', 'ADD_SUB', 'WRITTEN'],
            skills: [
                skill('E5.2.roman_12', 2, 'ROMAN', { max: 12 }, 'tiles'),
                skill('E5.2.add_sub_100_two_digit', 2, 'ADD_SUB', { max: 100, shapes: ['DU+DT', 'DU+DU', 'DU-DU'], bridge: 'none' }),
                skill('E5.2.written_add_100', 2, 'WRITTEN', { op: '+', digits: 2, carry: 'any' }, 'digits'),
                skill('E5.2.written_sub_100', 2, 'WRITTEN', { op: '−', digits: 2, carry: 'any' }, 'digits'),
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
                skill('E5.3.clock_end_lesson', 3, 'CLOCK_ELAPSED', { variants: ['end'], maxSpan: 45, lesson: true }, 'tiles'),
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
                skill('E5.4.temperature_read_0_30', 4, 'TEMPERATURE', { variant: 'read', low: 0, high: 30, step: 2, answer: 'number' }),
            ],
        },
        {
            step: 5,
            title: 'Litr, ½ l, ¼ l; kg, ½ kg, ¼ kg, dag',
            childName: 'Litry i kilogramy',
            types: ['CAPACITY', 'MASS'],
            skills: [
                skill('E5.5.capacity_quarter_l', 5, 'CAPACITY', { jugs: ['container-1l', 'container-half-l', 'container-quarter-l'], variant: 'toLitres', maxLitres: 4 }),
                skill('E5.5.mass_half_kg_e5', 5, 'MASS', { variant: 'half', unit: 'dag', weights: ['weight-10dag', 'weight-20dag', 'weight-50dag'], max: 100 }),
                skill('E5.5.capacity_half_l_e5', 5, 'CAPACITY', { variant: 'text', glasses: ['half', 'quarter'], maxLitres: 5 }),
            ],
        },
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
            skills: [
                skill('E5.7.compare_diff_100', 7, 'COMPARE_DIFF', { max: 100 }),
                skill('E5.7.length_ruler_mm', 7, 'LENGTH', { variant: 'ruler', unit: 'mm', lengthCm: 10, minMm: 11, maxMm: 95, startShift: 0.3 }),
                skill('E5.7.unit_choice', 7, 'UNIT_CHOICE', { quantities: ['length', 'mass'] }, 'tiles'),
                skill('E5.7.mass_grams', 7, 'MASS', { variant: 'text', kinds: ['kgToG', 'fractionKg', 'net', 'gross', 'tare'], unit: 'g', max: 5000 }),
            ],
        },
        {
            step: 8,
            title: 'Doba, rozkład jazdy; mnożenie przez 6, 7, 8, 9',
            childName: 'Mnożenie przez 6, 7, 8, 9',
            types: ['CLOCK_ELAPSED', 'MULT'],
            skills: [
                skill('E5.8.mult_6_9', 8, 'MULT', { maxProduct: 100, factors: [6, 7, 8, 9] }),
                skill('E5.8.clock_span_timetable', 8, 'CLOCK_ELAPSED', { variants: ['span', 'nightHours'], maxSpan: 75, theme: 'ride' }),
            ],
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
            skills: [
                skill('E5.10.word_100', 10, 'WORD', { max: 100, kinds: ['groups', 'share', 'each', 'sum', 'left'] }),
                skill('E5.10.price_100', 10, 'PRICE', { variants: ['total', 'unit'], max: 100, maxQty: 10 }),
                skill('E5.10.times_more_100', 10, 'TIMES_MORE', { variants: ['more', 'less', 'factor'], max: 100, maxFactor: 10 }),
            ],
        },
        {
            step: 11,
            title: 'Kolejność działań; miesiące 30/31 dni, kwartały',
            childName: 'Kolejność działań i kwartały',
            types: ['ORDER_OPS', 'CALENDAR'],
            skills: [
                skill('E5.11.order_ops_100', 11, 'ORDER_OPS', { forms: ['a+b*c', 'a-b:c', 'a*b+c', 'a:b-c'], max: 100 }),
                skill('E5.11.calendar_days', 11, 'CALENDAR', { variants: ['monthDays', 'quarter'] }, 'tiles'),
            ],
        },
        {
            step: 12,
            title: 'Odcinki w mm/cm/m, skala; obwody, także odwrotne (bok z obwodu)',
            childName: 'Obwody i boki',
            types: ['LENGTH', 'PERIMETER'],
            skills: [
                skill('E5.12.perimeter_side_square', 12, 'PERIMETER', { variant: 'sideSquare', max: 40 }),
                skill('E5.12.perimeter_side_rect', 12, 'PERIMETER', { variant: 'sideRect', max: 60 }),
                skill('E5.12.length_scale', 12, 'LENGTH', { variant: 'scale', scales: [2, 5, 10], max: 100 }),
            ],
        },
    ],
};
