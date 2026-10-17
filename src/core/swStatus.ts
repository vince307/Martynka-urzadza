// Runtime record of the service worker (audit P-1, B-8): is offline play ready, and did a newer build take over?
// Pure over plain events; the browser translation lives in src/pwa/registerServiceWorker.ts. Never saved.
export type SwPhase = 'unsupported' | 'registering' | 'installing' | 'ready' | 'install-failed' | 'register-failed';

export interface SwStatus {
    phase: SwPhase;
    /** Error name only (never a message); kept while an update fails behind an active worker. */
    error: string | null;
    /** A newer worker took control of a page that already had one. */
    takenOver: boolean;
    /** Bookkeeping of the reducer. */
    hadController: boolean;
    active: boolean;
    tracking: number | null;
}

export type SwEvent =
    | { type: 'unsupported' }
    | { type: 'register'; hadController: boolean }
    | { type: 'registerFailed'; error: string }
    | { type: 'installing'; id: number }
    | { type: 'waiting'; id: number }
    | { type: 'state'; id: number; state: 'installed' | 'activating' | 'activated' | 'redundant' }
    | { type: 'active'; id: number }
    | { type: 'controllerChange' };

export const initialSwStatus: SwStatus = { phase: 'registering', error: null, takenOver: false, hadController: false, active: false, tracking: null };

export const INSTALL_FAILED = 'InstallFailed';

export const stepSw = (status: SwStatus, event: SwEvent): SwStatus => {
    switch (event.type) {
        case 'unsupported':
            return { ...status, phase: 'unsupported' };
        case 'register':
            return { ...status, hadController: event.hadController, phase: status.active || event.hadController ? 'ready' : 'registering' };
        case 'registerFailed':
            return { ...status, phase: 'register-failed', error: event.error };
        case 'active':
            return { ...status, active: true, phase: status.tracking === null || status.phase === 'registering' ? 'ready' : status.phase };
        case 'installing':
            return { ...status, tracking: event.id, phase: status.active ? 'ready' : 'installing' };
        case 'waiting':   // a worker already installed when the page registered: tracked like an installing one
            return { ...status, tracking: event.id, phase: status.active ? 'ready' : 'installing' };
        case 'state': {
            if (event.id !== status.tracking) return status;   // an older worker replaced by a newer one is not a failure
            if (event.state === 'activated') return { ...status, active: true, tracking: null, phase: 'ready', error: null };
            if (event.state === 'redundant') {
                return status.active
                    ? { ...status, tracking: null, phase: 'ready', error: INSTALL_FAILED }
                    : { ...status, tracking: null, phase: 'install-failed', error: INSTALL_FAILED };
            }
            return status;
        }
        case 'controllerChange':
            return status.hadController ? { ...status, takenOver: true } : status;
    }
};

export type OfflineLine = 'ready' | 'installing' | 'failed' | 'updateFailed' | 'registerFailed' | 'unsupported';
export interface OfflineView {
    line: OfflineLine;
    code: string | null;
    takenOver: boolean;
}

const LINES: Record<SwPhase, OfflineLine> = {
    unsupported: 'unsupported',
    registering: 'installing',
    installing: 'installing',
    ready: 'ready',
    'install-failed': 'failed',
    'register-failed': 'registerFailed',
};

/** What the parent's panel shows: the line for the phase, the error name as the code, and whether a newer build took over. */
export const offlineView = (status: SwStatus): OfflineView => ({
    // A failed update behind an active worker is its own line (audit O-2): "ready" alone would hide it.
    line: status.phase === 'ready' && status.error !== null ? 'updateFailed' : LINES[status.phase],
    code: status.error,
    takenOver: status.takenOver,
});
