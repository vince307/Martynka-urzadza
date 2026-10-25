#!/usr/bin/env python3
"""Recolours the green board under the salon diorama (architecture-before / architecture-after).

Usage: python3 scripts/recolour-board.py <in.png> <out.png> <#RRGGBB>

DESIGN-GAP 170: the kit's board is a saturated green that fights the muted palette of the notebook screens.
The target #BCD799 is the kit's leafGreen #90C36A at 60 % over ivory #FFF5DF (a muted "listki" green, not a kit token).

Mask: HSV hue 95-165 deg and saturation > 0.30, flood-filled from the frame edges only, so the green trees in the
window and anything else inside the room stay untouched. Recolour: the local board colour comes from a normalised
Gaussian blur (radius 6); the target is the colour times (L / mean L) ** 0.5, which keeps the lighting gradient of the
board. Pixels within a 3 px dilation of the board (the antialiased rim) are shifted by w * (target - local board), with
w from the colour distance to the local board, so no green rim is left around the diorama.

Local tool, like `npm run font`: needs Python 3 with Pillow and numpy, run by `npm run art`. Not run in CI, outputs are
committed. It refuses to run on other library versions so a rebuild is byte-identical or fails loudly. The output PNG
has no metadata and a fixed compression level.
"""
import collections
import sys

import numpy as np
import PIL
from PIL import Image, ImageFilter

PINNED_PILLOW = '12.1.0'
PINNED_NUMPY = '2.4.3'


def check_versions() -> None:
    if PIL.__version__ != PINNED_PILLOW or np.__version__ != PINNED_NUMPY:
        sys.exit(f'recolour-board: Pillow {PIL.__version__} / numpy {np.__version__} found, '
                 f'{PINNED_PILLOW} / {PINNED_NUMPY} required '
                 f'(pip install pillow=={PINNED_PILLOW} numpy=={PINNED_NUMPY}); other versions may change the bytes')


def hsv(a):
    r, g, b = a[..., 0] / 255., a[..., 1] / 255., a[..., 2] / 255.
    mx = a.max(axis=-1) / 255.
    mn = a.min(axis=-1) / 255.
    d = mx - mn + 1e-6
    h = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) * 60
    s = np.where(mx > 0, d / (mx + 1e-6), 0)
    return h, s


def board_mask(a):
    h, s = hsv(a)
    core = (h > 95) & (h < 165) & (s > 0.30)
    height, width = core.shape
    filled = np.zeros_like(core)
    queue = collections.deque()
    edges = [(x, y) for x in range(width) for y in (0, height - 1)] + [(x, y) for y in range(height) for x in (0, width - 1)]
    for x, y in edges:
        if core[y, x] and not filled[y, x]:
            filled[y, x] = True
            queue.append((x, y))
    while queue:
        x, y = queue.popleft()
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < width and 0 <= ny < height and core[ny, nx] and not filled[ny, nx]:
                filled[ny, nx] = True
                queue.append((nx, ny))
    return filled, h


def nblur(x, radius=6):
    top = x.max() if x.max() > 0 else 1
    img = Image.fromarray(np.clip(x / top * 255, 0, 255).astype(np.uint8))
    return np.asarray(img.filter(ImageFilter.GaussianBlur(radius))).astype(np.float32) / 255 * top


def recolour(a, target, shade=0.5):
    filled, h = board_mask(a)
    f = filled.astype(np.float32)
    wsum = nblur(f) + 1e-6
    board = np.stack([nblur(a[..., i] * f) / wsum for i in range(3)], -1)
    lum = board.mean(-1)
    mean_lum = a[filled].mean()
    tgt = np.array(target, np.float32)[None, None, :] * ((lum / mean_lum) ** shade)[..., None]
    rim = np.asarray(Image.fromarray((f * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(7))).astype(np.float32) / 255
    dist = np.linalg.norm(a - board, axis=-1)
    w_rim = np.clip(1 - dist / 140, 0, 1) * rim * ((h > 70) & (h < 180))
    w = np.maximum(f, w_rim)
    out = a + w[..., None] * (tgt - board)
    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8))


def main() -> None:
    check_versions()
    if len(sys.argv) != 4:
        sys.exit('usage: recolour-board.py <in.png> <out.png> <#RRGGBB>')
    src, dst, colour = sys.argv[1:]
    hexv = colour.lstrip('#')
    if len(hexv) != 6:
        sys.exit(f'recolour-board: bad colour {colour}')
    target = tuple(int(hexv[i:i + 2], 16) for i in (0, 2, 4))
    a = np.asarray(Image.open(src).convert('RGB')).astype(np.float32)
    recolour(a, target).save(dst, format='PNG', compress_level=9, optimize=False)


if __name__ == '__main__':
    main()
