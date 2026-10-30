// GENERATED FILE — DO NOT EDIT.
// Generated from: ../../specs/apg/slider.qnt
// Spec hash (sha256): 7f8cabe937ca10920c10b5bda488a1ab01e76b75b8ffc8ae61a4abf8d0c8131d
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
