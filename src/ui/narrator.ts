// The narrator: reads a text aloud with the Polish system voice. It works on an
// injected speech synthesizer, utterance factory and timers, so it touches no
// browser global itself and tests run it on fakes (FR-009).
import { pickPolishVoice } from '../core/narration/voice';

export interface VoiceLike {
    lang: string;
    localService: boolean;
}

/** The part of SpeechSynthesisUtterance the narrator sets. */
export interface UtteranceLike {
    voice: unknown;
    lang: string;
    rate: number;
    onerror: ((event: unknown) => void) | null;
    onend: ((event: unknown) => void) | null;
}

/** The part of SpeechSynthesis the narrator needs. */
export interface SynthLike {
    getVoices(): VoiceLike[];
    speak(utterance: UtteranceLike): void;
    cancel(): void;
    addEventListener(type: 'voiceschanged', listener: () => void): void;
    removeEventListener(type: 'voiceschanged', listener: () => void): void;
}

export interface NarratorTimers {
    setTimeout(fn: () => void, ms: number): unknown;
    clearTimeout(handle: unknown): void;
    setInterval(fn: () => void, ms: number): unknown;
    clearInterval(handle: unknown): void;
}

export interface NarratorOptions {
    rate: number;
    voicePollMs: number;
    voiceTimeoutMs: number;
    cancelGapMs: number;
}

export interface Narrator {
    readonly available: boolean;
    /** Calls back now and whenever availability changes; returns an unsubscribe. */
    onAvailability(callback: (available: boolean) => void): () => void;
    speak(text: string): void;
    /** Speaks inside the user's gesture once; false while no Polish voice is known yet (try again on the next tap). */
    unlock(): boolean;
    cancel(): void;
}

export const createNarrator = (
    synth: SynthLike | undefined,
    makeUtterance: (text: string) => UtteranceLike,
    timers: NarratorTimers,
    options: NarratorOptions,
): Narrator => {
    let voice: VoiceLike | null = null;
    let pending: unknown = null;
    let unlocked = false;
    let current: UtteranceLike | null = null; // kept so the engine cannot drop the utterance before it ends
    const subscribers = new Set<(available: boolean) => void>();

    // A speech failure (not-allowed, interrupted, a throwing engine) must never block the game.
    const safely = (action: () => void): void => {
        try {
            action();
        } catch {
            // silent by design
        }
    };

    const refresh = (): void => {
        if (!synth) return;
        const before = voice !== null;
        safely(() => {
            voice = pickPolishVoice(synth.getVoices());
        });
        if (before !== (voice !== null)) subscribers.forEach((notify) => notify(voice !== null));
    };

    if (synth) {
        refresh();
        safely(() => synth.addEventListener('voiceschanged', refresh));
        if (!voice) {
            let waited = 0;
            const poll = timers.setInterval(() => {
                waited += options.voicePollMs;
                refresh();
                if (voice || waited >= options.voiceTimeoutMs) timers.clearInterval(poll);
            }, options.voicePollMs);
        }
    }

    const drop = (): void => {
        if (pending !== null) timers.clearTimeout(pending);
        pending = null;
    };

    const speakNow = (text: string): void => {
        if (!synth || !voice) return;
        const utterance = makeUtterance(text);
        utterance.voice = voice;
        utterance.lang = voice.lang;
        utterance.rate = options.rate;
        const release = (): void => {
            if (current === utterance) current = null;
        };
        utterance.onend = release;
        utterance.onerror = release;
        current = utterance;
        safely(() => synth.speak(utterance));
    };

    return {
        get available() {
            return voice !== null;
        },
        onAvailability(callback) {
            subscribers.add(callback);
            callback(voice !== null);
            return () => void subscribers.delete(callback);
        },
        speak(text) {
            if (!synth || !voice || text.trim() === '') return;
            drop();
            safely(() => synth.cancel());
            pending = timers.setTimeout(() => {
                pending = null;
                speakNow(text);
            }, options.cancelGapMs);
        },
        unlock() {
            if (unlocked) return true;
            if (!synth || !voice) return false;
            unlocked = true;
            speakNow('');
            return true;
        },
        cancel() {
            drop();
            if (synth) safely(() => synth.cancel());
        },
    };
};
