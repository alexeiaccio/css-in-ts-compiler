// GENERATED FILE — DO NOT EDIT.
// Generated from: ../../specs/apg/listbox-rearrangeable.qnt
// Spec hash (sha256): f0a60c97ef5162d60a2bc31f267fab205b09aee6e64c9f3de1a1650abd18c32c
// Regenerate with: npm run generate:model
import { Machine } from "@typeonce/effect-machine";
import { Schema } from "effect";
export const ApgListboxRearrangeableFields = {
    a0: Schema.BigInt,
    a1: Schema.BigInt,
    a2: Schema.BigInt,
    a3: Schema.BigInt,
    b0: Schema.BigInt,
    b1: Schema.BigInt,
    b2: Schema.BigInt,
    b3: Schema.BigInt,
    activeA: Schema.BigInt,
    activeB: Schema.BigInt,
    focusList: Schema.String,
    sel: Schema.BigInt,
    multi: Schema.Boolean,
    controlled: Schema.Boolean,
    accepting: Schema.Boolean,
    valueProp0: Schema.Boolean,
    valueProp1: Schema.Boolean,
    valueProp2: Schema.Boolean,
    valueProp3: Schema.Boolean,
    requested: Schema.BigInt,
    outcome: Schema.String,
    base: Schema.BigInt,
    requests: Schema.BigInt
};
export const ApgListboxRearrangeableStates = Machine.state({
    fields: ApgListboxRearrangeableFields
});
export const ApgListboxRearrangeableEvents = Machine.events({
    init: {},
    focus_a: {},
    focus_b: {},
    blur: {},
    arrow_down: {},
    arrow_up: {},
    home: {},
    end: {},
    space: {},
    move_up: {},
    move_down: {},
    transfer: {},
    set_multi: {
        flag: Schema.Boolean
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
export const ApgListboxRearrangeableDefinition = Machine.make({
    id: "ApgListboxRearrangeable",
    root: ApgListboxRearrangeableStates,
    events: ApgListboxRearrangeableEvents
});
export type ApgListboxRearrangeableEvent = Machine.EventOf<typeof ApgListboxRearrangeableEvents>;
