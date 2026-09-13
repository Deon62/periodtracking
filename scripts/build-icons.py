"""Regenerate every icon asset from one source logo.

    python scripts/build-icons.py [source.png]

The source is the full lockup — mark above the "nimoh" wordmark, on white or
transparent. Everything else is derived, so when the logo changes again this is
the only thing to re-run.

Why this exists rather than dropping one PNG into assets/: each target crops
differently, and a single file cannot satisfy all of them.

  * iOS and the legacy Android icon show the whole square, so the lockup can be
    large — it just needs breathing room inside the rounded-rect mask.
  * Android adaptive icons are the opposite. The launcher masks the image to a
    circle, squircle or whatever the device's theme uses, and only the middle
    66% of the canvas is guaranteed to survive. Art drawn to the edges loses its
    edges, which is how a wordmark ends up as "imo".
  * The splash and the in-app mark want the symbol alone. The screen already
    says "Welcome to nimoh" underneath, and printing the word twice looks like
    a mistake.

Requires Pillow:  pip install pillow
"""

import sys
from PIL import Image

SOURCE = sys.argv[1] if len(sys.argv) > 1 else 'assets/icon.png'
OUT = 'assets'
SIZE = 1024

WHITE = (255, 255, 255, 255)
BRAND = (255, 42, 133, 255)

# Fraction of the canvas the artwork is allowed to span.
FULL_SQUARE = 0.80   # iOS / legacy: generous, the whole square is visible
SAFE_ZONE = 0.62     # Android adaptive: inside the 66% the mask guarantees
SPLASH = 0.72


def is_ink(pixel):
    r, g, b, a = pixel
    return a > 20 and not (r > 245 and g > 245 and b > 245)


def ink_bbox(img, top=None, bottom=None):
    """Bounding box of real artwork, ignoring both white and transparency."""
    w, h = img.size
    px = img.load()
    y0 = 0 if top is None else top
    y1 = h if bottom is None else bottom
    min_x, min_y, max_x, max_y = w, h, -1, -1
    for y in range(y0, y1):
        for x in range(w):
            if is_ink(px[x, y]):
                min_x = min(min_x, x)
                min_y = min(min_y, y)
                max_x = max(max_x, x)
                max_y = max(max_y, y)
    if max_x < 0:
        raise SystemExit(f'No artwork found in {SOURCE}')
    return (min_x, min_y, max_x + 1, max_y + 1)


def empty_bands(img):
    """Fully blank horizontal runs between the top and bottom of the artwork."""
    w, h = img.size
    px = img.load()
    filled = [any(is_ink(px[x, y]) for x in range(w)) for y in range(h)]
    rows = [y for y, f in enumerate(filled) if f]
    top, bottom = rows[0], rows[-1]

    bands, run = [], None
    for y in range(top, bottom + 1):
        if not filled[y]:
            if run is None:
                run = y
        elif run is not None:
            bands.append((run, y - 1))
            run = None
    return top, bottom, bands


def place(art, canvas_size, span, background=None):
    """Scale `art` to `span` of the canvas and centre it."""
    target = int(canvas_size * span)
    scaled = art.copy()
    scaled.thumbnail((target, target), Image.LANCZOS)

    canvas = Image.new('RGBA', (canvas_size, canvas_size), background or (0, 0, 0, 0))
    canvas.alpha_composite(
        scaled,
        ((canvas_size - scaled.width) // 2, (canvas_size - scaled.height) // 2),
    )
    return canvas


def silhouette(img, colour=(0, 0, 0, 255)):
    """Flatten to one colour, keeping the alpha. For Android themed icons."""
    solid = Image.new('RGBA', img.size, colour[:3] + (0,))
    solid.putalpha(img.getchannel('A'))
    return solid


def on_white(img):
    """iOS icons may not be transparent."""
    base = Image.new('RGBA', img.size, WHITE)
    base.alpha_composite(img)
    return base


def transparent_where_white(img):
    """Drop the white plate so the lockup can sit on the dark splash."""
    out = img.copy()
    px = out.load()
    for y in range(out.height):
        for x in range(out.width):
            r, g, b, a = px[x, y]
            if a > 0 and r > 245 and g > 245 and b > 245:
                px[x, y] = (r, g, b, 0)
    return out


def main():
    source = Image.open(SOURCE).convert('RGBA')
    source = transparent_where_white(source)

    top, bottom, bands = empty_bands(source)
    # The last blank band is the space above the wordmark; everything above it
    # is the symbol. With no band the source is presumably the symbol already.
    split = bands[-1][0] if bands else bottom + 1

    lockup = source.crop(ink_bbox(source))
    mark = source.crop(ink_bbox(source, 0, split))
    print(f'lockup {lockup.size}   mark {mark.size}   (split at row {split})')

    targets = [
        ('icon.png', place(lockup, SIZE, FULL_SQUARE, WHITE)),
        ('android-icon-foreground.png', place(lockup, SIZE, SAFE_ZONE)),
        ('android-icon-background.png', Image.new('RGBA', (SIZE, SIZE), WHITE)),
        ('android-icon-monochrome.png', silhouette(place(lockup, SIZE, SAFE_ZONE))),
        ('splash-icon.png', place(mark, SIZE, SPLASH)),
        ('logo-mark.png', place(mark, SIZE, 0.94)),
        ('favicon.png', place(lockup, 48, FULL_SQUARE, WHITE)),
    ]

    for name, image in targets:
        path = f'{OUT}/{name}'
        image.convert('RGBA').save(path)
        print(f'  wrote {path:44} {image.size[0]}x{image.size[1]}')


if __name__ == '__main__':
    main()
