import type { Style } from "cssints/plugin";

import { reset } from "../../src/index.ts";

export const base: Style = reset();
export const empty = reset({});
export const all = reset({ media: true, prose: true });
export const some = reset({ prose: false });

// @ts-expect-error a flag is a boolean
export const e1 = reset({ media: "yes" });
// @ts-expect-error no such flag
export const e2 = reset({ fonts: true });
// @ts-expect-error flags are an object
export const e3 = reset(true);
