// GENERATED FILE — DO NOT EDIT.
// Generated from: ../../specs/apg/grid-selection.qnt
// Spec hash (sha256): 0c40bfa03a710fd6eec3ffb4b41eef8bd018b8f6a2174cdf9d2c8421b009e028
// Regenerate with: npm run generate:model
import { Machine } from "@typeonce/effect-machine";
import { Schema } from "effect";
export const ApgGridSelectionFields = {
    row: Schema.BigInt,
    col: Schema.BigInt,
    anchorRow: Schema.BigInt,
    anchorCol: Schema.BigInt,
    selActive: Schema.Boolean,
    selR0: Schema.BigInt,
    selR1: Schema.BigInt,
    selC0: Schema.BigInt,
    selC1: Schema.BigInt,
    hasFocus: Schema.Boolean,
    selectable: Schema.Boolean,
    controlled: Schema.Boolean,
    accepting: Schema.Boolean,
    valueProp: Schema.BigInt,
    requested: Schema.BigInt,
    outcome: Schema.String,
    base: Schema.BigInt,
    requests: Schema.BigInt
};
export const ApgGridSelectionStates = Machine.state({
    fields: ApgGridSelectionFields
});
export const ApgGridSelectionEvents = Machine.events({
    init: {},
    key: {
        key: Schema.String
    },
    click: {
        cell: Schema.BigInt
    },
    shift_click: {
        cell: Schema.BigInt
    },
    focus_in: {},
    focus_out: {},
    set_selectable: {
        flag: Schema.Boolean
    },
    setValue: {
        v: Schema.BigInt
    },
    hostToggle: {},
    control: {},
    acceptRequests: {}
});
export const ApgGridSelectionDefinition = Machine.make({
    id: "ApgGridSelection",
    root: ApgGridSelectionStates,
    events: ApgGridSelectionEvents
});
export type ApgGridSelectionEvent = Machine.EventOf<typeof ApgGridSelectionEvents>;
