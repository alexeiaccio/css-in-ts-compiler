// GENERATED FILE — DO NOT EDIT.
// Generated from: ../../specs/apg/menu-button.qnt
// Spec hash (sha256): 8636cd7e8489abe537f78fcdfd70fef48666a438e85da14e781d9e13aec55014
// Regenerate with: npm run generate:model
import { Machine } from "@typeonce/effect-machine";
import { Schema } from "effect";
export const ApgMenuButtonFields = {
    focusLevel: Schema.BigInt,
    focusIdx: Schema.BigInt,
    menuOpen: Schema.Boolean,
    lastActivated: Schema.BigInt,
    controlled: Schema.Boolean,
    accepting: Schema.Boolean,
    valueProp: Schema.Boolean,
    requested: Schema.Boolean,
    outcome: Schema.String,
    base: Schema.Boolean,
    requests: Schema.BigInt
};
export const ApgMenuButtonStates = Machine.state({
    fields: ApgMenuButtonFields
});
export const ApgMenuButtonEvents = Machine.events({
    init: {},
    focus_in: {},
    tab_out: {},
    click_button: {},
    activate: {
        key: Schema.String
    },
    arrow_down: {},
    arrow_up: {},
    key_home: {},
    key_end: {},
    escape: {},
    typeahead: {
        ch: Schema.BigInt
    },
    setValue: {
        v: Schema.Boolean
    },
    hostToggle: {},
    control: {},
    acceptRequests: {}
});
export const ApgMenuButtonDefinition = Machine.make({
    id: "ApgMenuButton",
    root: ApgMenuButtonStates,
    events: ApgMenuButtonEvents
});
export type ApgMenuButtonEvent = Machine.EventOf<typeof ApgMenuButtonEvents>;
