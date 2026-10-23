// GENERATED FILE — DO NOT EDIT.
// Generated from: ../../specs/apg/combobox-dialog.qnt
// Spec hash (sha256): 9c54b28ebd5149aa6dc357e94c07df9541f8905aca4a30d227aa9b1628f996f6
// Regenerate with: npm run generate:model
import { Machine } from "@typeonce/effect-machine";
import { Schema } from "effect";
export const ComboboxDialogFields = {
    open: Schema.Boolean,
    domFocus: Schema.BigInt,
    focusAbs: Schema.BigInt,
    value: Schema.BigInt,
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
export const ComboboxDialogStates = Machine.state({
    fields: ComboboxDialogFields
});
export const ComboboxDialogEvents = Machine.events({
    init: {},
    focus: {},
    blur: {},
    tab: {},
    shift_tab: {},
    arrow_down: {},
    alt_arrow_down: {},
    click_button: {},
    arrow_up: {},
    arrow_right: {},
    arrow_left: {},
    home: {},
    end: {},
    page_up: {},
    page_down: {},
    shift_page_up: {},
    shift_page_down: {},
    enter: {},
    space: {},
    escape: {},
    type_text: {
        k: Schema.BigInt
    },
    set_value: {
        k: Schema.BigInt
    },
    hostToggle: {},
    control: {},
    acceptRequests: {}
});
export const ComboboxDialogDefinition = Machine.make({
    id: "ComboboxDialog",
    root: ComboboxDialogStates,
    events: ComboboxDialogEvents
});
export type ComboboxDialogEvent = Machine.EventOf<typeof ComboboxDialogEvents>;
