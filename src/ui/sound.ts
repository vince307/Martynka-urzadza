import type { Game, Loader } from 'phaser';
import { cueDelayMs, soundOutcome, trimFrameCount, type Cue, type MusicState, type SoundId, type SoundOutcome, type SoundPrefs } from '../core/sound';
import { balance } from '../data/balance';
import { REGISTRY_KEYS } from '../data/layout';
import { SOUNDS } from '../data/sounds';

export interface SoundStatus {
    prefs: SoundPrefs;
    locked: boolean;
    log: readonly { id: SoundId; outcome: SoundOutcome }[];
    /** Cache keys of effects that did not load or decode. */
    missing: readonly string[];
    music: MusicState;
}

export interface SoundService {
    play(id: SoundId): SoundOutcome;
    setPrefs(prefs: SoundPrefs): void;
    prefs(): SoundPrefs;
    status(): SoundStatus;
    /** Called once by BootScene with the effects that are not in the cache. */
    setMissing(keys: readonly string[]): void;
    /**
     * Gives the service a loader that lives for the whole session (the HUD scene's). The music is fetched through it, and
     * only when the parent turned it on: at once when the saved preference already says on, otherwise at the toggle.
     */
    attachLoader(load: Loader.LoaderPlugin): void;
}

/**
 * The one place that plays sound. A missing, locked or throwing sound is an outcome and a warning, never an exception:
 * the game plays on without it. Effects never touch the narrator.
 */
export const createSoundService = (game: Game, initial: SoundPrefs): SoundService => {
    let current: SoundPrefs = { ...initial };
    let missing: readonly string[] = [];
    const log: { id: SoundId; outcome: SoundOutcome }[] = [];
    const record = (id: SoundId, outcome: SoundOutcome): SoundOutcome => {
        log.push({ id, outcome });
        if (log.length > balance.sound.logSize) log.shift();
        return outcome;
    };
    let musicState: SoundStatus['music'] = 'off';
    let loader: Loader.LoaderPlugin | undefined;
    let musicSound: { play(): unknown; stop(): unknown; destroy(): unknown } | undefined;
    const musicDef = SOUNDS.find((s) => s.id === 'music-loop');
    const locked = (): boolean => ('locked' in game.sound ? Boolean((game.sound as { locked?: boolean }).locked) : false);
    const stopMusic = (): void => {
        // A sound that exists was only waiting for the unlock: it ends as off. A download in flight (no sound yet)
        // stays "loading" so a second "on" does not queue the file twice.
        const waitingForUnlock = musicState === 'waiting-unlock';
        try {
            musicSound?.stop();
            musicSound?.destroy();
        } catch (error) {
            console.warn('Music did not stop cleanly', error);
        }
        musicSound = undefined;
        if (waitingForUnlock || musicState !== 'loading') musicState = 'off';
    };
    /** Starts the loop once the audio context allows it (a preference saved as on waits for the first gesture). */
    const playMusic = (): void => {
        if (!musicDef || !current.music || musicSound) return;
        try {
            const sound = game.sound.add(musicDef.key, { loop: true, volume: balance.sound.masterVolume * balance.sound.musicVolume });
            musicSound = sound;
            const start = (): void => {
                if (musicSound !== sound || !current.music) return;
                try {
                    sound.play();
                    musicState = 'playing';
                } catch (error) {
                    console.warn('Music failed to start', (error as Error).name);
                    musicState = 'missing';
                }
            };
            if (locked()) {
                musicState = 'waiting-unlock';
                game.sound.once('unlocked', start);
            } else start();
        } catch (error) {
            console.warn('Music failed to play', error);
            musicSound = undefined;
            musicState = 'missing';
        }
    };
    const startMusic = (): void => {
        if (!musicDef || !loader || !current.music || musicSound || musicState === 'loading') return;
        if (game.cache.audio.exists(musicDef.key)) {
            playMusic();
            return;
        }
        musicState = 'loading';
        const done = (): void => {
            // A decode failure fires no loaderror: the cache says whether the file is usable.
            if (!game.cache.audio.exists(musicDef.key) || trimOne(game, musicDef.key, musicDef.durationS)) {
                console.warn(`Music missing: ${musicDef.key}`);
                musicState = 'missing';
                return;
            }
            musicState = 'off';
            playMusic();
        };
        try {
            // Phaser gives each file its own xhr timeout of 0: the music's own limit is set as the file is queued.
            loader.once('addfile', (_key: string, _type: string, _loader: unknown, file: Loader.File) => { file.xhrSettings.timeout = balance.sound.musicLoadTimeoutMs; });
            loader.audio(musicDef.key, [...musicDef.urls]);
            loader.once('complete', done);
            loader.start();
        } catch (error) {
            console.warn('Music could not be queued', error);
            musicState = 'missing';
        }
    };
    return {
        play: (id) => {
            const def = SOUNDS.find((s) => s.id === id);
            if (!def) return record(id, 'missing');
            try {
                const outcome = soundOutcome('effect', current, { locked: locked(), exists: game.cache.audio.exists(def.key) });
                if (outcome === 'played') game.sound.play(def.key, { volume: balance.sound.masterVolume * balance.sound.effectVolume });
                return record(id, outcome);
            } catch (error) {
                console.warn(`Sound failed to play: ${id}`, error);
                return record(id, 'missing');
            }
        },
        setPrefs: (prefs) => {
            const wasOn = current.music;
            current = { ...prefs };
            if (wasOn && !current.music) stopMusic();
            if (!wasOn && current.music) startMusic();
        },
        attachLoader: (load) => {
            loader = load;
            startMusic();
        },
        prefs: () => ({ ...current }),
        status: () => ({ prefs: { ...current }, locked: locked(), log: [...log], missing, music: musicState }),
        setMissing: (keys) => { missing = [...keys]; },
    };
};

