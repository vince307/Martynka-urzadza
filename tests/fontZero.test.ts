import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Reads the font tables straight from the bytes (no font library, independent of
// scripts/make-font.py): the shipped task font must have a plain zero and its own name.
const ORIGINAL = 'designs/martynka-maths-A-v1/fonts/AtkinsonHyperlegibleNext.ttf';
const SHIPPED = 'public/fonts/MartynkaNext.ttf';

const view = (path: string): DataView => {
    const b = readFileSync(path);
    return new DataView(b.buffer, b.byteOffset, b.byteLength);
};

const tables = (v: DataView): Map<string, { offset: number; length: number }> => {
    const map = new Map<string, { offset: number; length: number }>();
    const count = v.getUint16(4);
    for (let i = 0; i < count; i++) {
        const at = 12 + i * 16;
        const tag = String.fromCharCode(v.getUint8(at), v.getUint8(at + 1), v.getUint8(at + 2), v.getUint8(at + 3));
        map.set(tag, { offset: v.getUint32(at + 8), length: v.getUint32(at + 12) });
    }
    return map;
};

const need = (t: Map<string, { offset: number; length: number }>, tag: string) => {
    const e = t.get(tag);
    if (!e) throw new Error(`table ${tag} missing`);
    return e;
};

const glyphCount = (v: DataView): number => v.getUint16(need(tables(v), 'maxp').offset + 4);

/** Glyph id of a BMP code point through the cmap format 4 subtable (platform 3, encoding 1). */
const glyphOf = (v: DataView, code: number): number => {
    const cmap = need(tables(v), 'cmap').offset;
    const n = v.getUint16(cmap + 2);
    for (let i = 0; i < n; i++) {
        const rec = cmap + 4 + i * 8;
        if (v.getUint16(rec) !== 3 || v.getUint16(rec + 2) !== 1) continue;
        const sub = cmap + v.getUint32(rec + 4);
        if (v.getUint16(sub) !== 4) continue;
        const segs = v.getUint16(sub + 6) / 2;
        const ends = sub + 14, starts = ends + segs * 2 + 2, deltas = starts + segs * 2, ranges = deltas + segs * 2;
        for (let s = 0; s < segs; s++) {
            if (code > v.getUint16(ends + s * 2) || code < v.getUint16(starts + s * 2)) continue;
            const range = v.getUint16(ranges + s * 2);
            const delta = v.getInt16(deltas + s * 2);
            if (range === 0) return (code + delta) & 0xffff;
            const at = ranges + s * 2 + range + (code - v.getUint16(starts + s * 2)) * 2;
            const g = v.getUint16(at);
            return g === 0 ? 0 : (g + delta) & 0xffff;
        }
    }
    throw new Error('no cmap format 4 subtable for the code point');
};

/** numberOfContours of a glyph, read from loca and glyf. */
const contours = (v: DataView, gid: number): number => {
    const t = tables(v);
    const long = v.getInt16(need(t, 'head').offset + 50) === 1;
    const loca = need(t, 'loca').offset;
    const offset = long ? v.getUint32(loca + gid * 4) : v.getUint16(loca + gid * 2) * 2;
    return v.getInt16(need(t, 'glyf').offset + offset);
};

const nameOf = (v: DataView, id: number): string => {
    const name = need(tables(v), 'name').offset;
    const count = v.getUint16(name + 2);
    const storage = name + v.getUint16(name + 4);
    for (let i = 0; i < count; i++) {
        const rec = name + 6 + i * 12;
        if (v.getUint16(rec) !== 3 || v.getUint16(rec + 6) !== id) continue;
        const len = v.getUint16(rec + 8), off = v.getUint16(rec + 10);
        let s = '';
        for (let k = 0; k < len; k += 2) s += String.fromCharCode(v.getUint16(storage + off + k));
        return s;
    }
    return '';
};

const wghtAxis = (v: DataView): [number, number] => {
    const fvar = need(tables(v), 'fvar').offset;
    const axesAt = fvar + v.getUint16(fvar + 4);
    const count = v.getUint16(fvar + 8);
    for (let i = 0; i < count; i++) {
        const a = axesAt + i * 20;
        const tag = String.fromCharCode(v.getUint8(a), v.getUint8(a + 1), v.getUint8(a + 2), v.getUint8(a + 3));
        if (tag === 'wght') return [v.getInt32(a + 4) / 65536, v.getInt32(a + 12) / 65536];
    }
    throw new Error('no wght axis');
};

describe('task font Martynka Next (plain zero)', () => {
    const shipped = view(SHIPPED);
    const original = view(ORIGINAL);

    it('draws the zero with an outer contour and ONE counter, not the slashed pair', () => {
        expect(contours(original, glyphOf(original, 0x30)), 'the original is slashed').toBe(3);
        expect(contours(shipped, glyphOf(shipped, 0x30))).toBe(2);
    });

    it('keeps U+0030 on the original glyph id and the same glyph count', () => {
        expect(glyphOf(shipped, 0x30)).toBe(glyphOf(original, 0x30));
        expect(glyphCount(shipped)).toBe(glyphCount(original));
    });

    it('has its own family name (OFL: modified version renamed), without the Braille Institute term', () => {
        for (const id of [1, 4, 6, 25]) {
            expect(nameOf(shipped, id), `name ${id}`).toContain(id === 6 || id === 25 ? 'MartynkaNext' : 'Martynka Next');
            expect(nameOf(shipped, id), `name ${id}`).not.toMatch(/Hyperlegible/i);
        }
    });

    it('keeps the copyright line and notes the modification in the version string', () => {
        expect(nameOf(shipped, 0)).toBe(nameOf(original, 0));
        expect(nameOf(shipped, 5)).toContain('Modified');
    });

    it('is still a variable font with the weight axis 200 to 800', () => {
        expect(wghtAxis(shipped)).toEqual([200, 800]);
    });

    it('ships the license text beside the font and names the modification', () => {
        const text = readFileSync('public/fonts/OFL.txt', 'utf8');
        expect(text).toContain('SIL OPEN FONT LICENSE Version 1.1');
        expect(text).toContain('Martynka Next');
    });
});
