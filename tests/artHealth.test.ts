// Origin: change art-stand-in-and-load-signal, phase 1. The record of which task pictures did not load.
import { describe, expect, it } from 'vitest';
import { artHealth, artHealthView, sectionState } from '../src/core/artHealth';

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
