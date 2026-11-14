// GENERATED FILE — DO NOT EDIT.
// Generated from: ../../specs/patterns/view-transition.qnt
// Spec hash (sha256): 183d5d17a9755879257780861e67e5346d24406d65b9c429182d75eb1e03b4f2
// Regenerate with: npm run generate:model
import { Machine } from "@typeonce/effect-machine";
import { Schema } from "effect";
export const PatternsViewTransitionFields = {
    mode: Schema.String,
    phase: Schema.String,
    active: Schema.BigInt,
    latest: Schema.BigInt,
    requests: Schema.BigInt,
    updates: Schema.BigInt,
    inert: Schema.BigInt,
    starts: Schema.BigInt,
    finished: Schema.BigInt,
    skips: Schema.BigInt,
    pending: Schema.BigInt
};
export const PatternsViewTransitionStates = Machine.state({
    fields: PatternsViewTransitionFields
});
export const PatternsViewTransitionEvents = Machine.events({
    init: {},
    request: {},
    settle: {},
    abort: {},
    inertOn: {},
    inertOff: {}
});
export const PatternsViewTransitionDefinition = Machine.make({
    id: "PatternsViewTransition",
    root: PatternsViewTransitionStates,
    events: PatternsViewTransitionEvents
});
export type PatternsViewTransitionEvent = Machine.EventOf<typeof PatternsViewTransitionEvents>;
