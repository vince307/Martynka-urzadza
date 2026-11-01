import { Renderer, Scene, type Loader } from 'phaser';
import { cellTap, houseArtKeys, houseCells, type HouseCellView } from '../core/houseCells';
import { roomDone } from '../core/rooms';
import type { HouseState, RoomState } from '../core/types';
import { balance } from '../data/balance';
import { loadErrorLine } from '../core/artHealth';
import { HOUSE_ART, type HouseArtEntry } from '../data/houseArt';
import { FIRST_HOUSE, HOUSE_GEOMETRY } from '../data/houses';
import { HOUSE_LAYOUT, REGISTRY_KEYS, SCENE_KEYS } from '../data/layout';
import { pl } from '../data/pl';
import { FIRST_ROOM, ROOMS } from '../data/rooms';
import { recordFallback } from '../ui/artFallbacks';
import type { RoomArtLoader } from '../ui/roomArtLoader';
import { playCues, soundOf } from '../ui/sound';
import { HouseView, type HouseCellMode } from '../ui/widgets/HouseView';
import { PageButton } from '../ui/widgets/PageButton';

export interface HouseSnapshot {
    cells: { id: string; floor: number; place: number; room: string | null; state: string; mode: HouseCellMode }[];
    shellReady: boolean;
    pending: string[];
}

/**
 * The house cross-section (S-23, FR-038): the child's house with one cell per room. A done room opens in the room scene (a visit), the room
 * in renovation returns to it, every other cell does nothing. The scene only reads the registry (never writes the room, the stars or the
 * current room), draws through `HouseView` and moves with `scene.switch`, so the task scene and the room sleep underneath. Nothing here is a tween.
 * Its pictures load on this scene's own loader the first time it opens (never at boot); until they arrive, or when they fail, a shell drawn in
 * code stands in. DESIGN-GAP (docs/design-gaps.md rows 184, 186-189): the kit has no house view.
 */
export class HouseScene extends Scene {
    private view!: HouseView;
    private back!: PageButton;
    private cells: HouseCellView[] = [];
    private modes: Record<string, HouseCellMode> = {};
    private artSettled = false;
    private artQueued = false;

    constructor() {
        super(SCENE_KEYS.house);
    }

    create(): void {
        // A scene object is reused by scene.start: forget the art flags and drawn cells of the building seen before (S-29).
        this.artQueued = false;
        this.artSettled = false;
        this.cells = [];
        this.modes = {};
        this.view = new HouseView(this);
        this.back = new PageButton(this, () => { this.tap(); this.scene.switch(SCENE_KEYS.room); }).setDepth(HOUSE_LAYOUT.depth.controls);
        const geometry = this.geometry();
        for (const def of geometry.cells) {
            const zone = this.add.zone(def.x + def.width / 2, def.y + def.height / 2, def.width, def.height).setInteractive().setDepth(HOUSE_LAYOUT.depth.controls);
            zone.on('pointerup', () => this.tapCell(def.id));
        }
        const onWake = (): void => this.show();
        const onRoomLoad = (): void => {
            if (this.scene.isActive()) this.render();
        };
        // A lost and restored WebGL context empties every texture; the cells are captured again at once, awake or asleep (as the task scene's backdrop).
        const onRestore = (): void => this.render();
        this.events.on('wake', onWake);
        this.registry.events.on(`changedata-${REGISTRY_KEYS.roomLoad}`, onRoomLoad);
        this.game.renderer.on(Renderer.Events.RESTORE_WEBGL, onRestore);
        this.events.once('shutdown', () => {
            this.events.off('wake', onWake);
            this.registry.events.off(`changedata-${REGISTRY_KEYS.roomLoad}`, onRoomLoad);
            this.game.renderer.off(Renderer.Events.RESTORE_WEBGL, onRestore);
            this.view.destroy();
        });
        this.show();
    }

    /** Every open of the house: the HUD gives way, the rooms of the open cells are asked for, the house art is queued once, then it is drawn. */
    private show(): void {
        this.registry.set(REGISTRY_KEYS.narration, null);
        this.registry.set(REGISTRY_KEYS.roomSwitch, false);
        this.registry.set(REGISTRY_KEYS.hudTitle, null);
        this.back.show(pl.house.back, HOUSE_LAYOUT.back.left, HOUSE_LAYOUT.back.top, 'secondary', false, HOUSE_LAYOUT.back);
        this.loadArt();
        this.render();
    }

