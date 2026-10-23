// GENERATED FILE — DO NOT EDIT.
// Generated from: ../../specs/apg/menu-menubar.qnt
// Spec hash (sha256): beb013802e75d9817fccf1de18b3b9ce4049426583e5e781ea16638ce68d22c4
// Regenerate with: npm run generate:model
import { Machine } from "@typeonce/effect-machine";
import { Schema } from "effect";
export const ApgMenuMenubarFields = {
    focusLevel: Schema.BigInt,
    focusIdx: Schema.BigInt,
    barStop: Schema.BigInt,
    openTop: Schema.BigInt,
    openSub: Schema.BigInt,
    lastActivated: Schema.BigInt,
    controlled: Schema.Boolean,
    accepting: Schema.Boolean,
    valueProp: Schema.BigInt,
    requested: Schema.BigInt,
    outcome: Schema.String,
    base: Schema.BigInt,
    requests: Schema.BigInt
};
export const ApgMenuMenubarStates = Machine.state({
    fields: ApgMenuMenubarFields
});
export const ApgMenuMenubarEvents = Machine.events({
    init: {},
    focus_in: {},
    tab_out: {},
    arrow_right: {},
    arrow_left: {},
    arrow_down: {},
    arrow_up: {},
    key_home: {},
    key_end: {},
    activate: {
        key: Schema.String
    },
    escape: {},
    typeahead: {
        ch: Schema.BigInt
    },
    setValue: {
        t: Schema.BigInt
    },
    hostToggle: {},
    control: {},
    acceptRequests: {}
});
export const ApgMenuMenubarDefinition = Machine.make({
    id: "ApgMenuMenubar",
    root: ApgMenuMenubarStates,
    events: ApgMenuMenubarEvents
});
export type ApgMenuMenubarEvent = Machine.EventOf<typeof ApgMenuMenubarEvents>;
