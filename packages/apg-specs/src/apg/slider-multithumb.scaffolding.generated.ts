// GENERATED FILE — DO NOT EDIT.
// Generated from: ../../specs/apg/slider-multithumb.qnt
// Spec hash (sha256): 829be4ba593cc2dbb09f67b6ef8bcaf4e13aeb17be3383e9c8abc6adade8dafd
// Regenerate with: npm run generate:model
import { Machine } from "@typeonce/effect-machine";
import { Schema } from "effect";
export const ApgSliderMultithumbFields = {
    lo: Schema.BigInt,
    hi: Schema.BigInt,
    focused: Schema.String,
    orientation: Schema.String,
    dir: Schema.String,
    handled: Schema.Boolean,
    controlled: Schema.Boolean,
    accepting: Schema.Boolean,
    valueProp: Schema.BigInt,
    requested: Schema.BigInt,
    outcome: Schema.String,
    base: Schema.BigInt,
    requests: Schema.BigInt
};
export const ApgSliderMultithumbStates = Machine.state({
    fields: ApgSliderMultithumbFields
});
export const ApgSliderMultithumbEvents = Machine.events({
    init: {},
    focusThumb: {
        t: Schema.String
    },
    blur: {},
    tab: {},
    shiftTab: {},
    keydown: {
        key: Schema.String
    },
    pointerLo: {
        raw: Schema.BigInt
    },
    pointerHi: {
        raw: Schema.BigInt
    },
    setOrientation: {
        o: Schema.String
    },
    setDir: {
        d: Schema.String
    },
    setValue: {
        v: Schema.BigInt
    },
    control: {},
    acceptRequests: {}
});
export const ApgSliderMultithumbDefinition = Machine.make({
    id: "ApgSliderMultithumb",
    root: ApgSliderMultithumbStates,
    events: ApgSliderMultithumbEvents
});
export type ApgSliderMultithumbEvent = Machine.EventOf<typeof ApgSliderMultithumbEvents>;
