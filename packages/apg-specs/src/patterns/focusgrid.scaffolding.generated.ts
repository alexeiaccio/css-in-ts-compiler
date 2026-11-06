// GENERATED FILE — DO NOT EDIT.
// Generated from: ../../specs/patterns/focusgrid.qnt
// Spec hash (sha256): 853d9a0c4ade5e5e115361ebde4bd533ba0abfb2466da95183927e0b3bbb1921
// Regenerate with: npm run generate:model
import { Machine } from "@typeonce/effect-machine";
import { Schema } from "effect";
export const PatternsFocusgridFields = {
    cur: Schema.BigInt,
    tabStop: Schema.BigInt,
    hasFocus: Schema.Boolean,
    start: Schema.BigInt,
    memory: Schema.Boolean,
    manual: Schema.Boolean,
    rowEdge: Schema.String,
    colEdge: Schema.String,
    outcome: Schema.String,
    snapCur: Schema.BigInt,
    snapStop: Schema.BigInt,
    lastManual: Schema.Boolean
};
export const PatternsFocusgridStates = Machine.state({
    fields: PatternsFocusgridFields
});
export const PatternsFocusgridEvents = Machine.events({
    init: {},
    focus_in: {},
    focus_out: {},
    click: {
        cell: Schema.BigInt
    },
    key: {
        k: Schema.String
    },
    set_memory: {
        on: Schema.Boolean
    },
    set_manual: {
        flag: Schema.Boolean
    },
    set_row_edge: {
        e: Schema.String
    },
    set_col_edge: {
        e: Schema.String
    },
    set_start: {
        i: Schema.BigInt
    }
});
export const PatternsFocusgridDefinition = Machine.make({
    id: "PatternsFocusgrid",
    root: PatternsFocusgridStates,
    events: PatternsFocusgridEvents
});
export type PatternsFocusgridEvent = Machine.EventOf<typeof PatternsFocusgridEvents>;
