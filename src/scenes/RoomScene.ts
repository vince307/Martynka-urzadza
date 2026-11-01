import { Scene, type GameObjects, type Tweens } from 'phaser';
import { balance } from '../data/balance';
import type { InputSuspender } from '../core/inputSuspend';
import type { LongPressEvent } from '../core/longPress';
import { ROOM_GESTURE_IDLE, roomGesture, type RoomGestureState } from '../core/roomGesture';
import { holdPoint, slotAt, unreachableSlots, type AlphaAt } from '../core/roomHit';
import { effectiveAutoRead } from '../core/narration/voice';
import { panelCue } from '../core/sound';
import { playBeforeSpeech, playCues, soundOf } from '../ui/sound';
import { currentTask, emptyRoomState, roomDone, roomsListView, stagesDone, taskButtonView, type RoomListItem } from '../core/rooms';
import { celebrationView } from '../core/celebration';
import { houseLayout, houseRoomList, nextRoom } from '../core/house';
import { cardRooms } from '../core/roomLoad';
import { houseCells, houseWakeVisit } from '../core/houseCells';
import type { RoomArtLoader } from '../ui/roomArtLoader';
import type { HouseState, RoomDef, RoomState, Settings } from '../core/types';
import { stepPanel, type PanelEvent, type PanelState } from '../core/variantPanel';
import { ANIMATION, ROOM_LAYOUT, REGISTRY_KEYS, SCENE_KEYS } from '../data/layout';
import { pl, roomText } from '../data/pl';
import { FIRST_HOUSE, HOUSES, HOUSE_GEOMETRY } from '../data/houses';
import { FIRST_ROOM, ROOMS } from '../data/rooms';
import type { Narrator } from '../ui/narrator';
import { prefersReducedMotion } from '../ui/motion';
import { PageButton } from '../ui/widgets/PageButton';
import { RoomDoneCard } from '../ui/widgets/RoomDoneCard';
import { RoomTaskButton } from '../ui/widgets/RoomTaskButton';
import { SCENE_SIZE } from '../data/roomArt';
import { buildWorn, RoomView } from '../ui/widgets/RoomView';
import { starBurst } from '../ui/widgets/starBurst';
import { VariantPanel } from '../ui/widgets/VariantPanel';
import type { Autosaver } from '../core/autosave';


export interface RoomSnapshot {
    roomId: string;
    tasksDone: number;
    chosen: Readonly<Record<string, number>>;
    /** Chosen slots without a hold point (e2e hook only reads it). */
    unreachable: string[];
    shown: Readonly<Record<string, number>>;
    /** The graded after pieces of the neglected room (empty after the stage task) and whether every one carries the worn filter. */
    worn: { keys: string[]; graded: boolean };
    /** The loose pieces standing on a contact shadow (between the stage and the finished room). */
    contactShadows: string[];
    currentTask: { id: string; label: string; cost: number } | null;
    taskKind: 'stage' | 'slot' | null;
    affordable: boolean;
    buttonText: string;
    panel: PanelState;
    hold: 'idle' | 'holding';
    heldSlot: string | null;
    done: boolean;
    stageDone: boolean;
    mode: 'normal' | 'change';
    card: { title: string; items: RoomListItem[]; celebration: { intensity: string; revealMs: number; burst: number } } | null;
    doneMiniature: 'live' | 'thumbnail' | 'drawn' | null;
    modeText: string | null;
    visiting: string | null;
    /** The shown zoom-out button label ("Dom" / "Baza"), null while the button is hidden. */
    houseLabel: string | null;
}

/**
 * The room (S-09, S-10, S-16a): the salon drawn from its pictures (stand-ins when one is missing), "Wróć do notesu" and the button of the current renovation task.
 * It owns the variant panel's state, the child's hold gesture, the change mode and the "Pokój gotowy!" card: the star balance and the room
 * progress live in the game registry, the scene only draws them and redraws on wake. The task scene sleeps underneath and wakes as it was left.
 * A task the child cannot afford yet sends them back to the notebook; an affordable one opens the variant panel, and only "Wybieram" there spends stars (core/variantPanel).
 * A hold on a furnished slot (or a tap in the change mode of a done room) opens the panel for a free change; the last purchase shows the card.
 * DESIGN-GAP (docs/design-gaps.md rows 12 and 37-41): the kit has the return button only.
 */
