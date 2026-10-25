// A colour grade as the 4x5 matrix Phaser's ColorMatrix takes, computed from data so the scene holds no numbers
// (change salon-style). Pure: no Phaser import. The sepia 3x3 and the saturation shape are Phaser's own.
import type { GradeParams } from './types';

const SEPIA = [
    [0.393, 0.769, 0.189],
    [0.349, 0.686, 0.168],
    [0.272, 0.534, 0.131],
] as const;

type M3 = number[][];

const mul = (a: M3, b: M3): M3 => a.map((row) => [0, 1, 2].map((j) => row[0] * b[0][j] + row[1] * b[1][j] + row[2] * b[2][j]));

/** Rows R, G, B, A; the offsets sit at 4, 9, 14 and 19 in 0-255 units. */
export function gradeMatrix(p: GradeParams): number[] {
    const mix: M3 = SEPIA.map((row, i) => row.map((v, j) => (1 - p.sepia) * (i === j ? 1 : 0) + p.sepia * v));
    const x = 1 + (2 * p.saturate) / 3;
    const y = -p.saturate / 3;
    const sat: M3 = [[x, y, y], [y, x, y], [y, y, x]];
    const m = mul(sat, mix).map((row) => row.map((v) => v * p.brightness * p.contrast));
    const offset = (1 - p.contrast) * 128 + p.lift;
    return [
        ...m[0], 0, offset,
        ...m[1], 0, offset,
        ...m[2], 0, offset,
        0, 0, 0, 1, 0,
    ];
}
