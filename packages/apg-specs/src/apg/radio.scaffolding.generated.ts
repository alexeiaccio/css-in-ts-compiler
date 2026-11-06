// GENERATED FILE — DO NOT EDIT.
// Generated from: ../../specs/apg/radio.qnt
// Spec hash (sha256): cd99c922cec43e61d7f0713ac03e3724441d516115f19c31d9c328add18e191e
// Regenerate with: npm run generate:model
import { Machine } from "@typeonce/effect-machine";
import { Schema } from "effect";
export const ApgRadioFields = {
    flavor: Schema.String,
    mask: Schema.BigInt,
    checked: Schema.BigInt,
    focus: Schema.BigInt,
    tabStop: Schema.BigInt,
    controlled: Schema.Boolean,
    accepting: Schema.Boolean,
    valueProp: Schema.BigInt,
    requested: Schema.BigInt,
    requests: Schema.BigInt,
    outcome: Schema.String,
    base: Schema.BigInt
};
export const ApgRadioStates = Machine.state({
    fields: ApgRadioFields
});
export const ApgRadioEvents = Machine.events({
    init: {},
    set_flavor: {
        v: Schema.String
    },
    set_disabled: {
        m: Schema.BigInt
    },
    preselect: {
        pick: Schema.BigInt
    },
    enter: {},
    leave: {},
    arrow_next: {},
    arrow_prev: {},
    space: {},
    click: {
        target: Schema.BigInt
    },
    setValue: {
        v: Schema.BigInt
    },
    control: {},
    acceptRequests: {}
});
export const ApgRadioDefinition = Machine.make({
    id: "ApgRadio",
    root: ApgRadioStates,
    events: ApgRadioEvents
});
export type ApgRadioEvent = Machine.EventOf<typeof ApgRadioEvents>;
