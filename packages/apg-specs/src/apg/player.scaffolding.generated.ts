// GENERATED FILE — DO NOT EDIT.
// Generated from: ../../specs/apg/player.qnt
// Spec hash (sha256): d9b522db8656c1fb9b91621ed3a5ef2054f27d683dd19716c20e86fecf0b9fb8
// Regenerate with: npm run generate:model
import { Machine } from "@typeonce/effect-machine";
import { Schema } from "effect";
export const ApgPlayerFields = {
    stage: Schema.String,
    seeking: Schema.Boolean,
    pos: Schema.BigInt,
    dur: Schema.BigInt,
    known: Schema.Boolean,
    paused: Schema.Boolean,
    ended: Schema.Boolean,
    vol: Schema.BigInt,
    applied: Schema.BigInt,
    muted: Schema.Boolean,
    rate: Schema.BigInt,
    full: Schema.Boolean,
    textMin: Schema.BigInt,
    textSec: Schema.BigInt,
    focus: Schema.String,
    plays: Schema.BigInt,
    pauses: Schema.BigInt,
    seeks: Schema.BigInt,
    controlled: Schema.Boolean,
    accepting: Schema.Boolean,
    prefs: Schema.BigInt,
    reqs: Schema.BigInt,
    reqKind: Schema.String,
    askNum: Schema.BigInt,
    outcome: Schema.String,
    base: Schema.BigInt
};
export const ApgPlayerStates = Machine.state({
    fields: ApgPlayerFields
});
export const ApgPlayerEvents = Machine.events({
    init: {},
    onLoadedMetadata: {
        d: Schema.BigInt
    },
    onCanPlay: {},
    onWaiting: {},
    onPlaying: {},
    onTimeUpdate: {
        t: Schema.BigInt
    },
    onPause: {},
    onEnded: {},
    onError: {},
    play: {},
    pause: {},
    togglePlay: {},
    seekPreview: {
        t: Schema.BigInt
    },
    seekCommit: {
        t: Schema.BigInt
    },
    seekKey: {
        key: Schema.String
    },
    surfaceSeekKey: {
        key: Schema.String
    },
    onSeeked: {},
    setVolume: {
        v: Schema.BigInt
    },
    toggleMute: {},
    setRate: {
        r: Schema.BigInt
    },
    toggleFullscreen: {},
    propVolume: {
        v: Schema.BigInt
    },
    propMuted: {
        m: Schema.Boolean
    },
    propRate: {
        r: Schema.BigInt
    },
    propFullscreen: {
        f: Schema.Boolean
    },
    control: {},
    acceptRequests: {},
    focusOn: {
        target: Schema.String
    },
    blur: {},
    loadStart: {}
});
export const ApgPlayerDefinition = Machine.make({
    id: "ApgPlayer",
    root: ApgPlayerStates,
    events: ApgPlayerEvents
});
export type ApgPlayerEvent = Machine.EventOf<typeof ApgPlayerEvents>;
