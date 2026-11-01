/**
 * The room-done card rectangle for any tile count (design gap 204).
 * The card is at least `minWidth` wide and grows by a tile (plus gap) per tile past what fits.
 * Limit: with the shipped numbers 5 tiles make a 1888-wide card; 6 tiles do not fit in 1920.
 */
export interface CardSpec { centerX: number; minWidth: number; padding: number; tileWidth: number; gap: number }
export interface CardRect { left: number; width: number; tileLefts: number[] }

export function roomDoneCardRect(count: number, spec: CardSpec): CardRect {
    const n = Math.max(0, count);
    const total = n === 0 ? 0 : n * spec.tileWidth + (n - 1) * spec.gap;
    const width = Math.max(spec.minWidth, n === 0 ? 0 : total + 2 * spec.padding);
    const start = spec.centerX - total / 2;
    const tileLefts: number[] = [];
    for (let i = 0; i < n; i++) tileLefts.push(start + i * (spec.tileWidth + spec.gap));
    return { left: spec.centerX - width / 2, width, tileLefts };
}
