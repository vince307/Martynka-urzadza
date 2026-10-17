// Origin: change final-sound, phase 1. Oracles are typed here, not read from the code under test.
import { describe, expect, it } from 'vitest';
import { allEffectKeys, cueDelayMs, effectsLine, musicCause, musicLine, DEFAULT_SOUND_PREFS, parseSoundPrefs, parseSoundPrefsWithProblem, soundOutcome, trimFrameCount } from '../src/core/sound';
import { balance } from '../src/data/balance';
import { SOUNDS } from '../src/data/sounds';

const on = { effects: true, music: true };
const open = { locked: false, exists: true };

describe('sound prefs', () => {
    it('defaults to effects on and music off', () => {
        expect(DEFAULT_SOUND_PREFS).toEqual({ effects: true, music: false });
    });
    it('keeps a valid field and defaults the rest', () => {
        expect(parseSoundPrefs('{"effects":false}')).toEqual({ effects: false, music: false });
        expect(parseSoundPrefs({ music: 'yes' })).toEqual({ effects: true, music: false });
        expect(parseSoundPrefs({ music: true, effects: false })).toEqual({ effects: false, music: true });
    });
    it('falls back to defaults on garbage', () => {
        for (const raw of ['{', 42, null, undefined, '[]', 'null']) {
            expect(parseSoundPrefs(raw)).toEqual({ effects: true, music: false });
        }
    });
});

describe('soundOutcome', () => {
    it('plays when on, loaded and unlocked', () => {
        expect(soundOutcome('effect', on, open)).toBe('played');
        expect(soundOutcome('music', on, open)).toBe('played');
    });
    it('off wins over missing and locked', () => {
        const off = { effects: false, music: false };
        expect(soundOutcome('effect', off, { locked: true, exists: false })).toBe('off');
        expect(soundOutcome('music', { effects: true, music: false }, { locked: true, exists: true })).toBe('off');
    });
    it('uses the flag of its own kind', () => {
        expect(soundOutcome('effect', { effects: false, music: true }, open)).toBe('off');
        expect(soundOutcome('music', { effects: true, music: false }, open)).toBe('off');
    });
    it('missing wins over locked; locked when only the context is locked', () => {
        expect(soundOutcome('effect', on, { locked: true, exists: false })).toBe('missing');
        expect(soundOutcome('effect', on, { locked: true, exists: true })).toBe('locked');
    });
});

describe('trimFrameCount', () => {
    it('rounds the logical duration at the context rate', () => {
        expect(trimFrameCount(0.48, 48000, 30000)).toBe(23040);
        expect(trimFrameCount(0.48, 44100, 30000)).toBe(21168);
    });
    it('never exceeds the available frames', () => {
        expect(trimFrameCount(0.48, 48000, 20000)).toBe(20000);
    });
    it('keeps all frames for an unusable duration', () => {
        for (const d of [0, -1, Infinity, NaN]) expect(trimFrameCount(d, 44100, 999)).toBe(999);
    });
});

describe('cueDelayMs', () => {
    it('is cue length plus the gap only when the cue played', () => {
        expect(cueDelayMs('played', 1.4, 150)).toBe(1550);
        expect(cueDelayMs('played', 2.3, 150)).toBe(2450);
    });
    it('is 0 for every other outcome', () => {
        for (const o of ['off', 'locked', 'missing'] as const) expect(cueDelayMs(o, 1.4, 150)).toBe(0);
    });
});

describe('SOUNDS table', () => {
    const durations: Record<string, number> = {
        'answer-right': 0.48, 'answer-retry': 0.32, star: 0.23, 'round-bonus': 1.2, tap: 0.07, 'panel-open': 0.32,
        'variant-pick': 0.16, purchase: 0.76, 'room-done': 2.3, 'skill-unlock': 1.4, coin: 0.16, 'minigame-done': 1.5,
        'music-loop': 48,
    };
    it('has the 13 sounds of the manifest with unique ids', () => {
        expect(SOUNDS.map(s => s.id).sort()).toEqual(Object.keys(durations).sort());
        expect(new Set(SOUNDS.map(s => s.id)).size).toBe(13);
    });
    it('has the manifest durations, keys and m4a-then-ogg urls', () => {
        for (const s of SOUNDS) {
            expect(s.durationS).toBe(durations[s.id]);
            expect(s.key).toBe(`sounds/${s.id}`);
            expect(s.urls).toEqual([`assets/sounds/m4a/${s.id}.m4a`, `assets/sounds/ogg/${s.id}.ogg`]);
        }
    });
    it('loads 12 sounds at boot, all but the music', () => {
        expect(SOUNDS.filter(s => s.boot)).toHaveLength(12);
        expect(SOUNDS.find(s => s.id === 'music-loop')?.boot).toBe(false);
    });
});

