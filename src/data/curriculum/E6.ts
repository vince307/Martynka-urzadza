// Stage E6 (grade 3, second semester): steps from docs/ZADANIA.md, section 3.
// Skills carry the parameters of group-1 generators; the remaining types
// (thermometer, mass, length, perimeter, written columns, place value) arrive later.
import type { SkillDef, StageDef } from '../../core/types';

const skill = (id: string, step: number, type: string, params: SkillDef['params'], answer: SkillDef['answer'] = 'keypad'): SkillDef => ({
    id,
    stage: 'E6',
    step,
    type,
    params,
    answer,
});

const range = (from: number, to: number, by: number): number[] => Array.from({ length: Math.floor((to - from) / by) + 1 }, (_, i) => from + i * by);

const TEENS = range(11, 19, 1);
const TENS_AND_HUNDREDS = [...range(10, 90, 10), ...range(100, 500, 100)];

export const E6: StageDef = {
    id: 'E6',
    steps: [
        {
            step: 1,
            title: 'Temperatury ujemne, różnice temperatur; dekada; sekundy',
            childName: 'Kalendarz i czas',
            types: ['TEMPERATURE', 'CALENDAR', 'TIME_UNITS'],
            skills: [
                skill('E6.1.calendar_time', 1, 'CALENDAR', { variants: ['timeFacts', 'monthDays', 'quarter'] }, 'tiles'),
                skill('E6.1.temperature_negative', 1, 'TEMPERATURE', { variant: 'read', low: -30, high: 30, step: 2, answer: 'text' }, 'tiles'),
                skill('E6.1.temperature_diff', 1, 'TEMPERATURE', { variant: 'diff', low: -20, high: 20, step: 2, answer: 'number' }),
            ],
        },
        { step: 2, title: 'Ile minut do pełnej godziny, czas trwania programu', types: ['CLOCK_ELAPSED'], skills: [] },
        { step: 3, title: 'Brutto/netto/tara; mm i wyrażenia dwumianowe; obwody figur złożonych', types: ['MASS', 'LENGTH', 'PERIMETER'], skills: [] },
        {
            step: 4,
            title: 'Mnożenie dwucyfrowej przez jednocyfrową (6 · 12), dzielenie typu 96 : 6; tuzin i mendel',
            childName: 'Mnożenie i dzielenie do 100',
            types: ['MULT', 'DIV'],
            skills: [
                skill('E6.4.mult_teens', 4, 'MULT', { maxProduct: 100, maxFactor: 9, factors: TEENS }),
                skill('E6.4.div_teens', 4, 'DIV', { maxDividend: 100, divisors: range(2, 9, 1), quotients: TEENS }),
            ],
        },
        {
            step: 5,
            title: 'Setki do 1000, km, tona; budowa liczby trzycyfrowej; dopełnianie do setki i do 1000',
            childName: 'Dopełnianie do 100 i 1000',
            types: ['PLACE_VALUE', 'COMPLEMENT', 'MASS'],
            skills: [
                skill('E6.5.complement_100_1000', 5, 'COMPLEMENT', { max: 1000, targets: [100, 1000] }),
                skill('E6.5.place_read_1000', 5, 'PLACE_VALUE', { variant: 'read', min: 100, max: 999 }),
            ],
        },
        {
            step: 6,
            title: '382 + 9, 697 + 9, 680 + 40, 764 − 8, 450 − 70',
            childName: 'Działania do 1000',
            types: ['ADD_SUB'],
            skills: [skill('E6.6.add_sub_1000_units_tens', 6, 'ADD_SUB', { max: 1000, shapes: ['HTU+U', 'HT+DT', 'HTU-U', 'HT-DT'], bridge: 'any' })],
        },
        {
            step: 7,
            title: 'Pisemne dodawanie i odejmowanie trzycyfrowych z przekroczeniem, sprawdzanie',
            childName: 'Sprawdzanie działań',
            types: ['WRITTEN', 'FACT_FAMILY'],
            skills: [skill('E6.7.fact_check_1000', 7, 'FACT_FAMILY', { max: 1000, variants: ['checkAdd', 'checkSub'] })],
        },
        {
            step: 8,
            title: '500 − 284; 3 · 200, 800 : 4; 13 · 10, 4 · 70, 360 : 4',
            childName: 'Mnożenie i dzielenie do 1000',
            types: ['ADD_SUB', 'MULT', 'DIV'],
            skills: [
                skill('E6.8.sub_from_hundreds', 8, 'ADD_SUB', { max: 1000, shapes: ['H-HTU'], bridge: 'any' }),
                skill('E6.8.mult_tens_hundreds', 8, 'MULT', { maxProduct: 1000, maxFactor: 9, factors: TENS_AND_HUNDREDS }),
                skill('E6.8.div_tens_hundreds', 8, 'DIV', { maxDividend: 1000, divisors: range(2, 9, 1), quotients: TENS_AND_HUNDREDS }),
            ],
        },
        {
            step: 9,
            title: 'Liczby do 10 000: tysiące, rozkład, porównywanie, zaokrąglanie do setek i tysięcy',
            childName: 'Zaokrąglanie liczb',
            types: ['PLACE_VALUE', 'ROUNDING'],
            skills: [
                skill('E6.9.rounding_100', 9, 'ROUNDING', { max: 10000, to: 100 }),
                skill('E6.9.rounding_1000', 9, 'ROUNDING', { max: 10000, to: 1000 }),
            ],
        },
        {
            step: 10,
            title: 'Rzymskie do MM; liczby do 100 000 i 1 000 000 (odczyt, porównanie, pełne rzędy)',
            childName: 'Duże liczby i rzymskie',
            types: ['ROMAN', 'PLACE_VALUE', 'COMPARE_NUM'],
            skills: [
                skill('E6.10.roman_2000', 10, 'ROMAN', { max: 2000 }, 'tiles'),
                skill('E6.10.compare_num_1000000', 10, 'COMPARE_NUM', { max: 1000000 }, 'tiles'),
            ],
        },
        { step: 11, title: 'Powtórka całego roku — „Test przed klasą 4”', types: ['MIX', 'LOGIC'], skills: [] },
    ],
};