export class RoomScene extends Scene {
    private resume: PageButton | undefined;
    private view!: RoomView;
    private ghosts: GameObjects.Image[] = [];
    private ghostTweens: Tweens.Tween[] = [];
    private taskButton!: RoomTaskButton;
    private variantPanel!: VariantPanel;
    private panel: PanelState = { kind: 'closed' };
    private gesture: RoomGestureState = ROOM_GESTURE_IDLE;
    private holdZone!: GameObjects.Zone;
    private modeButton!: PageButton;
    private houseButton!: PageButton;
    /** The done room the child looks at instead of the room in renovation (runtime only, never saved). */
    private visiting: string | null = null;
    private doneCard!: RoomDoneCard;
    private mode: 'normal' | 'change' = 'normal';
    /** The last purchase finished the room: the child's controls stay off until "Dalej" (set at once, drawn after the pop). */
    private card = false;
    private cardDrawn = false;
    /** What the last drawn card used (the e2e hook reads it). */
    private celebrationUsed: { intensity: string; revealMs: number; burst: number } = { intensity: 'room', revealMs: 0, burst: 0 };

    constructor() {
        super(SCENE_KEYS.room);
    }

    create(): void {
        this.visiting = null;
        this.view = new RoomView(this);
        this.gesture = ROOM_GESTURE_IDLE;
        this.mode = 'normal';
        this.card = false;
        this.cardDrawn = false;
        // Under every button (created later, so drawn and hit first): a hold on a furnished slot opens its change panel (S-10).
        const area = ROOM_LAYOUT.scene;
        this.holdZone = this.add.zone(area.left + area.width / 2, area.top + area.height / 2, area.width, area.height).setInteractive();
        this.holdZone.on('pointerdown', (p: { id: number; x: number; y: number }) => this.feed({ type: 'down', id: p.id, x: p.x, y: p.y, now: this.time.now }));
        this.holdZone.on('pointerup', (p: { id: number; wasCanceled?: boolean }) => this.feed(p.wasCanceled ? { type: 'cancel' } : { type: 'up', id: p.id }));
        this.holdZone.on('pointerout', () => this.feed({ type: 'cancel' }));
        this.input.on('pointermove', (p: { id: number; x: number; y: number }) => this.feed({ type: 'move', id: p.id, x: p.x, y: p.y }));
        this.taskButton = new RoomTaskButton(this, (affordable) => {
            if (!affordable) {
                this.tap();
                this.scene.switch(SCENE_KEYS.task);
                return;
            }
            this.dispatch({ type: 'open' });
        });
        this.variantPanel = new VariantPanel(
            this,
            (variant) => this.dispatch({ type: 'pick', variant }),
            () => this.dispatch({ type: 'confirm' }),
            () => this.dispatch({ type: 'close' }),
        );
        this.modeButton = new PageButton(this, () => {
            this.tap();
            this.mode = this.mode === 'change' ? 'normal' : 'change';
            this.resetGesture();
            this.redraw();
        }).setDepth(ROOM_LAYOUT.depth.controls);
        this.houseButton = new PageButton(this, () => { this.tap(); this.scene.switch(SCENE_KEYS.house); }).setDepth(ROOM_LAYOUT.depth.controls);
        this.doneCard = new RoomDoneCard(this, () => {
            this.tap();
            this.card = false;
            this.cardDrawn = false;
            this.moveAfterDone();
            this.redraw();
        });
        const button = new PageButton(this, () => { this.tap(); this.scene.switch(SCENE_KEYS.task); }).setDepth(ROOM_LAYOUT.depth.controls);
        this.resume = button;
        const refresh = (_sys?: unknown, data?: unknown): void => {
            this.panel = { kind: 'closed' };
            this.mode = 'normal';
            this.card = false;
            this.cardDrawn = false;
            this.resetGesture();
            // The house's wake data is the only way to a visit; a wake without data (notebook, house back) ends it.
            this.visiting = houseWakeVisit(data, this.currentRoomId(), this.houseCellList());
            if (this.visiting !== null) {
                this.roomArtLoader()?.ensure([this.visiting]);
            }
            this.redraw();
        };
        const onStars = (): void => {
            // The balance can change while the task scene is awake; only the open room reacts.
            if (this.scene.isActive()) {
                this.redraw();
            }
        };
        refresh();
        const onSleep = (): void => {
            this.visiting = null;
            // The panel, the card and the change mode never outlive the visit: the way out is hidden while they are up, but a settings dialog could cover it.
            this.panel = { kind: 'closed' };
            this.mode = 'normal';
            this.card = false;
            this.cardDrawn = false;
            this.resetGesture();
            this.clearGhosts();
        };
        this.events.on('wake', refresh);
        this.events.on('sleep', onSleep);
        this.registry.events.on(`changedata-${REGISTRY_KEYS.stars}`, onStars);
        // A room's pictures arrived (or were cut): the card tile or the room after "Dalej" is drawn again from what is loaded.
        const onRoomLoad = (): void => {
            if (this.scene.isActive()) {
                this.redraw();
            }
        };
        this.registry.events.on(`changedata-${REGISTRY_KEYS.roomLoad}`, onRoomLoad);
        this.events.once('shutdown', () => {
            this.events.off('wake', refresh);
            this.events.off('sleep', onSleep);
            this.clearGhosts();
            this.registry.events.off(`changedata-${REGISTRY_KEYS.stars}`, onStars);
            this.registry.events.off(`changedata-${REGISTRY_KEYS.roomLoad}`, onRoomLoad);
        });
    }

