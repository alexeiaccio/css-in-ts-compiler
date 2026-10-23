// GENERATED FILE — DO NOT EDIT.
// Generated from: ../../specs/apg/checkbox.qnt
// Spec hash (sha256): 2271bb2b3904aff05c85e834abe88ae556300c2b69a4c31ff86ce9c24c0d2bd0
// Regenerate with: npm run generate:model
import { Machine } from "@typeonce/effect-machine";
import { Schema } from "effect";
export const ApgCheckboxFields = {
    focused: Schema.Boolean,
    disabled: Schema.Boolean,
    state: Schema.String,
    allowMixed: Schema.Boolean,
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
export const ApgCheckboxStates = Machine.state({
    fields: ApgCheckboxFields
});
export const ApgCheckboxEvents = Machine.events({
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
    set_allow_mixed: {
        value: Schema.Boolean
    }
});
export const ApgCheckboxDefinition = Machine.make({
    id: "ApgCheckbox",
    root: ApgCheckboxStates,
    events: ApgCheckboxEvents
});
export type ApgCheckboxEvent = Machine.EventOf<typeof ApgCheckboxEvents>;
