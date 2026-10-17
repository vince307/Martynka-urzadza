// Origin: save-truth p11 (SVB-04, O2). Oracle: a timed-out write may or may not have landed, so the dialog must never
// say "Obecne postępy zostały bez zmian"; it says the game got no confirmation and to restart and check.
import { describe, expect, it } from 'vitest';
import { failureText, resetLead } from '../src/ui/dom/saveSummaryView';
import { pl } from '../src/data/pl';

const UNCONFIRMED = 'Gra nie dostała potwierdzenia zapisu. Uruchom grę ponownie i sprawdź postępy.';

describe('failureText (SVB-04)', () => {
    it.each([false, true])('a timeout (forced=%s) is not confirmed, never "bez zmian"', (forced) => {
        for (const error of ['timeout', 'TimeoutError']) {
            const text = failureText({ ok: false, error }, forced, pl.saveTransfer.resetFailed);
            expect(text).toBe(UNCONFIRMED);
            expect(text).not.toContain('bez zmian');
        }
    });
    it('a refusal or a rejected promise keeps the plain line', () => {
        expect(failureText({ ok: false, error: 'Busy' }, false, 'plain')).toBe('plain');
        expect(failureText({ ok: false, error: 'QuotaExceededError' }, false, 'plain')).toBe('plain');
        expect(failureText(null, true, 'plain')).toBe('plain');
        expect(failureText({ ok: false, error: 'Blocked' }, true, 'plain')).toBe('plain');
    });
    it('a forced store failure gives the site-data advice', () => {
        expect(failureText({ ok: false, error: 'QuotaExceededError' }, true, 'plain')).toBe(pl.saveTransfer.siteDataAdvice);
    });
});

describe('resetLead (O2)', () => {
    it('ends with a colon only when a list follows', () => {
        expect(resetLead(true)).toBe('Znikną wszystkie postępy z tego urządzenia:');
        expect(resetLead(false)).toBe('Znikną wszystkie postępy z tego urządzenia.');
    });
});
