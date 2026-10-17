// Origin: change health-lines-and-smoke, phase 5 (L-8, F4, A-5, B-4). The lines of the parent's "Obrazki" section.
import { describe, expect, it } from 'vitest';
import { artHealth, artHealthLines, type ArtHealth, type ArtCause } from '../src/core/artHealth';

const entries = (n: number) => Array.from({ length: n }, (_, i) => ({ key: `k${i}`, id: `i${i}` }));
const okHealth = (n: number): ArtHealth => artHealth(entries(n), () => true);
const missingHealth = (n: number, causes: ArtCause[]): ArtHealth => {
    const base = artHealth(entries(n), (key) => Number(key.slice(1)) >= causes.length);
    return { ...base, causes: Object.fromEntries(causes.map((cause, i) => [`k${i}`, cause])) };
};

describe('artHealthLines', () => {
    it('gives one ok line per known table and no code line', () => {
        expect(artHealthLines({ task: okHealth(38), room: okHealth(30), ui: okHealth(5), cut: 0, build: 'abc1234' })).toEqual([
            { kind: 'ok', table: 'task', count: 0, total: 38 },
            { kind: 'ok', table: 'room', count: 0, total: 30 },
            { kind: 'ok', table: 'ui', count: 0, total: 5 },
        ]);
    });

    it('shows the room line while the task record is unknown (F4)', () => {
        expect(artHealthLines({ task: undefined, room: missingHealth(30, ['fetch']), ui: undefined, cut: 0, build: 'b' }).slice(0, 1)).toEqual([
            { kind: 'missing', table: 'room', count: 1, total: 30 },
        ]);
    });

    it('adds the cut line with the number of cut files', () => {
        const lines = artHealthLines({ task: okHealth(3), room: undefined, ui: undefined, cut: 4, build: 'b' });
        expect(lines).toContainEqual({ kind: 'cut', count: 4 });
    });

    it('names the most frequent cause and the code with the build', () => {
        const lines = artHealthLines({ task: missingHealth(10, ['network', 'fetch', 'network']), room: undefined, ui: undefined, cut: 0, build: 'abc1234' });
        expect(lines).toEqual([
            { kind: 'missing', table: 'task', count: 3, total: 10 },
            { kind: 'cause', cause: 'network' },
            { kind: 'code', code: 'network', build: 'abc1234' },
        ]);
    });

    it('counts the causes of all tables together', () => {
        const lines = artHealthLines({ task: missingHealth(10, ['fetch']), room: missingHealth(10, ['decode', 'decode']), ui: undefined, cut: 0, build: 'b' });
        expect(lines.filter((l) => l.kind === 'cause')).toEqual([{ kind: 'cause', cause: 'decode' }]);
    });

    it('leaves the cause line to the cut line when the cut is the cause', () => {
        const lines = artHealthLines({ task: missingHealth(10, ['cut', 'cut']), room: undefined, ui: undefined, cut: 2, build: 'b' });
        expect(lines.map((l) => l.kind)).toEqual(['missing', 'cut', 'code']);
    });

    it('is empty when nothing is known', () => {
        expect(artHealthLines({ task: undefined, room: undefined, ui: undefined, cut: 0, build: 'b' })).toEqual([]);
    });
});
