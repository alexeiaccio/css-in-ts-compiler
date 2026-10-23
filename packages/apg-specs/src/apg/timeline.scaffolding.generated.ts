// GENERATED FILE — DO NOT EDIT.
// Generated from: ../../specs/apg/timeline.qnt
// Spec hash (sha256): 590cf793c7272e8cd1209d76c97cf1e2018661dcd5d2366330bfbe44c024a37f
// Regenerate with: npm run generate:model
import { Machine } from "@typeonce/effect-machine";
import { Schema } from "effect";
export const ApgTimelineFields = {
    expanded: Schema.BigInt,
    selected: Schema.BigInt,
    focus: Schema.BigInt,
    hasFocus: Schema.Boolean,
    viewStart: Schema.BigInt,
    viewEnd: Schema.BigInt,
    controlled: Schema.Boolean,
    accepting: Schema.Boolean,
    valueProp: Schema.BigInt,
    requested: Schema.BigInt,
    requests: Schema.BigInt,
    outcome: Schema.String,
    base: Schema.BigInt
};
export const ApgTimelineStates = Machine.state({
    fields: ApgTimelineFields
});
export const ApgTimelineEvents = Machine.events({
    init: {},
    focusTimeline: {},
    blurTimeline: {},
    focusNode: {
        node: Schema.BigInt
    },
    pressDown: {},
    pressUp: {},
    pressRight: {},
    pressLeft: {},
    pressHome: {},
    pressEnd: {},
    pressEnter: {},
    zoomIn: {},
    zoomOut: {},
    zoomReset: {},
    panLeft: {},
    panRight: {},
    click: {
        node: Schema.BigInt
    },
    selectNode: {
        node: Schema.BigInt
    },
    setValue: {
        v: Schema.BigInt
    },
    control: {},
    acceptRequests: {}
});
export const ApgTimelineDefinition = Machine.make({
    id: "ApgTimeline",
    root: ApgTimelineStates,
    events: ApgTimelineEvents
});
export type ApgTimelineEvent = Machine.EventOf<typeof ApgTimelineEvents>;
