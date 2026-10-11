import type { Style } from "cssints/plugin";

import { reset } from "../../src/index.ts";
// only the Baseline groups of cssints are variants
// @ts-expect-error a spec group is not a variant
import { reset as grid } from "@cssints/reset/css-grid-2";
// @ts-expect-error not-discouraged would be the full reset
import { reset as discouraged } from "@cssints/reset/not-discouraged";
// @ts-expect-error no such group
import { reset as unknown } from "@cssints/reset/widely";
// @ts-expect-error a year cssints has no data for
import { reset as year } from "@cssints/reset/baseline-2014";
import { reset as down } from "@cssints/reset/baseline-2022/with-downstream";
import { reset as limited } from "@cssints/reset/limited-availability";
import { reset as widely } from "@cssints/reset/widely-available";

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

// a variant is the same call
export const v1: Style = widely({ media: true, prose: true });
export const v2: Style = down();
export const v3: Style = limited({ prose: true });
// @ts-expect-error a variant takes the same flags
export const e4 = widely({ fonts: true });

export { discouraged, grid, unknown, year };
