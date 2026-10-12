// Word-problem templates for WORD and COMPARE_DIFF (ZADANIA.md, section 4):
// contexts from the game's world, a small pool of names with grammatical
// gender, verbs in both past forms. Templates are pure functions of numbers
// and return the prompt and the hint lines; generators choose the numbers.
import { countNoun, pluralCategory, type PluralForms } from '../core/text/plural';
import { nouns } from './nouns';
import { pl } from './pl';

export interface Person {
    name: string;
    genitive: string;       // "dla Oli"
    gender: 'm' | 'f';
}

export const people: readonly Person[] = [
    { name: 'Ola', genitive: 'Oli', gender: 'f' },
    { name: 'Kuba', genitive: 'Kuby', gender: 'm' },
    { name: 'Zosia', genitive: 'Zosi', gender: 'f' },
    { name: 'Franek', genitive: 'Franka', gender: 'm' },
    { name: 'Hania', genitive: 'Hani', gender: 'f' },
    { name: 'Staś', genitive: 'Stasia', gender: 'm' },
    { name: 'Ania', genitive: 'Ani', gender: 'f' },
    { name: 'Tomek', genitive: 'Tomka', gender: 'm' },
];

export interface Context {
    noun: PluralForms;
    place: string;          // "w kawiarni", "na półce"
}

export const contexts: readonly Context[] = [
    { noun: nouns.rogalik, place: 'w kawiarni' },
    { noun: nouns.ciastko, place: 'na talerzu' },
    { noun: nouns.filiżanka, place: 'na półce' },
    { noun: nouns.kwiatek, place: 'w ogrodzie' },
    { noun: nouns.poduszka, place: 'na kanapie' },
    { noun: nouns.książka, place: 'na półce' },
    { noun: nouns.klocek, place: 'w pudełku' },
    { noun: nouns.kredka, place: 'w piórniku' },
    { noun: nouns.naklejka, place: 'w albumie' },
];

export type WordKind = 'sum' | 'left' | 'start' | 'twoSteps' | 'moreBy' | 'age' | 'groups' | 'share' | 'each';

export interface WordArgs {
    a: number;
    b: number;
    c: number;              // used by twoSteps; 0 otherwise
    person: Person;
    other: Person;          // a second person, different from `person`
    ctx: Context;
}

export interface WordResult {
    prompt: string;
    answer: number;
    hint: string[];
}

export interface WordTemplate {
    id: string;
    kind: WordKind;
    build(args: WordArgs): WordResult;
}

const verb = (p: Person, forms: readonly [string, string]): string => (p.gender === 'm' ? forms[0] : forms[1]);
const cap = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1);
/** "jest 1 rogalik", "są 2 rogaliki", "jest 5 rogalików": present tense avoids noun gender. */
const isAre = (n: number): string => (pluralCategory(n) === 'few' ? pl.words.are : pl.words.is);
const MINUS = '−';
const TIMES = '·';
const DIVIDE = ':';

