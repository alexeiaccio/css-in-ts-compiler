// GENERATED FILE — DO NOT EDIT.
// Generated from: ../../specs/apg/combobox-select-only.qnt
// Spec hash (sha256): ba125384c6d539a2e12632dd6ff123a4cf8e29884f094e20ca1922ff9ac84a07
// Regenerate with: npm run generate:model
import { Machine } from "@typeonce/effect-machine";
import { Schema } from "effect";
export const ComboboxSelectOnlyFields = {
    open: Schema.Boolean,
    active: Schema.BigInt,
    value: Schema.BigInt,
    focused: Schema.Boolean,
    typed: Schema.BigInt,
    lastEvent: Schema.String,
    valueChanged: Schema.Boolean,
    controlled: Schema.Boolean,
    accepting: Schema.Boolean,
    valueProp: Schema.BigInt,
    requested: Schema.BigInt,
    outcome: Schema.String,
    base: Schema.BigInt,
    requests: Schema.BigInt
};
export const ComboboxSelectOnlyStates = Machine.state({
    fields: ComboboxSelectOnlyFields
});
export const ComboboxSelectOnlyEvents = Machine.events({
    init: {},
    focus: {},
    blur: {},
    arrow_down: {},
    alt_arrow_down: {},
    arrow_up: {},
    home: {},
    end: {},
    page_up: {},
    page_down: {},
    enter: {},
    space: {},
    tab: {},
    escape: {},
    alt_arrow_up: {},
    type_char: {
        ch: Schema.BigInt
    },
    click_combobox: {},
    click_option: {
        i: Schema.BigInt
    },
    set_value: {
        i: Schema.BigInt
    },
    setOpen: {
        o: Schema.Boolean
    },
    hostToggle: {},
    control: {},
    acceptRequests: {}
});
export const ComboboxSelectOnlyDefinition = Machine.make({
    id: "ComboboxSelectOnly",
    root: ComboboxSelectOnlyStates,
    events: ComboboxSelectOnlyEvents
});
export type ComboboxSelectOnlyEvent = Machine.EventOf<typeof ComboboxSelectOnlyEvents>;