    update(): void {
        if (this.gesture.press.kind === 'idle') {
            return;
        }
        const suspender = this.registry.get(REGISTRY_KEYS.inputSuspender) as InputSuspender | undefined;
        // A dialog over the canvas swallows the lift of the finger: the hold must not survive it.
        this.feed(suspender?.suspended() ? { type: 'cancel' } : { type: 'tick', now: this.time.now });
    }

    /** The gesture reducer decides when a hold opens the panel; the scene only supplies the slot under the finger and runs the result. */
    private feed(event: LongPressEvent): void {
        if (this.panel.kind === 'open' || this.card) {
            return;
        }
        const { room, state } = this.resolve();
        const slot = event.type === 'down' ? slotAt(room, state.chosen, { x: event.x, y: event.y }, this.alphaAt(room, state.chosen)) : null;
        const result = roomGesture(this.gesture, event, { mode: this.mode, slot, rules: balance.roomHold });
        this.gesture = result.state;
        this.view.highlight(result.held);
        if (result.open !== null) {
            this.resetGesture();
            this.dispatch({ type: 'change', slot: result.open });
        }
    }

    /**
     * Alpha of the picture a slot shows now, read from its texture (a touch on a transparent pixel goes to the piece below). Asked on
     * a pointer `down` only, never on a move. Null when the texture is not loaded: the slot's rectangle alone counts then.
     */
    private alphaAt(room: RoomDef, chosen: Readonly<Record<string, number>>): AlphaAt {
        return (slotId, localX, localY) => {
            const variant = chosen[slotId];
            const key = room.slots.find((s) => s.id === slotId)?.variants[variant ?? -1];
            if (!key || !this.textures.exists(key)) {
                return null;
            }
            return this.textures.getPixelAlpha(Math.floor(localX), Math.floor(localY), key);
        };
    }

    private resetGesture(): void {
        this.gesture = ROOM_GESTURE_IDLE;
        this.view.highlight(null);
    }