export const templates: readonly WordTemplate[] = [
    {
        id: 'sum.bought',
        kind: 'sum',
        build: ({ a, b, person, ctx }) => ({
            prompt: `${person.name} ${verb(person, pl.words.had)} ${countNoun(a, ctx.noun)} i ${verb(person, pl.words.bought)} jeszcze ${countNoun(b, ctx.noun)}. Ile ${ctx.noun[2]} ${person.name} ${pl.words.has} teraz?`,
            answer: a + b,
            hint: [`${a} + ${b} = ${a + b}`],
        }),
    },
    {
        id: 'sum.place',
        kind: 'sum',
        build: ({ a, b, ctx }) => ({
            prompt: `${cap(ctx.place)} ${isAre(a)} ${countNoun(a, ctx.noun)}. Dołożono jeszcze ${countNoun(b, ctx.noun)}. Ile ${ctx.noun[2]} jest teraz ${ctx.place}?`,
            answer: a + b,
            hint: [`${a} + ${b} = ${a + b}`],
        }),
    },
    {
        id: 'left.gave',
        kind: 'left',
        build: ({ a, b, person, other, ctx }) => ({
            prompt: `${person.name} ${verb(person, pl.words.had)} ${countNoun(a, ctx.noun)} i ${verb(person, pl.words.gave)} ${countNoun(b, ctx.noun)} dla ${other.genitive}. Ile ${ctx.noun[2]} ${person.name} ${pl.words.has} teraz?`,
            answer: a - b,
            hint: [`${a} ${MINUS} ${b} = ${a - b}`],
        }),
    },
    {
        id: 'left.taken',
        kind: 'left',
        build: ({ a, b, ctx }) => ({
            prompt: `${cap(ctx.place)} ${isAre(a)} ${countNoun(a, ctx.noun)}. Zabrano ${countNoun(b, ctx.noun)}. Ile ${ctx.noun[2]} zostało?`,
            answer: a - b,
            hint: [`${a} ${MINUS} ${b} = ${a - b}`],
        }),
    },
    {
        id: 'start.gave',
        kind: 'start',
        build: ({ a, b, person, ctx }) => ({
            // a = given away, b = left; the answer is the starting amount.
            prompt: `${person.name} ${verb(person, pl.words.gave)} ${countNoun(a, ctx.noun)} i ${pl.words.has} jeszcze ${countNoun(b, ctx.noun)}. Ile ${ctx.noun[2]} ${person.name} ${verb(person, pl.words.had)} na początku?`,
            answer: a + b,
            hint: [`${a} + ${b} = ${a + b}`],
        }),
    },
    {
        id: 'twoSteps.taken',
        kind: 'twoSteps',
        build: ({ a, b, c, ctx }) => ({
            prompt: `${cap(ctx.place)} ${isAre(a)} ${countNoun(a, ctx.noun)}. Rano zabrano ${countNoun(b, ctx.noun)}, a po południu ${countNoun(c, ctx.noun)}. Ile ${ctx.noun[2]} zostało?`,
            answer: a - b - c,
            hint: [`${a} ${MINUS} ${b} = ${a - b}`, `${a - b} ${MINUS} ${c} = ${a - b - c}`],
        }),
    },
    {
        id: 'moreBy.has',
        kind: 'moreBy',
        build: ({ a, b, person, other, ctx }) => ({
            prompt: `${person.name} ${pl.words.has} ${countNoun(a, ctx.noun)}, a ${other.name} ${pl.words.has} o ${countNoun(b, ctx.noun)} więcej. Ile ${ctx.noun[2]} ${pl.words.has} ${other.name}?`,
            answer: a + b,
            hint: [`${a} + ${b} = ${a + b}`],
        }),
    },
    {
        id: 'age.inYears',
        kind: 'age',
        build: ({ a, b, person }) => ({
            // a = age now, b = target age; the answer is the years to wait.
            prompt: `${person.name} ${pl.words.has} ${pl.words.years(a)}. Za ile lat ${verb(person, pl.words.willHave)} ${pl.words.years(b)}?`,
            answer: b - a,
            hint: [`${b} ${MINUS} ${a} = ${b - a}`],
        }),
    },
    {
        id: 'groups.boxes',
        kind: 'groups',
        build: ({ a, b, ctx }) => ({
            // a boxes with b items each.
            prompt: `Na stole ${isAre(a)} ${countNoun(a, nouns.pudełko)}, w każdym po ${countNoun(b, ctx.noun)}. Ile to razem ${ctx.noun[2]}?`,
            answer: a * b,
            hint: [`${a} ${TIMES} ${b} = ${a * b}`],
        }),
    },
    {
        id: 'share.plates',
        kind: 'share',
        build: ({ a, b, ctx }) => ({
            // a items shared equally among b plates.
            prompt: `${cap(countNoun(a, ctx.noun))} rozłożono po równo na ${countNoun(b, nouns.talerz)}. Ile ${ctx.noun[2]} jest na każdym talerzu?`,
            answer: a / b,
            hint: [`${a} ${DIVIDE} ${b} = ${a / b}`],
        }),
    },
    {
        id: 'each.boxes',
        kind: 'each',
        build: ({ a, b, ctx }) => ({
            // a items packed b per box: how many boxes?
            prompt: `${cap(countNoun(a, ctx.noun))} zapakowano do pudełek, po ${countNoun(b, ctx.noun)} w każdym. Ile pudełek zapełniono?`,
            answer: a / b,
            hint: [`${a} ${DIVIDE} ${b} = ${a / b}`],
        }),
    },
];

export const compareTemplates = {
    more: (p: Person, o: Person, a: number, b: number, ctx: Context): WordResult => ({
        prompt: `${p.name} ${pl.words.has} ${countNoun(a, ctx.noun)}, a ${o.name} ${pl.words.has} ${countNoun(b, ctx.noun)}. O ile więcej ${ctx.noun[2]} ${pl.words.has} ${a > b ? p.name : o.name}?`,
        answer: Math.abs(a - b),
        hint: [`${Math.max(a, b)} ${MINUS} ${Math.min(a, b)} = ${Math.abs(a - b)}`],
    }),
    less: (p: Person, o: Person, a: number, b: number, ctx: Context): WordResult => ({
        prompt: `${p.name} ${pl.words.has} ${countNoun(a, ctx.noun)}, a ${o.name} ${pl.words.has} ${countNoun(b, ctx.noun)}. O ile mniej ${ctx.noun[2]} ${pl.words.has} ${a < b ? p.name : o.name}?`,
        answer: Math.abs(a - b),
        hint: [`${Math.max(a, b)} ${MINUS} ${Math.min(a, b)} = ${Math.abs(a - b)}`],
    }),
};
