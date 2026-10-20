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
            { kind: 'skipped' },
            { kind: 'cause', cause: 'network' },
            { kind: 'advice', restart: true },
            { kind: 'code', code: 'network', build: 'abc1234' },
        ]);
    });

    it('counts the causes of all tables together', () => {
        const lines = artHealthLines({ task: missingHealth(10, ['fetch']), room: missingHealth(10, ['decode', 'decode']), ui: undefined, cut: 0, build: 'b' });
        expect(lines.filter((l) => l.kind === 'cause')).toEqual([{ kind: 'cause', cause: 'decode' }]);
    });

    it('marks the cut line as a background cut when the load spent time hidden, with no cause or advice line', () => {
        const lines = artHealthLines({ task: missingHealth(10, ['cut', 'cut', 'cut']), room: undefined, ui: undefined, cut: 3, build: 'b', background: true });
        expect(lines).toContainEqual({ kind: 'cut', count: 3, background: true });
        expect(lines.map((l) => l.kind)).toEqual(['missing', 'skipped', 'cut', 'code']);
    });

    it('keeps today\'s cut line when the load was never hidden', () => {
        const lines = artHealthLines({ task: okHealth(3), room: undefined, ui: undefined, cut: 3, build: 'b', background: false });
        expect(lines).toContainEqual({ kind: 'cut', count: 3 });
    });

    it('adds no cut line for a hidden load that cut nothing', () => {
        const lines = artHealthLines({ task: okHealth(3), room: undefined, ui: undefined, cut: 0, build: 'b', background: true });
        expect(lines.some((l) => l.kind === 'cut')).toBe(false);
    });

    it('leaves the cause line to the cut line when the cut is the cause', () => {
        const lines = artHealthLines({ task: missingHealth(10, ['cut', 'cut']), room: undefined, ui: undefined, cut: 2, build: 'b' });
        expect(lines.map((l) => l.kind)).toEqual(['missing', 'skipped', 'cut', 'code']);
    });

    it('is empty when nothing is known', () => {
        expect(artHealthLines({ task: undefined, room: undefined, ui: undefined, cut: 0, build: 'b' })).toEqual([]);
    });
});

describe('artHealthLines: folders, skipped tasks, labels, font, restart advice (phase 6)', () => {
    const taskMissing = (keys: [string, ArtCause][], total = 38): ArtHealth => {
        const missing = keys.map(([key]) => key);
        return {
            total,
            missing,
            missingIds: new Set(missing.map((key) => key.split('/').pop() as string)),
            causes: Object.fromEntries(keys),
        };
    };
    const base = { room: undefined, ui: undefined, cut: 0, build: 'b' } as const;

    it('counts the missing task pictures per folder, in folder order of the keys', () => {
        const task = taskMissing([['tasks/money/coin-1', 'fetch'], ['tasks/money/coin-2', 'fetch'], ['tasks/icons/apple', 'fetch']]);
        const lines = artHealthLines({ ...base, task });
        expect(lines.filter((l) => l.kind === 'folder')).toEqual([
            { kind: 'folder', folder: 'money', count: 2 },
            { kind: 'folder', folder: 'icons', count: 1 },
        ]);
    });

    it('says the tasks with these pictures are skipped only for task art', () => {
        const task = taskMissing([['tasks/money/coin-1', 'fetch']]);
        expect(artHealthLines({ ...base, task }).map((l) => l.kind)).toContain('skipped');
        const room = { total: 3, missing: ['salon/sofa'], missingIds: new Set(['salon/sofa']), causes: { 'salon/sofa': 'fetch' as const } };
        expect(artHealthLines({ ...base, task: undefined, room }).map((l) => l.kind)).not.toContain('skipped');
    });

    it('lists at most labelCap labels of missing room pieces', () => {
        const lines = artHealthLines({ ...base, task: undefined, labels: ['sofa', 'dywan', 'stolik', 'szafka'], labelCap: 3 });
        expect(lines).toContainEqual({ kind: 'labels', labels: ['sofa', 'dywan', 'stolik'] });
    });

    it('has no labels line without labels', () => {
        expect(artHealthLines({ ...base, task: okHealth(3), labels: [], labelCap: 3 }).map((l) => l.kind)).not.toContain('labels');
    });

    it('adds a font line only for the fallback font', () => {
        expect(artHealthLines({ ...base, task: okHealth(3), font: 'fallback' })).toContainEqual({ kind: 'font' });
        expect(artHealthLines({ ...base, task: okHealth(3), font: 'loaded' }).map((l) => l.kind)).not.toContain('font');
    });

    it('says a restart changes nothing for a 404 and for an undecodable file', () => {
        for (const cause of ['fetch', 'decode'] as const) {
            const lines = artHealthLines({ ...base, task: taskMissing([['tasks/money/coin-1', cause]]) });
            expect(lines).toContainEqual({ kind: 'advice', restart: false });
        }
    });

    it('advises a restart when the cause is the network', () => {
        const lines = artHealthLines({ ...base, task: taskMissing([['tasks/money/coin-1', 'network']]) });
        expect(lines).toContainEqual({ kind: 'advice', restart: true });
        expect(lines).not.toContainEqual({ kind: 'advice', restart: false });
    });

    it('leaves the advice to the cut line when the cut is the cause', () => {
        const lines = artHealthLines({ ...base, cut: 1, task: taskMissing([['tasks/money/coin-1', 'cut']]) });
        expect(lines.map((l) => l.kind)).not.toContain('advice');
    });
});

describe('artHealthLines: fallback line (phase 7)', () => {
    const base = { task: okHealth(3), room: okHealth(3), ui: okHealth(3), cut: 0, build: 'abc1234' };
    it('names the screens that showed a fallback, in a fixed order', () => {
        const lines = artHealthLines({ ...base, fallbacks: { loading: 'drawn', wallet: 'drawn' } });
        expect(lines).toContainEqual({ kind: 'fallback', where: ['wallet', 'loading'] });
    });
    it('adds nothing when no fallback was shown', () => {
        expect(artHealthLines({ ...base, fallbacks: {} }).some((l) => l.kind === 'fallback')).toBe(false);
        expect(artHealthLines(base).some((l) => l.kind === 'fallback')).toBe(false);
    });
});
