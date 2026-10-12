import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createNarrator, type NarratorOptions, type NarratorTimers, type SynthLike, type UtteranceLike, type VoiceLike } from '../src/ui/narrator';

// A fake synthesizer: the voice list is whatever the test sets, `voiceschanged`
// fires on demand, and every call is recorded. No real system voice is involved.
interface FakeVoice extends VoiceLike {
    name: string;
}
interface FakeUtterance extends UtteranceLike {
    text: string;
}

const makeSynth = (initial: FakeVoice[]) => {
    let voices = initial;
    const listeners = new Set<() => void>();
    const calls: string[] = [];
    const spoken: FakeUtterance[] = [];
    const synth: SynthLike = {
        getVoices: () => voices,
        speak: (u) => {
            calls.push(`speak:${(u as FakeUtterance).text}`);
            spoken.push(u as FakeUtterance);
        },
        cancel: () => {
            calls.push('cancel');
        },
        addEventListener: (_type, listener) => void listeners.add(listener),
        removeEventListener: (_type, listener) => void listeners.delete(listener),
    };
    return {
        synth,
        calls,
        spoken,
        listenerCount: () => listeners.size,
        setVoices: (next: FakeVoice[]) => {
            voices = next;
        },
        fireVoicesChanged: () => listeners.forEach((l) => l()),
    };
};

const makeUtterance = (text: string): FakeUtterance => ({ text, voice: null, lang: '', rate: 1, onerror: null, onend: null });
const timers: NarratorTimers = {
    setTimeout: (fn, ms) => setTimeout(fn, ms),
    clearTimeout: (h) => clearTimeout(h as ReturnType<typeof setTimeout>),
    setInterval: (fn, ms) => setInterval(fn, ms),
    clearInterval: (h) => clearInterval(h as ReturnType<typeof setInterval>),
};
const options: NarratorOptions = { rate: 0.85, voicePollMs: 250, voiceTimeoutMs: 3000, cancelGapMs: 80 };

// Android spells the tag with an underscore; desktop Chromium has no list until the event.
const android: FakeVoice[] = [
    { name: 'English', lang: 'en_US', localService: true },
    { name: 'Polish', lang: 'pl_PL', localService: true },
];

beforeEach(() => void vi.useFakeTimers());
afterEach(() => void vi.useRealTimers());

describe('voice detection', () => {
    it('is available at once when the list already has a Polish voice (Android pl_PL)', () => {
        const fake = makeSynth(android);
        expect(createNarrator(fake.synth, makeUtterance, timers, options).available).toBe(true);
    });

    it('starts unavailable on an empty list and becomes available on voiceschanged (Chromium)', () => {
        const fake = makeSynth([]);
        const narrator = createNarrator(fake.synth, makeUtterance, timers, options);
        const seen: boolean[] = [];
        narrator.onAvailability((a) => seen.push(a));
        expect(narrator.available).toBe(false);
        fake.setVoices(android);
        fake.fireVoicesChanged();
        expect(narrator.available).toBe(true);
        expect(seen).toEqual([false, true]);
    });

    it('finds a voice that appears without any event, by polling', () => {
        const fake = makeSynth([]);
        const narrator = createNarrator(fake.synth, makeUtterance, timers, options);
        vi.advanceTimersByTime(500);
        fake.setVoices(android);
        vi.advanceTimersByTime(250);
        expect(narrator.available).toBe(true);
    });

    it('gives up after the timeout, stops polling, but a later voiceschanged still enables it', () => {
        const fake = makeSynth([{ name: 'English', lang: 'en-US', localService: true }]);
        const narrator = createNarrator(fake.synth, makeUtterance, timers, options);
        vi.advanceTimersByTime(3000);
        expect(narrator.available).toBe(false);
        expect(vi.getTimerCount()).toBe(0);
        fake.setVoices(android);
        fake.fireVoicesChanged();
        expect(narrator.available).toBe(true);
    });

    it('reports availability only on change, and unsubscribe stops the callbacks', () => {
        const fake = makeSynth([]);
        const narrator = createNarrator(fake.synth, makeUtterance, timers, options);
        const seen: boolean[] = [];
        const off = narrator.onAvailability((a) => seen.push(a));
        fake.fireVoicesChanged();
        fake.fireVoicesChanged();
        expect(seen).toEqual([false]);
        off();
        fake.setVoices(android);
        fake.fireVoicesChanged();
        expect(seen).toEqual([false]);
    });

    it('without a synthesizer it is never available and every call is a no-op', () => {
        const narrator = createNarrator(undefined, makeUtterance, timers, options);
        expect(narrator.available).toBe(false);
        expect(() => {
            narrator.speak('Oblicz.');
            narrator.unlock();
            narrator.cancel();
        }).not.toThrow();
        vi.advanceTimersByTime(5000);
        expect(narrator.available).toBe(false);
    });
});

