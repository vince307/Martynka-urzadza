// Deploy smoke check (test-plan.md rollout phase 2): proves from outside that
// a release is live and installable. Used by the deploy workflow after
// `switch` and by the agent from its session.
// Usage: npm run check:deploy -- <baseUrl> [sha7] [--redirect-from <domain>]
// <baseUrl> may carry a path (https://bystrow.ariom.cloud/graj/): every request is made inside it.
// --redirect-from also checks that the old domain redirects there and serves the kill-switch /sw.js.
// Exit codes: 0 all checks ok, 1 some check failed, 2 usage.
import { FONT_URL } from '../src/data/layout';
import { CHOICE_ART } from '../src/data/choiceArt';
import { HOUSE_ART } from '../src/data/houseArt';
import { ROOM_ART } from '../src/data/roomArt';
import { SOUNDS } from '../src/data/sounds';
import { TASK_ART } from '../src/data/taskArt';
import { UI_ART } from '../src/data/uiArt';
import {
    bundlesFromHtml,
    cacheControlCheck,
    compareBundles,
    contentTypeCheck,
    entryVerdict,
    failLine,
    gameBase,
    hasBuildId,
    isLocalHost,
    killSwitchCheck,
    precacheCovers,
    precacheFromSw,
    precacheServed,
    redirectCheck,
    resolveInBase,
    type CheckResult,
    type EntryVerdict,
} from './deploy-check/parse';

const RETRIES = 6;
const RETRY_DELAY_MS = 5000;
const HEAD_POOL = 8;
const HEAD_TIMEOUT_MS = 15000;
const GET_TIMEOUT_MS = 60000;
// The game is "Bystrow" since 2026-10-31; a rollback to an older release still serves "Martynka urządza".
const TITLES = ['Bystrow', 'Martynka urządza'];

const argv = process.argv.slice(2);
const redirectAt = argv.indexOf('--redirect-from');
const redirectFrom = redirectAt === -1 ? undefined : argv[redirectAt + 1];
const positional = redirectAt === -1 ? argv : argv.filter((_, i) => i !== redirectAt && i !== redirectAt + 1);
const [baseArg, sha7] = positional;
if (!baseArg || positional.length > 2 || (sha7 !== undefined && !/^[0-9a-f]{7,40}$/.test(sha7)) || (redirectAt !== -1 && !/^[a-z0-9.-]+$/i.test(redirectFrom ?? ''))) {
    console.error('Usage: npm run check:deploy -- <baseUrl> [sha7] [--redirect-from <domain>]');
    process.exit(2);
}
const base = gameBase(baseArg);
const results: CheckResult[] = [];
const record = (r: CheckResult): void => {
    results.push(r);
    console.log(`${r.ok ? 'ok  ' : 'FAIL'} ${r.name} — ${r.detail}`);
};

/** The manifest's `name`, or "" when the body is not a JSON object with a string name. */
const manifestNameOf = (text: string): string => {
    try {
        const parsed: unknown = JSON.parse(text);
        if (parsed && typeof parsed === 'object' && 'name' in parsed && typeof parsed.name === 'string') {
            return parsed.name;
        }
    } catch {
        // fall through
    }
    return '';
};

const get = async (path: string, retries = 0): Promise<Response> => {
    for (let attempt = 0; ; attempt += 1) {
        try {
            // The limit covers the body read too: the Deploy job has no timeout of its own, a stalled answer must end.
            return await fetch(resolveInBase(path, base), { redirect: 'manual', signal: AbortSignal.timeout(GET_TIMEOUT_MS) });
        } catch (error) {
            if (attempt >= retries) {
                throw Object.assign(new Error(`${path}: ${error instanceof Error ? error.message : String(error)}`), { cause: error });
            }
            await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
        }
    }
};

/** HEAD one precache entry; one retry after a network error or timeout, then a failed verdict (status 0). */
const headEntry = async (url: string): Promise<EntryVerdict> => {
    for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
            const res = await fetch(resolveInBase(url, base), { method: 'HEAD', redirect: 'manual', signal: AbortSignal.timeout(HEAD_TIMEOUT_MS) });
            return entryVerdict(url, res.status, res.headers.get('content-type'), res.headers.get('location'));
        } catch {
            if (attempt === 0) {
                await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
            }
        }
    }
    return entryVerdict(url, 0, null, null);
};

const headAll = async (urls: readonly string[]): Promise<EntryVerdict[]> => {
    const out: EntryVerdict[] = new Array<EntryVerdict>(urls.length);
    let next = 0;
    const worker = async (): Promise<void> => {
        while (next < urls.length) {
            const i = next;
            next += 1;
            out[i] = await headEntry(urls[i]);
        }
    };
    await Promise.all(Array.from({ length: Math.min(HEAD_POOL, urls.length) }, worker));
    return out;
};

