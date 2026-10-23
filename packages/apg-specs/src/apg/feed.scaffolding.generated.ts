// GENERATED FILE — DO NOT EDIT.
// Generated from: ../../specs/apg/feed.qnt
// Spec hash (sha256): 1593bb9c9c291ba19148c31e45d9c1773a9837d0279ae49edc1226b86d148d79
// Regenerate with: npm run generate:model
import { Machine } from "@typeonce/effect-machine";
import { Schema } from "effect";
export const ApgFeedFields = {
    phase: Schema.String,
    busy: Schema.Boolean,
    loaded: Schema.BigInt,
    zone: Schema.String,
    focus: Schema.BigInt,
    sizeMode: Schema.String,
    totalKnown: Schema.Boolean,
    controlled: Schema.Boolean,
    accepting: Schema.Boolean,
    valueProp: Schema.BigInt,
    requested: Schema.BigInt,
    requests: Schema.BigInt,
    outcome: Schema.String,
    base: Schema.BigInt
};
export const ApgFeedStates = Machine.state({
    fields: ApgFeedFields
});
export const ApgFeedEvents = Machine.events({
    init: {},
    focus_article: {
        n: Schema.BigInt
    },
    page_down: {},
    page_up: {},
    ctrl_end: {},
    ctrl_home: {},
    focus_outside: {
        side: Schema.String
    },
    load_start: {},
    load_finish: {
        n: Schema.BigInt
    },
    load_fail: {},
    set_size_mode: {
        mode: Schema.String
    },
    set_total_known: {
        known: Schema.Boolean
    },
    setValue: {
        v: Schema.BigInt
    },
    control: {},
    acceptRequests: {}
});
export const ApgFeedDefinition = Machine.make({
    id: "ApgFeed",
    root: ApgFeedStates,
    events: ApgFeedEvents
});
export type ApgFeedEvent = Machine.EventOf<typeof ApgFeedEvents>;