    /** Room and its state from ONE id, so an unknown id can never pair one room with another room's state. */
    private resolve(): { room: RoomDef; state: RoomState } {
        const id = this.visiting ?? (this.registry.get(REGISTRY_KEYS.currentRoom) as string | undefined) ?? FIRST_ROOM;
        const room = ROOMS[id] ?? ROOMS[FIRST_ROOM];
        const rooms = this.registry.get(REGISTRY_KEYS.rooms) as Record<string, RoomState> | undefined;
        return { room, state: rooms?.[room.id] ?? emptyRoomState() };
    }

    private stars(): number {
        return (this.registry.get(REGISTRY_KEYS.stars) as number | undefined) ?? 0;
    }

    /** One tap = one reducer step. The registry is written only when the reducer says something was bought. */
    private dispatch(event: PanelEvent): void {
        const { room, state } = this.resolve();
        const step = stepPanel(this.panel, event, { room, state, stars: this.stars() });
        // One cue per tap: opening, previewing, "Wybieram" (a purchase or a free change); "Zamknij" is a navigation tap.
        const cue = panelCue(this.panel, step, event);
        playCues(this, soundOf(this.registry), cue ? [{ id: cue, delayMs: 0 }] : event.type === 'close' && this.panel.kind !== 'closed' ? [{ id: 'tap', delayMs: 0 }] : []);
        this.panel = step.panel;
        if (this.panel.kind === 'open') {
            this.resetGesture();
        }
        if (step.changed) {
            // A change is free: only the room is written, never the balance (core/variantPanel returns the same stars).
            const rooms = (this.registry.get(REGISTRY_KEYS.rooms) as Record<string, RoomState> | undefined) ?? {};
            this.registry.set(REGISTRY_KEYS.rooms, { ...rooms, [room.id]: step.state });
        }
        if (step.bought) {
            const rooms = (this.registry.get(REGISTRY_KEYS.rooms) as Record<string, RoomState> | undefined) ?? {};
            this.registry.set(REGISTRY_KEYS.rooms, { ...rooms, [room.id]: step.state });
            this.registry.set(REGISTRY_KEYS.stars, step.stars);
            // A purchase is saved at once, after both registry writes (the snapshot is taken when the write starts).
            void (this.registry.get(REGISTRY_KEYS.saver) as Pick<Autosaver, 'flush'> | undefined)?.flush('now');
            if (roomDone(room, step.state)) {
                // The last purchase: the controls go off now, the card is drawn once the new furniture has popped.
                this.card = true;
                this.cardDrawn = false;
                this.resetGesture();
                // The card lists the other rooms: their pictures load now, behind the reveal hold.
                this.roomArtLoader()?.ensure(cardRooms(this.listItems()));
            }
        }
        this.redraw();
        if (this.card && !this.cardDrawn) {
            const delay = celebrationView('room', prefersReducedMotion(), ANIMATION.celebration).revealMs;
            if (delay === 0) {
                this.showCard();
            } else {
                this.time.delayedCall(delay, () => this.showCard());
            }
        }
        // A stage purchase has no furniture to pop: the neglected background fades out instead.
        if (step.bought?.kind === 'stage') {
            this.fadeStage();
            return;
        }
        const celebrated = step.bought ?? step.changed;
        if (celebrated) {
            this.celebrate(celebrated);
        }
    }

    private showCard(): void {
        if (!this.card || this.cardDrawn) {
            return;
        }
        this.cardDrawn = true;
        this.redraw();
        const wait = playBeforeSpeech(soundOf(this.registry), 'room-done');
        const settings = this.registry.get(REGISTRY_KEYS.settings) as Settings | undefined;
        const learner = this.registry.get(REGISTRY_KEYS.learner) as { stage: string } | undefined;
        if (settings && learner && effectiveAutoRead(settings, learner.stage, balance.narrator.autoReadStages)) {
            // The tap on "Wybieram" was the gesture that unlocks speech (like the unlock card after "Dalej").
            // The cue plays first and the card is read after it (the narrator is never cut); no cue played: at once.
            const speak = (): void => {
                if (this.cardDrawn) {
                    (this.registry.get(REGISTRY_KEYS.narrator) as Narrator | undefined)?.speak(pl.room.done.spoken);
                }
            };
            if (wait > 0) {
                this.time.delayedCall(wait, speak);
            } else {
                speak();
            }
        }
    }

