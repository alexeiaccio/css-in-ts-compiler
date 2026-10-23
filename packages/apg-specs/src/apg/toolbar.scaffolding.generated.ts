// GENERATED FILE — DO NOT EDIT.
// Generated from: ../../specs/apg/toolbar.qnt
// Spec hash (sha256): 45274c0221709472943a1e45c72bf584573f4bbfc513b5cafa5fc8b987a2dd84
// Regenerate with: npm run generate:model
import { Machine } from "@typeonce/effect-machine";
import { Schema } from "effect";
export const ApgToolbarFields = {
    orientation: Schema.String,
    wrap: Schema.Boolean,
    focus: Schema.BigInt,
    tabStop: Schema.BigInt,
    disabledMask: Schema.BigInt,
    activations: Schema.BigInt,
    lastActivated: Schema.BigInt,
    consumed: Schema.BigInt,
    lastKeyConsumed: Schema.Boolean,
    menuOpen: Schema.Boolean,
    menuIndex: Schema.BigInt
};
export const ApgToolbarStates = Machine.state({
    fields: ApgToolbarFields
});
export const ApgToolbarEvents = Machine.events({
    init: {},
    tabIn: {},
    tab: {
        back: Schema.Boolean
    },
    leave: {},
    click: {
        idx: Schema.BigInt
    },
    key: {
        k: Schema.String
    },
    activate: {},
    escape: {},
    toggleDisabled: {
        idx: Schema.BigInt
    },
    flipOrientation: {},
    flipWrap: {}
});
export const ApgToolbarDefinition = Machine.make({
    id: "ApgToolbar",
    root: ApgToolbarStates,
    events: ApgToolbarEvents
});
export type ApgToolbarEvent = Machine.EventOf<typeof ApgToolbarEvents>;
