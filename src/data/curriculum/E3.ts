// Stage E3 (grade 2, first semester): steps from docs/ZADANIA.md, section 3.
// Only ADD_SUB skills carry parameters so far (roadmap F-03); the other steps
// list their task types and get skills with the generators in S-02.
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
        { step: 1, title: 'Powtórka do 20, budowa zadania tekstowego, „o ile więcej / mniej”', types: ['WORD', 'COMPARE_DIFF'], skills: [] },
        {
            step: 2,
            title: '+ i − do 20 z przekroczeniem, działania z okienkiem',
            types: ['ADD_SUB', 'MISSING'],
            skills: [
                addSub('E3.2.add_sub_20_bridge', 2, { max: 20, ops: ['+', '-'], bridge: 'ten' }),
                skill('E3.2.missing_20', 2, 'MISSING', { max: 20, ops: ['+', '-'], bridge: 'any' }),
            ],
        },
        { step: 3, title: 'Zegar: pełne godziny, obliczenia zegarowe', types: ['CLOCK'], skills: [] },
        { step: 4, title: 'Waga: kg, dag; diagramy', types: ['MASS', 'DATA'], skills: [] },
        { step: 5, title: 'Kwadrat magiczny, odcinki w cm', types: ['PUZZLE_GRID', 'LENGTH'], skills: [] },
        {
            step: 6,
            title: 'Liczby 21–30, + i − do 30 bez przekroczenia',
            types: ['PLACE_VALUE', 'ADD_SUB'],
            skills: [addSub('E3.6.add_sub_30_nobridge', 6, { max: 30, ops: ['+', '-'], bridge: 'none' })],
        },
        { step: 7, title: 'Siatka kwadratowa i kodowanie, parzyste/nieparzyste, liczby słowami', types: ['GRID', 'EVEN_ODD', 'NUMBER_WORDS'], skills: [] },
        {
            step: 8,
            title: '+ i − do 30 z przekroczeniem, dwie dwucyfrowe',
            types: ['ADD_SUB'],
            skills: [addSub('E3.8.add_sub_30_bridge', 8, { max: 30, shapes: ['DU+U', 'DU-U', 'DU+DU', 'DU-DU'], bridge: 'any' })],
        },
        { step: 9, title: 'Mnożenie jako „n razy po m”, mnożenie do 30, ·0 i ·1', types: ['MULT_GROUPS', 'MULT'], skills: [] },
        { step: 10, title: 'Dzielenie: po równo i „po ile”, dzielenie do 30, połowa', types: ['DIV', 'HALF'], skills: [] },
        { step: 11, title: 'Zegar 24-godzinny, cyfry rzymskie I–XII, kwartały, termometr', types: ['CLOCK', 'ROMAN', 'CALENDAR', 'TEMPERATURE'], skills: [] },
    ],
};
