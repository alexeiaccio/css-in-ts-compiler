// GENERATED FILE — DO NOT EDIT.
// Generated from: ../../specs/apg/treegrid.qnt
// Spec hash (sha256): ed6717f75f84f6257024728783c51f58f5096186002f0a3833b9d2c40c135053
// Regenerate with: npm run generate:model
import { Machine } from "@typeonce/effect-machine";
import { Schema } from "effect";
export const ApgTreegridFields = {
    navModel: Schema.String,
    selMode: Schema.String,
    exp0: Schema.Boolean,
    exp2: Schema.Boolean,
    exp4: Schema.Boolean,
    inGrid: Schema.Boolean,
    kind: Schema.String,
    frow: Schema.BigInt,
    fcol: Schema.BigInt,
    selMask: Schema.BigInt,
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
export const ApgTreegridStates = Machine.state({
    fields: ApgTreegridFields
});
export const ApgTreegridEvents = Machine.events({
    init: {},
    configureNav: {
        nav: Schema.String
    },
    configureSel: {
        sel: Schema.String
    },
    focusIn: {},
    blur: {},
    right: {},
    left: {},
    down: {},
    up: {},
    home: {},
    end: {},
    ctrlHome: {},
    ctrlEnd: {},
    enter: {},
    toggleRow: {
        r: Schema.BigInt
    },
    clickCell: {
        cell: Schema.BigInt
    },
    toggleSelect: {},
    selectAll: {},
    extendDown: {},
    extendUp: {},
    setValue: {
        v: Schema.BigInt
    },
    hostToggle: {
        r: Schema.BigInt
    },
    control: {},
    acceptRequests: {}
});
export const ApgTreegridDefinition = Machine.make({
    id: "ApgTreegrid",
    root: ApgTreegridStates,
    events: ApgTreegridEvents
});
export type ApgTreegridEvent = Machine.EventOf<typeof ApgTreegridEvents>;
