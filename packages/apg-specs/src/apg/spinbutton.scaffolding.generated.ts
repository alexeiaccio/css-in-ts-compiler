// GENERATED FILE — DO NOT EDIT.
// Generated from: ../../specs/apg/spinbutton.qnt
// Spec hash (sha256): 2cec7069c44874e465cbdf1a751fa272ff8272be19d3bc84ab2edc5574673e3a
// Regenerate with: npm run generate:model
import { Machine } from "@typeonce/effect-machine";
import { Schema } from "effect";
export const ApgSpinbuttonFields = {
    value: Schema.BigInt,
    focused: Schema.Boolean,
    editing: Schema.Boolean,
    draft: Schema.String,
    wrap: Schema.Boolean,
    result: Schema.String,
    controlled: Schema.Boolean,
    accepting: Schema.Boolean,
    valueProp: Schema.BigInt,
    requested: Schema.BigInt,
    outcome: Schema.String,
    base: Schema.BigInt,
    requests: Schema.BigInt
};
export const ApgSpinbuttonStates = Machine.state({
    fields: ApgSpinbuttonFields
});
export const ApgSpinbuttonEvents = Machine.events({
    init: {},
    focus: {},
    blur: {},
    arrowUp: {},
    arrowDown: {},
    pageUp: {},
    pageDown: {},
    home: {},
    end: {},
    clickIncrement: {},
    clickDecrement: {},
    typeText: {
        text: Schema.String
    },
    commit: {},
    revert: {},
    setWrap: {
        mode: Schema.Boolean
    },
    setValue: {
        v: Schema.BigInt
    },
    hostToggle: {},
    control: {},
    acceptRequests: {}
});
export const ApgSpinbuttonDefinition = Machine.make({
    id: "ApgSpinbutton",
    root: ApgSpinbuttonStates,
    events: ApgSpinbuttonEvents
});
export type ApgSpinbuttonEvent = Machine.EventOf<typeof ApgSpinbuttonEvents>;
