import { describe, expect, it } from 'vitest';
import { validateTask } from '../src/core/tasks/validate';
import { nouns } from '../src/data/nouns';
import { compareTemplates, contexts, people, templates } from '../src/data/wordTemplates';

const clean = (text: string): boolean => !/undefined|NaN|\s{2}|\s[.,?]/.test(text) && /^[A-ZŁŚŻŹĆ0-9]/.test(text) && text.endsWith('?');

describe('word templates', () => {
    it('cover every kind', () => {
        const kinds = new Set(templates.map((t) => t.kind));
        for (const k of ['sum', 'left', 'start', 'twoSteps', 'moreBy', 'age', 'groups', 'share', 'each']) {
            expect(kinds.has(k as never), k).toBe(true);
        }
    });

    for (const template of templates) {
        it(`${template.id}: inflection and grammar for 0..100`, () => {
            for (const person of people) {
                const other = people.find((p) => p !== person)!;
                for (const ctx of contexts) {
                    for (let n = 0; n <= 100; n += 1) {
                        // Numbers that keep the story true for the kind (b ≤ a, exact division, older target age).
                        let a = n;
                        let b = (n % 23) + 1;
                        let c = 0;
                        if (template.kind === 'left') {
                            b = n % 23;
                        } else if (template.kind === 'twoSteps') {
                            b = n % 23;
                            c = (n - b) % 7;
                        } else if (template.kind === 'age') {
                            b = n + 1 + (n % 5);
                        } else if (template.kind === 'share' || template.kind === 'each') {
                            b = (n % 9) + 2;
                            a = b * (n % 11);
                        }
                        const r = template.build({ a, b, c, person, other, ctx });
                        const task = { skillId: template.id, prompt: r.prompt, answer: r.answer, hint: r.hint };
                        expect(validateTask(task, { nouns }), r.prompt).toEqual([]);
                        expect(clean(r.prompt), r.prompt).toBe(true);
                        // Objects of verbs take the accusative: "ma 1 naklejkę", never "ma 1 naklejka".
                        expect(r.prompt, r.prompt).not.toMatch(/(ma|miał|miała|kupił|kupiła|oddał|oddała|zabrano|dołożono|o|po|jeszcze|\p{L}+(owi|iowi|ie|i)) 1 \p{L}+a\b/u);
                    }
                }
            }
        });
    }

    it('compare templates agree with the dictionary', () => {
        for (const build of [compareTemplates.more, compareTemplates.less]) {
            for (let a = 0; a <= 100; a += 3) {
                const r = build(people[0], people[1], a, (a + 5) % 31, contexts[a % contexts.length]);
                expect(validateTask({ skillId: 'cmp', prompt: r.prompt, answer: r.answer, hint: r.hint }, { nouns })).toEqual([]);
                expect(clean(r.prompt), r.prompt).toBe(true);
            }
        }
    });
});
