// Writer identity of one page load (audit T-3). The id is `<tabId>:<nonce>`: the tab id is kept in sessionStorage so a reload is
// the same tab, the nonce is new per document. A document that ends records its nonce, so the next document can tell "my previous
// page" from "another window" (a duplicated tab copies sessionStorage but never the original's live nonce as ended).
// Best effort: any storage failure gives a fresh random id with no ended list, which is today's behaviour.
const KEY = 'martynka:writer';
const KEEP = 8;

export interface WriterId {
    writer: string;
    /** Full ids of this tab's earlier documents that ended (at most the last 8). */
    endedWriters: string[];
    /** Records this document's nonce as ended; called on `pagehide`. Never throws. */
    end(): void;
}

type WriterStorage = Pick<Storage, 'getItem' | 'setItem'>;
interface Stored {
    tabId: string;
    ended: string[];
}

const randomPart = (): string =>
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

const parse = (text: string | null): Stored | null => {
    if (text === null) return null;
    try {
        const value: unknown = JSON.parse(text);
        if (typeof value !== 'object' || value === null) return null;
        const { tabId, ended } = value as { tabId?: unknown; ended?: unknown };
        if (typeof tabId !== 'string' || tabId === '' || tabId.includes(':')) return null;
        if (!Array.isArray(ended) || !ended.every((n) => typeof n === 'string')) return null;
        return { tabId, ended: ended.slice(-KEEP) };
    } catch {
        return null;
    }
};

const sessionStore = (): WriterStorage | undefined => {
    try {
        return typeof sessionStorage === 'undefined' ? undefined : sessionStorage;
    } catch {
        return undefined;
    }
};

export function createWriterId(storage: WriterStorage | undefined = sessionStore(), random: () => string = randomPart): WriterId {
    let tabId = random();
    const nonce = random();
    let ended: string[] = [];
    let usable = false;
    try {
        const stored = storage ? parse(storage.getItem(KEY)) : null;
        if (stored) {
            tabId = stored.tabId;
            ended = stored.ended;
        }
        if (storage) {
            storage.setItem(KEY, JSON.stringify({ tabId, ended } satisfies Stored));
            usable = true;
        }
    } catch {
        // A storage that throws: a fresh id and no ended list.
        ended = [];
    }
    const end = (): void => {
        if (!usable || !storage) return;
        try {
            const now = parse(storage.getItem(KEY)) ?? { tabId, ended };
            if (now.ended.includes(nonce)) return;
            storage.setItem(KEY, JSON.stringify({ tabId: now.tabId, ended: [...now.ended, nonce].slice(-KEEP) } satisfies Stored));
        } catch {
            // Nothing to do: the next load simply does not know this document ended.
        }
    };
    return { writer: `${tabId}:${nonce}`, endedWriters: ended.map((n) => `${tabId}:${n}`), end };
}
