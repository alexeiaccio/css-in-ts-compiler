// GENERATED FILE — DO NOT EDIT.
// Generated from: ../../specs/apg/grid-sort.qnt
// Spec hash (sha256): 7eb54bc15e1626f46fc0a3f7f3fdeb3d02794028374a29ae04ee0715893d6b6a
// Regenerate with: npm run generate:model
import { Machine } from "@typeonce/effect-machine";
import { Schema } from "effect";
export const ApgGridSortFields = {
    headerCol: Schema.BigInt,
    hasFocus: Schema.Boolean,
    sortEnabled: Schema.Boolean,
    sortCol: Schema.BigInt,
    sortDir: Schema.String,
    controlled: Schema.Boolean,
    accepting: Schema.Boolean,
    valueProp: Schema.BigInt,
    requested: Schema.BigInt,
    outcome: Schema.String,
    base: Schema.BigInt,
    requests: Schema.BigInt
};
export const ApgGridSortStates = Machine.state({
    fields: ApgGridSortFields
});
export const ApgGridSortEvents = Machine.events({
    init: {},
    key: {
        key: Schema.String
    },
    click: {
        column: Schema.BigInt
    },
    focus_in: {},
    focus_out: {},
    set_sort_enabled: {
        flag: Schema.Boolean
    },
    setValue: {
        v: Schema.BigInt
    },
    hostToggle: {},
    control: {},
    acceptRequests: {}
});
export const ApgGridSortDefinition = Machine.make({
    id: "ApgGridSort",
    root: ApgGridSortStates,
    events: ApgGridSortEvents
});
export type ApgGridSortEvent = Machine.EventOf<typeof ApgGridSortEvents>;
