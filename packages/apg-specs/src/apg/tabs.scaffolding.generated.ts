// GENERATED FILE — DO NOT EDIT.
// Generated from: ../../specs/apg/tabs.qnt
// Spec hash (sha256): 67077fb1a797d8e5c5d34acf4c542eeef443f1629bc80968317b109328a5ec74
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
