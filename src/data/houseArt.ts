// Pictures of the house cross-section (S-23): the shell of house 1 and the two cell pictures, plus the base shell and its airlock (S-29), converted to WebP by
// `npm run art` (public/assets/house/). Sizes are those of the designer pack manifest, checked against the file headers by
// tests/houseArt.test.ts. Not loaded by BootScene (the house scene loads them), but precached by the service worker.
export interface HouseArtEntry {
    key: string;
    url: string;
    width: number;
    height: number;
}

const entry = (file: string, width: number, height: number): HouseArtEntry => ({
    key: `house/${file}`,
    url: `assets/house/${file}.webp`,
    width,
    height,
});

export const HOUSE_ART: readonly HouseArtEntry[] = [
    entry('house-1-shell', 1920, 1080),
    entry('cell-closed', 608, 342),
    entry('cell-frame', 640, 374),
    entry('base-1-shell', 1920, 1080),
    entry('base-1-cell-closed', 608, 342),
    entry('base-1-cell-frame', 640, 374),
];
