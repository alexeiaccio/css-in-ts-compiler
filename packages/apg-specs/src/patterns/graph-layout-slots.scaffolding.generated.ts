// GENERATED FILE — DO NOT EDIT.
// Generated from: ../../specs/patterns/graph-layout-slots.qnt
// Spec hash (sha256): 89d2da71d0d5b43743d64649c6e256c4d044e541a14bd075ebce243f4aca708e
// Regenerate with: npm run generate:model
import { Machine } from "@typeonce/effect-machine";
import { Schema } from "effect";
export const PatternsGraphLayoutSlotsFields = {
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
    s_00: Schema.BigInt,
    s_01: Schema.BigInt,
    s_10: Schema.BigInt,
    s_11: Schema.BigInt,
    s_20: Schema.BigInt,
    s_21: Schema.BigInt,
    s_30: Schema.BigInt,
    s_31: Schema.BigInt,
    phase: Schema.BigInt
};
export const PatternsGraphLayoutSlotsStates = Machine.state({
    fields: PatternsGraphLayoutSlotsFields
});
export const PatternsGraphLayoutSlotsEvents = Machine.events({
    init: {},
    set_graph: {
        pick: Schema.BigInt
    },
    break_cycles: {},
    assign_layers: {},
    order_slots: {}
});
export const PatternsGraphLayoutSlotsDefinition = Machine.make({
    id: "PatternsGraphLayoutSlots",
    root: PatternsGraphLayoutSlotsStates,
    events: PatternsGraphLayoutSlotsEvents
});
export type PatternsGraphLayoutSlotsEvent = Machine.EventOf<typeof PatternsGraphLayoutSlotsEvents>;