    private roomArtLoader(): RoomArtLoader | undefined {
        return this.registry.get(REGISTRY_KEYS.roomArtLoader) as RoomArtLoader | undefined;
    }

    /** "Dalej": the game moves to the room in renovation (nothing with one room). The save is written after both registry writes. */
    private moveAfterDone(): void {
        const moved = nextRoom(
            { rooms: this.savedRooms(), currentRoom: this.resolve().room.id },
            houseLayout((this.registry.get(REGISTRY_KEYS.house) as HouseState | undefined) ?? FIRST_HOUSE, HOUSES, FIRST_HOUSE),
            ROOMS,
        );
        if (moved.movedFrom === null) {
            return;
        }
        this.registry.set(REGISTRY_KEYS.rooms, moved.rooms);
        this.registry.set(REGISTRY_KEYS.currentRoom, moved.currentRoom);
        void (this.registry.get(REGISTRY_KEYS.saver) as Pick<Autosaver, 'flush'> | undefined)?.flush('now');
        const loader = this.roomArtLoader();
        loader?.ensure([moved.currentRoom]);
        loader?.refreshHealth(moved.currentRoom);
    }

    private savedRooms(): Record<string, RoomState> {
        return (this.registry.get(REGISTRY_KEYS.rooms) as Record<string, RoomState> | undefined) ?? {};
    }

    private listItems(): RoomListItem[] {
        const rooms = this.savedRooms();
        const saved = (this.registry.get(REGISTRY_KEYS.house) as HouseState | undefined) ?? FIRST_HOUSE;
        return roomsListView(houseRoomList(houseLayout(saved, HOUSES, FIRST_HOUSE), ROOMS), ROOMS, rooms);
    }

    private currentRoomId(): string {
        return (this.registry.get(REGISTRY_KEYS.currentRoom) as string | undefined) ?? FIRST_ROOM;
    }

    private houseCellList() {
        const saved = (this.registry.get(REGISTRY_KEYS.house) as HouseState | undefined) ?? FIRST_HOUSE;
        const rooms = this.savedRooms();
        return houseCells(HOUSE_GEOMETRY[saved.id] ?? HOUSE_GEOMETRY[FIRST_HOUSE.id], saved, this.currentRoomId(), (id) => (ROOMS[id] ? roomDone(ROOMS[id], rooms[id] ?? emptyRoomState()) : null));
    }

