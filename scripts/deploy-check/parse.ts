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

/** Every expected room picture must be in the precache; a leading slash on either side is ignored. */
export const roomArtCheck = (precache: readonly string[], expectedUrls: readonly string[]): CheckResult => {
    const have = new Set(precache.map((u) => u.replace(/^\//, '')));
    const missing = expectedUrls.filter((u) => !have.has(u.replace(/^\//, '')));
    const found = expectedUrls.length - missing.length;
    return {
        name: 'precache covers room pictures',
        ok: expectedUrls.length > 0 && missing.length === 0,
        detail: `${found} of ${expectedUrls.length} room pictures precached${missing.length > 0 ? `; first missing: ${missing[0]}` : ''}`,
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

export interface EntryVerdict {
    url: string;
    ok: boolean;
    reason: string;
    status: number;
    type: string;
}

/** Media type per precached extension (matched before ";"); other extensions are checked by status only. */
export const EXPECTED_TYPES: Readonly<Record<string, string>> = {
    js: 'text/javascript',
    css: 'text/css',
    html: 'text/html',
    png: 'image/png',
    webp: 'image/webp',
    webmanifest: 'application/manifest+json',
    ttf: 'font/ttf',
    m4a: 'audio/mp4',
    ogg: 'audio/ogg',
};

const extensionOf = (url: string): string => /\.([a-z0-9]+)$/i.exec(url)?.[1].toLowerCase() ?? '';

/** Verdict for one precache entry from a HEAD response; status 0 means the request timed out or failed. */
export const entryVerdict = (url: string, status: number, contentType: string | null, location: string | null): EntryVerdict => {
    const type = (contentType ?? '').split(';')[0].trim().toLowerCase();
    const result = (ok: boolean, reason: string): EntryVerdict => ({ url, ok, reason, status, type });
    if (status === 0) {
        return result(false, 'timeout');
    }
    if (url.endsWith('/index.html') && [301, 308].includes(status) && ['/', './'].includes(location ?? '')) {
        return result(true, 'redirect to root');
    }
    if (status !== 200) {
        return result(false, `status ${status}`);
    }
    const expected = EXPECTED_TYPES[extensionOf(url)];
    if (expected !== undefined && type !== expected) {
        return result(false, `type ${type || '(none)'}, expected ${expected}`);
    }
    return result(true, 'ok');
};

/** One aggregated line: how many precache entries the server answered correctly, and the first failures. */
export const precacheServed = (verdicts: readonly EntryVerdict[]): CheckResult => {
    const failed = verdicts.filter((v) => !v.ok);
    const shown = failed.slice(0, 5).map((v) => `${v.url} ${v.status} ${v.type || v.reason}`);
    return {
        name: `precache served: ${verdicts.length - failed.length}/${verdicts.length}`,
        ok: verdicts.length > 0 && failed.length === 0,
        detail: verdicts.length === 0 ? 'no precache entries' : failed.length === 0 ? 'every entry answered with its media type' : `${shown.join('; ')}${failed.length > 5 ? `; and ${failed.length - 5} more` : ''}`,
    };
};

/** Every expected url of one HEAD table must be in the precache; a leading slash on either side is ignored. */
export const precacheCovers = (name: string, precache: readonly string[], urls: readonly string[]): CheckResult => {
    const have = new Set(precache.map((u) => u.replace(/^\//, '')));
    const missing = urls.filter((u) => !have.has(u.replace(/^\//, '')));
    return {
        name: `precache covers ${name}`,
        ok: urls.length > 0 && missing.length === 0,
        detail: `${urls.length - missing.length} of ${urls.length} ${name} precached${missing.length > 0 ? `; first missing: ${missing[0]}` : ''}`,
    };
};

/** True for localhost and loopback, where the immutable cache check and the www redirect do not apply. */
export const isLocalHost = (url: string): boolean => {
    const host = new URL(url).hostname;
    return host === 'localhost' || host === '127.0.0.1' || host === '[::1]';
};

export const failLine = (error: unknown): string =>
    `FAIL request error — ${error instanceof Error ? error.message : String(error)} (the release is already live; roll back from Actions → Deploy if needed)`;
