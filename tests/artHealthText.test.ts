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

// S-16b impl review: the verb and the pronoun agree with the count, like artMissing.
describe('pl.settings.soundMissing', () => {
    it.each([
        [1, 'Nie wczytał się 1 dźwięk. Gra działa dalej bez niego.'],
        [2, 'Nie wczytały się 2 dźwięki. Gra działa dalej bez nich.'],
        [5, 'Nie wczytało się 5 dźwięków. Gra działa dalej bez nich.'],
        [12, 'Nie wczytało się 12 dźwięków. Gra działa dalej bez nich.'],
    ])('agrees the verb with %i', (count, text) => {
        expect(pl.settings.soundMissing(count)).toBe(text);
    });
});

describe('pl.settings.uiArtMissing', () => {
    it.each([
        [1, '1 z 5 obrazków ekranów nie wczytał się.'],
        [2, '2 z 5 obrazków ekranów nie wczytały się.'],
        [5, '5 z 5 obrazków ekranów nie wczytało się.'],
    ])('agrees the verb with %i', (count, start) => {
        expect(pl.settings.uiArtMissing(count, 5).startsWith(start)).toBe(true);
    });
});

describe('pl.settings.artFolders agreement (phase 6)', () => {
    it.each([
        [1, 'pieniądze: brak 1 obrazka.'],
        [2, 'pieniądze: brak 2 obrazków.'],
        [5, 'pieniądze: brak 5 obrazków.'],
    ])('%i', (n, text) => {
        expect(pl.settings.artFolders('money', n)).toBe(text);
    });
});

// Phase 3 of audit-boot-hidden-tab (H-1): a cut after time in the background must not blame the connection.
describe('pl.settings.artCutBackground', () => {
    it('does not blame the internet and says a restart helps', () => {
        expect(pl.settings.artCutBackground).not.toMatch(/internet/i);
        expect(pl.settings.artCutBackground).toMatch(/ponownie/);
        expect(pl.settings.artCutBackground).toMatch(/tle/);
    });
});
