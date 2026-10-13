/** A global error or unhandled rejection reduced to plain data (the browser event is read at the edge). */
export interface ErrorSignal {
    kind: 'error' | 'rejection';
    message: string;
    hasError: boolean;
    name?: string;
    foreign: boolean;
}

const QUIET_REJECTIONS = new Set(['AbortError', 'NotAllowedError']);

/** An error event without an error object that browsers raise for harmless reasons. */
const isOpaqueNoise = (message: string): boolean =>
    message === '' || message === 'Script error.' || message.startsWith('ResizeObserver loop');

/** True when the signal means the game broke (show the restart card); false for noise that must not interrupt a child. */
export const isFatalSignal = (signal: ErrorSignal): boolean => {
    if (signal.foreign) {
        return false;
    }
    if (signal.kind === 'rejection') {
        return signal.name === undefined || !QUIET_REJECTIONS.has(signal.name);
    }
    return signal.hasError || !isOpaqueNoise(signal.message);
};
