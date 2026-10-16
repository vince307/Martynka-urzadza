/**
 * Name of the event Phaser's loader emits when one file is processed: `FILE_KEY_COMPLETE + type + '-' + key`.
 * `prefix` is `Loader.Events.FILE_KEY_COMPLETE`, which already ends in a dash, so no extra dash goes between it and the type.
 */
export function fileKeyCompleteEvent(prefix: string, type: string, key: string): string {
    return `${prefix}${type}-${key}`;
}
