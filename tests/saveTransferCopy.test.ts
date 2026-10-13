// Origin: S-12 phase 5. Oracle: Polish numeral agreement (1 gwiazdka, 2 gwiazdki, 5 gwiazdek, 12 gwiazdek, 22 gwiazdki)
// and the rule that every import refusal says the current save is untouched.
import { describe, expect, it } from 'vitest';
import type { ImportRejection } from '../src/core/saveFile';
import { pl } from '../src/data/pl';

describe('pl.saveTransfer import copy', () => {
    it.each([
        [0, '0 gwiazdek'], [1, '1 gwiazdka'], [2, '2 gwiazdki'], [4, '4 gwiazdki'], [5, '5 gwiazdek'],
        [12, '12 gwiazdek'], [22, '22 gwiazdki'], [100, '100 gwiazdek'],
    ])('stars(%i)', (n, text) => {
        expect(pl.saveTransfer.stars(n)).toBe(text);
    });

    it('has a calm text for every rejection reason, each leaving the save untouched', () => {
        const reasons: ImportRejection[] = ['too-big', 'not-json', 'not-ours', 'corrupt', 'future', 'unknown-version'];
        for (const reason of reasons) {
            expect(pl.saveTransfer.rejected[reason]).toMatch(/Obecne postępy zostały bez zmian\.$/);
        }
        expect(pl.saveTransfer.rejected.future).toContain('Zaktualizuj grę');
    });

    it('formats a room line', () => {
        expect(pl.saveTransfer.room('Salon', 3, 10)).toBe('Salon: 3 z 10');
    });
});