    private redraw(): void {
        const { room, state } = this.resolve();
        const task = currentTask(room, state);
        const open = this.panel.kind === 'open';
        const blocked = open || this.card;
        const panelSlot = this.panel.kind === 'open' ? (this.panel.mode === 'change' ? this.panel.slot : task?.kind === 'slot' ? task.slot : undefined) : undefined;
        const preview = this.panel.kind === 'open' && this.panel.preview !== null && panelSlot ? { slot: panelSlot, variant: this.panel.preview } : null;
        if (this.holdZone.input) {
            this.holdZone.input.enabled = !blocked;
        }
        this.view.render(room, state, preview);
        const taskView = taskButtonView(room, state, this.stars());
        this.taskButton.show(blocked ? null : taskView);
        const { modeButton } = ROOM_LAYOUT;
        if (!blocked && roomDone(room, state)) {
            this.modeButton.show(this.mode === 'change' ? pl.room.change.exit : pl.room.change.enter, modeButton.left, modeButton.top, 'primary', false, modeButton);
        } else {
            this.modeButton.hide();
        }
        const savedHouse = (this.registry.get(REGISTRY_KEYS.house) as HouseState | undefined) ?? FIRST_HOUSE;
        // The cross-section exists only for a building with geometry (data-driven: S-29 gives the space base one).
        if (blocked || !Object.prototype.hasOwnProperty.call(HOUSE_GEOMETRY, savedHouse.id)) {
            this.houseButton.hide();
        } else {
            const { houseButton } = ROOM_LAYOUT;
            this.houseButton.show(pl.house.open[savedHouse.id], houseButton.left, houseButton.top, 'primary', false, houseButton);
        }
        if (this.cardDrawn) {
            const view = celebrationView('room', prefersReducedMotion(), ANIMATION.celebration);
            this.celebrationUsed = { intensity: view.intensity, revealMs: view.revealMs, burst: view.burstCount };
            this.doneCard.show(this.listItems(), ROOMS, { ...this.savedRooms(), [room.id]: state }, room.id, {
                pending: this.roomArtLoader()?.pending() ?? new Set<string>(),
                burst: view.burstCount,
            });
        } else {
            this.doneCard.hide();
        }
        const { resume } = ROOM_LAYOUT;
        if (open) {
            const slotDef = room.slots.find((s) => s.id === panelSlot);
            if (slotDef) {
                this.variantPanel.show(slotDef, this.panel.kind === 'open' ? this.panel.preview : null);
            }
        } else {
            this.variantPanel.hide();
        }
        if (blocked) {
            this.resumeButton().hide();
        } else {
            // A press that began before the switch must not count, so the button is re-armed on every redraw.
            this.resumeButton().show(pl.room.resume, resume.left, resume.top, 'primary', false, resume);
        }
        // The speaker reads what the button asks for; the task scene overwrites it on its wake.
        const label = taskView ? roomText.task(taskView.label) : undefined;
        const narration = this.card ? pl.room.done.spoken : this.mode === 'change' ? pl.room.change.hint : label;
        this.registry.set(REGISTRY_KEYS.narration, narration ?? null);
    }

    private resumeButton(): PageButton {
        return this.resume as PageButton;
    }

    /** The neglected room fades away over the renovated one; nothing when the child asked for less motion. */
    private fadeStage(): void {
        if (prefersReducedMotion()) {
            return;
        }
        const { room } = this.resolve();
        const { depth } = ROOM_LAYOUT;
        // DESIGN-GAP (docs/design-gaps.md): the pack has no in-between backgrounds (brief P3.6), so this is a plain cross-fade.
        // The whole neglected state fades: its background, its floor shadows and the graded pieces (built from the empty state).
        const ghosts: GameObjects.Image[] = [];
        const plain = [
            { key: room.scene.before, depth: depth.scene + 0.1 },
            { key: room.scene.shadows, depth: depth.shadows + 0.1 },
        ];
        plain.forEach(({ key, depth: at }) => {
            if (this.textures.exists(key)) {
                ghosts.push(this.add.image(0, 0, key).setOrigin(0, 0).setDisplaySize(SCENE_SIZE.width, SCENE_SIZE.height).setDepth(at));
            }
        });
        ghosts.push(...buildWorn(this, room, emptyRoomState(), depth.wornGhost).images);
        ghosts.forEach((ghost) => {
            this.ghosts.push(ghost);
            const tween = this.tweens.add({ targets: ghost, alpha: 0, duration: ANIMATION.stageFadeMs, ease: 'Sine.easeInOut', onComplete: () => this.dropGhost(ghost) });
            this.ghostTweens.push(tween);
        });
    }

    private dropGhost(ghost: GameObjects.Image): void {
        this.ghosts = this.ghosts.filter((g) => g !== ghost);
        ghost.destroy();
    }

    /** A cross-fade never outlives a visit to the room: stop what is left and remove the ghosts (final-art-salon F1). */
    private clearGhosts(): void {
        this.ghostTweens.forEach((t) => t.stop());
        this.ghostTweens = [];
        this.ghosts.forEach((g) => g.destroy());
        this.ghosts = [];
    }

