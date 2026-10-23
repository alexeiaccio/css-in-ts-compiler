// GENERATED FILE — DO NOT EDIT.
// Generated from: ../../specs/apg/carousel.qnt
// Spec hash (sha256): 9bc680b857e2ffc9ab87a76cdb04b3da1686cf9a2cfa429d8fcde2b075627d93
// Regenerate with: npm run generate:model
import { Machine } from "@typeonce/effect-machine";
import { Schema } from "effect";
export const ApgCarouselFields = {
    slides: Schema.BigInt,
    current: Schema.BigInt,
    tabbed: Schema.Boolean,
    autoRotate: Schema.Boolean,
    stickyFocusPause: Schema.Boolean,
    rotate: Schema.Boolean,
    forced: Schema.Boolean,
    focus: Schema.BigInt,
    hover: Schema.Boolean,
    controlled: Schema.Boolean,
    accepting: Schema.Boolean,
    valueProp: Schema.BigInt,
    requested: Schema.BigInt,
    requests: Schema.BigInt,
    outcome: Schema.String,
    base: Schema.BigInt
};
export const ApgCarouselStates = Machine.state({
    fields: ApgCarouselFields
});
export const ApgCarouselEvents = Machine.events({
    init: {},
    tick: {},
    pointer_enter: {},
    pointer_leave: {},
    key_tab: {},
    key_shift_tab: {},
    focus_control: {
        t: Schema.BigInt
    },
    blur_out: {},
    key_activate: {},
    key_arrow_right: {},
    key_arrow_left: {},
    key_home: {},
    key_end: {},
    click_rotation: {},
    click_prev: {},
    click_next: {},
    click_tab: {
        i: Schema.BigInt
    },
    set_slide_count: {
        m: Schema.BigInt
    },
    set_tabbed: {
        on: Schema.Boolean
    },
    set_auto_rotate: {
        on: Schema.Boolean
    },
    set_sticky_focus_pause: {
        on: Schema.Boolean
    },
    set_reduced_motion: {},
    setValue: {
        v: Schema.BigInt
    },
    control: {},
    acceptRequests: {}
});
export const ApgCarouselDefinition = Machine.make({
    id: "ApgCarousel",
    root: ApgCarouselStates,
    events: ApgCarouselEvents
});
export type ApgCarouselEvent = Machine.EventOf<typeof ApgCarouselEvents>;
