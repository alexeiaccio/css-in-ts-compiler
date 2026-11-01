// GENERATED FILE — DO NOT EDIT.
// Generated from: ../../specs/patterns/animation.qnt
// Spec hash (sha256): 5155ac70a65e09f299622dc5ce5f98fd7e54cdb7f16a0ec0b04fd170750a033f
// Regenerate with: npm run generate:model
import { Machine } from "@typeonce/effect-machine";
import { Schema } from "effect";
export const PatternsAnimationFields = {
    visual: Schema.String,
    committed: Schema.String,
    logical: Schema.Boolean,
    optimistic: Schema.Boolean,
    visible: Schema.Boolean,
    progress: Schema.BigInt,
    handle: Schema.BigInt,
    last: Schema.BigInt,
    live: Schema.BigInt,
    pending: Schema.String,
    reduced: Schema.Boolean,
    stale: Schema.Boolean,
    reversed: Schema.Boolean,
    lead: Schema.Boolean,
    settled: Schema.Boolean,
    debounced: Schema.Boolean,
    coalesced: Schema.Boolean,
    arrived: Schema.BigInt,
    snapVisual: Schema.String,
    snapCommitted: Schema.String,
    snapLogical: Schema.Boolean,
    snapProgress: Schema.BigInt,
    snapHandle: Schema.BigInt,
    snapPending: Schema.String
};
export const PatternsAnimationStates = Machine.state({
    fields: PatternsAnimationFields
});
export const PatternsAnimationEvents = Machine.events({
    init: {},
    open: {},
    close: {},
    toggle: {},
    hover_in: {},
    hover_out: {},
    debounce: {},
    tick: {},
    finish_live: {},
    finish_stale: {},
    reduced_motion: {}
});
export const PatternsAnimationDefinition = Machine.make({
    id: "PatternsAnimation",
    root: PatternsAnimationStates,
    events: PatternsAnimationEvents
});
export type PatternsAnimationEvent = Machine.EventOf<typeof PatternsAnimationEvents>;
