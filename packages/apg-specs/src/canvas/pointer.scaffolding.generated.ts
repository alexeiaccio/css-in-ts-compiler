// GENERATED FILE — DO NOT EDIT.
// Generated from: ../../specs/canvas/pointer.qnt
// Spec hash (sha256): 6372995bcbfe2ef343cd80a010edeb84100414348350d5c41e11884af35c02f5
// Regenerate with: npm run generate:model
import { Machine } from "@typeonce/effect-machine";
import { Schema } from "effect";
export const CanvasPointerFields = {
    mode: Schema.String,
    owner: Schema.BigInt,
    prev: Schema.String,
    tgt: Schema.BigInt,
    shift: Schema.Boolean,
    space: Schema.Boolean,
    mqmode: Schema.String,
    snapOn: Schema.Boolean,
    tx: Schema.BigInt,
    ty: Schema.BigInt,
    z: Schema.BigInt,
    px: Schema.BigInt,
    py: Schema.BigInt,
    downx: Schema.BigInt,
    downy: Schema.BigInt,
    gx: Schema.BigInt,
    gy: Schema.BigInt,
    sel: Schema.BigInt,
    selSnap: Schema.BigInt,
    cursor: Schema.BigInt,
    editing: Schema.BigInt,
    n0x: Schema.BigInt,
    n0y: Schema.BigInt,
    n1x: Schema.BigInt,
    n1y: Schema.BigInt,
    n2x: Schema.BigInt,
    n2y: Schema.BigInt,
    ddx: Schema.BigInt,
    ddy: Schema.BigInt,
    guide: Schema.BigInt,
    annCount: Schema.BigInt,
    annSel: Schema.BigInt,
    hostMoved: Schema.Boolean
};
export const CanvasPointerStates = Machine.state({
    fields: CanvasPointerFields
});
export const CanvasPointerEvents = Machine.events({
    init: {},
    down: {
        touch: Schema.BigInt
    },
    move: {
        touch: Schema.BigInt
    },
    up: {
        lift: Schema.BigInt
    },
    cancel_pointer: {
        lost: Schema.BigInt
    },
    set_shift: {
        held: Schema.Boolean
    },
    set_space: {
        held: Schema.Boolean
    },
    set_marquee_mode: {
        choice: Schema.String
    },
    set_snap: {
        snapping: Schema.Boolean
    },
    zoom_to: {
        level: Schema.BigInt
    },
    toggle_edit: {},
    host_move: {
        place: Schema.BigInt
    }
});
export const CanvasPointerDefinition = Machine.make({
    id: "CanvasPointer",
    root: CanvasPointerStates,
    events: CanvasPointerEvents
});
export type CanvasPointerEvent = Machine.EventOf<typeof CanvasPointerEvents>;
