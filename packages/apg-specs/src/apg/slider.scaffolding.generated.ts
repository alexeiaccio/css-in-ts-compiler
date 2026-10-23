// GENERATED FILE — DO NOT EDIT.
// Generated from: ../../specs/apg/slider.qnt
// Spec hash (sha256): 189f136f0b8c0e2ab5d6f3dc6145065fac2e2d0f97d2b54b720af8d8f390e635
// Regenerate with: npm run generate:model
import { Machine } from "@typeonce/effect-machine";
import { Schema } from "effect";
export const ApgSliderFields = {
    flavor: Schema.BigInt,
    value: Schema.BigInt,
    focused: Schema.Boolean,
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
export const ApgSliderStates = Machine.state({
    fields: ApgSliderFields
});
export const ApgSliderEvents = Machine.events({
    init: {},
    configure: {
        pick: Schema.BigInt
    },
    focus: {},
    blur: {},
    keydown: {
        key: Schema.String
    },
    pointer: {
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
    hostToggle: {},
    control: {},
    acceptRequests: {}
});
export const ApgSliderDefinition = Machine.make({
    id: "ApgSlider",
    root: ApgSliderStates,
    events: ApgSliderEvents
});
export type ApgSliderEvent = Machine.EventOf<typeof ApgSliderEvents>;
