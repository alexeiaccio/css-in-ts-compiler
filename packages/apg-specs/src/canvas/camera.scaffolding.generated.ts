// GENERATED FILE — DO NOT EDIT.
// Generated from: ../../specs/canvas/camera.qnt
// Spec hash (sha256): 0b9988d2ecd7483da6644fa0f4525b25242adeb3620159a6164de980a1af03e5
// Regenerate with: npm run generate:model
import { Machine } from "@typeonce/effect-machine";
import { Schema } from "effect";
export const CanvasCameraFields = {
    vw: Schema.BigInt,
    vh: Schema.BigInt,
    tx: Schema.BigInt,
    ty: Schema.BigInt,
    z: Schema.BigInt,
    rm: Schema.Boolean,
    active: Schema.Boolean,
    tp: Schema.BigInt,
    stx: Schema.BigInt,
    sty: Schema.BigInt,
    sz: Schema.BigInt,
    ttx: Schema.BigInt,
    tty: Schema.BigInt,
    tz: Schema.BigInt,
    anch: Schema.Boolean,
    asx: Schema.BigInt,
    asy: Schema.BigInt,
    awx: Schema.BigInt,
    awy: Schema.BigInt
};
export const CanvasCameraStates = Machine.state({
    fields: CanvasCameraFields
});
export const CanvasCameraEvents = Machine.events({
    init: {},
    resize: {
        vp: Schema.BigInt
    },
    set_motion: {
        reduced: Schema.Boolean
    },
    pan_by: {
        delta: Schema.BigInt
    },
    zoom_at: {
        gesture: Schema.BigInt
    },
    zoom_limit: {
        limit: Schema.BigInt
    },
    request_tween: {
        goal: Schema.BigInt
    },
    tween_tick: {},
    cancel_tween: {}
});
export const CanvasCameraDefinition = Machine.make({
    id: "CanvasCamera",
    root: CanvasCameraStates,
    events: CanvasCameraEvents
});
export type CanvasCameraEvent = Machine.EventOf<typeof CanvasCameraEvents>;
