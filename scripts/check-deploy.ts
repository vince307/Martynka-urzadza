// Deploy smoke check (test-plan.md rollout phase 2): proves from outside that
// a release is live and installable. Used by the deploy workflow after
// `switch` and by the agent from its session.
// Usage: npm run check:deploy -- <baseUrl> [sha7]
// Exit codes: 0 all checks ok, 1 some check failed, 2 usage.
import {
    bundlesFromHtml,
    cacheControlCheck,
    compareBundles,
    contentTypeCheck,
    hasBuildId,
    precacheFromSw,
    type CheckResult,
} from './deploy-check/parse';

const RETRIES = 6;
const RETRY_DELAY_MS = 5000;
const TITLE = 'Martynka urządza';

const [baseArg, sha7] = process.argv.slice(2);
if (!baseArg || (sha7 !== undefined && !/^[0-9a-f]{7,40}$/.test(sha7))) {
    console.error('Usage: npm run check:deploy -- <baseUrl> [sha7]');
    process.exit(2);
}
const base = new URL(baseArg);
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
            return await fetch(new URL(path, base), { redirect: 'manual' });
        } catch (error) {
            if (attempt >= retries) {
                throw error;
            }
            await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
        }
    }
};

const main = async (): Promise<number> => {
    // The first request retries: right after a switch Caddy may still be
    // issuing a certificate for a fresh domain.
    const home = await get('/', RETRIES);
    const html = await home.text();
    record({ name: 'GET /', ok: home.status === 200 && html.includes(TITLE), detail: `${home.status}, title ${html.includes(TITLE) ? 'present' : 'missing'}` });
    record(cacheControlCheck('/', home.headers.get('cache-control'), 'no-cache'));

    const index = await get('/index.html');
    record(cacheControlCheck('/index.html', index.headers.get('cache-control'), 'no-cache'));

    const manifest = await get('/manifest.webmanifest');
    const manifestName = manifestNameOf(await manifest.text());
    record({ name: 'GET /manifest.webmanifest', ok: manifest.status === 200 && manifestName === TITLE, detail: `${manifest.status}, name "${manifestName}"` });
    record(contentTypeCheck('/manifest.webmanifest', manifest.headers.get('content-type'), 'application/manifest+json'));
    record(cacheControlCheck('/manifest.webmanifest', manifest.headers.get('cache-control'), 'no-cache'));

    const sw = await get('/sw.js');
    const swText = await sw.text();
    const precache = precacheFromSw(swText);
    record({ name: 'GET /sw.js', ok: sw.status === 200 && precache.length > 0, detail: `${sw.status}, ${precache.length} precache entries` });
    record(cacheControlCheck('/sw.js', sw.headers.get('cache-control'), 'no-cache'));

    const bundles = bundlesFromHtml(html);
    record(compareBundles(bundles, precache));
    let entryJs = '';
    for (const bundle of bundles) {
        const res = await get(bundle);
        const text = await res.text();
        record({ name: `GET ${bundle}`, ok: res.status === 200 && text.length > 0, detail: `${res.status}, ${text.length} bytes` });
        record(cacheControlCheck(bundle, res.headers.get('cache-control'), 'immutable'));
        if (/\/_app\/index-[^/]+\.js$/.test(bundle)) {
            entryJs = text;
        }
    }
    if (sha7) {
        record({ name: 'build id', ok: hasBuildId(entryJs, sha7), detail: hasBuildId(entryJs, sha7) ? `"${sha7}" found in the entry bundle` : `"${sha7}" not found in the entry bundle` });
    }

    if (!base.hostname.startsWith('www.') && base.hostname !== 'localhost' && base.hostname !== '127.0.0.1') {
        const www = new URL(base);
        www.hostname = `www.${base.hostname}`;
        try {
            const res = await fetch(www, { redirect: 'manual' });
            const location = res.headers.get('location') ?? '';
            record({ name: 'www redirects to apex', ok: [301, 308].includes(res.status) && location.startsWith(`${base.protocol}//${base.hostname}`), detail: `${res.status} → ${location || '(none)'}` });
        } catch (error) {
            record({ name: 'www redirects to apex', ok: false, detail: error instanceof Error ? error.message : String(error) });
        }
    }

    const failed = results.filter((r) => !r.ok);
    console.log(failed.length === 0 ? `\nall ${results.length} checks ok` : `\n${failed.length} of ${results.length} checks failed`);
    return failed.length === 0 ? 0 : 1;
};

main().then(
    (code) => process.exit(code),
    (error) => {
        console.error(`FAIL request error — ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
    },
);
