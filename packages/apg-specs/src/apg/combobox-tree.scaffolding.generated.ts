// GENERATED FILE — DO NOT EDIT.
// Generated from: ../../specs/apg/combobox-tree.qnt
// Spec hash (sha256): 27be47e44d878307a3ac21cbf7f97dfd60ecb37d9e8db1bae4f6d2209da51f8d
// Regenerate with: npm run generate:model
import { Machine } from "@typeonce/effect-machine";
import { Schema } from "effect";
export const ComboboxTreeFields = {
    open: Schema.Boolean,
    active: Schema.BigInt,
    selected: Schema.BigInt,
    e0: Schema.Boolean,
    e3: Schema.Boolean,
    focused: Schema.Boolean,
    labelMode: Schema.BigInt,
    picked: Schema.BigInt,
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
export const ComboboxTreeStates = Machine.state({
    fields: ComboboxTreeFields
});
export const ComboboxTreeEvents = Machine.events({
    init: {},
    focus: {},
    blur: {},
    tab: {},
    type_char: {},
    arrow_down: {},
    arrow_up: {},
    arrow_right: {},
    arrow_left: {},
    home: {},
    end: {},
    enter: {},
    escape: {},
    click_input: {},
    click_node: {
        n: Schema.BigInt
    },
    set_label_mode: {
        v: Schema.BigInt
    },
    set_value: {
        n: Schema.BigInt
    },
    hostToggle: {},
    control: {},
    acceptRequests: {}
});
export const ComboboxTreeDefinition = Machine.make({
    id: "ComboboxTree",
    root: ComboboxTreeStates,
    events: ComboboxTreeEvents
});
export type ComboboxTreeEvent = Machine.EventOf<typeof ComboboxTreeEvents>;
