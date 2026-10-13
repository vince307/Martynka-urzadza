import { describe, expect, it } from 'vitest';
import { E2E_FORCED_FAILURE, e2eFail } from '../src/testing/e2eHook';

describe('e2eFail', () => {
    it('reads each of the three sites from the query string', () => {
        expect(e2eFail('?e2eFail=step')).toBe('step');
        expect(e2eFail('?a=1&e2eFail=boot')).toBe('boot');
        expect(e2eFail('?e2eFail=settings&b=2')).toBe('settings');
    });

    it('returns null for a missing, unknown, empty or wrongly cased value', () => {
        for (const search of ['', '?x=1', '?e2eFail=', '?e2eFail=welcome', '?e2eFail=STEP', '?e2eFail=step2', '?e2eFail=%20step']) {
            expect(e2eFail(search), search).toBeNull();
        }
    });

    it('uses the first of a repeated parameter', () => {
        expect(e2eFail('?e2eFail=boot&e2eFail=step')).toBe('boot');
        expect(e2eFail('?e2eFail=nope&e2eFail=step')).toBeNull();
    });

    it('names the thrown error with the guard marker', () => {
        expect(E2E_FORCED_FAILURE).toBe('e2e-forced-failure');
    });
});
