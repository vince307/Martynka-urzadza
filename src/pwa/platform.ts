// Pure helpers deciding whether to show the "add to home screen" hint.
// They take plain objects instead of touching globals, so they can be checked
// without a browser (node --experimental-strip-types, later vitest).

export type Platform = 'ipad' | 'iphone' | 'android' | 'other';

export interface NavigatorInfo {
    userAgent: string;
    platform: string;
    maxTouchPoints: number;
}

export interface WindowInfo {
    matchMedia: (query: string) => { matches: boolean };
    // `standalone` is iOS-only and absent from lib.dom; `userAgent` keeps the
    // type non-weak so a real `window` is assignable.
    navigator: { standalone?: boolean; userAgent: string };
}

/** iPadOS Safari reports a Mac user agent; the touch points give it away. */
export const detectPlatform = (nav: NavigatorInfo): Platform => {
    if (/iPad/.test(nav.userAgent) || (nav.platform === 'MacIntel' && nav.maxTouchPoints > 1)) {
        return 'ipad';
    }
    if (/iPhone|iPod/.test(nav.userAgent)) {
        return 'iphone';
    }
    if (/Android/.test(nav.userAgent)) {
        return 'android';
    }
    return 'other';
};

/** True when the game runs from a home-screen icon rather than a browser tab. */
export const isStandalone = (win: WindowInfo): boolean =>
    win.matchMedia('(display-mode: standalone)').matches ||
    win.matchMedia('(display-mode: fullscreen)').matches ||
    win.navigator.standalone === true;

/** The hint targets tablets only; desktops and installed apps never see it. */
export const shouldShowInstallHint = (platform: Platform, standalone: boolean): boolean =>
    (platform === 'ipad' || platform === 'android') && !standalone;
