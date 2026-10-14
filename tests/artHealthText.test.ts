import { describe, expect, it } from 'vitest';
import { pl } from '../src/data/pl';

describe('pl.settings.artMissing', () => {
    it.each([
        [1, '1 z 38 obrazków nie wczytał się.'],
        [2, '2 z 38 obrazków nie wczytały się.'],
        [5, '5 z 38 obrazków nie wczytało się.'],
        [22, '22 z 38 obrazków nie wczytały się.'],
        [38, '38 z 38 obrazków nie wczytało się.'],
    ])('agrees the verb with %i', (count, start) => {
        expect(pl.settings.artMissing(count, 38).startsWith(start)).toBe(true);
    });
});
