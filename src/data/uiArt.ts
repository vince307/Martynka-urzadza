// Textures of the screens around the tasks (S-16c): the loading screen, the open wallet, the unlock-card notebook and the
// salon thumbnail and the three poses of the fox guide (idle, cheer, think; the whole 384 x 384 canvas, anchor (0.5, 0.87890625)), converted to WebP by `npm run art` (public/assets/ui/). The size is the converted file's, which
// tests/uiArt.test.ts checks against the file header. Loaded at start by BootScene so the service worker precaches them.
export type UiArtId = 'loadingBackground' | 'loadingEmblem' | 'wallet' | 'notebook' | 'salonAfter' | 'guideIdle' | 'guideCheer' | 'guideThink';

export interface UiArtDef {
    id: UiArtId;
    key: string;
    url: string;
    width: number;
    height: number;
    /** Polish text of the stand-in box when the texture is missing; '' for a picture that needs none. */
    label: string;
}

const def = (id: UiArtId, file: string, width: number, height: number, label: string): UiArtDef => ({
    id,
    key: `ui/${file}`,
    url: `assets/ui/${file}.webp`,
    width,
    height,
    label,
});

export const UI_ART: readonly UiArtDef[] = [
    def('loadingBackground', 'loading-background', 960, 540, ''),
    def('loadingEmblem', 'loading-emblem', 300, 300, ''),
    def('wallet', 'wallet-open', 640, 420, 'portfel'),
    def('notebook', 'skill-notebook', 400, 400, 'zeszyt'),
    def('salonAfter', 'salon-after', 480, 270, 'salon'),
    def('guideIdle', 'fox-idle', 384, 384, ''),
    def('guideCheer', 'fox-cheer', 384, 384, ''),
    def('guideThink', 'fox-think', 384, 384, ''),
];

export const UI_ART_KEYS: Record<UiArtId, string> = {
    loadingBackground: 'ui/loading-background',
    loadingEmblem: 'ui/loading-emblem',
    wallet: 'ui/wallet-open',
    notebook: 'ui/skill-notebook',
    salonAfter: 'ui/salon-after',
    guideIdle: 'ui/fox-idle',
    guideCheer: 'ui/fox-cheer',
    guideThink: 'ui/fox-think',
};
