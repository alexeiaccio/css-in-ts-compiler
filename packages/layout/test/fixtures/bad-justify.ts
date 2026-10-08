import { cluster } from "@cssints/layout" with { type: "cssints" };

// @ts-expect-error the build checks it too
export const a = cluster().justify("between");
