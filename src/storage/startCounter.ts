/** A device counter outside the save (SRR-08): consecutive starts on which the save store would not answer. The save format stays as it is. */
export const UNAVAILABLE_STARTS_KEY = 'martynka:unavailableStarts';

type CounterStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export interface StartCounter {
    /** 0 when nothing is stored, the value is not a count, or the storage throws. */
    read(): number;
    /** Adds one and returns the new count; with a storage that cannot keep it, returns 1 (a blocked store never shows a second start). */
    bump(): number;
    reset(): void;
}

export const createStartCounter = (storage: CounterStorage | undefined): StartCounter => {
    const read = (): number => {
        try {
            const raw = storage?.getItem(UNAVAILABLE_STARTS_KEY) ?? null;
            return raw !== null && /^\d+$/.test(raw) ? Number(raw) : 0;
        } catch (error) {
            console.warn('Start counter not readable; reading 0', error);
            return 0;
        }
    };
    return {
        read,
        bump: () => {
            const next = read() + 1;
            try {
                storage?.setItem(UNAVAILABLE_STARTS_KEY, String(next));
            } catch (error) {
                console.warn('Start counter not saved', error);
            }
            return next;
        },
        reset: () => {
            try {
                storage?.removeItem(UNAVAILABLE_STARTS_KEY);
            } catch (error) {
                console.warn('Start counter not reset', error);
            }
        },
    };
};
