// GENERATED FILE — DO NOT EDIT.
// Generated from: ../../specs/patterns/reactive.qnt
// Spec hash (sha256): b50a9fbbc64d167821ceb87fe181ca2dd0d1a355185b4336ca7026a1aba844c1
// Regenerate with: npm run generate:model
import { Machine } from "@typeonce/effect-machine";
import { Schema } from "effect";
export const PatternsReactiveFields = {
    xo: Schema.String,
    xt: Schema.String,
    yo: Schema.String,
    yt: Schema.String,
    xaOpen: Schema.String,
    xaTab: Schema.String,
    yaOpen: Schema.String,
    yaTab: Schema.String,
    aExpanded: Schema.String,
    aOneSel: Schema.String,
    aOneTab: Schema.String,
    aOneControls: Schema.String,
    aTwoSel: Schema.String,
    aTwoTab: Schema.String,
    aCurrent: Schema.String,
    aPanel: Schema.String,
    bExpanded: Schema.String,
    bOneSel: Schema.String,
    bOneTab: Schema.String,
    bOneControls: Schema.String,
    bTwoSel: Schema.String,
    bTwoTab: Schema.String,
    bChecked: Schema.String,
    bPanel: Schema.String,
    ready: Schema.Boolean,
    snapXo: Schema.String,
    snapXt: Schema.String,
    snapYo: Schema.String,
    snapYt: Schema.String,
    scope: Schema.String
};
export const PatternsReactiveStates = Machine.state({
    fields: PatternsReactiveFields
});
export const PatternsReactiveEvents = Machine.events({
    init: {},
    setup: {},
    clickOuterToggle: {},
    clickOuterTabOne: {},
    clickOuterTabTwo: {},
    changeOuterFieldOne: {},
    changeOuterFieldTwo: {},
    clickInnerToggle: {},
    clickInnerTabOne: {},
    clickInnerTabTwo: {},
    changeInnerCheckOn: {},
    changeInnerCheckOff: {},
    keydownInner: {},
    clickInnerPanel: {}
});
export const PatternsReactiveDefinition = Machine.make({
    id: "PatternsReactive",
    root: PatternsReactiveStates,
    events: PatternsReactiveEvents
});
export type PatternsReactiveEvent = Machine.EventOf<typeof PatternsReactiveEvents>;
