#!/usr/bin/env python3
"""Draws the app icons (home screen, maskable, iPad apple-touch, favicon) from the Bystrow logo.

Usage: python3 scripts/make-icons.py   (npm run icons)

The logo is the one on https://bystrow.ariom.cloud/: a cream "b" (#FFF9DD) in Martynka Next at weight 800 on a dark green
rounded square (#346650, 40 x 42 with a 13 px radius in the page's CSS) and a gold sparkle (#D79A38) that sits over the
square's top-right corner. The page and the game load the same font file (public/fonts/MartynkaNext.ttf), so the icon
needs no art pack and no network.

Two compositions:
- "any" (icon-192, icon-512, favicon): the rounded square with the sparkle on a transparent canvas;
- "full" (icon-maskable-512, apple-touch-icon-180): the green fills the canvas (Android masks it, iOS rounds it), the
  "b" and the sparkle sit inside the maskable safe zone (a centred circle of 80 % of the side).

Local tool, like `npm run font`: needs Python 3 with Pillow (pinned, so a rebuild is byte-identical or fails loudly).
Not run in CI, outputs are committed. Each icon is drawn 4x larger and reduced with a Lanczos filter for clean edges;
the PNG has no metadata and a fixed compression level.
"""
import math
import os
import sys

import PIL
from PIL import Image, ImageDraw, ImageFont

PINNED_PILLOW = '12.1.0'

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONT = os.path.join(ROOT, 'public', 'fonts', 'MartynkaNext.ttf')

GREEN = (0x34, 0x66, 0x50, 255)
CREAM = (0xFF, 0xF9, 0xDD, 255)
GOLD = (0xD7, 0x9A, 0x38, 255)

# The logo in CSS pixel units (style.css: .logo-icon 40 x 42, radius 13, font-size 33; the sparkle span is 16 px,
# right: -5 px, top: -8 px, so its centre sits near (38, 0)).
BOX_W, BOX_H, RADIUS, LETTER_SIZE = 40.0, 42.0, 13.0, 33.0
SPARK_CX, SPARK_CY, SPARK_R = 38.0, 0.0, 6.5

SUPERSAMPLE = 4

ICONS = [
    ('public/icons/icon-192.png', 192, 'any'),
    ('public/icons/icon-512.png', 512, 'any'),
    ('public/icons/icon-maskable-512.png', 512, 'full'),
    ('public/icons/apple-touch-icon-180.png', 180, 'full'),
    ('public/favicon.png', 48, 'any'),
]


def fail(message):
    print(f'make-icons: {message}', file=sys.stderr)
    sys.exit(1)


def sparkle(draw, cx, cy, r):
    """A four-point star (the page's "✦"): long points on the axes, a narrow waist between them."""
    inner = r * 0.38
    points = []
    for i in range(8):
        angle = -math.pi / 2 + i * math.pi / 4
        radius = r if i % 2 == 0 else inner
        points.append((cx + radius * math.cos(angle), cy + radius * math.sin(angle)))
    draw.polygon(points, fill=GOLD)


def letter_font(size_px):
    font = ImageFont.truetype(FONT, max(1, round(size_px)))
    font.set_variation_by_axes([800])
    return font


def draw_any(side):
    """Rounded square with the sparkle, centred on a transparent canvas with a small margin."""
    left_u, top_u = 0.0, SPARK_CY - SPARK_R
    right_u, bottom_u = max(BOX_W, SPARK_CX + SPARK_R), BOX_H
    span = max(right_u - left_u, bottom_u - top_u)
    scale = side * 0.92 / span
    ox = (side - (right_u - left_u) * scale) / 2 - left_u * scale
    oy = (side - (bottom_u - top_u) * scale) / 2 - top_u * scale

    image = Image.new('RGBA', (side, side), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    draw.rounded_rectangle(
        [ox, oy, ox + BOX_W * scale, oy + BOX_H * scale], radius=RADIUS * scale, fill=GREEN
    )
    draw.text(
        (ox + BOX_W / 2 * scale, oy + BOX_H / 2 * scale), 'b',
        font=letter_font(LETTER_SIZE * scale), fill=CREAM, anchor='mm',
    )
    sparkle(draw, ox + SPARK_CX * scale, oy + SPARK_CY * scale, SPARK_R * scale)
    return image


def draw_full(side):
    """Green to the edges; the letter and the sparkle keep the logo's proportions inside the 80 % safe circle."""
    image = Image.new('RGBA', (side, side), GREEN)
    draw = ImageDraw.Draw(image)
    # The logo square (40 x 42) shrunk so its letter and sparkle fit the safe circle (radius 0.4 * side).
    scale = side * 0.62 / BOX_H
    ox = (side - BOX_W * scale) / 2
    oy = (side - BOX_H * scale) / 2 + side * 0.02
    draw.text(
        (ox + BOX_W / 2 * scale, oy + BOX_H / 2 * scale), 'b',
        font=letter_font(LETTER_SIZE * scale), fill=CREAM, anchor='mm',
    )
    sparkle(draw, ox + (SPARK_CX - 4) * scale, oy + (SPARK_CY + 6) * scale, SPARK_R * scale)
    return image


def main():
    if PIL.__version__ != PINNED_PILLOW:
        fail(f'needs Pillow {PINNED_PILLOW}, found {PIL.__version__}')
    if not os.path.exists(FONT):
        fail(f'missing {FONT}')
    for relative, size, kind in ICONS:
        big = (draw_any if kind == 'any' else draw_full)(size * SUPERSAMPLE)
        icon = big.resize((size, size), Image.LANCZOS)
        out = os.path.join(ROOT, relative)
        os.makedirs(os.path.dirname(out), exist_ok=True)
        icon.save(out, format='PNG', optimize=False, compress_level=9)
        print(f'wrote {relative}')


if __name__ == '__main__':
    main()
