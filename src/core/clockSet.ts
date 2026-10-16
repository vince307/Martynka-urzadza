// Clock to set as a pure reducer (S-13b phase 4), modelled on blockDrag.ts. The scene feeds raw pointer events and the
// geometry of the drawn dial; the reducer decides which hand a finger holds and which time the hands show. The angle
// of the finger counts, never its distance from the centre. A cancelled touch puts the hands back where they were.
import { clockHandAngles } from './round/pictureLayout';
import { formatTime } from './text/time';

export type Hand = 'hour' | 'minute';
/** A pose on a 12-hour dial: hour 1..12 (never 0), minute 0..59. */
export interface ClockPose { hour: number; minute: number }
export interface ClockSetState extends ClockPose {
    carrying: Hand | null;
    pointerId: number | null;
    /** The pose before the current grab; null while nothing is held. */
    before: ClockPose | null;
    startX: number;
    startY: number;
    moved: boolean;
}
export type ClockSetEvent =
    | { type: 'down'; pointerId: number; x: number; y: number }
    | { type: 'move'; pointerId: number; x: number; y: number }
    | { type: 'up'; pointerId: number; x: number; y: number }
    | { type: 'cancel'; pointerId?: number }
    | { type: 'reset' };
/** The dial in scene pixels: where it is and how long the drawn hands are. */
export interface ClockSetGeo { centre: { x: number; y: number }; hourLength: number; minuteLength: number }
export interface ClockSetRules {
    /** 60: full hours (the minute hand stays at 12); 5: the minute hand snaps to five minutes. */
    snapMinutes: 60 | 5;
    /** A hand is held when a finger lands within this distance of its tip. */
    grabRadius: number;
    /** A held hand follows the finger only after the finger has travelled this far. */
    startDistance: number;
}

export const initialClockSet = (pose: ClockPose): ClockSetState =>
    ({ hour: pose.hour, minute: pose.minute, carrying: null, pointerId: null, before: null, startX: 0, startY: 0, moved: false });

/** The time as the school writes it ("3.00"); the answer text of a clock task. */
export const clockValue = (pose: ClockPose): string => formatTime(pose.hour, pose.minute);

/** Every time the hands can show for a snap, as answer texts. */
export const reachableTimes = (snapMinutes: 60 | 5): string[] => {
    const out: string[] = [];
    for (let hour = 1; hour <= 12; hour += 1) {
        for (let minute = 0; minute < 60; minute += snapMinutes) {
            out.push(formatTime(hour, minute));
        }
    }
    return out;
};

const TIE_DEGREES = 0.5;

/** Degrees clockwise from 12, 0..360. */
const angleOf = (geo: ClockSetGeo, x: number, y: number): number => {
    const degrees = (Math.atan2(x - geo.centre.x, geo.centre.y - y) * 180) / Math.PI;
    return (degrees + 360) % 360;
};
const gap = (a: number, b: number): number => {
    const d = Math.abs(a - b) % 360;
    return d > 180 ? 360 - d : d;
};
const idle = (state: ClockSetState): ClockSetState => ({
    hour: state.before?.hour ?? state.hour, minute: state.before?.minute ?? state.minute,
    carrying: null, pointerId: null, before: null, startX: 0, startY: 0, moved: false,
});

const grab = (state: ClockSetState, event: { pointerId: number; x: number; y: number }, geo: ClockSetGeo, rules: ClockSetRules): ClockSetState => {
    const angles = clockHandAngles(state.hour, state.minute);
    const reach = (hand: Hand): boolean => {
        const length = hand === 'hour' ? geo.hourLength : geo.minuteLength;
        const a = (angles[hand] * Math.PI) / 180;
        return Math.hypot(event.x - (geo.centre.x + Math.sin(a) * length), event.y - (geo.centre.y - Math.cos(a) * length)) <= rules.grabRadius;
    };
    const candidates = (['hour', 'minute'] as const).filter((hand) => (hand === 'hour' || rules.snapMinutes !== 60) && reach(hand));
    if (candidates.length === 0) return state;
    let hand: Hand = candidates[0];
    if (candidates.length === 2) {
        const finger = angleOf(geo, event.x, event.y);
        const byHour = gap(finger, angles.hour);
        const byMinute = gap(finger, angles.minute);
        if (Math.abs(byHour - byMinute) > TIE_DEGREES) {
            hand = byHour < byMinute ? 'hour' : 'minute';
        } else {
            const radius = Math.hypot(event.x - geo.centre.x, event.y - geo.centre.y);
            hand = radius > (geo.hourLength + geo.minuteLength) / 2 ? 'minute' : 'hour';
        }
    }
    return {
        ...state, carrying: hand, pointerId: event.pointerId, before: { hour: state.hour, minute: state.minute },
        startX: event.x, startY: event.y, moved: false,
    };
};

const follow = (state: ClockSetState, x: number, y: number, geo: ClockSetGeo, rules: ClockSetRules): ClockSetState => {
    if (!state.carrying) return state;
    const moved = state.moved || Math.hypot(x - state.startX, y - state.startY) > rules.startDistance;
    if (!moved || Math.hypot(x - geo.centre.x, y - geo.centre.y) < 1) return { ...state, moved };
    const angle = angleOf(geo, x, y);
    if (state.carrying === 'minute') {
        const minute = (Math.round(angle / 6 / rules.snapMinutes) * rules.snapMinutes) % 60;
        return { ...state, moved, minute };
    }
    // The hour hand also drifts half a degree per minute: remove the drift before reading the hour.
    const hour = Math.round((angle - state.minute * 0.5) / 30);
    return { ...state, moved, hour: ((((hour % 12) + 12) % 12) || 12) };
};

/**
 * Rules: a touch within `grabRadius` of a hand tip holds that hand (the minute hand of a full-hour clock cannot be held);
 * with both tips in reach the hand nearer in angle wins, an exact tie goes to the radius. The held hand follows the finger's
 * angle, snapped, once the finger has travelled `startDistance`. `up` leaves the pose; `cancel` and `reset` restore the pose
 * from before the grab. A `down` of the same finger while a hand is held drops that grab (pose restored) and starts afresh; a `down` of another finger is ignored.
 */
export const stepClockSet = (state: ClockSetState, event: ClockSetEvent, geo: ClockSetGeo, rules: ClockSetRules): ClockSetState => {
    if (event.type === 'cancel') {
        return event.pointerId !== undefined && state.pointerId !== null && event.pointerId !== state.pointerId ? state : idle(state);
    }
    if (event.type === 'reset') return idle(state);
    // GRD-02: another finger's touch must not undo the pose the child is holding; the same finger's `down` is a lost `up` (S13-09).
    if (event.type === 'down') return state.carrying !== null && event.pointerId !== state.pointerId ? state : grab(idle(state), event, geo, rules);
    if (state.carrying === null || event.pointerId !== state.pointerId) return state;
    const next = follow(state, event.x, event.y, geo, rules);
    return event.type === 'move' ? next : { ...next, carrying: null, pointerId: null, before: null, moved: false };
};
