// GENERATED FILE — DO NOT EDIT.
// Generated from: ../../specs/apg/windowsplitter.qnt
// Spec hash (sha256): dabf1a4246c52d1aebb98160ec6bff1f3c76103fb8a7075ee2389d4ac864ae23
// Regenerate with: npm run generate:model
import { Machine } from "@typeonce/effect-machine";
import { Schema } from "effect";
export const ApgWindowsplitterFields = {
    orientation: Schema.String,
    fixed: Schema.Boolean,
    value: Schema.BigInt,
    prev: Schema.BigInt,
    collapsed: Schema.Boolean,
    justRestored: Schema.Boolean,
    focus: Schema.String,
    ariaNow: Schema.BigInt,
    requests: Schema.BigInt,
    controlled: Schema.Boolean,
    accepting: Schema.Boolean,
    valueProp: Schema.BigInt,
    requested: Schema.BigInt,
    outcome: Schema.String,
    base: Schema.BigInt
};
export const ApgWindowsplitterStates = Machine.state({
    fields: ApgWindowsplitterFields
});
export const ApgWindowsplitterEvents = Machine.events({
    init: {},
    focusSplitter: {},
    blur: {},
    left: {},
    right: {},
    up: {},
    down: {},
    home: {},
    end: {},
    enter: {},
    f6: {},
    orientVertical: {},
    orientHorizontal: {},
    makeFixed: {},
    makeResizable: {},
    setValue: {
        v: Schema.BigInt
    },
    hostToggle: {},
    control: {},
    acceptRequests: {}
});
export const ApgWindowsplitterDefinition = Machine.make({
    id: "ApgWindowsplitter",
    root: ApgWindowsplitterStates,
    events: ApgWindowsplitterEvents
});
export type ApgWindowsplitterEvent = Machine.EventOf<typeof ApgWindowsplitterEvents>;