describe('speak', () => {
    it('cancels first, speaks after the gap with the Polish voice, its lang and the rate', () => {
        const fake = makeSynth(android);
        const narrator = createNarrator(fake.synth, makeUtterance, timers, options);
        narrator.speak('Oblicz. dwa plus trzy');
        expect(fake.calls).toEqual(['cancel']);
        vi.advanceTimersByTime(80);
        expect(fake.calls).toEqual(['cancel', 'speak:Oblicz. dwa plus trzy']);
        const [utterance] = fake.spoken;
        expect(utterance.voice).toBe(android[1]);
        expect(utterance.lang).toBe('pl_PL');
        expect(utterance.rate).toBe(0.85);
    });

    it('only the last of two quick calls is spoken', () => {
        const fake = makeSynth(android);
        const narrator = createNarrator(fake.synth, makeUtterance, timers, options);
        narrator.speak('pierwsze');
        vi.advanceTimersByTime(30);
        narrator.speak('drugie');
        vi.advanceTimersByTime(500);
        expect(fake.calls.filter((c) => c.startsWith('speak:'))).toEqual(['speak:drugie']);
    });

    it('cancel drops a pending utterance and cancels the synthesizer', () => {
        const fake = makeSynth(android);
        const narrator = createNarrator(fake.synth, makeUtterance, timers, options);
        narrator.speak('x');
        narrator.cancel();
        vi.advanceTimersByTime(500);
        expect(fake.calls.filter((c) => c.startsWith('speak:'))).toEqual([]);
        expect(fake.calls.at(-1)).toBe('cancel');
    });

    it('says nothing when no Polish voice is known', () => {
        const fake = makeSynth([{ name: 'English', lang: 'en-US', localService: true }]);
        const narrator = createNarrator(fake.synth, makeUtterance, timers, options);
        narrator.speak('x');
        vi.advanceTimersByTime(500);
        expect(fake.calls).toEqual([]);
    });

    it('swallows a throwing synthesizer and a speech error event', () => {
        const fake = makeSynth(android);
        const narrator = createNarrator(fake.synth, makeUtterance, timers, options);
        narrator.speak('x');
        vi.advanceTimersByTime(80);
        expect(() => fake.spoken[0].onerror?.({ error: 'not-allowed' })).not.toThrow();
        fake.synth.speak = () => {
            throw new Error('boom');
        };
        fake.synth.cancel = () => {
            throw new Error('boom');
        };
        expect(() => {
            narrator.speak('y');
            vi.advanceTimersByTime(80);
            narrator.cancel();
            narrator.unlock();
        }).not.toThrow();
    });

    it('ignores empty text', () => {
        const fake = makeSynth(android);
        const narrator = createNarrator(fake.synth, makeUtterance, timers, options);
        narrator.speak('   ');
        vi.advanceTimersByTime(500);
        expect(fake.calls).toEqual([]);
    });
});

describe('unlock', () => {
    it('speaks one empty utterance directly and only once', () => {
        const fake = makeSynth(android);
        const narrator = createNarrator(fake.synth, makeUtterance, timers, options);
        expect(narrator.unlock()).toBe(true);
        expect(narrator.unlock()).toBe(true);
        expect(fake.calls).toEqual(['speak:']);
    });

    it('reports a tap before the voices load as not unlocked, so the next tap can try again', () => {
        const fake = makeSynth([]);
        const narrator = createNarrator(fake.synth, makeUtterance, timers, options);
        expect(narrator.unlock()).toBe(false);
        expect(fake.calls).toEqual([]);
        fake.setVoices(android);
        fake.fireVoicesChanged();
        expect(narrator.unlock()).toBe(true);
        expect(fake.calls).toEqual(['speak:']);
    });
});
