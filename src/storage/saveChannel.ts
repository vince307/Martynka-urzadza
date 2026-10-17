// A hint between windows of the game (audit T-2): after a save landed, the writer and the generation are posted so a stale
// window learns at once instead of at its next write. The message is never stored, and it never decides anything alone:
// `channelVerdict` and `writeVerdict` (src/core/save.ts) do. Any failure (no BroadcastChannel, a throwing constructor or
// postMessage) leaves the channel a silent no-op, which is today's behaviour. The only place that touches BroadcastChannel.
export interface SaveChannelMessage {
    writer: string;
    generation: number;
}

export interface SaveChannel {
    post(msg: SaveChannelMessage): void;
    /** One listener; a malformed message never reaches it. */
    onMessage(listener: (msg: SaveChannelMessage) => void): void;
    close(): void;
}

export const SAVE_CHANNEL_NAME = 'martynka-save';

type ChannelCtor = new (name: string) => Pick<BroadcastChannel, 'postMessage' | 'close' | 'onmessage'>;

const NOOP: SaveChannel = { post: () => undefined, onMessage: () => undefined, close: () => undefined };

const isMessage = (data: unknown): data is SaveChannelMessage => {
    if (typeof data !== 'object' || data === null) return false;
    const { writer, generation } = data as { writer?: unknown; generation?: unknown };
    return typeof writer === 'string' && typeof generation === 'number' && Number.isInteger(generation) && generation >= 0;
};

export function createSaveChannel(ctor: ChannelCtor | undefined = typeof BroadcastChannel === 'function' ? BroadcastChannel : undefined): SaveChannel {
    if (typeof ctor !== 'function') return NOOP;
    try {
        const channel = new ctor(SAVE_CHANNEL_NAME);
        return {
            post: (msg) => {
                try {
                    channel.postMessage({ writer: msg.writer, generation: msg.generation });
                } catch {
                    // a closed or refused channel: the next write's guard still decides
                }
            },
            onMessage: (listener) => {
                channel.onmessage = (event) => {
                    if (isMessage(event.data)) listener({ writer: event.data.writer, generation: event.data.generation });
                };
            },
            close: () => {
                try {
                    channel.close();
                } catch {
                    // nothing to release
                }
            },
        };
    } catch {
        return NOOP;
    }
}
