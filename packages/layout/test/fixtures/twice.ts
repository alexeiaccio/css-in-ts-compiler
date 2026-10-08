import { stack } from "@cssints/layout" with { type: "cssints" };

// @ts-expect-error the build checks it too
export const a = stack().gap(1).gap(2);