/**
 * Cuts the encoder padding off every loaded effect: a decoded buffer is copied to its logical length (trimFrameCount)
 * and put back in the cache under the same key. Returns the keys that could not be trimmed (counted as missing).
 */
export const trimEffects = (game: Game): string[] => {
    const failed: string[] = [];
    for (const def of SOUNDS) {
        if (def.boot && game.cache.audio.exists(def.key) && trimOne(game, def.key, def.durationS)) failed.push(def.key);
    }
    return failed;
};

/** Trims one cached buffer to its logical length. Returns true when it failed (the key is then removed from the cache). */
const trimOne = (game: Game, key: string, durationS: number): boolean => {
    try {
        const context = (game.sound as { context?: AudioContext }).context;
        const buffer = game.cache.audio.get(key) as AudioBuffer | undefined;
        if (!context || !buffer || typeof buffer.getChannelData !== 'function') return false;   // no Web Audio: nothing to trim
        const frames = trimFrameCount(durationS, buffer.sampleRate, buffer.length);
        if (frames >= buffer.length) return false;
        const cut = context.createBuffer(buffer.numberOfChannels, frames, buffer.sampleRate);
        for (let c = 0; c < buffer.numberOfChannels; c += 1) {
            cut.copyToChannel(buffer.getChannelData(c).subarray(0, frames), c);
        }
        game.cache.audio.add(key, cut);
        return false;
    } catch (error) {
        console.warn(`Sound trim failed: ${key}`, error);
        game.cache.audio.remove(key);   // an untrimmed effect would click; better none
        return true;
    }
};

/** The game's sound service, or undefined where none was made (tests, a failed start): callers then stay silent. */
export const soundOf = (registry: { get(key: string): unknown }): SoundService | undefined =>
    registry.get(REGISTRY_KEYS.sound) as SoundService | undefined;

/** Plays a cue now or after its delay on the scene clock (removed with the scene). */
export const playCues = (
    scene: { time: { delayedCall(ms: number, fn: () => void): unknown } },
    service: SoundService | undefined,
    cues: readonly Cue[],
): void => {
    if (!service) return;
    for (const cue of cues) {
        if (cue.delayMs <= 0) service.play(cue.id);
        else scene.time.delayedCall(cue.delayMs, () => service.play(cue.id));
    }
};

/**
 * Plays a cue that spoken text must wait for and returns how long the text waits (0 when the cue did not play or
 * there is no service). The narrator is never cut by an effect; the speech starts after it.
 */
export const playBeforeSpeech = (service: SoundService | undefined, id: SoundId): number => {
    if (!service) return 0;
    const def = SOUNDS.find((s) => s.id === id);
    return def ? cueDelayMs(service.play(id), def.durationS, balance.sound.speechGapMs) : 0;
};
