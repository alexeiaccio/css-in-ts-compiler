import { ring } from "./examples/ring.ts";
export const a: string = ring().width("2px").color("red");
export const b = ring().color("red");
// @ts-expect-error not a width
ring().width("red");
// @ts-expect-error used once
ring().width("1px").width("2px");
// @ts-expect-error no such method
ring().height("1px");
