export const E2E_HOOK_MARKER: string;
export function checkE2EHook(chunks: { fileName: string; code: string }[], expectHook: boolean): { ok: boolean; message: string };
export function e2eHookGuard(): { name: string; apply: 'build'; generateBundle(this: { error(message: string): never }, options: unknown, bundle: Record<string, { type: string; fileName: string; code?: string }>): void };
