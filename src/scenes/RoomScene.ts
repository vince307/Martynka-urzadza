import { Scene } from 'phaser';
import { currentTask, emptyRoomState, taskButtonView } from '../core/rooms';
import type { RoomState } from '../core/types';
import { ROOM_LAYOUT, REGISTRY_KEYS, SCENE_KEYS } from '../data/layout';
import { pl } from '../data/pl';
import { FIRST_ROOM, ROOMS } from '../data/rooms';
import { PageButton } from '../ui/widgets/PageButton';
import { RoomTaskButton } from '../ui/widgets/RoomTaskButton';
import { RoomView } from '../ui/widgets/RoomView';

export interface RoomSnapshot {
    roomId: string;
    tasksDone: number;
    chosen: Readonly<Record<string, number>>;
    currentTask: { id: string; label: string; cost: number } | null;
    affordable: boolean;
    buttonText: string;
}

/**
 * The room (S-09): the salon drawn in code, "Wróć do notesu" and the button of the current renovation task.
 * It owns no state: the star balance and the room progress live in the game registry, the scene only draws them
 * and redraws on wake. The task scene sleeps underneath and wakes exactly as it was left.
 * A task the child cannot afford yet sends them back to the notebook; an affordable one opens the variant panel (next phase).
 * DESIGN-GAP (docs/design-gaps.md row 12): the kit has the return button only.
 */
export class RoomScene extends Scene {
    private resume: PageButton | undefined;
    private view!: RoomView;
    private taskButton!: RoomTaskButton;

    constructor() {
        super(SCENE_KEYS.room);
    }

    create(): void {
        const { resume } = ROOM_LAYOUT;
        this.view = new RoomView(this);
        this.taskButton = new RoomTaskButton(this, (affordable) => {
            if (!affordable) {
                this.scene.switch(SCENE_KEYS.task);
            }
        });
        const button = new PageButton(this, () => this.scene.switch(SCENE_KEYS.task));
        this.resume = button;
        const refresh = (): void => {
            // A press that began before the switch must not count, so the buttons are re-armed on every redraw.
            button.show(pl.room.resume, resume.left, resume.top, 'primary', false, resume);
            this.redraw();
        };
        const onStars = (): void => {
            // The balance can change while the task scene is awake; only the open room reacts.
            if (this.scene.isActive()) {
                this.redraw();
            }
        };
        refresh();
        this.events.on('wake', refresh);
        this.registry.events.on(`changedata-${REGISTRY_KEYS.stars}`, onStars);
        this.events.once('shutdown', () => {
            this.events.off('wake', refresh);
            this.registry.events.off(`changedata-${REGISTRY_KEYS.stars}`, onStars);
        });
    }

    private roomId(): string {
        return (this.registry.get(REGISTRY_KEYS.currentRoom) as string | undefined) ?? FIRST_ROOM;
    }

    private roomState(): RoomState {
        const rooms = this.registry.get(REGISTRY_KEYS.rooms) as Record<string, RoomState> | undefined;
        return rooms?.[this.roomId()] ?? emptyRoomState();
    }

    private stars(): number {
        return (this.registry.get(REGISTRY_KEYS.stars) as number | undefined) ?? 0;
    }

    private redraw(): void {
        const room = ROOMS[this.roomId()] ?? ROOMS[FIRST_ROOM];
        const state = this.roomState();
        this.view.render(room, state, null);
        const task = taskButtonView(room, state, this.stars());
        this.taskButton.show(task);
        // The speaker reads what the button asks for; the task scene overwrites it on its wake.
        const label = task ? (pl.room.tasks as Record<string, string>)[task.label] : undefined;
        this.registry.set(REGISTRY_KEYS.narration, label ?? null);
    }

    /** Centre of "Wróć do notesu" in scene space, for the e2e hook. */
    resumeTarget(): { x: number; y: number } | null {
        return this.resume ? this.resume.target() : null;
    }

    /** Centre of the current task button, for the e2e hook; null while hidden. */
    taskButtonTarget(): { x: number; y: number } | null {
        return this.taskButton.target();
    }

    /** Read-only copy of what the room shows, for the e2e hook. */
    snapshot(): RoomSnapshot {
        const room = ROOMS[this.roomId()] ?? ROOMS[FIRST_ROOM];
        const state = this.roomState();
        const task = currentTask(room, state);
        const view = taskButtonView(room, state, this.stars());
        return {
            roomId: room.id,
            tasksDone: state.tasksDone,
            chosen: { ...state.chosen },
            currentTask: task ? { id: task.id, label: task.label, cost: task.cost } : null,
            affordable: view?.affordable ?? false,
            buttonText: this.taskButton.text(),
        };
    }
}
