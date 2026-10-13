import { pl } from '../../data/pl';

export type ExportOutcome = 'shared' | 'downloaded' | 'cancelled' | 'failed';

const isAbort = (error: unknown): boolean => typeof error === 'object' && error !== null && (error as { name?: string }).name === 'AbortError';

/**
 * Hands a save text to the parent as a file: the share sheet when the browser can share files (iPad, Android),
 * otherwise a download. Called from the tap on "Zapisz plik" (the share sheet needs a user gesture), so the File is
 * built synchronously first. Cancelling the sheet is "cancelled"; any other failure is logged and is "failed". Never throws.
 */
// DESIGN-GAP 44 (docs/design-gaps.md): the kit does not say how a parent keeps a copy; a .txt through the share sheet first.
export const saveFileToDevice = async (text: string, fileName: string, nav: Navigator = navigator, doc: Document = document): Promise<ExportOutcome> => {
    try {
        const file = new File([text], fileName, { type: 'text/plain' });
        if (typeof nav.canShare === 'function' && typeof nav.share === 'function' && nav.canShare({ files: [file] })) {
            try {
                await nav.share({ files: [file] });
                return 'shared';
            } catch (error) {
                if (isAbort(error)) return 'cancelled';
                console.error(error);   // fall through to the download
            }
        }
        const url = URL.createObjectURL(file);
        const link = doc.createElement('a');
        link.href = url;
        link.download = fileName;
        doc.body.append(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 0);
        return 'downloaded';
    } catch (error) {
        console.error(error);
        return 'failed';
    }
};

/** Name of the raw copy of an unreadable save (kept stable; the current save gets a dated name from pl.saveTransfer). */
export const RAW_FILE_NAME = pl.saveFailed.fileName;
