// Music through the service (S-16b phase 7, plan-review F6): lazy load, start after a reload, state from the cache.
import { describe, expect, it, vi } from 'vitest';
import type { Game, Loader } from 'phaser';
import { createSoundService } from '../src/ui/sound';

const KEY = 'sounds/music-loop';

const rig = (options: { locked?: boolean; decodes?: boolean; device?: 'webaudio' | 'html5' | 'none'; playThrows?: boolean } = {}) => {
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
        play: options.playThrows ? vi.fn(() => { throw new Error('boom'); }) : vi.fn(),
        ...(options.device === 'none' || options.device === 'html5' ? {} : { context: {} }),
    };
    const game = { sound, device: { audio: { audioData: options.device !== 'none' } }, cache: { audio: { exists: (k: string) => cached.has(k), get: () => undefined, add: vi.fn(), remove: vi.fn() } } } as unknown as Game;
    const queued: string[] = [];
    let complete: (() => void) | undefined;
    const handlers: { event: string; fn: (file: unknown) => void }[] = [];
    const load = {
        audio: (key: string) => { queued.push(key); },
        once: (event: string, fn: () => void) => { if (event === 'complete') complete = fn; },
        on: (event: string, fn: (file: unknown) => void) => { handlers.push({ event, fn }); },
        off: (event: string, fn: (file: unknown) => void) => { const i = handlers.findIndex((h) => h.event === event && h.fn === fn); if (i >= 0) handlers.splice(i, 1); },
        start: vi.fn(),
    } as unknown as Loader.LoaderPlugin;
    return {
        game, load, queued, added, played,
        handlers,
        fail: (file: unknown) => { for (const h of [...handlers]) if (h.event === 'loaderror') h.fn(file); },
        cache: cached,
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

    // S-16b impl review: a music waiting for the unlock and turned off must not stay "loading" and block the next "on".
    it('turned off while waiting for the unlock, the music is off and starts again at the next on', () => {
        const r = rig({ locked: true });
        const service = createSoundService(r.game, { effects: true, music: true });
        service.attachLoader(r.load);
        r.finish();
        service.setPrefs({ effects: true, music: false });
        expect(service.status().music).toBe('off');
        service.setPrefs({ effects: true, music: true });
        r.unlock();
        expect(service.status().music).toBe('playing');
        expect(r.played.filter((p) => p === 'play')).toHaveLength(1);
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

// Audit S-5: the music error names its cause; the keyed listeners on the shared HUD loader go away in every done path.
describe('music failure cause', () => {
    it('a 404 on the music file is http:404 and the listeners are gone after the load', () => {
        const r = rig({ decodes: false });
        const service = createSoundService(r.game, { effects: true, music: true });
        service.attachLoader(r.load);
        r.fail({ key: KEY, xhrLoader: { status: 404 } });
        r.finish();
        expect(service.status().music).toBe('missing');
        expect(service.status().musicError).toBe('http:404');
        expect(r.handlers).toEqual([]);
    });
    it('a loaderror of another file is not the music cause', () => {
        const r = rig({ decodes: false });
        const service = createSoundService(r.game, { effects: true, music: true });
        service.attachLoader(r.load);
        r.fail({ key: 'something/else', xhrLoader: { status: 500 } });
        r.finish();
        expect(service.status().musicError).toBe('decode');
    });
    it('a file that arrived but is not in the cache is decode, a good start has no error', () => {
        const bad = rig({ decodes: false });
        const a = createSoundService(bad.game, { effects: true, music: true });
        a.attachLoader(bad.load);
        bad.finish();
        expect(a.status().musicError).toBe('decode');
        const good = rig();
        const b = createSoundService(good.game, { effects: true, music: true });
        b.attachLoader(good.load);
        good.finish();
        expect(b.status().musicError).toBeNull();
        expect(good.handlers).toEqual([]);
    });
});

// Audit M-1 / S-4 and S-9: how often a locked context swallowed an effect, and what kind of audio the device has.
describe('locked touches and device', () => {
    const play = (r: ReturnType<typeof rig>, n: number) => {
        r.cache.add('sounds/tap');
        const service = createSoundService(r.game, { effects: true, music: false });
        for (let i = 0; i < n; i += 1) service.play('tap');
        return service;
    };
    it('counts every effect a locked context swallowed', () => {
        expect(play(rig({ locked: true }), 3).status().lockedCount).toBe(3);
        expect(play(rig({ locked: false }), 3).status().lockedCount).toBe(0);
    });
    it('names the device audio: web audio, html5, none', () => {
        expect(createSoundService(rig().game, { effects: true, music: false }).status().device).toBe('webaudio');
        expect(createSoundService(rig({ device: 'html5' }).game, { effects: true, music: false }).status().device).toBe('html5');
        expect(createSoundService(rig({ device: 'none' }).game, { effects: true, music: false }).status().device).toBe('none');
    });
});

// Audit S-9 / S-10: an effect that throws joins the missing set once and warns once.
describe('an effect that throws', () => {
    it('warns once per id however often it is played, and its key is missing', () => {
        const r = rig({ playThrows: true });
        r.cache.add('sounds/tap');
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        const service = createSoundService(r.game, { effects: true, music: false });
        expect(service.play('tap')).toBe('missing');
        service.play('tap');
        expect(warn.mock.calls.filter((c) => String(c[0]).includes('tap'))).toHaveLength(1);
        expect(service.status().missing).toEqual(['sounds/tap']);
        service.setMissing(['sounds/star']);
        service.play('tap');
        expect(service.status().missing).toEqual(['sounds/star', 'sounds/tap']);
        warn.mockRestore();
    });
});
