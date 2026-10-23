// GENERATED FILE — DO NOT EDIT.
// Generated from: ../../specs/apg/combobox-grid.qnt
// Spec hash (sha256): f9e919d360cf7c5aba58a1052b4110365401a0317c4635fe887b890ffc10fcd9
// Regenerate with: npm run generate:model
import { Machine } from "@typeonce/effect-machine";
import { Schema } from "effect";
export const ComboboxGridFields = {
    open: Schema.Boolean,
    row: Schema.BigInt,
    col: Schema.BigInt,
    focused: Schema.Boolean,
    hasText: Schema.Boolean,
    picked: Schema.BigInt,
    cellValues: Schema.Boolean,
    lastEvent: Schema.String,
    valueChanged: Schema.Boolean,
    wasOpen: Schema.Boolean,
    controlled: Schema.Boolean,
    accepting: Schema.Boolean,
    valueProp: Schema.BigInt,
    requested: Schema.BigInt,
    outcome: Schema.String,
    base: Schema.BigInt,
    requests: Schema.BigInt
};
export const ComboboxGridStates = Machine.state({
    fields: ComboboxGridFields
});
export const ComboboxGridEvents = Machine.events({
    init: {},
    focus: {},
    blur: {},
    tab: {},
    type_char: {},
    backspace: {},
    delete: {},
    arrow_down: {},
    arrow_up: {},
    arrow_right: {},
    arrow_left: {},
    home: {},
    end: {},
    enter: {},
    escape: {},
    click_input: {},
    click_cell: {
        k: Schema.BigInt
    },
    set_layout: {
        cells: Schema.Boolean
    },
    set_value: {
        i: Schema.BigInt
    },
    hostToggle: {},
    control: {},
    acceptRequests: {}
});
export const ComboboxGridDefinition = Machine.make({
    id: "ComboboxGrid",
    root: ComboboxGridStates,
    events: ComboboxGridEvents
});
export type ComboboxGridEvent = Machine.EventOf<typeof ComboboxGridEvents>;