const main = async (): Promise<number> => {
    // The first request retries: right after a switch Caddy may still be
    // issuing a certificate for a fresh domain.
    const home = await get('/', RETRIES);
    const html = await home.text();
    const titled = TITLES.some((title) => html.includes(`<title>${title}</title>`));
    record({ name: 'GET /', ok: home.status === 200 && titled, detail: `${home.status}, title ${titled ? 'present' : 'missing'}` });
    record(cacheControlCheck('/', home.headers.get('cache-control'), 'no-cache'));

    const index = await get('/index.html');
    record(cacheControlCheck('/index.html', index.headers.get('cache-control'), 'no-cache'));

    const manifest = await get('/manifest.webmanifest');
    const manifestName = manifestNameOf(await manifest.text());
    record({ name: 'GET /manifest.webmanifest', ok: manifest.status === 200 && TITLES.includes(manifestName), detail: `${manifest.status}, name "${manifestName}"` });
    record(contentTypeCheck('/manifest.webmanifest', manifest.headers.get('content-type'), 'application/manifest+json'));
    record(cacheControlCheck('/manifest.webmanifest', manifest.headers.get('cache-control'), 'no-cache'));

    const sw = await get('/sw.js');
    const swText = await sw.text();
    const precache = precacheFromSw(swText);
    record({ name: 'GET /sw.js', ok: sw.status === 200 && precache.length > 0, detail: `${sw.status}, ${precache.length} precache entries` });
    record(cacheControlCheck('/sw.js', sw.headers.get('cache-control'), 'no-cache'));

    record(precacheServed(await headAll(precache)));
    if (sha7) {
        // These tables are HEAD's: after a rollback (no SHA) they may list files the older release never had.
        record(precacheCovers('task pictures', precache, TASK_ART.map((a) => a.url)));
        record(precacheCovers('screen pictures', precache, UI_ART.map((a) => a.url)));
        record(precacheCovers('task font', precache, [FONT_URL]));
        record(precacheCovers('room pictures', precache, ROOM_ART.map((a) => a.url)));
        record(precacheCovers('house pictures', precache, HOUSE_ART.map((a) => a.url)));
        record(precacheCovers('choice pictures', precache, CHOICE_ART.map((a) => a.url)));
        record(precacheCovers('boot sounds', precache, SOUNDS.filter((s) => s.boot).flatMap((s) => [...s.urls])));
    }

    const bundles = bundlesFromHtml(html, base.pathname);
    record(compareBundles(bundles, precache));
    let entryJs = '';
    for (const bundle of bundles) {
        const res = await get(bundle);
        const text = await res.text();
        record({ name: `GET ${bundle}`, ok: res.status === 200 && text.length > 0, detail: `${res.status}, ${text.length} bytes` });
        if (isLocalHost(baseArg)) {
            record({ name: `${bundle}: cache-control immutable`, ok: true, detail: 'skipped on localhost' });
        } else {
            record(cacheControlCheck(bundle, res.headers.get('cache-control'), 'immutable'));
        }
        if (/\/_app\/index-[^/]+\.js$/.test(bundle)) {
            entryJs = text;
        }
    }
    if (sha7) {
        record({ name: 'build id', ok: hasBuildId(entryJs, sha7), detail: hasBuildId(entryJs, sha7) ? `"${sha7}" found in the entry bundle` : `"${sha7}" not found in the entry bundle` });
    }

    // Only an apex (one dot, not an IPv4) has a www twin; a subdomain such as bystrow.ariom.cloud has none.
    const isApex = /^[^.]+\.[^.]+$/.test(base.hostname) && !/^\d+\.\d+$/.test(base.hostname);
    if (isApex && !isLocalHost(baseArg)) {
        const www = new URL(base);
        www.hostname = `www.${base.hostname}`;
        try {
            const res = await fetch(www, { redirect: 'manual', signal: AbortSignal.timeout(GET_TIMEOUT_MS) });
            const location = res.headers.get('location') ?? '';
            record({ name: 'www redirects to apex', ok: [301, 308].includes(res.status) && location.startsWith(`${base.protocol}//${base.hostname}`), detail: `${res.status} → ${location || '(none)'}` });
        } catch (error) {
            record({ name: 'www redirects to apex', ok: false, detail: error instanceof Error ? error.message : String(error) });
        }
    }

    if (redirectFrom) {
        const target = base.href.replace(/\/$/, '');
        for (const uri of ['/', '/x?y=1']) {
            try {
                const res = await fetch(`https://${redirectFrom}${uri}`, { redirect: 'manual', signal: AbortSignal.timeout(GET_TIMEOUT_MS) });
                record(redirectCheck(`${redirectFrom}${uri} redirects to the game`, res.status, res.headers.get('location'), `${target}${uri}`));
            } catch (error) {
                record({ name: `${redirectFrom}${uri} redirects to the game`, ok: false, detail: error instanceof Error ? error.message : String(error) });
            }
        }
        try {
            const res = await fetch(`https://${redirectFrom}/sw.js`, { redirect: 'manual', signal: AbortSignal.timeout(GET_TIMEOUT_MS) });
            record(killSwitchCheck(res.status, res.headers.get('cache-control'), await res.text()));
        } catch (error) {
            record({ name: 'old domain /sw.js is the kill switch', ok: false, detail: error instanceof Error ? error.message : String(error) });
        }
    }

    const failed = results.filter((r) => !r.ok);
    console.log(failed.length === 0 ? `\nall ${results.length} checks ok` : `\n${failed.length} of ${results.length} checks failed`);
    return failed.length === 0 ? 0 : 1;
};

main().then(
    (code) => process.exit(code),
    (error) => {
        console.error(failLine(error));
        process.exit(1);
    },
);
