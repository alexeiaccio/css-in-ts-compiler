// GENERATED FILE — DO NOT EDIT.
// Generated from: ../../specs/patterns/resizable-panels.qnt
// Spec hash (sha256): 70e8411cc707fad3c49eb7088c881a12cb97745d397a1588dd6d118c9caffa3f
// Regenerate with: npm run generate:model
import { Machine } from "@typeonce/effect-machine";
import { Schema } from "effect";
export const PatternsResizablePanelsFields = {
    o: Schema.String,
    s0: Schema.BigInt,
    s1: Schema.BigInt,
    s2: Schema.BigInt,
    prev0: Schema.BigInt,
    focus: Schema.String,
    justRestored: Schema.Boolean,
    rq0: Schema.BigInt,
    rq1: Schema.BigInt,
    rq2: Schema.BigInt,
    b0: Schema.BigInt,
    b1: Schema.BigInt,
    b2: Schema.BigInt,
    k0: Schema.BigInt,
    k1: Schema.BigInt,
    k2: Schema.BigInt,
    dd: Schema.BigInt,
    dr: Schema.BigInt,
    outcome: Schema.String,
    controlled: Schema.Boolean,
    accepting: Schema.Boolean,
    requests: Schema.BigInt
};
export const PatternsResizablePanelsStates = Machine.state({
    fields: PatternsResizablePanelsFields
});
export const PatternsResizablePanelsEvents = Machine.events({
    init: {},
    focusSep0: {},
    focusSep1: {},
    blur: {},
    left: {},
    right: {},
    up: {},
    down: {},
    home: {},
    end: {},
    enter: {},
    orientVertical: {},
    orientHorizontal: {},
    dragDown0: {},
    dragDown1: {},
    dragNext: {},
    dragPrev: {},
    dragUp: {},
    hostEqual: {},
    hostWide: {},
    hostNarrow: {},
    hostCollapsed: {},
    control: {},
    acceptRequests: {}
});
export const PatternsResizablePanelsDefinition = Machine.make({
    id: "PatternsResizablePanels",
    root: PatternsResizablePanelsStates,
    events: PatternsResizablePanelsEvents
});
export type PatternsResizablePanelsEvent = Machine.EventOf<typeof PatternsResizablePanelsEvents>;
