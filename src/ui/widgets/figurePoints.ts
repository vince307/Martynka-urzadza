// Outline points of figures drawn in code (pure, no Phaser), shared by faceDraw and the tests.

const HEART_STEPS = 64;

/**
 * The outline of a heart of radius `r` centred on (cx, cy): one closed contour from the classic heart curve, as wide as 2r and
 * centred vertically. Visual gate S-14d: a heart drawn as two stroked circles on a triangle showed the circles' inner arcs and read
 * as three figures, which a SHAPES or PATTERN task cannot afford.
 */
export const heartPoints = (cx: number, cy: number, r: number): { x: number; y: number }[] => {
    const raw = Array.from({ length: HEART_STEPS }, (_, i) => {
        const t = (2 * Math.PI * i) / HEART_STEPS;
        return {
            x: 16 * Math.sin(t) ** 3,
            y: -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)),
        };
    });
    const top = Math.min(...raw.map((p) => p.y));
    const bottom = Math.max(...raw.map((p) => p.y));
    const scale = r / 16;
    const mid = (top + bottom) / 2;
    return raw.map((p) => ({ x: cx + p.x * scale, y: cy + (p.y - mid) * scale }));
};
