import { describe, expect, it } from 'vitest';
import { balance } from '../src/data/balance';
import { defaultAutoRead, effectiveAutoRead, isPolishLang, pickPolishVoice } from '../src/core/narration/voice';

const voice = (lang: string, localService: boolean, name = lang) => ({ lang, localService, name });

describe('isPolishLang', () => {
    it('accepts pl-PL, Android pl_PL, upper case and a bare pl', () => {
        for (const lang of ['pl-PL', 'pl_PL', 'PL', 'pl', 'PL-pl']) expect(isPolishLang(lang), lang).toBe(true);
    });

    it('rejects other languages, including ones that merely start with p or contain pl', () => {
        for (const lang of ['en-US', 'pt-BR', 'plx', 'cs-CZ', 'en-PL', '']) expect(isPolishLang(lang), lang).toBe(false);
    });
});

describe('pickPolishVoice', () => {
    it('returns null for an empty list and for a list without Polish', () => {
        expect(pickPolishVoice([])).toBeNull();
        expect(pickPolishVoice([voice('en-US', true), voice('de-DE', true)])).toBeNull();
    });

    it('finds the Polish voice whatever the tag spelling', () => {
        for (const lang of ['pl-PL', 'pl_PL', 'PL']) {
            const pl = voice(lang, true, 'Zosia');
            expect(pickPolishVoice([voice('en-US', true), pl])).toBe(pl);
        }
    });

    it('prefers a local voice over a network one, wherever it stands in the list', () => {
        const network = voice('pl-PL', false, 'Google polski');
        const local = voice('pl_PL', true, 'Zosia');
        expect(pickPolishVoice([network, local])).toBe(local);
        expect(pickPolishVoice([local, network])).toBe(local);
    });

    it('takes a network-only Polish voice when it is the only one', () => {
        const network = voice('pl-PL', false);
        expect(pickPolishVoice([voice('en-US', true), network])).toBe(network);
    });

    it('keeps list order among equals', () => {
        const a = voice('pl-PL', true, 'A');
        const b = voice('pl-PL', true, 'B');
        expect(pickPolishVoice([a, b])).toBe(a);
    });
});

describe('defaultAutoRead', () => {
    const stages = ['E1', 'E2'];

    it('is on for E1 and E2 and off from E3 on', () => {
        expect(['E1', 'E2', 'E3', 'E4', 'E5', 'E6'].map((s) => defaultAutoRead(s, stages))).toEqual([true, true, false, false, false, false]);
    });

    it('is off for an unknown stage and for an empty list', () => {
        expect(defaultAutoRead('X9', stages)).toBe(false);
        expect(defaultAutoRead('E1', [])).toBe(false);
    });
});

describe('effectiveAutoRead', () => {
    const stages = ['E1', 'E2'];

    it('falls back to the stage default while the parent has not chosen (null)', () => {
        expect(effectiveAutoRead({ autoRead: null }, 'E1', stages)).toBe(true);
        expect(effectiveAutoRead({ autoRead: null }, 'E3', stages)).toBe(false);
    });

    it('lets the parent choice win at every stage', () => {
        expect(effectiveAutoRead({ autoRead: false }, 'E1', stages)).toBe(false);
        expect(effectiveAutoRead({ autoRead: true }, 'E4', stages)).toBe(true);
        expect(effectiveAutoRead({ autoRead: true }, 'E1', stages)).toBe(true);
        expect(effectiveAutoRead({ autoRead: false }, 'E6', stages)).toBe(false);
    });
});

describe('auto-read default (F-01)', () => {
    it('is off for every stage unless the parent turns it on', () => {
        expect(balance.narrator.autoReadStages).toEqual([]);
        for (const s of ['E1', 'E2', 'E3', 'E4', 'E5', 'E6']) {
            expect(effectiveAutoRead({ autoRead: null }, s, balance.narrator.autoReadStages), s).toBe(false);
            expect(effectiveAutoRead({ autoRead: true }, s, balance.narrator.autoReadStages), s).toBe(true);
        }
    });
});
