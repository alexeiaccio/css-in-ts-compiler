// GENERATED FILE — DO NOT EDIT.
// Generated from: ../../specs/apg/checkbox-group.qnt
// Spec hash (sha256): 35010cbb4aef0e7a5c52a1f588f8cd81784e1b0992ac824ab48a2e5b1467d2f5
// Regenerate with: npm run generate:model
import { Machine } from "@typeonce/effect-machine";
import { Schema } from "effect";
export const ApgCheckboxGroupFields = {
    c0: Schema.Boolean,
    c1: Schema.Boolean,
    c2: Schema.Boolean,
    m0: Schema.Boolean,
    m1: Schema.Boolean,
    m2: Schema.Boolean,
    focus: Schema.String,
    remember: Schema.Boolean,
    controlled: Schema.Boolean,
    accepting: Schema.Boolean,
    valueProp: Schema.BigInt,
    requested: Schema.BigInt,
    outcome: Schema.String,
    base: Schema.BigInt,
    requests: Schema.BigInt
};
export const ApgCheckboxGroupStates = Machine.state({
    fields: ApgCheckboxGroupFields
});
export const ApgCheckboxGroupEvents = Machine.events({
    init: {},
    focus_on: {
        target: Schema.String
    },
    blur: {},
    key_tab: {},
    key_space: {},
    click: {
        target: Schema.String
    },
    set_remember: {
        value: Schema.Boolean
    },
    setValue: {
        v: Schema.BigInt
    },
    hostToggle: {
        panel: Schema.BigInt
    },
    control: {},
    acceptRequests: {}
});
export const ApgCheckboxGroupDefinition = Machine.make({
    id: "ApgCheckboxGroup",
    root: ApgCheckboxGroupStates,
    events: ApgCheckboxGroupEvents
});
export type ApgCheckboxGroupEvent = Machine.EventOf<typeof ApgCheckboxGroupEvents>;
