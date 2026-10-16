// Music through the service (S-16b phase 7, plan-review F6): lazy load, start after a reload, state from the cache.
import { describe, expect, it, vi } from 'vitest';
import type { Game, Loader } from 'phaser';
import { createSoundService } from '../src/ui/sound';

const KEY = 'sounds/music-loop';

const rig = (options: { locked?: boolean; decodes?: boolean } = {}) => {
    const cached = new Set<string>();
    const added: { key: string; config: unknown }[] = [];
    const played: string[] = [];
    let unlockHandler: (() => void) | undefined;
    const sound = {
        locked: options.locked ?? false,
        add: (key: string, config: unknown) => {
            added.push({ key, config });
            return { play: () => played.push('play'), stop: () => played.push('stop'), destroy: () => played.push('destroy') };
        },
        once: (_event: string, fn: () => void) => { unlockHandler = fn; },
        play: vi.fn(),
    };
    const game = { sound, cache: { audio: { exists: (k: string) => cached.has(k), get: () => undefined, add: vi.fn(), remove: vi.fn() } } } as unknown as Game;
    const queued: string[] = [];
    let complete: (() => void) | undefined;
    const load = {
        audio: (key: string) => { queued.push(key); },
        once: (event: string, fn: () => void) => { if (event === 'complete') complete = fn; },
        start: vi.fn(),
    } as unknown as Loader.LoaderPlugin;
    return {
        game, load, queued, added, played,
        finish: () => { if (options.decodes !== false) cached.add(KEY); complete?.(); },
        unlock: () => { sound.locked = false; unlockHandler?.(); },
    };
};

describe('music through the sound service', () => {
    it('does not load the music while it is off', () => {
        const r = rig();
        const service = createSoundService(r.game, { effects: true, music: false });
        service.attachLoader(r.load);
        expect(r.queued).toEqual([]);
        expect(service.status().music).toBe('off');
    });

    it('a preference saved as on loads at attach and plays after the file arrives', () => {
        const r = rig();
        const service = createSoundService(r.game, { effects: true, music: true });
        service.attachLoader(r.load);
        expect(r.queued).toEqual([KEY]);
        expect(service.status().music).toBe('loading');
        r.finish();
        expect(service.status().music).toBe('playing');
        expect(r.played).toContain('play');
    });

    it('turning the music on loads it once, and a second toggle during the load queues nothing more', () => {
        const r = rig();
        const service = createSoundService(r.game, { effects: true, music: false });
        service.attachLoader(r.load);
        service.setPrefs({ effects: true, music: true });
        service.setPrefs({ effects: true, music: true });
        expect(r.queued).toEqual([KEY]);
    });

    it('a file that is not in the cache after the load is missing, not playing', () => {
        const r = rig({ decodes: false });
        const service = createSoundService(r.game, { effects: true, music: true });
        service.attachLoader(r.load);
        r.finish();
        expect(service.status().music).toBe('missing');
        expect(r.played).not.toContain('play');
    });

    it('a locked audio context holds the start until it unlocks', () => {
        const r = rig({ locked: true });
        const service = createSoundService(r.game, { effects: true, music: true });
        service.attachLoader(r.load);
        r.finish();
        expect(r.played).not.toContain('play');
        r.unlock();
        expect(r.played).toContain('play');
        expect(service.status().music).toBe('playing');
    });

    it('turning the music off stops and destroys it; a music turned off while loading does not start', () => {
        const r = rig();
        const service = createSoundService(r.game, { effects: true, music: true });
        service.attachLoader(r.load);
        service.setPrefs({ effects: true, music: false });
        r.finish();
        expect(r.played).not.toContain('play');
        expect(service.status().music).toBe('off');
        service.setPrefs({ effects: true, music: true });
        expect(service.status().music).toBe('playing');
        service.setPrefs({ effects: true, music: false });
        expect(r.played).toEqual(expect.arrayContaining(['stop', 'destroy']));
        expect(service.status().music).toBe('off');
    });
});
