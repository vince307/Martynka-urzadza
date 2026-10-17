// Origin: S-12 phase 5. Oracle: Polish numeral agreement (1 gwiazdka, 2 gwiazdki, 5 gwiazdek, 12 gwiazdek, 22 gwiazdki)
// and the rule that every import refusal says the current save is untouched.
import { describe, expect, it } from 'vitest';
import type { ImportRejection } from '../src/core/saveFile';
import { pl } from '../src/data/pl';

describe('pl.saveTransfer export copy (save-truth p10)', () => {
    it('a download is only said to have started; an unexportable state has its own line', () => {
        expect(Object.keys(pl.saveTransfer.exportOutcome).sort()).toEqual(['cancelled', 'downloadStarted', 'failed', 'shared']);
        expect(pl.saveTransfer.exportOutcome.downloadStarted).toBe('Pobieranie pliku się zaczęło. Sprawdź folder Pobrane.');
        expect(pl.saveTransfer.exportInvalid).toBe('Tej kopii nie da się zapisać: stan gry jest uszkodzony.');
    });
});

describe('pl.saveTransfer import copy', () => {
    it.each([
        [0, '0 gwiazdek'], [1, '1 gwiazdka'], [2, '2 gwiazdki'], [4, '4 gwiazdki'], [5, '5 gwiazdek'],
        [12, '12 gwiazdek'], [22, '22 gwiazdki'], [100, '100 gwiazdek'],
    ])('stars(%i)', (n, text) => {
        expect(pl.saveTransfer.stars(n)).toBe(text);
    });

    it('has a calm text for every rejection reason, each leaving the save untouched', () => {
        const reasons: ImportRejection[] = ['too-big', 'not-json', 'not-ours', 'corrupt', 'future', 'unknown-version', 'migration-failed'];
        for (const reason of reasons) {
            expect(pl.saveTransfer.rejected[reason]).toMatch(/Obecne postępy zostały bez zmian\.$/);
        }
        expect(pl.saveTransfer.rejected.future).toContain('Zaktualizuj grę');
    });

    it('formats a room line', () => {
        expect(pl.saveTransfer.room('Salon', 3, 10)).toBe('Salon: 3 z 10');
        // Room names are lower case in data (they live inside sentences); the line starts with a capital (visual gate).
        expect(pl.saveTransfer.room('salon', 0, 10)).toBe('Salon: 0 z 10');
    });

    it('asks before a reset, advises a copy and keeps the destructive label off the cancel label', () => {
        expect(pl.saveTransfer.resetTitle).toMatch(/\?$/);
        expect(pl.saveTransfer.resetHint).toContain('zapisz kopię');
        expect(pl.saveTransfer.resetConfirm).not.toBe(pl.parent.cancel);
    });

    it('names the raw copy with a date and the file info with date and build (S12-14, S12-09)', () => {
        expect(pl.saveFailed.fileName('2026-10-14')).toBe('martynka-zapis-surowy-2026-10-14.txt');
        expect(pl.saveTransfer.fileInfo('14.10.2026', 'abc1234')).toBe('Kopia z 14.10.2026, wersja gry abc1234');
        expect(pl.saveTransfer.fileInfo(null, null)).toBe('');
        expect(pl.saveTransfer.fileInfo('14.10.2026', null)).toBe('Kopia z 14.10.2026');
        expect(pl.settings.saveMigrated.kept(1)).toBe('Zapis przeniesiono z wersji 1. Stara kopia została na tym urządzeniu.');
        expect(pl.settings.saveMigrated.lost(1)).toBe('Zapis przeniesiono z wersji 1, ale starej kopii nie udało się zachować.');
        expect(pl.settings.saveMigrated.uncertain(2)).toBe('Zapis przeniesiono z wersji 2. Nie wiadomo, czy stara kopia została zachowana.');
        expect(pl.settings.saveMigrated.pending(2)).toBe('Zapis jest przenoszony z wersji 2. Poczekaj chwilę.');
        expect(pl.settings.saveFailingTimeout).toBe('Zapis trwał za długo. Mógł się udać, gra spróbuje jeszcze raz.');
        expect(pl.settings.olderWriter).toBe('Starsza wersja gry zapisała tu postępy. Uruchom grę ponownie.');
        expect(pl.settings.saveFailingDetail(1, 'write', 'QuotaExceededError')).toBe('1 nieudana próba · zapis · Kod: QuotaExceededError');
        expect(pl.settings.saveFailingDetail(2, 'backup', 'X')).toBe('2 nieudane próby · kopia starego zapisu · Kod: X');
        expect(pl.settings.saveFailingDetail(5, 'replace', 'X')).toBe('5 nieudanych prób · zastąpienie zapisu · Kod: X');
    });
});
