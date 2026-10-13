import { rawExportText } from '../../core/save';
import { pl } from '../../data/pl';

const isAbort = (error: unknown): boolean => typeof error === 'object' && error !== null && (error as { name?: string }).name === 'AbortError';

/**
 * Hands the raw stored save to the parent as a text file: the share sheet when the browser can share files
 * (iPad, Android), otherwise a download. Cancelling the sheet is silent; any other failure is logged and the
 * card stays. Never throws.
 */
export const exportRawSave = async (raw: unknown, nav: Navigator = navigator, doc: Document = document): Promise<void> => {
    try {
        const file = new File([rawExportText(raw)], pl.saveFailed.fileName, { type: 'text/plain' });
        if (typeof nav.canShare === 'function' && typeof nav.share === 'function' && nav.canShare({ files: [file] })) {
            try {
                await nav.share({ files: [file] });
                return;
            } catch (error) {
                if (isAbort(error)) return;
                console.error(error);   // fall through to the download
            }
        }
        const url = URL.createObjectURL(file);
        const link = doc.createElement('a');
        link.href = url;
        link.download = pl.saveFailed.fileName;
        doc.body.append(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch (error) {
        console.error(error);
    }
};
