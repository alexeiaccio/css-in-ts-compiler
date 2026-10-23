// GENERATED FILE — DO NOT EDIT.
// Generated from: ../../specs/apg/treeview.qnt
// Spec hash (sha256): 08df566eb0fcb09ac3e11c9207978c5dd57e8a3d183850b79cf8ae8087884944
// Regenerate with: npm run generate:model
import { Machine } from "@typeonce/effect-machine";
import { Schema } from "effect";
export const ApgTreeviewFields = {
    multi: Schema.Boolean,
    expanded: Schema.BigInt,
    selected: Schema.BigInt,
    focus: Schema.BigInt,
    hasFocus: Schema.Boolean,
    ta1: Schema.String,
    ta2: Schema.String,
    activated: Schema.BigInt,
    controlled: Schema.Boolean,
    accepting: Schema.Boolean,
    valueProp0: Schema.Boolean,
    valueProp1: Schema.Boolean,
    valueProp2: Schema.Boolean,
    valueProp3: Schema.Boolean,
    valueProp4: Schema.Boolean,
    valueProp5: Schema.Boolean,
    valueProp6: Schema.Boolean,
    requested: Schema.BigInt,
    outcome: Schema.String,
    base: Schema.BigInt,
    requests: Schema.BigInt
};
export const ApgTreeviewStates = Machine.state({
    fields: ApgTreeviewFields
});
export const ApgTreeviewEvents = Machine.events({
    init: {},
    configure: {
        m: Schema.Boolean
    },
    focusTree: {},
    blurTree: {},
    pressDown: {},
    pressUp: {},
    pressRight: {},
    pressLeft: {},
    pressHome: {},
    pressEnd: {},
    pressEnter: {},
    pressSpace: {},
    pressStar: {},
    typeChar: {
        ch: Schema.String
    },
    typeaheadReset: {},
    pressShiftDown: {},
    pressShiftUp: {},
    pressCtrlA: {},
    click: {
        node: Schema.BigInt
    },
    setValue: {
        v: Schema.BigInt
    },
    hostToggle: {
        n: Schema.BigInt
    },
    control: {},
    acceptRequests: {}
});
export const ApgTreeviewDefinition = Machine.make({
    id: "ApgTreeview",
    root: ApgTreeviewStates,
    events: ApgTreeviewEvents
});
export type ApgTreeviewEvent = Machine.EventOf<typeof ApgTreeviewEvents>;
