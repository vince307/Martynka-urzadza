// Keeps the e2e test hook out of production. The markers are strings the e2e-only
// code carries (src/testing/e2eHook.ts); none may appear in any production chunk.
// The e2e build must contain the required ones (otherwise the hook vanished and
// the e2e project would fail with a confusing error).
export const E2E_HOOK_MARKER = '__martynkaE2E';
export const E2E_HOOK_MARKERS = [E2E_HOOK_MARKER, 'e2eMonth', 'e2eFail', 'e2e-forced-failure', 'e2eStars', 'e2eSave', 'e2eSkills', 'e2eArt', 'stallall', 'e2eDay', 'e2eVariant', 'legacy-salon', 'v4-salon', 'v5-salon'];
// Markers that must be in the e2e build: every one has a caller there, so a missing one means the hook was dropped.
export const E2E_REQUIRED_MARKERS = [...E2E_HOOK_MARKERS];

/**
 * @param {{ fileName: string; code: string }[]} chunks
 * @param {boolean} expectHook
 * @param {string[]} [required]
 * @returns {{ ok: boolean; message: string }}
 */
export const checkE2EHook = (chunks, expectHook, required = E2E_REQUIRED_MARKERS) => {
    const state = expectHook ? 'present' : 'absent';
    if (!expectHook) {
        for (const marker of E2E_HOOK_MARKERS) {
            const files = chunks.filter((c) => c.code.includes(marker)).map((c) => c.fileName);
            if (files.length > 0) {
                return { ok: false, message: `e2e hook leaked into the production bundle (${marker} in ${files.join(', ')})` };
            }
        }
    } else {
        for (const marker of required) {
            if (!chunks.some((c) => c.code.includes(marker))) {
                return { ok: false, message: `E2E_HOOK=1 but ${marker} is in no chunk: the hook was dropped from the e2e build` };
            }
        }
    }
    return { ok: true, message: `e2e hook: ${state} (${chunks.length} chunks checked)` };
};

/** Vite plugin: runs checkE2EHook on the finished bundle and fails the build on a violation. */
export const e2eHookGuard = () => ({
    name: 'martynka-e2e-hook-guard',
    apply: 'build',
    generateBundle(_options, bundle) {
        const chunks = Object.values(bundle)
            .filter((item) => item.type === 'chunk')
            .map((item) => ({ fileName: item.fileName, code: item.code }));
        const result = checkE2EHook(chunks, process.env.E2E_HOOK === '1');
        if (!result.ok) {
            this.error(result.message);
        }
        console.log(result.message);
    },
});
