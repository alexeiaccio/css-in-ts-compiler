// GENERATED FILE — DO NOT EDIT.
// Generated from: ../../specs/apg/meter.qnt
// Spec hash (sha256): b72cfa3231ecf06c295309e94669a7b8d1c4b65b4a45c9ef323ddaab5a56c900
// Regenerate with: npm run generate:model
import { Machine } from "@typeonce/effect-machine";
import { Schema } from "effect";
export const ApgMeterFields = {
    min: Schema.BigInt,
    max: Schema.BigInt,
    raw: Schema.BigInt,
    now: Schema.BigInt,
    friendly: Schema.Boolean,
    hasText: Schema.Boolean,
    textNow: Schema.BigInt
};
export const ApgMeterStates = Machine.state({
    fields: ApgMeterFields
});
export const ApgMeterEvents = Machine.events({
    init: {},
    setValue: {
        v: Schema.BigInt
    },
    setRange: {
        r: Schema.BigInt
    },
    addText: {},
    removeText: {},
    percentFriendly: {},
    percentUnfriendly: {}
});
export const ApgMeterDefinition = Machine.make({
    id: "ApgMeter",
    root: ApgMeterStates,
    events: ApgMeterEvents
});
export type ApgMeterEvent = Machine.EventOf<typeof ApgMeterEvents>;
