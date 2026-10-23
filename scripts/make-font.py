#!/usr/bin/env python3
"""Builds public/fonts/MartynkaNext.ttf: Atkinson Hyperlegible Next with a plain "0".

The original zero has a slash: its two counters are split by a diagonal. This script
replaces both counters with ONE oval counter (the outer contour scaled into the box the
two counters spanned), for the default master and for every gvar master, then renames the
family to "Martynka Next" (SIL OFL 1.1: a modified version gets its own name; name ID 0,
the copyright line, stays untouched; name ID 5 gets a modification note).

Local tool, like `npm run icons`: needs Python 3 and fontTools, input is the committed
original in designs/ (read-only), output is committed. Not run in CI.

Reproducible: fixed head.modified, no timestamp recalculation, and the script refuses to
run on any fontTools version other than the one it was written against, so a rebuild is
byte-identical or fails loudly.
"""
import sys
from pathlib import Path

import fontTools
from fontTools.ttLib import TTFont
from fontTools.ttLib.tables.TupleVariation import TupleVariation
from fontTools.ttLib.tables._g_l_y_f import GlyphCoordinates

PINNED_FONTTOOLS = '4.61.1'
FAMILY = 'Martynka Next'
OLD_FAMILY = 'Atkinson Hyperlegible Next'
NOTE = (' Modified: the zero has a plain oval counter instead of a slashed one; '
        'renamed Martynka Next (modification for the Martynka urzadza game).')
FIXED_MODIFIED = 3_875_472_000  # 2026-10-22 00:00 UTC in the font epoch (1904), never "now"

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'designs/martynka-maths-A-v1/fonts/AtkinsonHyperlegibleNext.ttf'
OUT = ROOT / 'public/fonts/MartynkaNext.ttf'


def main() -> None:
    if fontTools.version != PINNED_FONTTOOLS:
        sys.exit(f'make-font: fontTools {fontTools.version} found, {PINNED_FONTTOOLS} required '
                 f'(pip install fonttools=={PINNED_FONTTOOLS}); other versions may change the bytes')
    f = TTFont(str(SRC), recalcTimestamp=False)
    glyf, gvar = f['glyf'], f['gvar']
    g = glyf['zero']
    base, ends, flags = g.getCoordinates(glyf)
    base = [tuple(p) for p in base]
    n = len(base)
    if len(ends) != 3:
        sys.exit('make-font: the original zero no longer has 3 contours')
    tuples = gvar.variations['zero']
    for t in tuples:
        t.calcInferredDeltas(GlyphCoordinates(base), ends)
    e0, e1, e2 = ends

    def master(t):
        d = t.coordinates
        return [(base[i][0] + (d[i][0] if d[i] else 0), base[i][1] + (d[i][1] if d[i] else 0)) for i in range(n)]

    def build(pts):
        outer, c1, c2 = pts[:e0 + 1], pts[e0 + 1:e1 + 1], pts[e1 + 1:e2 + 1]
        ox0, ox1 = min(p[0] for p in outer), max(p[0] for p in outer)
        oy0, oy1 = min(p[1] for p in outer), max(p[1] for p in outer)
        ix0, iy0 = min(p[0] for p in c1), min(p[1] for p in c1)
        ix1, iy1 = max(p[0] for p in c2), max(p[1] for p in c2)
        sx, sy = (ix1 - ix0) / (ox1 - ox0), (iy1 - iy0) / (oy1 - oy0)
        inner = [(ix0 + (x - ox0) * sx, iy0 + (y - oy0) * sy) for x, y in outer]
        inner.reverse()
        return outer + inner

    rnd = lambda v: [(round(x), round(y)) for x, y in v]
    oflags = list(flags[:e0 + 1])
    new_base = rnd(build(base))
    new_masters = [rnd(build(master(t))) for t in tuples]
    g.coordinates = GlyphCoordinates(new_base)
    g.flags = bytearray(oflags + list(reversed(oflags)))
    g.endPtsOfContours = [e0, len(new_base) - 1]
    g.numberOfContours = 2
    g.recalcBounds(glyf)
    new_tuples = []
    for t, m in zip(tuples, new_masters):
        deltas = [(m[i][0] - new_base[i][0], m[i][1] - new_base[i][1]) for i in range(len(new_base))]
        deltas += [p if p else (0, 0) for p in t.coordinates[n:]]  # phantom points unchanged
        new_tuples.append(TupleVariation(dict(t.axes), deltas))
    gvar.variations['zero'] = new_tuples

    for rec in f['name'].names:
        s = rec.toUnicode()
        if rec.nameID in (1, 3, 4, 6, 16, 17, 25):
            s = s.replace(OLD_FAMILY, FAMILY).replace(OLD_FAMILY.replace(' ', ''), FAMILY.replace(' ', ''))
        elif rec.nameID == 5 and NOTE not in s:
            s += NOTE
        rec.string = s
    f['head'].modified = FIXED_MODIFIED
    OUT.parent.mkdir(parents=True, exist_ok=True)
    f.save(str(OUT))
    print('wrote', OUT.relative_to(ROOT))


if __name__ == '__main__':
    main()
