import { isFatalSignal, noiseLine, type ErrorSignal } from '../../core/errorSignal';

const signalOfError = (event: ErrorEvent, origin: string): ErrorSignal => ({
    kind: 'error',
    message: event.message ?? '',
    hasError: event.error !== undefined && event.error !== null,
    name: event.error instanceof Error ? event.error.name : undefined,
    foreign: Boolean(event.filename) && !event.filename.startsWith(origin),
});

const signalOfRejection = (event: PromiseRejectionEvent): ErrorSignal => {
    const reason: unknown = event.reason;
    const isError = reason instanceof Error;
    // Old WebKit: a DOMException does not inherit from Error, but its name is what the decision reads.
    const named = isError || (typeof DOMException !== 'undefined' && reason instanceof DOMException);
    return {
        kind: 'rejection',
        message: named ? (reason as Error).message : String(reason),
        hasError: isError,
        name: named ? (reason as Error).name : undefined,
        foreign: false,
    };
};

/**
 * The one error boundary of the game, at the edge: window `error` and `unhandledrejection`
 * (bubbling phase, so failed resource loads do not count). The decision is core/errorSignal;
 * the original is logged to the console only, nothing leaves the device. `onFatal` runs once
 * per fatal event, never re-entered: a failure inside the handler is logged, not handled again.
 * Returns the function that removes the listeners.
 */
export const installErrorBoundary = (win: Window, onFatal: (error: unknown) => void): (() => void) => {
    let handling = false;
    const handle = (signal: ErrorSignal, original: unknown): void => {
        if (!isFatalSignal(signal)) {
            console.warn(signal.kind === 'rejection' ? noiseLine(signal) : `Ignored browser noise: ${signal.message}`);
            return;
        }
        console.error(original);
        if (handling) {
            return;
        }
        handling = true;
        try {
            onFatal(original);
        } catch (failure) {
            console.error(failure);
        } finally {
            handling = false;
        }
    };
    const onError = (event: ErrorEvent): void => handle(signalOfError(event, win.location.origin), event.error ?? event.message);
    const onRejection = (event: PromiseRejectionEvent): void => handle(signalOfRejection(event), event.reason);
    win.addEventListener('error', onError);
    win.addEventListener('unhandledrejection', onRejection);
    return () => {
        win.removeEventListener('error', onError);
        win.removeEventListener('unhandledrejection', onRejection);
    };
};
