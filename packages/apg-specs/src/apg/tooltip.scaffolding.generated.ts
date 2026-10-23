// GENERATED FILE — DO NOT EDIT.
// Generated from: ../../specs/apg/tooltip.qnt
// Spec hash (sha256): 31e91f059b8174c03141cff303abec475824d7458590dbbed7773dc3ecc96901
// Regenerate with: npm run generate:model
import { Machine } from "@typeonce/effect-machine";
import { Schema } from "effect";
export const ApgTooltipFields = {
    focus: Schema.String,
    pointer: Schema.String,
    shownA: Schema.Boolean,
    shownB: Schema.Boolean,
    pendA: Schema.Boolean,
    pendB: Schema.Boolean,
    dismA: Schema.Boolean,
    dismB: Schema.Boolean,
    warm: Schema.Boolean,
    warmEnabled: Schema.Boolean,
    describedA: Schema.Boolean,
    describedB: Schema.Boolean,
    requests: Schema.BigInt,
    controlled: Schema.Boolean,
    accepting: Schema.Boolean,
    valueProp: Schema.BigInt,
    requested: Schema.BigInt,
    outcome: Schema.String,
    base: Schema.BigInt
};
export const ApgTooltipStates = Machine.state({
    fields: ApgTooltipFields
});
export const ApgTooltipEvents = Machine.events({
    init: {},
    focusIn: {
        t: Schema.String
    },
    focusOut: {},
    pointerEnter: {
        t: Schema.String
    },
    pointerLeave: {},
    pointerEnterTip: {},
    showTimer: {
        t: Schema.String
    },
    hideTimer: {},
    escape: {},
    warmExpire: {},
    setWarmup: {
        on: Schema.Boolean
    },
    setValue: {
        v: Schema.BigInt
    },
    hostToggle: {},
    control: {},
    acceptRequests: {}
});
export const ApgTooltipDefinition = Machine.make({
    id: "ApgTooltip",
    root: ApgTooltipStates,
    events: ApgTooltipEvents
});
export type ApgTooltipEvent = Machine.EventOf<typeof ApgTooltipEvents>;
