// GENERATED FILE — DO NOT EDIT.
// Generated from: ../../specs/patterns/dropzone.qnt
// Spec hash (sha256): 41fe512af3b2dccfbc489df33a2504e817557b00ba8060e111e258da418cf24b
// Regenerate with: npm run generate:model
import { Machine } from "@typeonce/effect-machine";
import { Schema } from "effect";
export const PatternsDropzoneFields = {
    depth: Schema.BigInt,
    highlight: Schema.Boolean,
    disabled: Schema.Boolean,
    batch: Schema.String,
    batches: Schema.BigInt,
    dropped: Schema.Boolean,
    delivered: Schema.Boolean,
    exited: Schema.Boolean
};
export const PatternsDropzoneStates = Machine.state({
    fields: PatternsDropzoneFields
});
export const PatternsDropzoneEvents = Machine.events({
    init: {},
    enter_zone: {},
    enter_child: {},
    leave_child: {},
    leave_zone: {},
    drop_accepted: {},
    drop_rejected: {},
    drop_empty: {},
    set_disabled: {
        off: Schema.Boolean
    }
});
export const PatternsDropzoneDefinition = Machine.make({
    id: "PatternsDropzone",
    root: PatternsDropzoneStates,
    events: PatternsDropzoneEvents
});
export type PatternsDropzoneEvent = Machine.EventOf<typeof PatternsDropzoneEvents>;
