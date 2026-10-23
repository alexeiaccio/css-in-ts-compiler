// GENERATED FILE — DO NOT EDIT.
// Generated from: ../../specs/apg/alert.qnt
// Spec hash (sha256): 9624ecb9dc3eaa1b5c9d5ccc0a44d695fd0e0f46e384e8248b28ab0f73844bc2
// Regenerate with: npm run generate:model
import { Machine } from "@typeonce/effect-machine";
import { Schema } from "effect";
export const ApgAlertFields = {
    loaded: Schema.Boolean,
    mounted: Schema.Boolean,
    role: Schema.String,
    message: Schema.BigInt,
    nextId: Schema.BigInt,
    announced: Schema.BigInt,
    announcements: Schema.BigInt,
    preloaded: Schema.BigInt,
    focus: Schema.String,
    dismissals: Schema.BigInt
};
export const ApgAlertStates = Machine.state({
    fields: ApgAlertFields
});
export const ApgAlertEvents = Machine.events({
    init: {},
    show: {},
    load: {},
    dismiss: {},
    focusTask: {},
    focusOther: {}
});
export const ApgAlertDefinition = Machine.make({
    id: "ApgAlert",
    root: ApgAlertStates,
    events: ApgAlertEvents
});
export type ApgAlertEvent = Machine.EventOf<typeof ApgAlertEvents>;
