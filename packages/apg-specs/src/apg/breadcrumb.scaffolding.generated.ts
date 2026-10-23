// GENERATED FILE — DO NOT EDIT.
// Generated from: ../../specs/apg/breadcrumb.qnt
// Spec hash (sha256): 0725349bd6d8924054ee7fbda32974408db3fe7b71b1fc680218240e25868ea0
// Regenerate with: npm run generate:model
import { Machine } from "@typeonce/effect-machine";
import { Schema } from "effect";
export const ApgBreadcrumbFields = {
    depth: Schema.BigInt,
    currentIsLink: Schema.Boolean,
    currentIndex: Schema.BigInt,
    navigations: Schema.BigInt
};
export const ApgBreadcrumbStates = Machine.state({
    fields: ApgBreadcrumbFields
});
export const ApgBreadcrumbEvents = Machine.events({
    init: {},
    descend: {},
    ancestor: {
        target: Schema.BigInt
    },
    renderLink: {},
    renderText: {},
    toggleMark: {}
});
export const ApgBreadcrumbDefinition = Machine.make({
    id: "ApgBreadcrumb",
    root: ApgBreadcrumbStates,
    events: ApgBreadcrumbEvents
});
export type ApgBreadcrumbEvent = Machine.EventOf<typeof ApgBreadcrumbEvents>;
