// Pure helpers for the deploy smoke check (scripts/check-deploy.ts): what a
// healthy release looks like from outside, without any network code.

export interface CheckResult {
    name: string;
    ok: boolean;
    detail: string;
}

/** Hashed bundles referenced by index.html: "/_app/index-<hash>.js", "/_app/index-<hash>.css". */
export const bundlesFromHtml = (html: string): string[] => {
    const found = new Set<string>();
    for (const m of html.matchAll(/(?:src|href)="(\/_app\/[^"]+\.(?:js|css))"/g)) {
        found.add(m[1]);
    }
    return [...found];
};

/** URLs listed in the service worker precache manifest, normalised to leading "/". */
export const precacheFromSw = (sw: string): string[] => {
    const found = new Set<string>();
    for (const m of sw.matchAll(/url:"([^"]+)"/g)) {
        found.add(m[1].startsWith('/') ? m[1] : `/${m[1]}`);
    }
    return [...found];
};

/** True when the bundle text carries the build id literal injected by Vite (`__BUILD_ID__`). */
export const hasBuildId = (js: string, sha7: string): boolean => js.includes(`"${sha7}"`);

export const compareBundles = (fromHtml: string[], precache: string[]): CheckResult => {
    const missing = fromHtml.filter((b) => !precache.includes(b));
    return {
        name: 'precache covers index.html bundles',
        ok: fromHtml.length > 0 && missing.length === 0,
        detail: fromHtml.length === 0 ? 'no bundles found in index.html' : missing.length === 0 ? `${fromHtml.length} bundles` : `missing: ${missing.join(', ')}`,
    };
};

export const cacheControlCheck = (name: string, header: string | null, expected: 'no-cache' | 'immutable'): CheckResult => {
    const value = header ?? '';
    const ok = expected === 'no-cache' ? /\bno-cache\b/.test(value) : /\bimmutable\b/.test(value) && /max-age=\d{6,}/.test(value);
    return { name: `${name}: cache-control ${expected}`, ok, detail: value || '(no header)' };
};

export const contentTypeCheck = (name: string, header: string | null, prefix: string): CheckResult => ({
    name: `${name}: content-type ${prefix}`,
    ok: (header ?? '').toLowerCase().startsWith(prefix),
    detail: header ?? '(no header)',
});
