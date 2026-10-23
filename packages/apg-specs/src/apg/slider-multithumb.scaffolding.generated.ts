// GENERATED FILE — DO NOT EDIT.
// Generated from: ../../specs/apg/slider-multithumb.qnt
// Spec hash (sha256): 9d113656249981f1ef2ab84e53a1e4eed24aa9bbfa905d29715d426449453088
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
