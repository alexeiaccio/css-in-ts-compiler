// GENERATED FILE — DO NOT EDIT.
// Generated from: ../../specs/apg/menu-checkable.qnt
// Spec hash (sha256): 281201c9574dde5f24bbc36caf44ddebdeeb233222663767575c2cd550627ce9
// Regenerate with: npm run generate:model
import { Machine } from "@typeonce/effect-machine";
import { Schema } from "effect";
export const ApgMenuCheckableFields = {
    focusIdx: Schema.BigInt,
    menuOpen: Schema.Boolean,
    wrap: Schema.Boolean,
    choice: Schema.BigInt,
    lastActivated: Schema.BigInt,
    controlled: Schema.Boolean,
    accepting: Schema.Boolean,
    valueProp: Schema.BigInt,
    requested: Schema.BigInt,
    outcome: Schema.String,
    base: Schema.BigInt,
    requests: Schema.BigInt
};
export const ApgMenuCheckableStates = Machine.state({
    fields: ApgMenuCheckableFields
});
export const ApgMenuCheckableEvents = Machine.events({
    init: {},
    arrow_down: {},
    arrow_up: {},
    key_home: {},
    key_end: {},
    enter: {},
    space: {},
    escape: {},
    setValue: {
        v: Schema.BigInt
    },
    hostToggle: {},
    control: {},
    acceptRequests: {}
});
export const ApgMenuCheckableDefinition = Machine.make({
    id: "ApgMenuCheckable",
    root: ApgMenuCheckableStates,
    events: ApgMenuCheckableEvents
});
export type ApgMenuCheckableEvent = Machine.EventOf<typeof ApgMenuCheckableEvents>;
