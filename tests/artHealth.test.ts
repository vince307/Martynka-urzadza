// Origin: change art-stand-in-and-load-signal, phase 1. The record of which task pictures did not load.
import { describe, expect, it } from 'vitest';
import { artCauses, artHealth, artHealthLines, artHealthView, bootGroups, bootQueue, cutByTable, fontHealth, pictureCutCount, loadErrorLine, sectionState, tableOf, wrongSizes } from '../src/core/artHealth';

const entries = Array.from({ length: 38 }, (_, i) => ({ key: `art-key-${i}`, id: `id-${i}` }));

describe('artHealth', () => {
    it('is ok when every texture exists', () => {
        const h = artHealth(entries, () => true);
        expect(h.total).toBe(38);
        expect(h.missing).toEqual([]);
        expect(artHealthView(h)).toEqual({ kind: 'ok', total: 38 });
    });

    it('counts 3 of 38 missing and keeps ids apart from keys', () => {
        const gone = new Set(['art-key-1', 'art-key-7', 'art-key-30']);
        const h = artHealth(entries, (key) => !gone.has(key));
        expect(h.missing).toEqual(['art-key-1', 'art-key-7', 'art-key-30']);
        expect([...h.missingIds].sort()).toEqual(['id-1', 'id-30', 'id-7']);
        expect(artHealthView(h)).toEqual({ kind: 'missing', count: 3, total: 38 });
    });

    it('handles no entries and an absent record', () => {
        expect(artHealthView(artHealth([], () => false))).toEqual({ kind: 'ok', total: 0 });
        expect(artHealthView(undefined)).toEqual({ kind: 'unknown' });
    });
});

// Change stale-tab-and-health, phase 7 (G-1, L-6, L-8): the section never says "ok" while one line is missing.
describe('sectionState', () => {
    const ok = { kind: 'ok', total: 5 } as const;
    const gone = { kind: 'missing', count: 2, total: 5 } as const;
    it.each([
        ['all ok', [ok, ok, ok], 'ok'],
        ['only UI missing', [ok, ok, gone], 'missing'],
        ['only room missing', [ok, gone, ok], 'missing'],
        ['only task missing', [gone, ok, ok], 'missing'],
        ['unknown and absent lines are ignored', [ok, { kind: 'unknown' }, undefined], 'ok'],
    ] as const)('%s', (_name, views, state) => {
        expect(sectionState(views)).toBe(state);
    });
});

// Change health-lines-and-smoke, phase 3 (A-3/L-3/B-5/U-3, A-4, ASL-07): the boot log names the table, URL and status; every missing key has a cause.
describe('loadErrorLine', () => {
    it('names the table, key, URL and HTTP status', () => {
        expect(loadErrorLine('task', 'tasks/money/coin', 'assets/tasks/money/coin.webp', 404)).toBe(
            'Task file failed to load: tasks/money/coin assets/tasks/money/coin.webp (HTTP 404)',
        );
        expect(loadErrorLine('room', 'rooms/salon/sofa', 'assets/rooms/salon/sofa.webp', 500)).toMatch(/^Room file failed to load: rooms\/salon\/sofa .* \(HTTP 500\)$/);
        expect(loadErrorLine('ui', 'ui/wallet', 'assets/ui/wallet.webp', 403)).toMatch(/^Ui file failed to load: /);
        expect(loadErrorLine('sound', 'sfx/pop', 'assets/sounds/m4a/pop.m4a', 404)).toMatch(/^Sound file failed to load: /);
    });

    it('says timeout or network for status 0, never an HTTP code', () => {
        const line = loadErrorLine('task', 'k', 'assets/k.webp', 0);
        expect(line).toBe('Task file failed to load: k assets/k.webp (timeout or network)');
        expect(line).not.toContain('HTTP');
    });
});

describe('tableOf', () => {
    const tables = { task: new Set(['t1']), room: new Set(['r1']), ui: new Set(['u1']), sound: new Set(['s1']) };
    it('finds the table of a key and null for an unknown one (the font)', () => {
        expect(tableOf('t1', tables)).toBe('task');
        expect(tableOf('r1', tables)).toBe('room');
        expect(tableOf('u1', tables)).toBe('ui');
        expect(tableOf('s1', tables)).toBe('sound');
        expect(tableOf('martynka-font', tables)).toBeNull();
    });
});

describe('artCauses', () => {
    it('classifies a missing key from the recorded loader events', () => {
        const seen = {
            loaded: new Set(['decoded-bad']),
            failed: new Map([['gone', 404], ['slow', 0], ['cut-after-fail', 404]]),
            cut: new Set(['cut-key', 'cut-after-fail']),
        };
        const causes = artCauses(['decoded-bad', 'gone', 'slow', 'cut-key', 'cut-after-fail', 'untouched'], seen);
        expect(causes).toEqual({
            'decoded-bad': 'decode',
            gone: 'fetch',
            slow: 'network',
            'cut-key': 'cut',
            'cut-after-fail': 'cut',
            untouched: 'never',
        });
    });
});