    /** Pop of the new furniture and a burst of stars; nothing at all when the child asked for less motion. */
    private celebrate(bought: { slot: string; variant: 0 | 1 | 2 }): void {
        if (prefersReducedMotion()) {
            return;
        }
        const { room } = this.resolve();
        const at = this.view.slotCenter(room, bought.slot);
        if (!at) {
            return;
        }
        // The pop grows the picture itself, on its own depth and around its anchor, so a piece in front still covers it (V2).
        const object = this.view.objectOf(bought.slot);
        if (object) {
            const [sx, sy] = [object.scaleX, object.scaleY];
            this.tweens.add({
                targets: object,
                scaleX: sx * ANIMATION.purchasePopScale,
                scaleY: sy * ANIMATION.purchasePopScale,
                duration: ANIMATION.purchasePopMs,
                yoyo: true,
                ease: 'Sine.easeOut',
                onComplete: () => object.setScale(sx, sy),
            });
        }
        starBurst(this, at.x, at.y, { count: ANIMATION.purchaseParticles, depth: ROOM_LAYOUT.depth.celebrate });
    }

    /** The `tap` cue of a navigation button (see TaskScene.tap for the list). */
    private tap(): void {
        playCues(this, soundOf(this.registry), [{ id: 'tap', delayMs: 0 }]);
    }

    /** Centre of "Wróć do notesu" in scene space, for the e2e hook. */
    resumeTarget(): { x: number; y: number } | null {
        return this.resume ? this.resume.target() : null;
    }

    /** Centre of the current task button, for the e2e hook; null while hidden. */
    taskButtonTarget(): { x: number; y: number } | null {
        return this.taskButton.target();
    }

    /** Centres of the three variant thumbnails, or none while the panel is closed; for the e2e hook. */
    thumbTargets(): { x: number; y: number }[] {
        return this.variantPanel.thumbTargets();
    }

    modeButtonTarget(): { x: number; y: number } | null {
        return this.modeButton.target();
    }

    houseButtonTarget(): { x: number; y: number } | null {
        return this.houseButton.target();
    }

    cardNextTarget(): { x: number; y: number } | null {
        return this.doneCard.target();
    }

    chooseTarget(): { x: number; y: number } | null {
        return this.variantPanel.chooseTarget();
    }

    closeTarget(): { x: number; y: number } | null {
        return this.variantPanel.closeTarget();
    }

    /** A point where a hold lands on each furnished slot, for the e2e hook. */
    slotTargets(): Record<string, { x: number; y: number }> {
        const out: Record<string, { x: number; y: number }> = {};
        const { room, state } = this.resolve();
        const { chosen } = state;
        for (const slot of room.slots) {
            const at = holdPoint(room, chosen, slot.id, undefined, this.alphaAt(room, chosen));
            if (at) {
                out[slot.id] = at;
            }
        }
        return out;
    }

    /** Read-only copy of what the room shows, for the e2e hook. */
    snapshot(): RoomSnapshot {
        const { room, state } = this.resolve();
        const task = currentTask(room, state);
        const view = taskButtonView(room, state, this.stars());
        return {
            roomId: room.id,
            tasksDone: state.tasksDone,
            chosen: { ...state.chosen },
            unreachable: unreachableSlots(room, state.chosen, this.alphaAt(room, state.chosen)),
            shown: this.view.shown(),
            worn: this.view.wornState(),
            contactShadows: this.view.contactShadowIds(),
            currentTask: task ? { id: task.id, label: task.label, cost: task.cost } : null,
            taskKind: task?.kind ?? null,
            affordable: view?.affordable ?? false,
            buttonText: this.taskButton.text(),
            panel: { ...this.panel },
            hold: this.gesture.press.kind === 'idle' ? 'idle' : 'holding',
            heldSlot: this.gesture.slot,
            done: roomDone(room, state),
            stageDone: stagesDone(room, state) > 0,
            mode: this.mode,
            card: this.cardDrawn ? { title: pl.room.done.title, items: this.listItems(), celebration: { ...this.celebrationUsed } } : null,
            doneMiniature: this.cardDrawn ? this.doneCard.miniature() : null,
            visiting: this.visiting,
            houseLabel: this.houseButton.text(),
            modeText: this.modeButton.target() ? (this.mode === 'change' ? pl.room.change.exit : pl.room.change.enter) : null,
        };
    }
}
