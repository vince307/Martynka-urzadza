// Ids and values of the art kit's money, weights, jugs and icons (S-14). The values come from the kit's manifest.json
// (grosze, grams, millilitres), not from pixels; a drawing carries only the ids. Polish text for them lives in
// `core/text/measure.ts` and `pl.ts`.

export const COIN_IDS = ['coin-01gr', 'coin-02gr', 'coin-05gr', 'coin-10gr', 'coin-20gr', 'coin-50gr', 'coin-1zl', 'coin-2zl', 'coin-5zl'] as const;
export const NOTE_IDS = ['note-10zl', 'note-20zl', 'note-50zl', 'note-100zl', 'note-200zl', 'note-500zl'] as const;
export type CoinId = (typeof COIN_IDS)[number];
export type NoteId = (typeof NOTE_IDS)[number];
export type MoneyId = CoinId | NoteId;

export const MONEY: readonly { id: MoneyId; grosze: number }[] = [
    { id: 'coin-01gr', grosze: 1 },
    { id: 'coin-02gr', grosze: 2 },
    { id: 'coin-05gr', grosze: 5 },
    { id: 'coin-10gr', grosze: 10 },
    { id: 'coin-20gr', grosze: 20 },
    { id: 'coin-50gr', grosze: 50 },
    { id: 'coin-1zl', grosze: 100 },
    { id: 'coin-2zl', grosze: 200 },
    { id: 'coin-5zl', grosze: 500 },
    { id: 'note-10zl', grosze: 1000 },
    { id: 'note-20zl', grosze: 2000 },
    { id: 'note-50zl', grosze: 5000 },
    { id: 'note-100zl', grosze: 10000 },
    { id: 'note-200zl', grosze: 20000 },
    { id: 'note-500zl', grosze: 50000 },
];

export type WeightId = 'weight-1kg' | 'weight-2kg' | 'weight-5kg' | 'weight-10dag' | 'weight-20dag' | 'weight-50dag';

export const WEIGHTS: readonly { id: WeightId; grams: number; label: string }[] = [
    { id: 'weight-10dag', grams: 100, label: '10 dag' },
    { id: 'weight-20dag', grams: 200, label: '20 dag' },
    { id: 'weight-50dag', grams: 500, label: '50 dag' },
    { id: 'weight-1kg', grams: 1000, label: '1 kg' },
    { id: 'weight-2kg', grams: 2000, label: '2 kg' },
    { id: 'weight-5kg', grams: 5000, label: '5 kg' },
];

export type JugId = 'container-1l' | 'container-half-l' | 'container-quarter-l';

export const JUGS: readonly { id: JugId; ml: number; label: string }[] = [
    { id: 'container-1l', ml: 1000, label: '1 l' },
    { id: 'container-half-l', ml: 500, label: '½ l' },
    { id: 'container-quarter-l', ml: 250, label: '¼ l' },
];

/** The kit jug images are square, JUG_SOURCE_SIZE px a side; JUG_VISIBLE_RECT is given in that space. */
export const JUG_SOURCE_SIZE = 512;

/** The part of a jug image that holds the liquid scale, the same for all three jugs: x, y, width, height in the 512 x 512 image. */
export const JUG_VISIBLE_RECT = { x: 32, y: 78, width: 448, height: 356 } as const;

/** How many pieces one drawing may hold: validateVisual enforces it and each widget pools exactly that many images. */
export const ART_LIMITS = { moneyItems: 10, weights: 6, jugs: 10, icons: 30 } as const;

/** The 12 icons of the kit with the dictionary noun (src/data/nouns.ts) a prompt uses; the dictionary wins over the kit label. */
export const ICONS = [
    { id: 'cup', noun: 'filiżanka' },
    { id: 'croissant', noun: 'rogalik' },
    { id: 'flower', noun: 'kwiatek' },
    { id: 'cushion', noun: 'poduszka' },
    { id: 'book', noun: 'książka' },
    { id: 'lamp', noun: 'lampa' },
    { id: 'apple', noun: 'jabłko' },
    { id: 'pear', noun: 'gruszka' },
    { id: 'teapot', noun: 'czajniczek' },
    { id: 'pencil', noun: 'kredka' },
    { id: 'key', noun: 'klucz' },
    { id: 'yarn', noun: 'kłębek' },
] as const;
/** The icons that can lie on a plate (a MULT_GROUPS group is drawn in a frame that stands for a plate). */
export const PLATE_ICONS: readonly IconId[] = ['apple', 'pear', 'croissant'];

export type IconId = (typeof ICONS)[number]['id'];

/** Believable masses (grams) of the icons that can lie on a scale, each buildable from at most 6 of `WEIGHTS`. */
export const SCALE_ITEMS: readonly { icon: IconId; grams: readonly number[] }[] = [
    { icon: 'apple', grams: [100, 200, 300] },
    { icon: 'pear', grams: [100, 200, 300] },
    { icon: 'croissant', grams: [100] },
    { icon: 'yarn', grams: [100, 200, 300, 400] },
    { icon: 'cup', grams: [200, 300, 500] },
    { icon: 'book', grams: [300, 400, 500, 600, 700, 800, 1000] },
    { icon: 'cushion', grams: [600, 800, 900, 1000, 2000, 3000] },
    { icon: 'teapot', grams: [500, 1000, 2000] },
    { icon: 'lamp', grams: [2000, 3000, 5000] },
];

/** Thermometer housing (512 x 1536 image) and its scale: -30 sits at yForMinus30, each degree is pixelsPerDegree higher. */
export const THERMOMETER = {
    min: -30,
    max: 30,
    yForMinus30: 1260,
    pixelsPerDegree: 16,
    frame: { width: 512, height: 1536 },
} as const;
