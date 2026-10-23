// GENERATED FILE — DO NOT EDIT.
// Generated from: ../../specs/apg/dialog-modal.qnt
// Spec hash (sha256): db1fa69011e83f41ee85115a223998acafe7b96112af2254ed80b39d4ad502aa
// Regenerate with: npm run generate:model
import { Machine } from "@typeonce/effect-machine";
import { Schema } from "effect";
export const ApgDialogModalFields = {
    depth: Schema.BigInt,
    l1: Schema.BigInt,
    l2: Schema.BigInt,
    l3: Schema.BigInt,
    r1: Schema.BigInt,
    r2: Schema.BigInt,
    r3: Schema.BigInt,
    focus: Schema.BigInt,
    requests: Schema.BigInt,
    controlled: Schema.Boolean,
    accepting: Schema.Boolean,
    valueProp: Schema.Boolean,
    requested: Schema.Boolean,
    outcome: Schema.String,
    base: Schema.Boolean
};
export const ApgDialogModalStates = Machine.state({
    fields: ApgDialogModalFields
});
export const ApgDialogModalEvents = Machine.events({
    init: {},
    escape: {},
    activate: {},
    pointer_outside: {},
    tab: {},
    shift_tab: {},
    focus_attempt: {
        target: Schema.BigInt
    },
    remove_invoker: {},
    setValue: {
        v: Schema.Boolean
    },
    hostToggle: {},
    control: {},
    acceptRequests: {}
});
export const ApgDialogModalDefinition = Machine.make({
    id: "ApgDialogModal",
    root: ApgDialogModalStates,
    events: ApgDialogModalEvents
});
export type ApgDialogModalEvent = Machine.EventOf<typeof ApgDialogModalEvents>;
