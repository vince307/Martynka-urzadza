// Stage E3 (grade 2, first semester): steps from docs/ZADANIA.md, section 3.
// Skills carry the parameters of group-1 generators (roadmap S-02); drawing
// and art types (mass, grid, temperature) arrive in M6; clock, ruler, blocks and charts are drawn (S-13).
import type { SkillDef, StageDef } from '../../core/types';

const skill = (id: string, step: number, type: string, params: SkillDef['params'], answer: SkillDef['answer'] = 'keypad'): SkillDef => ({
    id,
    stage: 'E3',
    step,
    type,
    params,
    answer,
});

const addSub = (id: string, step: number, params: SkillDef['params']): SkillDef => skill(id, step, 'ADD_SUB', params);

export const E3: StageDef = {
    id: 'E3',
    steps: [
        {
            step: 1,
            title: 'Powtórka do 20, budowa zadania tekstowego, „o ile więcej / mniej”',
            childName: 'Zadania tekstowe do 20',
            types: ['WORD', 'COMPARE_DIFF'],
            skills: [
                skill('E3.1.word_20', 1, 'WORD', { max: 20, kinds: ['sum', 'left', 'start', 'twoSteps', 'moreBy'] }),
                skill('E3.1.compare_diff_20', 1, 'COMPARE_DIFF', { max: 20 }),
            ],
        },
        {
            step: 2,
            title: '+ i − do 20 z przekroczeniem, działania z okienkiem',
            childName: 'Działania do 20 z okienkiem',
            types: ['ADD_SUB', 'MISSING'],
            skills: [
                addSub('E3.2.add_sub_20_bridge', 2, { max: 20, ops: ['+', '-'], bridge: 'ten' }),
                skill('E3.2.missing_20', 2, 'MISSING', { max: 20, ops: ['+', '-'], bridge: 'ten' }),
            ],
        },
        {
            step: 3,
            title: 'Zegar: pełne godziny, obliczenia zegarowe',
            childName: 'Zegar: pełne godziny',
            types: ['CLOCK'],
            skills: [
                skill('E3.3.clock_read_full', 3, 'CLOCK', { variant: 'read', minuteStep: 60 }, 'tiles'),
                skill('E3.3.clock_later_full', 3, 'CLOCK', { variant: 'later', minuteStep: 60, maxShift: 3 }, 'tiles'),
            ],
        },
        {
            step: 4,
            title: 'Waga: kg, dag; diagramy',
            childName: 'Diagramy',
            types: ['MASS', 'DATA'],
            skills: [
                skill('E3.4.data_most_10', 4, 'DATA', { variant: 'most', maxValue: 10, bars: 4 }, 'tiles'),
                skill('E3.4.data_least_10', 4, 'DATA', { variant: 'least', maxValue: 10, bars: 4 }, 'tiles'),
                skill('E3.4.data_howmany_10', 4, 'DATA', { variant: 'howMany', maxValue: 10, bars: 3 }),
                skill('E3.4.data_diff_10', 4, 'DATA', { variant: 'diff', maxValue: 10, bars: 3 }),
                skill('E3.4.mass_kg_10', 4, 'MASS', { variant: 'read', unit: 'kg', weights: ['weight-1kg', 'weight-2kg', 'weight-5kg'], max: 10 }),
                skill('E3.4.mass_dag_100', 4, 'MASS', { variant: 'read', unit: 'dag', weights: ['weight-10dag', 'weight-20dag', 'weight-50dag'], max: 100 }),
            ],
        },
        {
            step: 5,
            title: 'Kwadrat magiczny, odcinki w cm',
            childName: 'Mierzenie odcinków',
            types: ['PUZZLE_GRID', 'LENGTH'],
            skills: [skill('E3.5.length_ruler_cm_15', 5, 'LENGTH', { variant: 'ruler', unit: 'cm', lengthCm: 15, minMm: 20, maxMm: 120, startShift: 0.4 })],
        },
        {
            step: 6,
            title: 'Liczby 21–30, + i − do 30 bez przekroczenia',
            childName: 'Działania do 30',
            types: ['PLACE_VALUE', 'ADD_SUB'],
            skills: [
                addSub('E3.6.add_sub_30_nobridge', 6, { max: 30, shapes: ['DU+U', 'DU-U', 'DU+DU', 'DU-DU'], bridge: 'none' }),
                skill('E3.6.place_read_30', 6, 'PLACE_VALUE', { variant: 'read', min: 11, max: 30 }),
                skill('E3.6.place_tens_30', 6, 'PLACE_VALUE', { variant: 'tens', min: 11, max: 30 }),
                skill('E3.6.place_build_30', 6, 'PLACE_VALUE', { variant: 'build', min: 11, max: 30 }, 'drag'),
            ],
        },
        {
            step: 7,
            title: 'Siatka kwadratowa i kodowanie, parzyste/nieparzyste, liczby słowami',
            childName: 'Parzyste i liczby słowami',
            types: ['GRID', 'EVEN_ODD', 'NUMBER_WORDS'],
            skills: [
                skill('E3.7.even_odd_30', 7, 'EVEN_ODD', { max: 30, variant: 'single' }, 'tiles'),
                skill('E3.7.select_even_30', 7, 'EVEN_ODD', { max: 30, variant: 'select' }, 'select'),
                skill('E3.7.number_words_30', 7, 'NUMBER_WORDS', { max: 30, kind: 'any' }, 'tiles'),
            ],
        },
        {
            step: 8,
            title: '+ i − do 30 z przekroczeniem, dwie dwucyfrowe',
            childName: 'Przekraczanie dziesiątki',
            types: ['ADD_SUB'],
            skills: [addSub('E3.8.add_sub_30_bridge', 8, { max: 30, shapes: ['DU+U', 'DU-U', 'DU+DU', 'DU-DU'], bridge: 'any' })],
        },
        {
            step: 9,
            title: 'Mnożenie jako „n razy po m”, mnożenie do 30, ·0 i ·1',
            childName: 'Mnożenie do 30',
            types: ['MULT_GROUPS', 'MULT'],
            skills: [
                skill('E3.9.mult_30', 9, 'MULT', { maxProduct: 30, maxFactor: 10, allowZeroOne: true }),
                skill('E3.9.mult_groups_result', 9, 'MULT_GROUPS', { variant: 'result', groups: [2, 5], size: [2, 6], max: 30 }, 'tiles'),
                skill('E3.9.mult_groups_expr', 9, 'MULT_GROUPS', { variant: 'expr', groups: [2, 5], size: [2, 6], max: 30 }, 'tiles'),
                skill('E3.9.word_groups_30', 9, 'WORD', { max: 30, kinds: ['groups'], maxFactor: 6 }),
            ],
        },
        {
            step: 10,
            title: 'Dzielenie: po równo i „po ile”, dzielenie do 30, połowa',
            childName: 'Dzielenie do 30',
            types: ['DIV', 'HALF'],
            skills: [
                skill('E3.10.div_30', 10, 'DIV', { maxDividend: 30, maxQuotient: 10 }),
                skill('E3.10.half_30', 10, 'HALF', { max: 30 }),
                skill('E3.10.word_share_30', 10, 'WORD', { max: 30, kinds: ['share', 'each'], maxFactor: 6 }),
            ],
        },
        {
            step: 11,
            title: 'Zegar 24-godzinny, cyfry rzymskie I–XII, kwartały, termometr',
            childName: 'Cyfry rzymskie i kwartały',
            types: ['CLOCK', 'ROMAN', 'CALENDAR', 'TEMPERATURE'],
            skills: [
                skill('E3.11.clock_24h', 11, 'CLOCK', { variant: 'h24', minuteStep: 60 }, 'tiles'),
                skill('E3.11.roman_12', 11, 'ROMAN', { max: 12 }, 'tiles'),
                skill('E3.11.calendar', 11, 'CALENDAR', { variants: ['nextMonth', 'prevMonth', 'quarter', 'romanMonth'] }, 'tiles'),
                skill('E3.11.temperature_read_30', 11, 'TEMPERATURE', { variant: 'read', low: -30, high: 30, step: 5, answer: 'text' }, 'tiles'),
            ],
        },
    ],
};
