// GENERATED FILE — DO NOT EDIT.
// Generated from: ../../specs/apg/alertdialog.qnt
// Spec hash (sha256): bb9b199b47c66b62a41b8f4b5ff5d7087150770ad5d0eeaf4d91cf36f55f2f53
// Regenerate with: npm run generate:model
import { Machine } from "@typeonce/effect-machine";
import { Schema } from "effect";
export const ApgAlertdialogFields = {
    isOpen: Schema.Boolean,
    focus: Schema.BigInt,
    ret: Schema.BigInt,
    interacted: Schema.Boolean,
    notes: Schema.BigInt,
    stored: Schema.BigInt,
    requests: Schema.BigInt,
    controlled: Schema.Boolean,
    accepting: Schema.Boolean,
    valueProp: Schema.Boolean,
    requested: Schema.Boolean,
    outcome: Schema.String,
    base: Schema.Boolean
};
export const ApgAlertdialogStates = Machine.state({
    fields: ApgAlertdialogFields
});
export const ApgAlertdialogEvents = Machine.events({
    init: {},
    escape: {},
    activate: {},
    tab: {},
    shift_tab: {},
    focus_attempt: {
        target: Schema.BigInt
    },
    ctrl_s: {},
    type_text: {},
    clear_text: {},
    pointer_outside: {},
    setValue: {
        v: Schema.Boolean
    },
    hostToggle: {},
    control: {},
    acceptRequests: {}
});
export const ApgAlertdialogDefinition = Machine.make({
    id: "ApgAlertdialog",
    root: ApgAlertdialogStates,
    events: ApgAlertdialogEvents
});
export type ApgAlertdialogEvent = Machine.EventOf<typeof ApgAlertdialogEvents>;
