// Build output check (Task 9): the production build in <dir> (default dist/) is made for the game served under
// /graj/: manifest start_url/scope, every index.html URL and every service worker precache entry stay inside it.
// Usage: npm run check:build [-- <dir>]. Exit codes: 0 all checks ok, 1 some check failed or a file is missing.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { APP_BASE, checkBuildPaths } from './build-check/paths';

const dir = process.argv[2] ?? 'dist';
let failed = false;
try {
    const read = (name: string): string => readFileSync(join(dir, name), 'utf8');
    const results = checkBuildPaths({ manifest: read('manifest.webmanifest'), html: read('index.html'), sw: read('sw.js') }, APP_BASE);
    for (const r of results) {
        console.log(`${r.ok ? 'ok  ' : 'FAIL'} ${r.name} — ${r.detail}`);
        failed ||= !r.ok;
    }
} catch (error) {
    console.log(`FAIL read ${dir} — ${error instanceof Error ? error.message : String(error)}`);
    failed = true;
}
process.exit(failed ? 1 : 0);
