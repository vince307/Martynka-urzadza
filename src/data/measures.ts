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
export const ART_LIMITS = { moneyItems: 10, trayKinds: 4, weights: 6, jugs: 10, icons: 30, rowMinIcons: 3, rowIcons: 10 } as const;

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

/** Units a UNIT_CHOICE task offers as tiles, by quantity (a child at E5 knows no tonne yet). */
export const UNIT_TILES = {
    length: ['mm', 'cm', 'm', 'km'],
    mass: ['g', 'dag', 'kg'],
} as const;
export type UnitQuantity = keyof typeof UNIT_TILES;

/**
 * Things with a length or a mass for UNIT_CHOICE. `like` finishes "<Subject> ..." in the second hint and names no unit;
 * the number runs from `min` to `max` in steps of `step`. Each range is chosen so that exactly one tile unit makes sense
 * (a pen of 14 cm, an apple of 150 g); `dag` is only ever a distractor, because the same mass reads in g and in dag.
 */
export const UNIT_ITEMS: readonly { subject: string; quantity: UnitQuantity; unit: string; min: number; max: number; step: number; like: string }[] = [
    { subject: 'Długopis', quantity: 'length', unit: 'cm', min: 12, max: 16, step: 1, like: 'jest tak długi jak twoja dłoń' },
    { subject: 'Ołówek', quantity: 'length', unit: 'cm', min: 15, max: 19, step: 1, like: 'jest trochę dłuższy niż twoja dłoń' },
    { subject: 'Mrówka', quantity: 'length', unit: 'mm', min: 3, max: 8, step: 1, like: 'jest mniejsza niż paznokieć' },
    { subject: 'Ziarnko ryżu', quantity: 'length', unit: 'mm', min: 6, max: 9, step: 1, like: 'jest drobne jak okruszek' },
    { subject: 'Klasa', quantity: 'length', unit: 'm', min: 8, max: 10, step: 1, like: 'ma kilkanaście kroków długości' },
    { subject: 'Boisko szkolne', quantity: 'length', unit: 'm', min: 40, max: 60, step: 5, like: 'jest długie na kilkadziesiąt kroków' },
    { subject: 'Droga do szkoły', quantity: 'length', unit: 'km', min: 1, max: 3, step: 1, like: 'to spacer na kilkanaście minut' },
    { subject: 'Droga z Warszawy do Krakowa', quantity: 'length', unit: 'km', min: 290, max: 300, step: 5, like: 'to kilka godzin jazdy pociągiem' },
    { subject: 'Jabłko', quantity: 'mass', unit: 'g', min: 120, max: 200, step: 10, like: 'mieści się w jednej dłoni' },
    { subject: 'Moneta', quantity: 'mass', unit: 'g', min: 4, max: 8, step: 1, like: 'jest lekka jak piórko' },
    { subject: 'Kromka chleba', quantity: 'mass', unit: 'g', min: 25, max: 40, step: 5, like: 'jest lekka jak kilka monet' },
    { subject: 'Jajko', quantity: 'mass', unit: 'g', min: 50, max: 70, step: 5, like: 'leży lekko na dłoni' },
    { subject: 'Kot', quantity: 'mass', unit: 'kg', min: 3, max: 6, step: 1, like: 'jest lżejszy niż dziecko' },
    { subject: 'Plecak ucznia', quantity: 'mass', unit: 'kg', min: 3, max: 6, step: 1, like: 'da się go unieść jedną ręką' },
    { subject: 'Pies', quantity: 'mass', unit: 'kg', min: 8, max: 25, step: 1, like: 'jest cięższy niż plecak, a lżejszy niż dorosły' },
    { subject: 'Tata', quantity: 'mass', unit: 'kg', min: 70, max: 95, step: 5, like: 'jest dużo cięższy niż dziecko' },
];

/** Packs for the brutto / netto / tara tasks: the unit their mass reads in and the believable range of the gross mass. */
export const MASS_PACKS: readonly { subject: string; unit: 'g' | 'kg'; min: number; max: number }[] = [
    { subject: 'Puszka groszku', unit: 'g', min: 400, max: 600 },
    { subject: 'Słoik miodu', unit: 'g', min: 400, max: 1000 },
    { subject: 'Paczka makaronu', unit: 'g', min: 200, max: 600 },
    { subject: 'Pudełko herbatników', unit: 'g', min: 200, max: 500 },
    { subject: 'Worek ziemniaków', unit: 'kg', min: 10, max: 30 },
    { subject: 'Skrzynka jabłek', unit: 'kg', min: 10, max: 20 },
    { subject: 'Wiadro farby', unit: 'kg', min: 8, max: 20 },
    { subject: 'Karton książek', unit: 'kg', min: 8, max: 20 },
];

/** What a text MASS skill converts: how many grams one of the big unit is (the noun key is in `nouns`). */
export const MASS_FACTORS = {
    kgToG: { big: 'kilogram', small: 'gram', factor: 1000, maxN: 9 },
    tToKg: { big: 'tona', small: 'kilogram', factor: 1000, maxN: 5 },
    qToKg: { big: 'kwintal', small: 'kilogram', factor: 100, maxN: 9 },
} as const;

/**
 * LENGTH `scale` (S-14c): what a plan can show, in real metres. A plan is drawn on paper, so it shows 2 to 10 cm (so the
 * plan length stays a times-table factor in grade 3); a side of a room is 3 to 9 m, a pitch up to 100 m. The generator picks a scale, a place and a plan length that give a whole real length
 * inside the place's range.
 */
export const SCALE_PLAN_CM = { min: 2, max: 10 } as const;
export const SCALE_PLACES: readonly { subject: string; minM: number; maxM: number }[] = [
    { subject: 'Pokój', minM: 3, maxM: 9 },
    { subject: 'Klasa', minM: 6, maxM: 10 },
    { subject: 'Ogród', minM: 10, maxM: 40 },
    { subject: 'Sala gimnastyczna', minM: 20, maxM: 40 },
    { subject: 'Boisko', minM: 30, maxM: 100 },
    { subject: 'Ulica', minM: 50, maxM: 100 },
];

/** LENGTH `twoUnit`: the factor of each pair and the range of the larger part ("4 cm 7 mm", "2 m 35 cm"). */
export const TWO_UNIT_PAIRS = {
    'cm-mm': { big: 'cm', small: 'mm', factor: 10, minBig: 1, maxBig: 30 },
    'm-cm': { big: 'm', small: 'cm', factor: 100, minBig: 1, maxBig: 9 },
} as const;
export type TwoUnitPair = keyof typeof TWO_UNIT_PAIRS;

/** CAPACITY `text`: glasses per litre, the liquids and the number of litres the pitcher holds. */
export const GLASS_PER_LITRE = { half: 2, quarter: 4 } as const;
export type GlassSize = keyof typeof GLASS_PER_LITRE;
export const GLASS_SIGN: Record<GlassSize, string> = { half: '½', quarter: '¼' };
export const PITCHER_LIQUIDS: readonly string[] = ['soku', 'wody', 'mleka', 'kompotu'];
