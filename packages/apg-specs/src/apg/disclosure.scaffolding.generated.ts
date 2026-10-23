// GENERATED FILE — DO NOT EDIT.
// Generated from: ../../specs/apg/disclosure.qnt
// Spec hash (sha256): 01154b5697f750117a5314384a275e3dd1e2b2a7fb97cac95a69f05f08276dfd
// Regenerate with: npm run generate:model
import { Machine } from "@typeonce/effect-machine";
import { Schema } from "effect";
export const ApgDisclosureFields = {
    expanded: Schema.Boolean,
    disabled: Schema.Boolean,
    focus: Schema.String,
    ariaExpanded: Schema.String,
    panelHidden: Schema.Boolean,
    requests: Schema.BigInt,
    controlled: Schema.Boolean,
    accepting: Schema.Boolean,
    valueProp: Schema.Boolean,
    requested: Schema.Boolean,
    outcome: Schema.String,
    base: Schema.Boolean
};
export const ApgDisclosureStates = Machine.state({
    fields: ApgDisclosureFields
});
export const ApgDisclosureEvents = Machine.events({
    init: {},
    focusTrigger: {},
    blurTrigger: {},
    click: {},
    press: {},
    expand: {},
    collapse: {},
    toggle: {},
    setValue: {
        v: Schema.Boolean
    },
    hostToggle: {},
    control: {},
    acceptRequests: {},
    disable: {},
    enable: {}
});
export const ApgDisclosureDefinition = Machine.make({
    id: "ApgDisclosure",
    root: ApgDisclosureStates,
    events: ApgDisclosureEvents
});
export type ApgDisclosureEvent = Machine.EventOf<typeof ApgDisclosureEvents>;
