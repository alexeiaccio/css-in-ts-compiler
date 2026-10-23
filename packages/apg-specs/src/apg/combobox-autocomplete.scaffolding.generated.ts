// GENERATED FILE — DO NOT EDIT.
// Generated from: ../../specs/apg/combobox-autocomplete.qnt
// Spec hash (sha256): c7008879311f01567a89a277bb9bd620cb7fb4e31f035231131947e82238ef0f
// Regenerate with: npm run generate:model
import { Machine } from "@typeonce/effect-machine";
import { Schema } from "effect";
export const ComboboxAutocompleteFields = {
    mode: Schema.BigInt,
    open: Schema.Boolean,
    text: Schema.BigInt,
    picked: Schema.BigInt,
    active: Schema.BigInt,
    focused: Schema.Boolean,
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
export const ComboboxAutocompleteStates = Machine.state({
    fields: ComboboxAutocompleteFields
});
export const ComboboxAutocompleteEvents = Machine.events({
    init: {},
    focus: {},
    blur: {},
    tab: {},
    type_char: {
        ch: Schema.BigInt
    },
    backspace: {},
    delete: {},
    arrow_down: {},
    arrow_up: {},
    alt_arrow_down: {},
    alt_arrow_up: {},
    arrow_left: {},
    arrow_right: {},
    home: {},
    end: {},
    enter: {},
    escape: {},
    click_input: {},
    click_button: {},
    click_option: {
        i: Schema.BigInt
    },
    set_autocomplete: {
        m: Schema.BigInt
    },
    set_value: {
        i: Schema.BigInt
    },
    hostToggle: {},
    control: {},
    acceptRequests: {}
});
export const ComboboxAutocompleteDefinition = Machine.make({
    id: "ComboboxAutocomplete",
    root: ComboboxAutocompleteStates,
    events: ComboboxAutocompleteEvents
});
export type ComboboxAutocompleteEvent = Machine.EventOf<typeof ComboboxAutocompleteEvents>;
