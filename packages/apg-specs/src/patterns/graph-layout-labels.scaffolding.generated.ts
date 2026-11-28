// GENERATED FILE — DO NOT EDIT.
// Generated from: ../../specs/patterns/graph-layout-labels.qnt
// Spec hash (sha256): d5e7ad55fecd4e7da400226b7f96eb76f1afcebacfb04182a98d0961741aa128
// Regenerate with: npm run generate:model
import { Machine } from "@typeonce/effect-machine";
import { Schema } from "effect";
export const PatternsGraphLayoutLabelsFields = {
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
    l_ab: Schema.BigInt,
    l_ac: Schema.BigInt,
    l_ad: Schema.BigInt,
    l_bc: Schema.BigInt,
    l_bd: Schema.BigInt,
    l_cd: Schema.BigInt,
    o_ab: Schema.BigInt,
    o_ac: Schema.BigInt,
    o_ad: Schema.BigInt,
    o_bc: Schema.BigInt,
    o_bd: Schema.BigInt,
    o_cd: Schema.BigInt,
    phase: Schema.BigInt
};
export const PatternsGraphLayoutLabelsStates = Machine.state({
    fields: PatternsGraphLayoutLabelsFields
});
export const PatternsGraphLayoutLabelsEvents = Machine.events({
    init: {},
    set_graph: {
        pick: Schema.BigInt
    },
    break_cycles: {},
    assign_layers: {},
    order_slots: {},
    place_labels: {}
});
export const PatternsGraphLayoutLabelsDefinition = Machine.make({
    id: "PatternsGraphLayoutLabels",
    root: PatternsGraphLayoutLabelsStates,
    events: PatternsGraphLayoutLabelsEvents
});
export type PatternsGraphLayoutLabelsEvent = Machine.EventOf<typeof PatternsGraphLayoutLabelsEvents>;
