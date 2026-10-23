// GENERATED FILE — DO NOT EDIT.
// Generated from: ../../specs/apg/radio.qnt
// Spec hash (sha256): 90673b761dfafefb63af681d1db9668c21e7a0a2bf339228cd72b4c21d70d156
// Regenerate with: npm run generate:model
import { Machine } from "@typeonce/effect-machine";
import { Schema } from "effect";
export const ApgRadioFields = {
    flavor: Schema.String,
    mask: Schema.BigInt,
    checked: Schema.BigInt,
    focus: Schema.BigInt,
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
