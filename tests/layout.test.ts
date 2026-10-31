import { describe, expect, it } from 'vitest';
import { isExpression } from '../src/core/round/prompt';
import { keypadGrid, tileRow } from '../src/ui/widgets/geometry';
import { placementData } from '../src/data/placement';
import { ROOMS } from '../src/data/rooms';
import { BUILDING_CHOICES, HOUSE_GEOMETRY } from '../src/data/houses';
import { CONTENT_LEFT, NOTEBOOK, FONT_SIZES, FONT_WEIGHT_RANGE, FONT_WEIGHTS, GAME_HEIGHT, LIPS, GAME_WIDTH, BEADS, HOUSE_LAYOUT, HOUSE_TOUCH_TARGETS, HUD_LAYOUT, HUD_PILL, HUD_TOUCH_TARGETS, MIN_TOUCH_TARGET, PLACEHOLDER_COLORS, ROOM_DONE_LAYOUT, ROOM_LAYOUT, ROOM_TOUCH_TARGETS, SUMMARY_LAYOUT, TASK_LAYOUT, TASK_TOUCH_TARGETS, UNLOCK_LAYOUT, WELCOME_LAYOUT, WELCOME_TOUCH_TARGETS } from '../src/data/layout';

describe('task screen layout constants', () => {
    it('keeps every touch target at least the minimum size', () => {
        for (const [name, size] of Object.entries(TASK_TOUCH_TARGETS)) {
            expect(size.width, `${name} width`).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
            expect(size.height, `${name} height`).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
        }
    });

    it('keeps the HUD speaker a touch target, inside the screen and clear of the star counter', () => {
        for (const [name, size] of Object.entries(HUD_TOUCH_TARGETS)) {
            expect(size.width, `${name} width`).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
            expect(size.height, `${name} height`).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
        }
        const { speaker } = HUD_LAYOUT;
        const counter = TASK_LAYOUT.starCounter;
        expect(speaker.left).toBeGreaterThanOrEqual(0);
        expect(speaker.top).toBeGreaterThanOrEqual(0);
        expect(speaker.left + speaker.width).toBeLessThanOrEqual(GAME_WIDTH);
        expect(speaker.top + speaker.height).toBeLessThanOrEqual(GAME_HEIGHT);
        expect(speaker.left + speaker.width).toBeLessThanOrEqual(counter.left);   // no overlap with the counter
        expect(speaker.top).toBeLessThanOrEqual(counter.top + counter.height);
    });

    it('keeps the HUD room switch a touch target in the top left, clear of the progress dots and the speaker', () => {
        const { roomSwitch, speaker } = HUD_LAYOUT;
        expect(HUD_TOUCH_TARGETS.roomSwitch).toEqual({ width: roomSwitch.width, height: roomSwitch.height });
        expect(roomSwitch.left).toBeGreaterThanOrEqual(0);
        expect(roomSwitch.top).toBeGreaterThanOrEqual(0);
        expect(roomSwitch.left + roomSwitch.width).toBeLessThanOrEqual(speaker.left);
        const dots = TASK_LAYOUT.dots;
        const dotsLeft = dots.centerX - (2 * BEADS.gap + BEADS.radius);   // five beads, centred
        expect(roomSwitch.left + roomSwitch.width).toBeLessThanOrEqual(dotsLeft);
    });

    it('draws every HUD control as a kit pill: 96 px or more, the pill height where the kit says so, lip on screen and clear of the beads and of each other', () => {
        const { settings, speaker, roomSwitch } = HUD_LAYOUT;
        const counter = TASK_LAYOUT.starCounter;
        const lip = LIPS.hud.offset;
        const pills = { speaker, roomSwitch, counter, settings };
        for (const [name, p] of Object.entries(pills)) {
            expect(p.height, `${name} height`).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
            expect(p.top + p.height + lip, `${name} lip on screen`).toBeLessThanOrEqual(GAME_HEIGHT);
        }
        for (const p of [speaker, roomSwitch, counter]) {
            expect(p.height).toBe(HUD_PILL.height);
        }
        // Face and lip of one pill, as one rectangle, against the beads row and the other pills.
        const box = (p: { left: number; top: number; width: number; height: number }) => ({ left: p.left, top: p.top, right: p.left + p.width, bottom: p.top + p.height + lip });
        const hits = (a: ReturnType<typeof box>, b: ReturnType<typeof box>): boolean => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
        const { dots } = TASK_LAYOUT;
        const reach = BEADS.radius;   // the beads of ProgressDots (the ring is drawn inside the radius)
        const row = { left: dots.centerX - (2 * BEADS.gap + reach), top: dots.y - reach, width: 2 * (2 * BEADS.gap + reach), height: 2 * reach - lip };
        for (const p of [speaker, roomSwitch, counter]) {
            expect(hits(box(p), box(row)), 'beads row').toBe(false);
        }
        const faces = Object.values(pills).map(box);
        faces.forEach((a, i) => faces.slice(i + 1).forEach((b) => expect(hits(a, b)).toBe(false)));
    });

    it('keeps the parent settings icon a touch target in the bottom right, outside the notebook and the room area and clear of the other HUD controls', () => {
        const { settings, speaker, roomSwitch } = HUD_LAYOUT;
        expect(HUD_TOUCH_TARGETS.settings).toEqual({ width: settings.width, height: settings.height });
        expect(settings.left).toBeGreaterThanOrEqual(0);
        expect(settings.top).toBeGreaterThanOrEqual(0);
        expect(settings.left + settings.width).toBeLessThanOrEqual(GAME_WIDTH);
        expect(settings.top + settings.height).toBeLessThanOrEqual(GAME_HEIGHT);
        // A child's tap on the notebook or the room must never land on the gear.
        const { notebook } = TASK_LAYOUT;
        expect(settings.left).toBeGreaterThanOrEqual(notebook.left + notebook.width);
        // Below the star counter, the speaker and "Do pokoju" (all in the top band).
        const counter = TASK_LAYOUT.starCounter;
        expect(settings.top).toBeGreaterThanOrEqual(counter.top + counter.height);
        expect(settings.top).toBeGreaterThanOrEqual(speaker.top + speaker.height);
        expect(settings.top).toBeGreaterThanOrEqual(roomSwitch.top + roomSwitch.height);
    });

    it('keeps the gear hint bubble above the gear, inside the screen and right of every answer control and room control (visual gate F-02)', () => {
        const { settingsHint, settings } = HUD_LAYOUT;
        const left = settingsHint.right - settingsHint.width;
        const { keypad, barSpan, picture, drag, coinDrag } = TASK_LAYOUT;
        const rights = {
            keypad: keypad.left + keypad.width,
            barTiles: barSpan.tiles.x + barSpan.tiles.width,
            barKeypad: barSpan.keypad.x + barSpan.keypad.width,
            tallTilesBar: picture.tall.tiles.bar.x + picture.tall.tiles.bar.width,
            tallTilesLines: picture.tall.tiles.lines.x + picture.tall.tiles.lines.width,
            tallKeypadBar: picture.tall.keypad.bar.x + picture.tall.keypad.bar.width,
            dragTray: drag.tray.x + drag.tray.width,
            dragOk: drag.ok.x + drag.ok.width,
            coinTray: coinDrag.tray.x + coinDrag.tray.width,
            roomTask: ROOM_LAYOUT.taskButton.left + ROOM_LAYOUT.taskButton.width,
            roomChoose: ROOM_LAYOUT.choose.left + ROOM_LAYOUT.choose.width,
            roomClose: ROOM_LAYOUT.close.left + ROOM_LAYOUT.close.width,
            roomMode: ROOM_LAYOUT.modeButton.left + ROOM_LAYOUT.modeButton.width,
        };
        for (const [name, right] of Object.entries(rights)) {
            expect(left, `hint clear of ${name}`).toBeGreaterThanOrEqual(right);
        }
        expect(settingsHint.right).toBeLessThanOrEqual(GAME_WIDTH);
        expect(settingsHint.bottom).toBeLessThanOrEqual(settings.top);
        // The longest word ("Przytrzymaj," about 183 px at 32 px / 650) must fit the wrap width, or it would stick out of the bubble.
        expect(settingsHint.width - 2 * settingsHint.padding).toBeGreaterThanOrEqual(FONT_SIZES.settingsHint * 5.8);
    });

    it('keeps the summary page buttons touch targets, side by side without overlap, inside the notebook', () => {
        const { width, height, left, gap, top } = SUMMARY_LAYOUT.buttons;
        expect(TASK_TOUCH_TARGETS.pageButton).toEqual({ width, height });
        const notebook = TASK_LAYOUT.notebook;
        expect(gap).toBeGreaterThan(0);                                   // the two buttons do not overlap
        expect(left + 2 * width + gap).toBeLessThanOrEqual(notebook.left + notebook.width - notebook.border);
        expect(top + height).toBeLessThanOrEqual(notebook.top + notebook.height - notebook.border);
        const { stars } = SUMMARY_LAYOUT;
        expect(stars.top + stars.size).toBeLessThan(SUMMARY_LAYOUT.earned.top);   // star row sits above "+N"
    });

    it('keeps the unlock card button a touch target, centred inside the card, which sits inside the notebook', () => {
        const { card, button, art, name } = UNLOCK_LAYOUT;
        expect(TASK_TOUCH_TARGETS.unlockNext).toEqual({ width: button.width, height: button.height });
        expect(button.width).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
        expect(button.height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
        expect(button.left + button.width / 2).toBe(card.left + card.width / 2);
        expect(button.top + button.height).toBeLessThanOrEqual(card.top + card.height - card.border);
        expect(art.top + art.size).toBeLessThan(name.y);                          // the art sits above the name
        expect(name.y + FONT_SIZES.unlockName).toBeLessThan(button.top);          // the name sits above the button
        const notebook = TASK_LAYOUT.notebook;
        expect(card.left).toBeGreaterThanOrEqual(notebook.left + notebook.border);
        expect(card.left + card.width).toBeLessThanOrEqual(notebook.left + notebook.width - notebook.border);
        expect(card.top + card.height).toBeLessThanOrEqual(notebook.top + notebook.height - notebook.border);
    });

    it('keeps the room touch targets 96 px or more, inside the scene, apart from each other, the gear and the HUD', () => {
        const { resume, taskButton } = ROOM_LAYOUT;
        expect(ROOM_TOUCH_TARGETS.resume).toEqual({ width: resume.width, height: resume.height });
        expect(ROOM_TOUCH_TARGETS.taskButton).toEqual({ width: taskButton.width, height: taskButton.height });
        const rects = [resume, taskButton].map((r) => ({ left: r.left, top: r.top, right: r.left + r.width, bottom: r.top + r.height }));
        for (const target of Object.values(ROOM_TOUCH_TARGETS)) {
            expect(target.width).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
            expect(target.height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
        }
        for (const r of rects) {
            expect(r.left).toBeGreaterThanOrEqual(0);
            expect(r.top).toBeGreaterThanOrEqual(0);
            expect(r.right).toBeLessThanOrEqual(GAME_WIDTH);
            expect(r.bottom).toBeLessThanOrEqual(GAME_HEIGHT);
        }
        const overlap = (a: { left: number; top: number; right: number; bottom: number }, b: { left: number; top: number; right: number; bottom: number }): boolean =>
            a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
        const { settings, speaker, roomSwitch } = HUD_LAYOUT;
        const hud = [settings, speaker, roomSwitch, TASK_LAYOUT.starCounter].map((r) => ({ left: r.left, top: r.top, right: r.left + r.width, bottom: r.top + r.height }));
        expect(overlap(rects[0], rects[1])).toBe(false);
        for (const r of rects) {
            for (const h of hud) {
                expect(overlap(r, h)).toBe(false);
            }
        }
    });

    it('keeps the "Dom" button a child-sized touch target, in the scene and clear of every other room control, the panel and the HUD', () => {
        type Rect = { left: number; top: number; right: number; bottom: number };
        const rect = (r: { left: number; top: number; width: number; height: number }): Rect => ({ left: r.left, top: r.top, right: r.left + r.width, bottom: r.top + r.height });
        const overlap = (a: Rect, b: Rect): boolean => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
        const { houseButton, resume, taskButton, modeButton, choose, close, thumbs, tray } = ROOM_LAYOUT;
        expect(ROOM_TOUCH_TARGETS.houseButton).toEqual({ width: houseButton.width, height: houseButton.height });
        expect(ROOM_TOUCH_TARGETS.houseButton.width).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
        expect(ROOM_TOUCH_TARGETS.houseButton.height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
        const r = rect(houseButton);
        expect(r.left).toBeGreaterThanOrEqual(0);
        expect(r.top).toBeGreaterThanOrEqual(0);
        expect(r.right).toBeLessThanOrEqual(GAME_WIDTH);
        expect(r.bottom).toBeLessThanOrEqual(GAME_HEIGHT);
        const thumbRects = [0, 1, 2].map((i) => rect({ left: thumbs.left + i * (thumbs.size + thumbs.gap), top: thumbs.top - thumbs.lift, width: thumbs.size, height: thumbs.size + thumbs.lift }));
        const { settings, speaker, roomSwitch } = HUD_LAYOUT;
        const hud = [settings, speaker, roomSwitch, TASK_LAYOUT.starCounter].map(rect);
        for (const other of [rect(resume), rect(taskButton), rect(modeButton), rect(choose), rect(close), ...thumbRects, ...hud]) {
            expect(overlap(r, other)).toBe(false);
        }
        expect(r.bottom).toBeLessThanOrEqual(tray.top);
    });

    it('draws the house shell under the cells: the pack shell has opaque cream cells (pack README order shell, cells, frame)', () => {
        const { depth } = HOUSE_LAYOUT;
        expect(depth.background).toBeLessThan(depth.shell);
        expect(depth.shell).toBeLessThan(depth.cells);
        expect(depth.cells).toBeLessThan(depth.frame);
        expect(depth.frame).toBeLessThan(depth.teaser);
        expect(depth.teaser).toBeLessThan(depth.controls);
    });

    it('keeps "Wróć do pokoju" of the house a child-sized target in the top-left corner, clear of the roof, the cells, the star counter and the HUD', () => {
        type Rect = { left: number; top: number; right: number; bottom: number };
        const rect = (r: { left: number; top: number; width: number; height: number }): Rect => ({ left: r.left, top: r.top, right: r.left + r.width, bottom: r.top + r.height });
        const overlap = (a: Rect, b: Rect): boolean => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
        const { back, shellLeft, shellTop } = HOUSE_LAYOUT;
        expect(HOUSE_TOUCH_TARGETS.back).toEqual({ width: back.width, height: back.height });
        expect(HOUSE_TOUCH_TARGETS.back.width).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
        expect(HOUSE_TOUCH_TARGETS.back.height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
        const r = rect(back);
        expect(r.left).toBeGreaterThanOrEqual(0);
        expect(r.top).toBeGreaterThanOrEqual(0);
        // The roof: the shell starts at x 456 and under y 148 at that edge, so the corner above-left of it is free.
        expect(r.right).toBeLessThanOrEqual(shellLeft);
        expect(r.bottom).toBeLessThanOrEqual(shellTop);
        const { settings, speaker } = HUD_LAYOUT;
        for (const other of [settings, speaker, TASK_LAYOUT.starCounter].map(rect)) expect(overlap(r, other)).toBe(false);
        for (const geometry of Object.values(HOUSE_GEOMETRY)) {
            for (const cell of geometry.cells) {
                expect(overlap(r, rect({ left: cell.x, top: cell.y, width: cell.width, height: cell.height }))).toBe(false);
                expect(cell.width).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
                expect(cell.height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
            }
        }
    });

    it('keeps "Wybieram" clear of the task button and "Wróć do notesu", so the second tap of a double tap after a purchase lands on nothing', () => {
        // After a purchase RoomScene.redraw shows the next task's button and the return button in the same step
        // (impl-review F1). "Zamknij" may share the task button's place: a double tap there re-opens the same panel.
        type Rect = { left: number; top: number; right: number; bottom: number };
        const rect = (r: { left: number; top: number; width: number; height: number }): Rect => ({ left: r.left, top: r.top, right: r.left + r.width, bottom: r.top + r.height });
        const overlap = (a: Rect, b: Rect): boolean => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
        const { choose, taskButton, resume } = ROOM_LAYOUT;
        expect(overlap(rect(choose), rect(taskButton))).toBe(false);
        expect(overlap(rect(choose), rect(resume))).toBe(false);
    });

    it('keeps the mode button and the "Pokój gotowy!" button touch targets in the scene, clear of the panel controls, "Wróć do notesu", the gear and the HUD', () => {
        // "Zamknij" shares the mode button's place on purpose (like the task button in S-09): a double tap on "Zamknij" toggles the mode and costs nothing.
        type Rect = { left: number; top: number; right: number; bottom: number };
        const rect = (r: { left: number; top: number; width: number; height: number }): Rect => ({ left: r.left, top: r.top, right: r.left + r.width, bottom: r.top + r.height });
        const overlap = (a: Rect, b: Rect): boolean => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
        const { modeButton, choose, resume, thumbs, tray } = ROOM_LAYOUT;
        const { button, card } = ROOM_DONE_LAYOUT;
        expect(ROOM_TOUCH_TARGETS.modeButton).toEqual({ width: modeButton.width, height: modeButton.height });
        expect(ROOM_TOUCH_TARGETS.cardNext).toEqual({ width: button.width, height: button.height });
        for (const target of [ROOM_TOUCH_TARGETS.modeButton, ROOM_TOUCH_TARGETS.cardNext]) {
            expect(target.width).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
            expect(target.height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
        }
        const thumbRects = [0, 1, 2].map((i) => rect({ left: thumbs.left + i * (thumbs.size + thumbs.gap), top: thumbs.top - thumbs.lift, width: thumbs.size, height: thumbs.size + thumbs.lift }));
        const { settings, speaker, roomSwitch } = HUD_LAYOUT;
        const hud = [settings, speaker, roomSwitch, TASK_LAYOUT.starCounter].map(rect);
        for (const r of [rect(modeButton), rect(button)]) {
            expect(r.left).toBeGreaterThanOrEqual(0);
            expect(r.top).toBeGreaterThanOrEqual(0);
            expect(r.right).toBeLessThanOrEqual(GAME_WIDTH);
            expect(r.bottom).toBeLessThanOrEqual(GAME_HEIGHT);
            for (const h of hud) {
                expect(overlap(r, h)).toBe(false);
            }
        }
        for (const r of [rect(modeButton), rect(button)]) {
            for (const other of [...thumbRects, rect(choose)]) {
                expect(overlap(r, other)).toBe(false);
            }
        }
        // "Wróć do notesu" and the mode button are on screen together; the card hides the way back.
        expect(overlap(rect(modeButton), rect(resume))).toBe(false);
        // The card sits above the tray, inside the room area's width and clear of the gear and the HUD; "Dalej" is inside it.
        const cardRect = rect(card);
        expect(cardRect.bottom).toBeLessThanOrEqual(tray.top);
        expect(cardRect.left).toBeGreaterThanOrEqual(0);
        expect(cardRect.right).toBeLessThanOrEqual(GAME_WIDTH);
        for (const h of hud) {
            expect(overlap(cardRect, h)).toBe(false);
        }
        const buttonRect = rect(button);
        expect(buttonRect.left).toBeGreaterThanOrEqual(cardRect.left);
        expect(buttonRect.right).toBeLessThanOrEqual(cardRect.right);
        expect(buttonRect.top).toBeGreaterThanOrEqual(cardRect.top);
        expect(buttonRect.bottom).toBeLessThanOrEqual(cardRect.bottom);
    });

    it('lays the room list tiles of the "Pokój gotowy!" card inside it and above "Dalej"', () => {
        const { card, tiles, button, title } = ROOM_DONE_LAYOUT;
        const total = 2 * tiles.width + tiles.gap;
        const first = card.left + card.width / 2 - total / 2;
        expect(first).toBeGreaterThanOrEqual(card.left);
        expect(first + total).toBeLessThanOrEqual(card.left + card.width);
        expect(tiles.top).toBeGreaterThan(title.y);
        expect(tiles.top + tiles.height).toBeLessThanOrEqual(button.top);
        expect(ROOM_LAYOUT.scene.width * tiles.thumbScale).toBeLessThanOrEqual(tiles.width);
        // The miniature of the 1920x1080 scene ends above the caption line of the tile.
        expect(tiles.thumbTop + ROOM_LAYOUT.scene.height * tiles.thumbScale).toBeLessThan(tiles.captionY - 14);
    });

    // Plan-review F3: the pictures use the manifest z (0-99); everything the child touches or reads is drawn above that band.
    it('draws the room controls above every room layer depth and in a fixed order', () => {
        const { depth } = ROOM_LAYOUT;
        const order = [depth.outline, depth.controls, depth.panel, depth.celebrate, depth.card];
        for (const d of order) expect(d).toBeGreaterThan(99);
        expect([...order].sort((a, b) => a - b)).toEqual(order);
        expect(new Set(order).size).toBe(order.length);
        for (const room of Object.values(ROOMS)) {
            for (const layer of [...room.slots, ...room.decor]) {
                expect(layer.z, `${room.id}/${layer.id}`).toBeGreaterThanOrEqual(0);
                expect(layer.z, `${room.id}/${layer.id}`).toBeLessThanOrEqual(99);
                expect(layer.z, `${room.id}/${layer.id}`).toBeGreaterThan(depth.shadows);
            }
            expect(depth.shadows).toBeLessThan(depth.worn);
            expect(depth.worn + 0.1).toBeLessThan(depth.outline);
            expect(depth.wornGhost).toBeLessThan(depth.outline);
        }
    });

    it('keeps the variant name inside its thumbnail, under the picture', () => {
        const { thumbs } = ROOM_LAYOUT;
        expect(thumbs.labelY).toBeLessThan(thumbs.size);
        expect(thumbs.labelY).toBeGreaterThanOrEqual(thumbs.size - thumbs.inset - thumbs.nameHeight / 2);
        expect('minAspect' in thumbs).toBe(false);
    });

    it('keeps the variant panel touch targets 96 px or more, inside the tray, apart from each other and clear of the HUD', () => {
        const { tray, thumbs, choose, close } = ROOM_LAYOUT;
        expect(ROOM_TOUCH_TARGETS.thumb).toEqual({ width: thumbs.size, height: thumbs.size });
        expect(ROOM_TOUCH_TARGETS.choose).toEqual({ width: choose.width, height: choose.height });
        expect(ROOM_TOUCH_TARGETS.close).toEqual({ width: close.width, height: close.height });
        for (const target of [ROOM_TOUCH_TARGETS.thumb, ROOM_TOUCH_TARGETS.choose, ROOM_TOUCH_TARGETS.close]) {
            expect(target.width).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
            expect(target.height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
        }
        type Rect = { left: number; top: number; right: number; bottom: number };
        const rect = (r: { left: number; top: number; width: number; height: number }): Rect => ({ left: r.left, top: r.top, right: r.left + r.width, bottom: r.top + r.height });
        const overlap = (a: Rect, b: Rect): boolean => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
        const trayRect = rect(tray);
        const thumbRects = [0, 1, 2].map((i) => rect({ left: thumbs.left + i * (thumbs.size + thumbs.gap), top: thumbs.top - thumbs.lift, width: thumbs.size, height: thumbs.size + thumbs.lift }));
        const all = [...thumbRects, rect(choose), rect(close)];
        for (const r of all) {
            expect(r.left).toBeGreaterThanOrEqual(trayRect.left);
            expect(r.top).toBeGreaterThanOrEqual(trayRect.top);
            expect(r.right).toBeLessThanOrEqual(trayRect.right);
            expect(r.bottom).toBeLessThanOrEqual(trayRect.bottom);
        }
        for (let i = 0; i < all.length; i++) {
            for (let j = i + 1; j < all.length; j++) {
                expect(overlap(all[i], all[j])).toBe(false);
            }
        }
        const { settings, speaker, roomSwitch } = HUD_LAYOUT;
        for (const h of [settings, speaker, roomSwitch, TASK_LAYOUT.starCounter]) {
            expect(overlap(trayRect, rect(h))).toBe(false);
        }
    });

    it('keeps the welcome age buttons touch targets, side by side without overlap, inside the notebook', () => {
        const { left, top, width, height, gap } = WELCOME_LAYOUT.ages;
        expect(WELCOME_TOUCH_TARGETS.age).toEqual({ width, height });
        expect(WELCOME_TOUCH_TARGETS.age.width).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
        expect(WELCOME_TOUCH_TARGETS.age.height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
        expect(gap).toBeGreaterThan(0);
        const notebook = TASK_LAYOUT.notebook;
        const count = placementData.ages.length;
        expect(left).toBeGreaterThanOrEqual(notebook.left + notebook.border);
        expect(left + count * width + (count - 1) * gap).toBeLessThanOrEqual(notebook.left + notebook.width - notebook.border);
        expect(top + height + LIPS.age.offset).toBeLessThanOrEqual(notebook.top + notebook.height - notebook.border);
        expect(WELCOME_LAYOUT.question.y + FONT_SIZES.summaryTitle).toBeLessThan(top);   // the question sits above the buttons
    });

    it('keeps the welcome parent button a touch target, inside the notebook and clear of the age buttons', () => {
        const { left, top, width, height } = WELCOME_LAYOUT.parent;
        expect(WELCOME_TOUCH_TARGETS.parent).toEqual({ width, height });
        expect(WELCOME_TOUCH_TARGETS.parent.width).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
        expect(WELCOME_TOUCH_TARGETS.parent.height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
        // Visual gate S-06: the button used to straddle the notebook's bottom-right border; it sits inside, like the kit's page buttons.
        const notebook = TASK_LAYOUT.notebook;
        expect(left).toBeGreaterThanOrEqual(notebook.left + notebook.border);
        expect(left + width).toBeLessThanOrEqual(notebook.left + notebook.width - notebook.border);
        expect(top + height).toBeLessThanOrEqual(notebook.top + notebook.height - notebook.border);
        const ages = WELCOME_LAYOUT.ages;
        expect(top).toBeGreaterThanOrEqual(ages.top + ages.height + LIPS.age.offset);
    });

    it('lays the welcome choice view out: cards, speaker and back are touch targets inside the notebook, clear of each other and of the title', () => {
        const { title, cards, speaker, back } = WELCOME_LAYOUT.choice;
        const cardH = cards.pictureHeight + cards.labelHeight;
        expect(WELCOME_TOUCH_TARGETS.choiceCard).toEqual({ width: cards.pictureWidth, height: cardH });
        expect(WELCOME_TOUCH_TARGETS.choiceSpeaker).toEqual({ width: speaker.width, height: speaker.height });
        expect(WELCOME_TOUCH_TARGETS.choiceBack).toEqual({ width: back.width, height: back.height });
        for (const t of [WELCOME_TOUCH_TARGETS.choiceCard, WELCOME_TOUCH_TARGETS.choiceSpeaker, WELCOME_TOUCH_TARGETS.choiceBack]) {
            expect(t.width).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
            expect(t.height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
        }
        type R = { left: number; top: number; right: number; bottom: number };
        const box = (left: number, top: number, width: number, height: number): R => ({ left, top, right: left + width, bottom: top + height });
        const overlap = (a: R, b: R): boolean => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
        const nb = TASK_LAYOUT.notebook;
        const face: R = { left: Math.max(CONTENT_LEFT, nb.left + nb.border), top: nb.top + nb.border, right: nb.left + nb.width - nb.border, bottom: nb.top + nb.height - nb.border };
        const cardRects = BUILDING_CHOICES.map((_, i) => box(cards.left + i * (cards.pictureWidth + cards.gap), cards.top, cards.pictureWidth, cardH + LIPS.age.offset));
        const titleRect = box(title.x - 560, title.y, 1120, FONT_SIZES.summaryTitle);   // generous width for "Co urządzamy najpierw?"
        const rects = [...cardRects, box(speaker.left, speaker.top, speaker.width, speaker.height), box(back.left, back.top, back.width, back.height + 8)];
        for (const r of rects) {
            expect(r.left).toBeGreaterThanOrEqual(face.left);
            expect(r.right).toBeLessThanOrEqual(face.right);
            expect(r.top).toBeGreaterThanOrEqual(face.top);
            expect(r.bottom).toBeLessThanOrEqual(face.bottom);
            expect(overlap(r, titleRect)).toBe(false);
        }
        for (let i = 0; i < rects.length; i++) {
            for (let j = i + 1; j < rects.length; j++) {
                expect(overlap(rects[i], rects[j])).toBe(false);
            }
        }
        expect(cards.gap).toBeGreaterThan(0);
    });

    it('uses the kit tile height of 136 px, not smaller', () => {
        expect(TASK_LAYOUT.tiles.height).toBeGreaterThanOrEqual(136);
    });

    it('keeps the prompt font at 64 px or more', () => {
        expect(FONT_SIZES.prompt).toBeGreaterThanOrEqual(64);
    });

    it('uses the style guide weights (650-750) for every kit text role, inside the font range', () => {
        const [min, max] = FONT_WEIGHT_RANGE.split(' ').map(Number);
        for (const [role, weight] of Object.entries(FONT_WEIGHTS)) {
            expect(weight, role).toBeGreaterThanOrEqual(min);
            expect(weight, role).toBeLessThanOrEqual(max);
            if (role !== 'caption' && role !== 'brand' && role !== 'unlockTitle') {   // the build id is technical; the kit brand line and the unlock title are 800 (.welcome-brand, .unlock-card h2)
                expect(weight, role).toBeGreaterThanOrEqual(650);
                expect(weight, role).toBeLessThanOrEqual(750);
            }
        }
    });

    it('fits four tiles and the keypad inside the notebook', () => {
        const { tiles, keypad, notebook } = TASK_LAYOUT;
        const tilesRight = tiles.left + 4 * tiles.width + 3 * tiles.gap;
        expect(tilesRight).toBeLessThanOrEqual(notebook.left + notebook.width);
        expect(keypad.left + keypad.width).toBeLessThanOrEqual(notebook.left + notebook.width);
        expect(3 * keypad.keyWidth + 2 * keypad.gap).toBe(keypad.width);
    });

    it('keeps the solution lines (expression centre, bar width) inside the notebook and left of the keypad', () => {
        const { notebook, keypad, barSpan, expression, expressionWide } = TASK_LAYOUT;
        const inner = { left: notebook.left + notebook.border, right: notebook.left + notebook.width - notebook.border };
        for (const [centre, width, right] of [
            [expressionWide.x, barSpan.tiles.width, inner.right],
            [expression.x, barSpan.keypad.width, keypad.left],
        ] as const) {
            expect(centre - width / 2).toBeGreaterThanOrEqual(inner.left);
            expect(centre + width / 2).toBeLessThanOrEqual(right);
        }
    });

    it('keeps the lip of every task control inside the notebook and clear of the next control', () => {
        const { tiles, keypad, notebook, bar } = TASK_LAYOUT;
        const innerBottom = notebook.top + notebook.height - notebook.border;
        const barTop = bar.bottom - bar.height;
        for (const rect of tileRow(4, { x: notebook.left, y: tiles.top, width: notebook.width, height: tiles.height }, tiles)) {
            expect(rect.y + rect.height + LIPS.answer.offset).toBeLessThan(barTop);
        }
        expect(bar.bottom + LIPS.action.offset).toBeLessThanOrEqual(innerBottom);
        const rows = keypadGrid(keypad).keys.map((k) => k.rect);
        for (const rect of rows) {
            const below = rows.find((r) => r.x === rect.x && r.y > rect.y);
            if (below) {
                expect(rect.y + rect.height + LIPS.key.offset).toBeLessThan(below.y);
            } else {
                expect(rect.y + rect.height + LIPS.key.offset).toBeLessThanOrEqual(innerBottom);   // the bar sits left of the keypad, not under it
            }
        }
    });

    it('draws colours from the palette as valid RGB numbers', () => {
        for (const color of Object.values(PLACEHOLDER_COLORS)) {
            expect(Number.isInteger(color) && color >= 0 && color <= 0xffffff).toBe(true);
        }
    });
});

describe('isExpression', () => {
    it('recognises bare calculations and rejects sentences', () => {
        expect(isExpression('38 + 27')).toBe(true);
        expect(isExpression('17 − 8 = □')).toBe(true);
        expect(isExpression('Ile jest filiżanek?')).toBe(false);
        expect(isExpression('Liczba 3 jest parzysta czy nieparzysta?')).toBe(false);
    });
});

describe('"Wróć" to the age choice (F-02 b)', () => {
    it('is a touch target inside the left margin, clear of the notebook, above the build id caption', () => {
        const { ageBack, notebook } = TASK_LAYOUT;
        expect(TASK_TOUCH_TARGETS.ageBack).toEqual({ width: ageBack.width, height: ageBack.height });
        expect(ageBack.left).toBeGreaterThanOrEqual(0);
        expect(ageBack.left + ageBack.width).toBeLessThanOrEqual(notebook.left);
        expect(ageBack.top + ageBack.height).toBeLessThanOrEqual(GAME_HEIGHT - 24 - FONT_SIZES.caption);
    });
});

describe('notebook content stays right of the margin line (orchestrator browser defect after phase 4)', () => {
    const { notebook } = TASK_LAYOUT;
    // Hand-computed: frame left 180 + border 16 + margin 92 = line at 288, width 2, gap 24.
    const marginRight = 180 + 16 + 92 + 2;

    it('derives the inset from the notebook tokens', () => {
        expect(NOTEBOOK.margin.fromInnerLeft).toBe(92);
        expect(CONTENT_LEFT).toBe(marginRight + 24);
        expect(CONTENT_LEFT).toBe(314);
    });

    it('starts every left-column rectangle and the wrapped prompt box right of the line and ends them inside the notebook', () => {
        const { picture: p, promptBeside, expression, coinDrag, drag } = TASK_LAYOUT;
        const rects = [
            p.keypad, p.keypadSolution.picture, p.keypadSolution.lines, p.tilesSolution.picture, p.select.solution.picture,
            p.long.tiles, p.long.tilesSolution.picture, p.long.tilesSolution.lines, p.digits.picture, p.hint.keypad.picture, p.hint.keypad.lines,
            p.tall.tiles.picture, p.tall.keypad.picture, p.drag.picture, drag.mat, coinDrag.wallet,
            { x: promptBeside.x - promptBeside.maxWidth / 2, y: 0, width: promptBeside.maxWidth, height: 0 },
            { x: expression.x - expression.maxWidth / 2, y: 0, width: expression.maxWidth, height: 0 },
        ];
        for (const r of rects) {
            expect(r.x).toBeGreaterThanOrEqual(CONTENT_LEFT);
            expect(r.x + r.width).toBeLessThanOrEqual(notebook.left + notebook.width - notebook.border);
        }
    });

    it('keeps a prompt beside the keypad clear of the keypad', () => {
        const { promptBeside, expression, keypad } = TASK_LAYOUT;
        expect(promptBeside.x + promptBeside.maxWidth / 2).toBeLessThan(keypad.left);
        expect(expression.x + expression.maxWidth / 2).toBeLessThan(keypad.left);
    });
});

describe('page and age button lips (phase 5)', () => {
    const { notebook } = TASK_LAYOUT;
    const innerBottom = notebook.top + notebook.height - notebook.border;

    it('keeps the lip of the summary, unlock, "Rodzic" and age buttons inside the notebook', () => {
        const { buttons } = SUMMARY_LAYOUT;
        expect(buttons.top + buttons.height + LIPS.page.offset).toBeLessThanOrEqual(innerBottom);
        const unlock = UNLOCK_LAYOUT.button;
        expect(unlock.top + unlock.height + LIPS.page.offset).toBeLessThanOrEqual(UNLOCK_LAYOUT.card.top + UNLOCK_LAYOUT.card.height - UNLOCK_LAYOUT.card.border);
        const parent = WELCOME_LAYOUT.parent;
        expect(parent.top + parent.height + LIPS.page.offset).toBeLessThanOrEqual(innerBottom);
        const ages = WELCOME_LAYOUT.ages;
        expect(ages.top + ages.height + LIPS.age.offset).toBeLessThanOrEqual(innerBottom);
    });

    it('keeps the lip of "Wróć" above the build id caption', () => {
        const { ageBack } = TASK_LAYOUT;
        expect(ageBack.top + ageBack.height + LIPS.page.offset).toBeLessThanOrEqual(GAME_HEIGHT - 24 - FONT_SIZES.caption);
    });
});
