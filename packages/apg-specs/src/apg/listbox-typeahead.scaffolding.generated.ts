// GENERATED FILE — DO NOT EDIT.
// Generated from: ../../specs/apg/listbox-typeahead.qnt
// Spec hash (sha256): 33e6bfa4349668310585be4a77d778f1d6e1d024def185d506938da91129c108
// Regenerate with: npm run generate:model
import { Machine } from "@typeonce/effect-machine";
import { Schema } from "effect";
export const ApgListboxTypeaheadFields = {
    hasFocus: Schema.Boolean,
    active: Schema.BigInt,
    buf: Schema.BigInt,
    bufLen: Schema.BigInt,
    armed: Schema.Boolean,
    matched: Schema.Boolean,
    controlled: Schema.Boolean,
    accepting: Schema.Boolean,
    valueProp: Schema.BigInt,
    requested: Schema.BigInt,
    outcome: Schema.String,
    base: Schema.BigInt,
    requests: Schema.BigInt
};
export const ApgListboxTypeaheadStates = Machine.state({
    fields: ApgListboxTypeaheadFields
});
export const ApgListboxTypeaheadEvents = Machine.events({
    init: {},
    focus_in: {},
    blur: {},
    type_char: {
        ch: Schema.BigInt
    },
    timeout: {},
    arrow_down: {},
    arrow_up: {},
    home: {},
    end: {},
    setValue: {
        v: Schema.BigInt
    },
    hostToggle: {},
    control: {},
    acceptRequests: {}
});
export const ApgListboxTypeaheadDefinition = Machine.make({
    id: "ApgListboxTypeahead",
    root: ApgListboxTypeaheadStates,
    events: ApgListboxTypeaheadEvents
});
export type ApgListboxTypeaheadEvent = Machine.EventOf<typeof ApgListboxTypeaheadEvents>;
