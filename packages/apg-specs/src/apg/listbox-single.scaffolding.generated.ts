// GENERATED FILE — DO NOT EDIT.
// Generated from: ../../specs/apg/listbox-single.qnt
// Spec hash (sha256): e8f75a29f579de91d0fa68455d442264bce17c6e5e8b744a80812137b5790f92
// Regenerate with: npm run generate:model
import { Machine } from "@typeonce/effect-machine";
import { Schema } from "effect";
export const ApgListboxSingleFields = {
    hasFocus: Schema.Boolean,
    active: Schema.BigInt,
    selected: Schema.BigInt,
    followsFocus: Schema.Boolean,
    controlled: Schema.Boolean,
    accepting: Schema.Boolean,
    valueProp0: Schema.Boolean,
    valueProp1: Schema.Boolean,
    valueProp2: Schema.Boolean,
    valueProp3: Schema.Boolean,
    valueProp4: Schema.Boolean,
    valueProp5: Schema.Boolean,
    requested: Schema.BigInt,
    outcome: Schema.String,
    base: Schema.BigInt,
    requests: Schema.BigInt
};
export const ApgListboxSingleStates = Machine.state({
    fields: ApgListboxSingleFields
});
export const ApgListboxSingleEvents = Machine.events({
    init: {},
    seed: {
        index: Schema.BigInt
    },
    focus_in: {},
    blur: {},
    arrow_down: {},
    arrow_up: {},
    home: {},
    end: {},
    space: {},
    click: {
        index: Schema.BigInt
    },
    set_follows_focus: {
        follow: Schema.Boolean
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
export const ApgListboxSingleDefinition = Machine.make({
    id: "ApgListboxSingle",
    root: ApgListboxSingleStates,
    events: ApgListboxSingleEvents
});
export type ApgListboxSingleEvent = Machine.EventOf<typeof ApgListboxSingleEvents>;
