// GENERATED FILE — DO NOT EDIT.
// Generated from: ../../specs/patterns/graph-layout.qnt
// Spec hash (sha256): 791385b80d23a8d7b745e3991b445e488e6d22eece4c5ec20a5acfee7fb41f2a
// Regenerate with: npm run generate:model
import { Machine } from "@typeonce/effect-machine";
import { Schema } from "effect";
export const PatternsGraphLayoutFields = {
    e_ab: Schema.BigInt,
    e_ac: Schema.BigInt,
    e_ad: Schema.BigInt,
    e_bc: Schema.BigInt,
    e_bd: Schema.BigInt,
    e_cd: Schema.BigInt,
    r_ab: Schema.Boolean,
    r_ac: Schema.Boolean,
    r_ad: Schema.Boolean,
    r_bc: Schema.Boolean,
    r_bd: Schema.Boolean,
    r_cd: Schema.Boolean,
    layer_a: Schema.BigInt,
    layer_b: Schema.BigInt,
    layer_c: Schema.BigInt,
    layer_d: Schema.BigInt,
    order_a: Schema.BigInt,
    order_b: Schema.BigInt,
    order_c: Schema.BigInt,
    order_d: Schema.BigInt,
    phase: Schema.BigInt
};
export const PatternsGraphLayoutStates = Machine.state({
    fields: PatternsGraphLayoutFields
});
export const PatternsGraphLayoutEvents = Machine.events({
    init: {},
    set_graph: {
        pick: Schema.BigInt
    },
    break_cycles: {},
    assign_layers: {},
    order_nodes: {}
});
export const PatternsGraphLayoutDefinition = Machine.make({
    id: "PatternsGraphLayout",
    root: PatternsGraphLayoutStates,
    events: PatternsGraphLayoutEvents
});
export type PatternsGraphLayoutEvent = Machine.EventOf<typeof PatternsGraphLayoutEvents>;
