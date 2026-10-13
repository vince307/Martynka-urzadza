/**
 * Whether the child (or the device) asked for less motion. Read at the moment
 * an animation would start, not once per session: the setting can change while
 * the game runs. Without matchMedia, or when it throws, motion stays on.
 */
export function prefersReducedMotion(win: Pick<Window, 'matchMedia'> | undefined = globalThis.window): boolean {
    try {
        return win?.matchMedia('(prefers-reduced-motion: reduce)').matches === true;
    } catch {
        return false;
    }
}
