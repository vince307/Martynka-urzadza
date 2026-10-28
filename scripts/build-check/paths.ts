// Pure checks of a production build served under a path (Task 9: the landing page owns "/", the game lives
// under /graj/). Every URL the browser uses must stay inside the game's base, or the page, the manifest or the
// service worker reaches the landing page. Used by scripts/check-build.ts on dist/ after `npm run build`.
import type { CheckResult } from '../deploy-check/parse';

/** Path the game is served under; equals `base` in vite/config.shared.mjs. */
export const APP_BASE = '/graj/';

/** Every src/href value of index.html, in document order. */
export const htmlUrls = (html: string): string[] => [...html.matchAll(/\s(?:src|href)="([^"]*)"/g)].map((m) => m[1]);

/** Every `url` of the workbox precache manifest in sw.js, as written (workbox resolves them against sw.js). */
export const swPrecacheUrls = (sw: string): string[] => [...sw.matchAll(/url:"([^"]+)"/g)].map((m) => m[1]);

/** The navigation fallback URL of sw.js (literal or minified through a variable), or undefined. */
const navigationFallback = (sw: string): string | undefined =>
    /createHandlerBoundToURL\("([^"]+)"\)/.exec(sw)?.[1] ?? /([\w$]+)="([^"]+)",[\w$.()]*createHandlerBoundToURL\(\1\)/.exec(sw)?.[2];

/** A precache or fallback URL stays under the base: relative (resolved against base/sw.js) or absolute inside it. */
const insideBase = (url: string, base: string): boolean => (url.startsWith('/') ? url.startsWith(base) : !/^[a-z][a-z0-9+.-]*:/i.test(url));

const parseManifest = (text: string): Record<string, unknown> => {
    try {
        const parsed: unknown = JSON.parse(text);
        return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
    } catch {
        return {};
    }
};

const valueCheck = (name: string, value: unknown, expected: string): CheckResult => ({
    name,
    ok: value === expected,
    detail: `${JSON.stringify(value) ?? '(none)'}${value === expected ? '' : `, expected "${expected}"`}`,
});

export interface BuildFiles {
    manifest: string;
    html: string;
    sw: string;
}

export const checkBuildPaths = ({ manifest, html, sw }: BuildFiles, base: string): CheckResult[] => {
    const parsed = parseManifest(manifest);
    const icons = Array.isArray(parsed.icons) ? (parsed.icons as unknown[]) : [];
    const iconSrcs = icons.map((icon) => (icon && typeof icon === 'object' && 'src' in icon && typeof icon.src === 'string' ? icon.src : ''));
    // Icons are written relative to the manifest (no leading "/"), so the same manifest works under any base.
    const badIcons = iconSrcs.filter((src) => src === '' || src.startsWith('/') || /^[a-z][a-z0-9+.-]*:/i.test(src));

    const urls = htmlUrls(html);
    const outside = urls.filter((url) => !url.startsWith(base));

    const precache = swPrecacheUrls(sw);
    const badPrecache = precache.filter((url) => !insideBase(url, base));
    const fallback = navigationFallback(sw);

    return [
        valueCheck('manifest start_url', parsed.start_url, base),
        valueCheck('manifest scope', parsed.scope, base),
        {
            name: 'manifest icons',
            ok: iconSrcs.length > 0 && badIcons.length === 0,
            detail: iconSrcs.length === 0 ? 'no icons' : badIcons.length === 0 ? `${iconSrcs.length} relative icons` : `not relative: ${badIcons.join(', ')}`,
        },
        {
            name: 'index.html URLs',
            ok: urls.length > 0 && outside.length === 0,
            detail: urls.length === 0 ? 'no src/href found' : outside.length === 0 ? `${urls.length} URLs under ${base}` : `outside ${base}: ${outside.join(', ')}`,
        },
        {
            name: 'sw.js precache',
            ok: precache.length > 0 && badPrecache.length === 0,
            detail: precache.length === 0 ? 'no precache entries' : badPrecache.length === 0 ? `${precache.length} entries under ${base}` : `outside ${base}: ${badPrecache.join(', ')}`,
        },
        {
            name: 'sw.js navigation fallback',
            ok: fallback !== undefined && insideBase(fallback, base),
            detail: fallback === undefined ? 'none found' : `"${fallback}"`,
        },
    ];
};
