import { describe, expect, it } from 'vitest';
import { pl } from '../src/data/pl';
import { countNoun, inflect, pluralCategory } from '../src/core/text/plural';

const apple = ['jabłko', 'jabłka', 'jabłek'] as const;

describe('pluralCategory / inflect', () => {
    it.each([
        [1, 'jabłko'],
        [2, 'jabłka'],
        [3, 'jabłka'],
        [4, 'jabłka'],
        [5, 'jabłek'],
        [11, 'jabłek'],
        [12, 'jabłek'],
        [13, 'jabłek'],
        [14, 'jabłek'],
        [21, 'jabłek'],
        [22, 'jabłka'],
        [23, 'jabłka'],
        [24, 'jabłka'],
        [25, 'jabłek'],
        [100, 'jabłek'],
        [112, 'jabłek'],
        [122, 'jabłka'],
        [1000, 'jabłek'],
        [0, 'jabłek'],
    ])('%i → %s', (n, form) => {
        expect(inflect(n, apple)).toBe(form);
    });

    it('categories', () => {
        expect(pluralCategory(1)).toBe('one');
        expect(pluralCategory(4)).toBe('few');
        expect(pluralCategory(14)).toBe('many');
        expect(pluralCategory(0)).toBe('many');
    });

    it('rejects negatives and fractions', () => {
        expect(() => pluralCategory(-1)).toThrow(RangeError);
        expect(() => pluralCategory(2.5)).toThrow(RangeError);
    });

    it('countNoun() joins the number and the form', () => {
        expect(countNoun(5, apple)).toBe('5 jabłek');
        expect(countNoun(1, apple)).toBe('1 jabłko');
    });
});

describe('pl.settings.saveEarlier (parent save health)', () => {
    it.each([
        [1, 'Wcześniej: 1 nieudana próba (QuotaExceededError).'],
        [2, 'Wcześniej: 2 nieudane próby (QuotaExceededError).'],
        [5, 'Wcześniej: 5 nieudanych prób (QuotaExceededError).'],
        [22, 'Wcześniej: 22 nieudane próby (QuotaExceededError).'],
    ])('agrees with %i', (count, text) => {
        expect(pl.settings.saveEarlier(count, 'QuotaExceededError')).toBe(text);
    });

    it('has a sentence for every persistence result but unknown', () => {
        expect(pl.settings.savePersist.granted).toBe('Przeglądarka nie usunie zapisu sama.');
        for (const k of ['denied', 'unsupported', 'error'] as const) expect(pl.settings.savePersist[k]).toContain('może usunąć zapis');
    });
});
