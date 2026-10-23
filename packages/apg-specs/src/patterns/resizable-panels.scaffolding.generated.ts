// GENERATED FILE — DO NOT EDIT.
// Generated from: ../../specs/patterns/resizable-panels.qnt
// Spec hash (sha256): db4dc3af8fd3c1d52dd46481354474cf4fc3fc98088e57d37ba62b1b3cbe1f65
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
