// GENERATED FILE — DO NOT EDIT.
// Generated from: ../../specs/apg/accordion.qnt
// Spec hash (sha256): 6f04cf649fc01fa973fa9449210493b9e866027264acb8734f3fc0be4fde83f4
// Regenerate with: npm run generate:model
import { Machine } from "@typeonce/effect-machine";
import { Schema } from "effect";
export const ApgAccordionFields = {
    expanded0: Schema.Boolean,
    expanded1: Schema.Boolean,
    expanded2: Schema.Boolean,
    focus: Schema.BigInt,
    multiple: Schema.Boolean,
    collapsible: Schema.Boolean,
    headingLevel: Schema.BigInt,
    controlled: Schema.Boolean,
    accepting: Schema.Boolean,
    valueProp: Schema.BigInt,
    requested: Schema.BigInt,
    outcome: Schema.String,
    base: Schema.BigInt,
    requests: Schema.BigInt
};
export const ApgAccordionStates = Machine.state({
    fields: ApgAccordionFields
});
export const ApgAccordionEvents = Machine.events({
    init: {},
    click_header: {
        panel: Schema.BigInt
    },
    click_content: {
        panel: Schema.BigInt
    },
    key_enter: {},
    key_space: {},
    key_tab: {},
    key_shift_tab: {},
    blur: {},
    set_multiple: {
        allow: Schema.Boolean
    },
    set_collapsible: {
        allow: Schema.Boolean
    },
    set_heading_level: {
        level: Schema.BigInt
    },
    setValue: {
        v: Schema.BigInt
    },
    hostToggle: {
        panel: Schema.BigInt
    },
    control: {},
    acceptRequests: {}
});
export const ApgAccordionDefinition = Machine.make({
    id: "ApgAccordion",
    root: ApgAccordionStates,
    events: ApgAccordionEvents
});
export type ApgAccordionEvent = Machine.EventOf<typeof ApgAccordionEvents>;
