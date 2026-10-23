// GENERATED FILE — DO NOT EDIT.
// Generated from: ../../specs/apg/switch.qnt
// Spec hash (sha256): af9d14eb36f426f67ac3c3ea0cf6c462ff2b1eb210cc601a0c0d2a8298cd5060
// Regenerate with: npm run generate:model
import { Machine } from "@typeonce/effect-machine";
import { Schema } from "effect";
export const ApgSwitchFields = {
    focused: Schema.Boolean,
    disabled: Schema.Boolean,
    checked: Schema.String,
    enterToggles: Schema.Boolean,
    spaceArmed: Schema.Boolean,
    pointerArmed: Schema.Boolean,
    requests: Schema.BigInt,
    controlled: Schema.Boolean,
    accepting: Schema.Boolean,
    valueProp: Schema.String,
    requested: Schema.String,
    outcome: Schema.String,
    base: Schema.String
};
export const ApgSwitchStates = Machine.state({
    fields: ApgSwitchFields
});
export const ApgSwitchEvents = Machine.events({
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
        incoming: Schema.String
    },
    hostToggle: {},
    control: {},
    acceptRequests: {},
    seed: {
        incoming: Schema.String
    },
    set_disabled: {
        value: Schema.Boolean
    },
    set_enter_toggles: {
        value: Schema.Boolean
    }
});
export const ApgSwitchDefinition = Machine.make({
    id: "ApgSwitch",
    root: ApgSwitchStates,
    events: ApgSwitchEvents
});
export type ApgSwitchEvent = Machine.EventOf<typeof ApgSwitchEvents>;
