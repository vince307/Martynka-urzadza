// Stage E2 (grade 1, second semester): steps from docs/ZADANIA.md, section 3.
// Skills carry the parameters of group-1 generators (roadmap S-03); drawing
// and art types (shapes, counting, money, measures) arrive in M6. Numeric
// answers use the keypad; sign and choice answers use tiles.
import type { SkillDef, StageDef } from '../../core/types';

const skill = (id: string, step: number, type: string, params: SkillDef['params'], answer: SkillDef['answer'] = 'keypad'): SkillDef => ({
    id,
    stage: 'E2',
    step,
    type,
    params,
    answer,
});

const addSub = (id: string, step: number, params: SkillDef['params']): SkillDef => skill(id, step, 'ADD_SUB', params);

export const E2: StageDef = {
    id: 'E2',
    steps: [
        {
            step: 1,
            title: 'Liczby 13–20, budowa 10 + n, + i − bez przekroczenia',
            childName: 'Działania do 20',
            types: ['PLACE_VALUE', 'ADD_SUB'],
            skills: [addSub('E2.1.add_sub_20_units', 1, { max: 20, shapes: ['DU+U', 'DU-U'], bridge: 'none' })],
        },
        { step: 2, title: 'Pieniądze do 20 zł, litr', types: ['MONEY_COUNT', 'MONEY_PAY', 'MONEY_CHANGE', 'CAPACITY'], skills: [] },
        {
            step: 3,
            title: 'Dodawanie z przekroczeniem: 9 + n → 8 + n → 7 + n → 6 + n',
            childName: 'Dodawanie z przekroczeniem',
            types: ['ADD_SUB'],
            skills: [addSub('E2.3.add_bridge_20', 3, { max: 20, ops: ['+'], bridge: 'ten' })],
        },
        {
            step: 4,
            title: 'Przemienność dodawania',
            childName: 'Przemienność dodawania',
            types: ['FACT_FAMILY'],
            skills: [skill('E2.4.fact_swap_20', 4, 'FACT_FAMILY', { max: 20, variants: ['swap'] })],
        },
        {
            step: 5,
            title: 'Odejmowanie z przekroczeniem: od 11–12 → 13–14 → 15–17 → 18',
            childName: 'Odejmowanie z przekroczeniem',
            types: ['ADD_SUB'],
            skills: [addSub('E2.5.sub_bridge_20', 5, { max: 20, ops: ['-'], bridge: 'ten' })],
        },
        {
            step: 6,
            title: 'Sprawdzanie odejmowania dodawaniem, grafy +n / −n',
            childName: 'Sprawdzanie odejmowania',
            types: ['FACT_FAMILY', 'ARROW_TABLE'],
            skills: [skill('E2.6.fact_check_sub_20', 6, 'FACT_FAMILY', { max: 20, variants: ['checkSub'] })],
        },
        {
            step: 7,
            title: 'Dziesiątki do 100: liczenie, porównywanie, + i − dziesiątek',
            childName: 'Dziesiątki do 100',
            types: ['SEQUENCE', 'COMPARE_NUM', 'ADD_SUB'],
            skills: [
                skill('E2.7.sequence_tens_100', 7, 'SEQUENCE', { max: 100, steps: [10], start: 'multiple' }),
                skill('E2.7.compare_num_100', 7, 'COMPARE_NUM', { max: 100 }, 'tiles'),
                addSub('E2.7.add_sub_tens_100', 7, { max: 100, shapes: ['DT+DT', 'DT-DT'], bridge: 'none' }),
            ],
        },
        { step: 8, title: 'Grosze, dekagram, metr', types: ['MONEY_COUNT', 'MASS', 'LENGTH'], skills: [] },
        {
            step: 9,
            title: 'Liczby dwucyfrowe: D i J, 30 + 4, 76 − 6, porównywanie',
            childName: 'Działania na liczbach do 99',
            types: ['PLACE_VALUE', 'ADD_SUB'],
            skills: [addSub('E2.9.add_sub_99', 9, { max: 99, shapes: ['DT+U', 'DU-U'], bridge: 'none' })],
        },
        {
            step: 10,
            title: 'Diagram słupkowy, kalendarz miesiąca, zegar ± 1 godzina',
            childName: 'Dni tygodnia i miesiące',
            types: ['DATA', 'CALENDAR', 'CLOCK'],
            skills: [skill('E2.10.calendar_20', 10, 'CALENDAR', { variants: ['nextMonth', 'prevMonth', 'nextWeekday', 'prevWeekday'] }, 'tiles')],
        },
    ],
};