describe('balance.sound', () => {
    it('holds the volumes and delays', () => {
        const b = balance.sound;
        expect([b.masterVolume, b.effectVolume, b.musicVolume]).toEqual([0.55, 0.65, 0.14]);
        expect([b.starDelayMs, b.speechGapMs, b.logSize]).toEqual([250, 150, 50]);
    });
    it('gives the 746 KB music file longer than it needs at 50 KB/s', () => {
        expect(balance.sound.musicLoadTimeoutMs).toBeGreaterThan((746014 / 50000) * 1000);
    });
});

describe('music status line', () => {
    const states = ['off', 'loading', 'waiting-unlock', 'playing', 'missing'] as const;
    it('shows nothing when music is switched off, whatever the state', () => {
        for (const state of states) expect(musicLine({ effects: true, music: false }, state)).toBeNull();
    });
    it('names downloading, waiting for a tap and a missing file apart', () => {
        expect(musicLine(on, 'loading')).toBe('loading');
        expect(musicLine(on, 'waiting-unlock')).toBe('waitingUnlock');
        expect(musicLine(on, 'missing')).toBe('missing');
    });
    it('shows nothing while the music plays or has not started', () => {
        expect(musicLine(on, 'playing')).toBeNull();
        expect(musicLine(on, 'off')).toBeNull();
    });
});

describe('locked context lines (audit M-1 / S-4, S-9)', () => {
    it('music waiting for the unlock says blocked from the threshold on, not before', () => {
        expect(musicLine(on, 'waiting-unlock', 2, 3)).toBe('waitingUnlock');
        expect(musicLine(on, 'waiting-unlock', 3, 3)).toBe('blocked');
        expect(musicLine(on, 'waiting-unlock', 9, 3)).toBe('blocked');
    });
    it('without a threshold the old line stays, and an off music shows nothing', () => {
        expect(musicLine(on, 'waiting-unlock')).toBe('waitingUnlock');
        expect(musicLine({ effects: true, music: false }, 'waiting-unlock', 9, 3)).toBeNull();
    });
    it('the effects line is blocked at the threshold and noDevice beats it', () => {
        expect(effectsLine({ lockedCount: 2, threshold: 3, device: 'webaudio' })).toBeNull();
        expect(effectsLine({ lockedCount: 3, threshold: 3, device: 'webaudio' })).toBe('blocked');
        expect(effectsLine({ lockedCount: 0, threshold: 3, device: 'none' })).toBe('noDevice');
        expect(effectsLine({ lockedCount: 7, threshold: 3, device: 'none' })).toBe('noDevice');
        expect(effectsLine({ lockedCount: 7, threshold: 3, device: 'html5' })).toBe('blocked');
    });
    it('the balance threshold is 3 touches', () => {
        expect(balance.sound.lockedTouches).toBe(3);
    });
});

describe('musicCause (audit S-5)', () => {
    it('names an http status, a timeout and an unknown failure', () => {
        expect(musicCause({ xhrLoader: { status: 404 } })).toBe('http:404');
        expect(musicCause({ xhrLoader: { status: 503 } })).toBe('http:503');
        expect(musicCause({ xhrLoader: { status: 0 } })).toBe('timeout');
        expect(musicCause({ xhrLoader: null })).toBe('timeout');
        expect(musicCause(undefined)).toBeNull();
    });
});

describe('allEffectKeys', () => {
    it('lists every effect of the table and never the music', () => {
        const table = [
            { key: 'sounds/a', boot: true },
            { key: 'sounds/b', boot: true },
            { key: 'sounds/music-loop', boot: false },
        ];
        expect(allEffectKeys(table)).toEqual(['sounds/a', 'sounds/b']);
    });
    it('covers the whole real table without the music key', () => {
        const keys = allEffectKeys(SOUNDS);
        expect(keys).toHaveLength(SOUNDS.length - 1);
        expect(keys).not.toContain('sounds/music-loop');
    });
});

describe('parseSoundPrefsWithProblem (audit S-7)', () => {
    it('names why a stored value was not used', () => {
        expect(parseSoundPrefsWithProblem('{bad').problem).toMatch(/not valid JSON/);
        expect(parseSoundPrefsWithProblem('[1]').problem).toMatch(/not an object/);
        expect(parseSoundPrefsWithProblem('{"effects":"yes","music":true}').problem).toMatch(/effects/);
    });
    it('has no problem for a good value or for nothing stored', () => {
        expect(parseSoundPrefsWithProblem('{"effects":true,"music":false}')).toEqual({ prefs: { effects: true, music: false }, problem: null });
        expect(parseSoundPrefsWithProblem(null).problem).toBeNull();
    });
    it('parseSoundPrefs gives the same prefs', () => {
        expect(parseSoundPrefs('{"effects":"x"}')).toEqual(parseSoundPrefsWithProblem('{"effects":"x"}').prefs);
    });
});
