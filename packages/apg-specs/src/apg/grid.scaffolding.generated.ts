// GENERATED FILE — DO NOT EDIT.
// Generated from: ../../specs/apg/grid.qnt
// Spec hash (sha256): 5349d3004355c984c021894b1290a347d5a53c34b9b759792688965f14440216
// Regenerate with: npm run generate:model
import { Machine } from "@typeonce/effect-machine";
import { Schema } from "effect";
export const ApgGridFields = {
    row: Schema.BigInt,
    col: Schema.BigInt,
    hasFocus: Schema.Boolean,
    mode: Schema.String,
    dirty: Schema.Boolean,
    lastEdit: Schema.String,
    gridKind: Schema.String,
    wrapCols: Schema.Boolean,
    wrapRows: Schema.Boolean,
    focusTarget: Schema.String,
    gridReadonly: Schema.Boolean
};
export const ApgGridStates = Machine.state({
    fields: ApgGridFields
});
export const ApgGridEvents = Machine.events({
    init: {},
    key: {
        key: Schema.String
    },
    click: {
        cell: Schema.BigInt
    },
    focus_in: {},
    focus_out: {},
    set_kind: {
        choice: Schema.String
    },
    set_wrap_cols: {
        flag: Schema.Boolean
    },
    set_wrap_rows: {
        flag: Schema.Boolean
    },
    set_focus_target: {
        choice: Schema.String
    },
    set_readonly: {
        flag: Schema.Boolean
    }
});
export const ApgGridDefinition = Machine.make({
    id: "ApgGrid",
    root: ApgGridStates,
    events: ApgGridEvents
});
export type ApgGridEvent = Machine.EventOf<typeof ApgGridEvents>;