describe('wrongSizes', () => {
    it('lists the keys whose texture differs from the table, and skips a key with no texture', () => {
        const entries = [
            { key: 'a', width: 100, height: 50 },
            { key: 'b', width: 100, height: 50 },
            { key: 'c', width: 100, height: 50 },
        ];
        const sizes: Record<string, { width: number; height: number }> = { a: { width: 100, height: 50 }, b: { width: 100, height: 51 } };
        expect(wrongSizes(entries, (key) => sizes[key])).toEqual(['b']);
    });
});

// Change health-lines-and-smoke, phase 4 (B-6, A-7 record, B-3 record): queue order, font check, cut by table.
describe('bootQueue', () => {
    it('queues the loading pictures, font, task, room and other screen pictures before the sounds', () => {
        const order = bootQueue(['sound', 'ui', 'room', 'task', 'font', 'loadingArt']);
        expect(order).toEqual(['loadingArt', 'font', 'task', 'room', 'ui', 'sound']);
        expect(order.indexOf('sound')).toBeGreaterThan(order.indexOf('room'));
        expect(order.indexOf('sound')).toBe(order.length - 1);
    });

    it('keeps only the groups asked for', () => {
        expect(bootQueue(['sound', 'task'])).toEqual(['task', 'sound']);
    });
});

describe('bootGroups', () => {
    it('boots the choice cards and no room on a fresh install', () => {
        expect(bootGroups(true)).toEqual(['loadingArt', 'font', 'task', 'choice', 'ui', 'sound']);
    });
    it('boots the room and no choice cards for a returning player', () => {
        expect(bootGroups(false)).toEqual(['loadingArt', 'font', 'task', 'room', 'ui', 'sound']);
    });
    it('keeps the queue order with the choice group between the task pictures and the screens', () => {
        expect(bootQueue(['sound', 'ui', 'choice', 'task', 'font', 'loadingArt'])).toEqual(['loadingArt', 'font', 'task', 'choice', 'ui', 'sound']);
    });
});

describe('fontHealth', () => {
    it('is loaded when a face of the family is loaded, quoted or not', () => {
        expect(fontHealth([{ family: 'Arial', status: 'loaded' }, { family: '"Atk"', status: 'loaded' }], 'Atk')).toBe('loaded');
        expect(fontHealth([{ family: 'Atk', status: 'loaded' }], 'Atk')).toBe('loaded');
    });
    it('is fallback when the face is absent, loading or in error', () => {
        expect(fontHealth([], 'Atk')).toBe('fallback');
        expect(fontHealth([{ family: 'Atk', status: 'error' }], 'Atk')).toBe('fallback');
        expect(fontHealth([{ family: 'Atk', status: 'loading' }], 'Atk')).toBe('fallback');
        expect(fontHealth([{ family: 'Other', status: 'loaded' }], 'Atk')).toBe('fallback');
    });
});

describe('cutByTable', () => {
    it('groups cut keys by table and lists the font apart', () => {
        const tables = { task: new Set(['t1']), room: new Set(['r1', 'r2']), ui: new Set(['u1']), sound: new Set(['s1']) };
        expect(cutByTable(['r1', 'font', 's1', 'r2'], tables)).toEqual({ task: [], room: ['r1', 'r2'], ui: [], sound: ['s1'], font: ['font'] });
    });
});

describe('pictureCutCount', () => {
    const tables = { task: new Set(['t1']), room: new Set(['r1']), ui: new Set(['u1']), sound: new Set(['s1', 's2']) };

    it('sums the task, room and ui lists and leaves sounds and the font out', () => {
        expect(pictureCutCount({ task: ['a'], room: ['b'], ui: [], sound: ['s'], font: ['f'] })).toBe(2);
    });

    it('is 0 when only sounds and the font were cut, and then no cut line shows', () => {
        const byTable = cutByTable(['s1', 's2', 'font'], tables);
        const cut = pictureCutCount(byTable);
        expect(cut).toBe(0);
        expect(artHealthLines({ task: artHealth([], () => true), room: undefined, ui: undefined, cut, build: 'b' }).some((l) => l.kind === 'cut')).toBe(false);
    });

    it('is 0 for an absent record and counts the rest when a list is missing', () => {
        expect(pictureCutCount(undefined)).toBe(0);
        expect(pictureCutCount({ task: ['a', 'b'], room: ['c'] })).toBe(3);
    });

    it('reads the shape cutByTable writes', () => {
        expect(pictureCutCount(cutByTable(['t1', 'r1', 's1', 'font'], tables))).toBe(2);
    });
});
