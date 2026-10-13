// Reference-counted input suspension (S-08, plan "Wstrzymanie wejścia"): the
// target (the game's input manager) is enabled again only when the count
// returns to zero. `onRelease` runs once per return to zero, before the target
// is re-enabled (plan-review F1: a touchend lost while input was off must be
// cleaned up by the caller, e.g. by resetting the pointers).
export interface InputSuspender {
    /** Suspends input; the returned function releases this hold (idempotent). */
    suspend(): () => void;
    suspended(): boolean;
}

export const createInputSuspender = (target: { enabled: boolean }, onRelease?: () => void): InputSuspender => {
    let count = 0;
    return {
        suspend: () => {
            count += 1;
            target.enabled = false;
            let released = false;
            return () => {
                if (released) return;
                released = true;
                count -= 1;
                if (count === 0) {
                    // The input must come back even when onRelease throws (the error still propagates).
                    try {
                        onRelease?.();
                    } finally {
                        target.enabled = true;
                    }
                }
            };
        },
        suspended: () => count > 0,
    };
};

export interface InputSession {
    run<T>(fn: () => T): T;
    end(): void;
    active(): boolean;
}

// A scene-held hold on the input switch: opens on creation, ends at most once, and
// `run` ends it when the wrapped callback throws, so a failing dialog callback can
// never leave touch dead.
export const openInputSession = (suspender: InputSuspender): InputSession => {
    let resume: (() => void) | undefined = suspender.suspend();
    const end = (): void => {
        const release = resume;
        resume = undefined;
        release?.();
    };
    return {
        run: <T>(fn: () => T): T => {
            try {
                return fn();
            } catch (error) {
                end();
                throw error;
            }
        },
        end,
        active: () => resume !== undefined,
    };
};
