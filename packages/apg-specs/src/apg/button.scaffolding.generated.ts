// GENERATED FILE — DO NOT EDIT.
// Generated from: ../../specs/apg/button.qnt
// Spec hash (sha256): 70e91d8eb7ac86f25cdd72d576a4ae04e703b34f281f30aa774d1f6122dd4883
// Regenerate with: npm run generate:model
import { Machine } from "@typeonce/effect-machine";
import { Schema } from "effect";
export const ApgButtonFields = {
    focused: Schema.Boolean,
    disabled: Schema.Boolean,
    isToggle: Schema.Boolean,
    pressed: Schema.Boolean,
    toggleCount: Schema.BigInt,
    spaceArmed: Schema.Boolean,
    pointerArmed: Schema.Boolean,
    activations: Schema.BigInt,
    requests: Schema.BigInt,
    controlled: Schema.Boolean,
    accepting: Schema.Boolean,
    valueProp: Schema.Boolean,
    requested: Schema.Boolean,
    outcome: Schema.String,
    base: Schema.Boolean
};
export const ApgButtonStates = Machine.state({
    fields: ApgButtonFields
});
export const ApgButtonEvents = Machine.events({
    init: {},
    focus: {},
    blur: {},
    key_down: {
        key: Schema.String
    },
    key_up: {
        key: Schema.String
    },
    pointer_down: {},
    pointer_up: {},
    pointer_cancel: {},
    setValue: {
        v: Schema.Boolean
    },
    hostToggle: {},
    control: {},
    acceptRequests: {},
    seed: {
        v: Schema.Boolean
    },
    set_disabled: {
        value: Schema.Boolean
    },
    set_toggle: {
        value: Schema.Boolean
    }
});
export const ApgButtonDefinition = Machine.make({
    id: "ApgButton",
    root: ApgButtonStates,
    events: ApgButtonEvents
});
export type ApgButtonEvent = Machine.EventOf<typeof ApgButtonEvents>;
