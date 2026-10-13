import { describe, expect, it } from 'vitest';
import { e2eSave } from '../src/testing/e2eHook';

describe('e2eSave', () => {
    it('reads unreadable from the query string', () => {
        expect(e2eSave('?e2eSave=unreadable')).toBe('unreadable');
        expect(e2eSave('?a=1&e2eSave=unreadable')).toBe('unreadable');
    });

    it('returns null for a missing or other value', () => {
        for (const search of ['', '?x=1', '?e2eSave=', '?e2eSave=x', '?e2eSave=UNREADABLE', '?e2eSave=unreadable1']) {
            expect(e2eSave(search), search).toBeNull();
        }
    });
});
