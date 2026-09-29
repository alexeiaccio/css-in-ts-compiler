import { cx, p } from "cssints";

// p is build-time: without the attribute this is a build error.
export const a = cx(p(4));
