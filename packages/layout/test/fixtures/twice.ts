/* oxlint-disable typescript/no-unsafe-assignment, typescript/no-unsafe-call -- a call the types reject, for the build's error */
import { stack } from "@cssints/layout" with { type: "cssints" };

// @ts-expect-error the build checks it too
export const a = stack().gap(1).gap(2);