    private render(): void {
        const geometry = this.geometry();
        const house = (this.registry.get(REGISTRY_KEYS.house) as HouseState | undefined) ?? FIRST_HOUSE;
        const rooms = this.registry.get(REGISTRY_KEYS.rooms) as Record<string, RoomState> | undefined;
        const current = (this.registry.get(REGISTRY_KEYS.currentRoom) as string | undefined) ?? FIRST_ROOM;
        this.cells = houseCells(geometry, house, current, (id) => (ROOMS[id] ? roomDone(ROOMS[id], rooms?.[id] ?? { tasksDone: 0, chosen: {} }) : null));
        const loader = this.registry.get(REGISTRY_KEYS.roomArtLoader) as RoomArtLoader | undefined;
        const open = this.cells.filter((c) => c.state !== 'closed' && c.room !== null).map((c) => c.room as string);
        loader?.ensure(open);
        this.modes = this.view.render(this.cells, geometry, rooms, { shellReady: this.shellReady(), pending: loader?.pending() ?? new Set<string>() });
    }

    private tapCell(id: string): void {
        if (!this.scene.isActive()) return;
        const cell = this.cells.find((c) => c.id === id);
        if (!cell) return;
        const tap = cellTap(cell);
        if (tap.kind === 'none') return;
        this.tap();
        if (tap.visit === null) this.scene.switch(SCENE_KEYS.room);
        else this.scene.switch(SCENE_KEYS.room, { visit: tap.visit });
    }

    private geometry() {
        const house = (this.registry.get(REGISTRY_KEYS.house) as HouseState | undefined) ?? FIRST_HOUSE;
        return HOUSE_GEOMETRY[house.id] ?? HOUSE_GEOMETRY[FIRST_HOUSE.id];
    }

    private shellReady(): boolean {
        return this.art().every((e) => this.textures.exists(e.key));
    }

    /** Only the pictures the current building names (house 1: three, the base: its own two plus the shared frame). */
    private art(): HouseArtEntry[] {
        const keys = houseArtKeys(this.geometry());
        return HOUSE_ART.filter((e) => keys.includes(e.key));
    }

    /** The first open queues the pictures of the current building on this scene's loader; a failed file is told once and leaves the stand-in. */
    private loadArt(): void {
        if (this.artQueued) return;
        this.artQueued = true;
        const missing = this.art().filter((e) => !this.textures.exists(e.key));
        const seam = __E2E_HOOK__ ? (this.registry.get(REGISTRY_KEYS.forcedArt) as string | null | undefined) : null;
        if (missing.length === 0) {
            this.artSettled = true;
            return;
        }
        if (seam === 'house') {
            this.settle();   // e2e build only: nothing is fetched
            return;
        }
        const onFail = (file: Loader.File): void => {
            if (this.art().some((e) => e.key === file.key)) console.warn(loadErrorLine('house', file.key, file.src, file.xhrLoader?.status ?? 0));
        };
        const onAdd = (_key: string, _type: string, _loader: unknown, file: Loader.File): void => {
            if (this.art().some((e) => e.key === file.key)) file.xhrSettings.timeout = balance.loader.timeoutMs;
        };
        this.load.on('addfile', onAdd);
        this.load.on('loaderror', onFail);
        this.load.once('complete', () => {
            this.load.off('loaderror', onFail);
            this.load.off('addfile', onAdd);
            this.settle();
            this.render();
        });
        for (const e of missing) this.load.image(e.key, e.url);
        this.load.start();
    }

    private settle(): void {
        this.artSettled = true;
        if (!this.shellReady()) recordFallback(this, 'house', 'drawn');
    }

    private tap(): void {
        playCues(this, soundOf(this.registry), [{ id: 'tap', delayMs: 0 }]);
    }

    /** For the e2e hook only. */
    snapshot(): HouseSnapshot {
        const loader = this.registry.get(REGISTRY_KEYS.roomArtLoader) as RoomArtLoader | undefined;
        return {
            cells: this.cells.map((c) => ({ id: c.id, floor: c.floor, place: c.place, room: c.room, state: c.state, mode: this.modes[c.id] ?? 'closed' })),
            shellReady: this.shellReady() && this.artSettled,
            pending: [...(loader?.pending() ?? [])],
        };
    }

    targets(): { back: { x: number; y: number } | null; cells: Record<string, { x: number; y: number }> } {
        const cells: Record<string, { x: number; y: number }> = {};
        for (const c of this.geometry().cells) cells[c.id] = { x: c.x + c.width / 2, y: c.y + c.height / 2 };
        return { back: this.back.target(), cells };
    }

    pixel(cellId: string): [number, number, number, number] | null {
        return this.view.pixel(cellId);
    }
}
