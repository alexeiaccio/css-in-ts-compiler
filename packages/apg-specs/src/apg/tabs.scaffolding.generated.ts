// GENERATED FILE — DO NOT EDIT.
// Generated from: ../../specs/apg/tabs.qnt
// Spec hash (sha256): 651b1bb67adbbbaad893cde3f39889b178c698fc27ae10527c3c9a71ec5d43aa
// Regenerate with: npm run generate:model
import { Machine } from "@typeonce/effect-machine";
import { Schema } from "effect";
export const ApgTabsFields = {
    activation: Schema.String,
    orientation: Schema.String,
    deletable: Schema.Boolean,
    disabled: Schema.BigInt,
    present: Schema.BigInt,
    selected: Schema.BigInt,
    focused: Schema.BigInt,
    tabStop: Schema.BigInt,
    zone: Schema.String,
    controlled: Schema.Boolean,
    accepting: Schema.Boolean,
    valueProp: Schema.BigInt,
    requested: Schema.BigInt,
    requests: Schema.BigInt,
    outcome: Schema.String,
    base: Schema.BigInt
};
export const ApgTabsStates = Machine.state({
    fields: ApgTabsFields
});
export const ApgTabsEvents = Machine.events({
    init: {},
    configure: {
        flavor: Schema.BigInt
    },
    tab_key: {
        shift: Schema.Boolean
    },
    press: {
        key: Schema.String
    },
    click: {
        tab: Schema.BigInt
    },
    setValue: {
        v: Schema.BigInt
    },
    control: {},
    acceptRequests: {}
});
export const ApgTabsDefinition = Machine.make({
    id: "ApgTabs",
    root: ApgTabsStates,
    events: ApgTabsEvents
});
export type ApgTabsEvent = Machine.EventOf<typeof ApgTabsEvents>;
