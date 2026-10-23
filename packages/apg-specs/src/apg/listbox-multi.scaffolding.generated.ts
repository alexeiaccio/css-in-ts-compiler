// GENERATED FILE — DO NOT EDIT.
// Generated from: ../../specs/apg/listbox-multi.qnt
// Spec hash (sha256): e0a589a363a9e8c1b5fc596a7b31fdf0a1194688a01e40559d65668ad0968095
// Regenerate with: npm run generate:model
import { Machine } from "@typeonce/effect-machine";
import { Schema } from "effect";
export const ApgListboxMultiFields = {
    hasFocus: Schema.Boolean,
    active: Schema.BigInt,
    selected: Schema.BigInt,
    anchor: Schema.BigInt,
    selectionModel: Schema.String,
    lastOp: Schema.String,
    controlled: Schema.Boolean,
    accepting: Schema.Boolean,
    valueProp0: Schema.Boolean,
    valueProp1: Schema.Boolean,
    valueProp2: Schema.Boolean,
    valueProp3: Schema.Boolean,
    valueProp4: Schema.Boolean,
    requested: Schema.BigInt,
    outcome: Schema.String,
    base: Schema.BigInt,
    requests: Schema.BigInt
};
export const ApgListboxMultiStates = Machine.state({
    fields: ApgListboxMultiFields
});
export const ApgListboxMultiEvents = Machine.events({
    init: {},
    seed: {
        v: Schema.BigInt
    },
    focus_in: {},
    blur: {},
    arrow_down: {},
    arrow_up: {},
    home: {},
    end: {},
    space: {},
    ctrl_space: {},
    shift_arrow_down: {},
    shift_arrow_up: {},
    ctrl_arrow_down: {},
    ctrl_arrow_up: {},
    shift_space: {},
    ctrl_shift_home: {},
    ctrl_shift_end: {},
    ctrl_a: {},
    click: {
        index: Schema.BigInt
    },
    set_selection_model: {
        model: Schema.String
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
export const ApgListboxMultiDefinition = Machine.make({
    id: "ApgListboxMulti",
    root: ApgListboxMultiStates,
    events: ApgListboxMultiEvents
});
export type ApgListboxMultiEvent = Machine.EventOf<typeof ApgListboxMultiEvents>;
