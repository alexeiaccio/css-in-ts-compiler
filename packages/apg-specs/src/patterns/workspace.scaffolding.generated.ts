// GENERATED FILE — DO NOT EDIT.
// Generated from: ../../specs/patterns/workspace.qnt
// Spec hash (sha256): 36b247658710a29293b4a5a14a08f43a7d308515beb53db9b46b299e21934061
// Regenerate with: npm run generate:model
import { Machine } from "@typeonce/effect-machine";
import { Schema } from "effect";
export const PatternsWorkspaceFields = {
    where0: Schema.BigInt,
    where1: Schema.BigInt,
    where2: Schema.BigInt,
    where3: Schema.BigInt,
    active0: Schema.BigInt,
    active1: Schema.BigInt,
    activeF: Schema.BigInt,
    activeE: Schema.BigInt,
    exists0: Schema.Boolean,
    exists1: Schema.Boolean,
    floatOn: Schema.Boolean,
    side: Schema.String,
    collapsed0: Schema.Boolean,
    collapsed1: Schema.Boolean,
    keepEmpty: Schema.Boolean,
    drag: Schema.BigInt,
    target: Schema.String,
    reason: Schema.String,
    copies: Schema.BigInt,
    bW0: Schema.BigInt,
    bW1: Schema.BigInt,
    bW2: Schema.BigInt,
    bW3: Schema.BigInt
};
export const PatternsWorkspaceStates = Machine.state({
    fields: PatternsWorkspaceFields
});
export const PatternsWorkspaceEvents = Machine.events({
    init: {},
    keepOn: {},
    pick0: {},
    pick1: {},
    pick2: {},
    pick3: {},
    cancel: {},
    dropTab0: {},
    dropTab1: {},
    dropTabF: {},
    dropEdgeLeft: {},
    dropEdgeRight: {},
    dropEdgeTop: {},
    dropEdgeBottom: {},
    dropFloat: {},
    dockFloat: {},
    copyTab: {},
    closeTab: {},
    transferOut: {},
    attach: {},
    collapse0: {},
    collapse1: {}
});
export const PatternsWorkspaceDefinition = Machine.make({
    id: "PatternsWorkspace",
    root: PatternsWorkspaceStates,
    events: PatternsWorkspaceEvents
});
export type PatternsWorkspaceEvent = Machine.EventOf<typeof PatternsWorkspaceEvents>;
