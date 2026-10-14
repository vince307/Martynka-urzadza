// Word-problem templates for WORD and COMPARE_DIFF (ZADANIA.md, section 4):
// contexts from the game's world, a small pool of names with grammatical
// gender, verbs in both past forms. Templates are pure functions of numbers
// and return the prompt and the hint lines; generators choose the numbers.
import { countNoun, pluralCategory, type PluralForms } from '../core/text/plural';
import { nouns } from './nouns';
import { pl } from './pl';

export interface Person {
    name: string;
    dative: string;         // "oddała Oli", "dał Kubie"
    gender: 'm' | 'f';
}

export const people: readonly Person[] = [
    { name: 'Ola', dative: 'Oli', gender: 'f' },
    { name: 'Kuba', dative: 'Kubie', gender: 'm' },
    { name: 'Zosia', dative: 'Zosi', gender: 'f' },
    { name: 'Franek', dative: 'Frankowi', gender: 'm' },
    { name: 'Hania', dative: 'Hani', gender: 'f' },
    { name: 'Staś', dative: 'Stasiowi', gender: 'm' },
    { name: 'Ania', dative: 'Ani', gender: 'f' },
    { name: 'Tomek', dative: 'Tomkowi', gender: 'm' },
];

export interface Context {
    noun: PluralForms;
    accusative: string;     // singular accusative for "ma 1 naklejkę" (equals nominative for masculine/neuter)
    place: string;          // "w kawiarni", "na półce"
    portable: boolean;      // fits boxes and plates (groups / share / each templates)
    price?: readonly [number, number];   // a believable shop price in grosze, min..max (MONEY_CHANGE); none = never bought
}

export const contexts: readonly Context[] = [
    { noun: nouns.rogalik, accusative: 'rogalik', place: 'w kawiarni', portable: true, price: [100, 600] },
    { noun: nouns.ciastko, accusative: 'ciastko', place: 'na talerzu', portable: true, price: [50, 800] },
    { noun: nouns.filiżanka, accusative: 'filiżankę', place: 'na półce', portable: false, price: [500, 4000] },
    { noun: nouns.kwiatek, accusative: 'kwiatek', place: 'w ogrodzie', portable: false, price: [300, 3000] },
    { noun: nouns.poduszka, accusative: 'poduszkę', place: 'na kanapie', portable: false, price: [2000, 10000] },
    { noun: nouns.książka, accusative: 'książkę', place: 'na półce', portable: false, price: [1000, 6000] },
    { noun: nouns.klocek, accusative: 'klocek', place: 'w pudełku', portable: true, price: [100, 2000] },
    { noun: nouns.kredka, accusative: 'kredkę', place: 'w piórniku', portable: true, price: [50, 500] },
    { noun: nouns.naklejka, accusative: 'naklejkę', place: 'w albumie', portable: true, price: [1, 500] },
    { noun: nouns.złoty, accusative: 'złoty', place: 'w skarbonce', portable: false },
];

