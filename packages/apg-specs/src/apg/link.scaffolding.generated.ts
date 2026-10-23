// GENERATED FILE — DO NOT EDIT.
// Generated from: ../../specs/apg/link.qnt
// Spec hash (sha256): 1970a5bd0408fe3d0bd8f88846fef0fb4c74f32bed4071c3b0f36454281e5e30
// Regenerate with: npm run generate:model
import { Machine } from "@typeonce/effect-machine";
import { Schema } from "effect";
export const ApgLinkFields = {
    native: Schema.Boolean,
    tabindex: Schema.Boolean,
    focus: Schema.String,
    location: Schema.BigInt,
    activations: Schema.BigInt
};
export const ApgLinkStates = Machine.state({
    fields: ApgLinkFields
});
export const ApgLinkEvents = Machine.events({
    init: {},
    focusLink: {},
    blur: {},
    press: {},
    pressSpace: {},
    click: {},
    back: {},
    setNative: {},
    setCustom: {}
});
export const ApgLinkDefinition = Machine.make({
    id: "ApgLink",
    root: ApgLinkStates,
    events: ApgLinkEvents
});
export type ApgLinkEvent = Machine.EventOf<typeof ApgLinkEvents>;
