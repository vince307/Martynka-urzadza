# Martynka urządza — notebook maths visual pack A, v1

The selected direction is A — Przytulny notes. The prior living-room art and palette are carried forward. This pack supplies this round's visual assets and a clickable presentation of their interactions.

## Contents

- `preview.html`, `screen.css`, `maths.css`, `preview.js`: local interactive presentation, with welcome, counting tiles, keypad, hints, second try, sequential solution, correct reward, five-task round summary, unlock card and room return.
- `screenshots/`: 1920 × 1080 mockups of the requested screens and states, a tablet view, overview and artwork contact sheets.
- `assets/icons/`: twelve 512-square transparent icons, plus actual-size 64 and 96 px versions.
- `assets/money/`: nine transparent coin PNGs, 1 gr–5 zł, and six transparent banknote PNGs, 10–500 zł. Coin canvases are 512-square; banknotes are 768 × 512 with transparent padding.
- `assets/measuring/`: empty balance scale, six weights, three jug fill illustrations, and a −30 to +30 °C thermometer. The transparent thermometer housing is also included separately.
- `reference/`: seven SVG helper drawings, a 1920 × 1080 style sheet, mathematical geometry metadata, and reusable drawing source.
- `fonts/`: Atkinson Hyperlegible Next and its SIL Open Font License.
- `manifest.json`: file paths, dimensions, denominations in grosze, weights in grams, quantities in millilitres and thermometer range/mapping.
- `style-guide.md`, `browser-checks.json`, `asset-checks.json`: approved direction, measured checks and implementation conventions.
- `source-art/`, `source-metadata.json`, `prompts/`: native generated artwork, selected revisions, generation prompts and provenance. Artwork used the built-in image-generation tool. Normalisation and reference compositions used browser canvas; exact mathematical helpers were drawn in code.

## Preview locally

From this folder, run `python3 -m http.server 8768 --bind 127.0.0.1`, then open `http://127.0.0.1:8768/preview.html`. The gallery loads its local manifest; serve the directory rather than opening the page directly from disk. Fonts and art are bundled; no external asset service is required.

The controls above the scene are presentation tools for a parent or designer. Add `?game-only=1` for the child-facing 16:9 view. The welcome has all requested ages 6, 7, 8, 9, 10. The preview rounds demonstrate two sets of five fixed tasks, not a school-level curriculum or assessment. There is no persistence, timer, account, shop or analytics. Mini-game boards remain later work as requested.

## Integration

Use exact values in `manifest.json` for maths. Example: 50 gr + 2 zł is 50 + 200 = 250 grosze, displayed as 2,50 zł. The illustrations are not drawn to real physical currency size. Keep banknote unit labels visible; reserve a larger display than tiny counting icons for money, scales and thermometers.

The three jug variants share a canvas and visible rectangle. The illustrative glass and meniscus make pixel-based volume measurement inappropriate; choose the variants by their millilitre metadata. The scale art is level with empty pans; weights are separate sprites. Future live weighing must move the beam and pans consistently with the values. No unbalanced states are claimed in this pack.

`reference/helper-style.cjs` regenerates the vector reference files with Node; it uses no third-party dependencies. `reference/thermometer-face.js` supplies the exact scale and liquid geometry. Draw its face over `assets/measuring/thermometer-frame.png` at the reference size, with the bundled font loaded, to render a different temperature. The finished thermometer PNG shows +10 °C.

Polish speech in the presentation uses a Polish device voice when available; the fallback asks an adult to read. Recorded Polish audio is not included in this visual-art pack. The full school-level task engine, production audio and persistent room spending are game implementation work beyond these visual deliverables.

## Validation

Browser checks cover minimum 96 px reference targets, 1024 × 768 and 1280 × 800 tablet targets, correct and incorrect attempts, unique object counting, keypad entry/erase, one star per task, all five progress steps, summary, unlock and room resume. Asset checks cover dimensions, transparent alpha, all requested denominations and unit conversions, plus helper counts and geometry.
