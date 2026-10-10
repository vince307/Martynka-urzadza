# Martynka urządza — maths style, locked A, v1

Approved: **A — Przytulny notes**, with C's colours and the previously approved A furniture and botanical wall frames. Maths earns stars; stars decorate rooms. The reading surface is a keepsake notebook in the living room. Keep its centre calm and its decoration at the edges.

## Font and spacing

Use the bundled **Atkinson Hyperlegible Next** variable font, weight 650–750 for short labels and 700–750 for numerals. Polish uppercase and lowercase diacritics and `1`, `7`, `6`, `9`, `0`, `O`, `−` were checked in the font character map. Its slashed zero and distinct numeral shapes are visible in the preview. Font source and SIL Open Font License are included. [Official family files](https://github.com/google/fonts/tree/main/ofl/atkinsonhyperlegiblenext).

Reference scene: **1920 × 1080**. Prompts 64 px, counting answers 90 px, keypad numerals 58 px, calculations 112 px, hints 30–34 px, welcome prompt 86 px. Unlock skill label 48 px. Use real `−`, `×`, Polish `zł`, lowercase `gr`, `kg`, `dag`, `l`, and decimal commas. No handwriting for maths.

Interactive child controls are at least **96 × 96 px** at reference size. Use 16–32 px gaps. The 16:9 area scales proportionally and letterboxes on 4:3 tablets. The checks at 1024 × 768 retain targets of at least 48 CSS px. Keep prompts and pictures visible while the keypad is used. Parent review controls belong outside the game scene.

## Palette and rendering

| Role | Colour |
|---|---|
| Paper, neutral panels | Ivory `#FFF5DF` |
| Notebook cover and primary buttons | Turquoise `#54BEB4` |
| Text, mathematical lines and selection border | Deep teal `#245C59` |
| Answer tiles | Pale leaf `#E3F0D9` |
| Correct feedback | Pale leaf `#E5F2D4` |
| Hint and second try | Warm yellow `#FFF0B9` |
| Stars and bookmark | Butter yellow `#F1CE6B` |
| Frames and furniture | Oak `#C99B66` |
| Small painted accents | Terracotta `#C98460` |

Use soft painterly material shading, clean rounded silhouettes and warm upper-left light. Panels have opaque, nearly flat reading centres, broad rounded edges and a soft lower-right shadow. Put texture in frames and illustrated objects. The room retains the approved high three-quarter camera; maths faces are straight-on for legibility.

## Task states

Idle answers have equal emphasis. Correct uses a checkmark, “Brawo!”, a gold star flying toward the counter, and “Dalej”. Each task awards once. Reduced-motion settings suppress the travel animation.

A different answer gets “Spróbuj jeszcze raz” and a concrete hint in warm yellow, with the answers still available. No red cross, failure stamp, alarm, penalty or timer. Second try uses the same gentle treatment. “Pokaż kroki” reveals a solution in successive steps, then returns the child to another try. Counted objects receive numbered markers and can each be counted once. The speaker reads the task or hint with the same calm pace.

Five progress dots belong to the round. Summary uses “Brawo!”, earned stars, “Kolejna runda” and “Do pokoju”. The unlock card uses “Nowa umiejętność!” and one short skill name. Welcome asks “Ile masz lat?” with buttons 6–10. Age and school level are separate settings in the future game; the preview uses fixed examples.

## Counting icons

Twelve distinct objects: cup, croissant, flower, cushion, book, lamp, apple, pear, teapot, pencil, key and yarn ball. Each image contains exactly one intended counting object. Keep the saucer visually subordinate to the cup. No loose crumbs, bonus flowers, steam, faces, floating sparkles or background props on a counting mat.

Master export: 512 × 512 transparent PNG with approximately 32 px minimum margin and a maximum 448 px silhouette. Actual-size 64 and 96 px exports are included. Use a touch wrapper of at least 96 px even when the illustrated object itself is smaller. The original raster sources and prompts are retained.

## Code-drawn helpers

Use ivory faces, teal lines, oak frames and leaf/yellow highlights. Reference contours are 4 px, internal grids and minor ticks 2 px. Shadow: 4 px offset, approximately 8 px blur at low opacity. Keep diagram numerals aligned and distinguish active positions with geometry as well as colour.

The supplied SVG reference is mathematical source, not painted approximation: 60 clock ticks at 3:30, a 0–10 cm ruler with half-centimetre divisions, a 0–10 number line, 1/10/100 base-ten units, written `38 + 27 = 65` with carry, grid-aligned polygons, and dice faces 4 and 6. Their geometry and values are also recorded in `reference/helper-metadata.json`.

## Money and measuring objects

Money uses familiar denomination and colour cues with an original play design. The nine coins retain brass/silver families and opposite bimetal arrangements for 2 zł and 5 zł. Banknotes use brown, rose, blue, green, ochre and violet-grey families for 10, 20, 50, 100, 200 and 500 zł. Big values, botanical illustrations and the small word “GRA” replace official designs. No rulers' portraits, national emblems, signatures, serials, NBP logos or security artwork.

Denominations and coin metal families were checked against [Mennica Polska](https://www.mennica.com.pl/monety-i-numizmaty/monety-obiegowe); banknote denomination and visual colour references come from [NBP's banknote reference](https://static.nbp.pl/strony/bezpiecznepieniadze/index.html). These are teaching illustrations, not reproductions or physical-scale measuring templates. Use the manifest values in grosze for arithmetic.

Scale, weights and glass jugs are separate transparent art. Weights carry 1, 2, 5 kg and 10, 20, 50 dag. Jugs show 1 l, ½ l and ¼ l on a shared footprint. Their painted fill illustrations communicate quantity; numeric values come from the manifest, not a pixel-measured volume calculation.

The thermometer combines a painted housing with an exact code-drawn face: −30 to +30 °C, 1-degree ticks, 10-degree labels, and a shown temperature of +10 °C. To change its temperature, redraw the liquid using the supplied face mapping; do not stretch the finished illustration.