/** A counted object: "1 naklejkę", "2 naklejki", "5 naklejek" (accusative for 1). */
export const obj = (n: number, ctx: Context): string => (n === 1 ? `1 ${ctx.accusative}` : countNoun(n, ctx.noun));

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
            prompt: `${person.name} ${verb(person, pl.words.had)} ${obj(a, ctx)} i ${verb(person, pl.words.bought)} jeszcze ${obj(b, ctx)}. Ile ${ctx.noun[2]} ${person.name} ${pl.words.has} teraz?`,
            answer: a + b,
            hint: [`${a} + ${b} = ${a + b}`],
        }),
    },
    {
        id: 'sum.place',
        kind: 'sum',
        build: ({ a, b, ctx }) => ({
            prompt: `${cap(ctx.place)} ${isAre(a)} ${countNoun(a, ctx.noun)}. Dołożono jeszcze ${obj(b, ctx)}. Ile ${ctx.noun[2]} jest teraz ${ctx.place}?`,
            answer: a + b,
            hint: [`${a} + ${b} = ${a + b}`],
        }),
    },
    {
        id: 'left.gave',
        kind: 'left',
        build: ({ a, b, person, other, ctx }) => ({
            prompt: `${person.name} ${verb(person, pl.words.had)} ${obj(a, ctx)} i ${verb(person, pl.words.gave)} ${other.dative} ${obj(b, ctx)}. Ile ${ctx.noun[2]} ${person.name} ${pl.words.has} teraz?`,
            answer: a - b,
            hint: [`${a} ${MINUS} ${b} = ${a - b}`],
        }),
    },
    {
        id: 'left.taken',
        kind: 'left',
        build: ({ a, b, ctx }) => ({
            prompt: `${cap(ctx.place)} ${isAre(a)} ${countNoun(a, ctx.noun)}. Zabrano ${obj(b, ctx)}. Ile ${ctx.noun[2]} zostało?`,
            answer: a - b,
            hint: [`${a} ${MINUS} ${b} = ${a - b}`],
        }),
    },
    {
        id: 'start.gave',
        kind: 'start',
        build: ({ a, b, person, other, ctx }) => ({
            // a = given away, b = left; the answer is the starting amount.
            prompt: `${person.name} ${verb(person, pl.words.gave)} ${other.dative} ${obj(a, ctx)} i ${pl.words.has} jeszcze ${obj(b, ctx)}. Ile ${ctx.noun[2]} ${person.name} ${verb(person, pl.words.had)} na początku?`,
            answer: a + b,
            hint: [`${a} + ${b} = ${a + b}`],
        }),
    },
    {
        id: 'twoSteps.taken',
        kind: 'twoSteps',
        build: ({ a, b, c, ctx }) => ({
            prompt: `${cap(ctx.place)} ${isAre(a)} ${countNoun(a, ctx.noun)}. Rano zabrano ${obj(b, ctx)}, a po południu ${obj(c, ctx)}. Ile ${ctx.noun[2]} zostało?`,
            answer: a - b - c,
            hint: [`${a} ${MINUS} ${b} = ${a - b}`, `${a - b} ${MINUS} ${c} = ${a - b - c}`],
        }),
    },
    {
        id: 'moreBy.has',
        kind: 'moreBy',
        build: ({ a, b, person, other, ctx }) => ({
            prompt: `${person.name} ${pl.words.has} ${obj(a, ctx)}, a ${other.name} ${pl.words.has} o ${obj(b, ctx)} więcej. Ile ${ctx.noun[2]} ${pl.words.has} ${other.name}?`,
            answer: a + b,
            hint: [`${a} + ${b} = ${a + b}`],
        }),
    },
    {
        id: 'age.inYears',
        kind: 'age',
        build: ({ a, b, person }) => ({
            // a = age now, b = target age; the answer is the years to wait.
            prompt: `${person.name} ${pl.words.has} ${countNoun(a, nouns.rok)}. Za ile lat ${verb(person, pl.words.willHave)} ${countNoun(b, nouns.rok)}?`,
            answer: b - a,
            hint: [`${b} ${MINUS} ${a} = ${b - a}`],
        }),
    },
    {
        id: 'groups.boxes',
        kind: 'groups',
        build: ({ a, b, ctx }) => ({
            // a boxes with b items each.
            prompt: `Na stole ${isAre(a)} ${countNoun(a, nouns.pudełko)}, w każdym po ${obj(b, ctx)}. Ile to razem ${ctx.noun[2]}?`,
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
            prompt: `${cap(countNoun(a, ctx.noun))} zapakowano do pudełek, po ${obj(b, ctx)} w każdym. Ile pudełek zapełniono?`,
            answer: a / b,
            hint: [`${a} ${DIVIDE} ${b} = ${a / b}`],
        }),
    },
];

export const compareTemplates = {
    more: (p: Person, o: Person, a: number, b: number, ctx: Context): WordResult => ({
        prompt: `${p.name} ${pl.words.has} ${obj(a, ctx)}, a ${o.name} ${pl.words.has} ${obj(b, ctx)}. O ile więcej ${ctx.noun[2]} ${pl.words.has} ${a > b ? p.name : o.name}?`,
        answer: Math.abs(a - b),
        hint: [`${Math.max(a, b)} ${MINUS} ${Math.min(a, b)} = ${Math.abs(a - b)}`],
    }),
    less: (p: Person, o: Person, a: number, b: number, ctx: Context): WordResult => ({
        prompt: `${p.name} ${pl.words.has} ${obj(a, ctx)}, a ${o.name} ${pl.words.has} ${obj(b, ctx)}. O ile mniej ${ctx.noun[2]} ${pl.words.has} ${a < b ? p.name : o.name}?`,
        answer: Math.abs(a - b),
        hint: [`${Math.max(a, b)} ${MINUS} ${Math.min(a, b)} = ${Math.abs(a - b)}`],
    }),
};
