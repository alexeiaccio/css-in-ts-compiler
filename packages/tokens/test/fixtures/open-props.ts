import {
  boxShadow,
  cn,
  color,
  p,
  transitionTimingFunction,
} from "cssints" with { type: "cssints" };
import { easings, shadows } from "@cssints/tokens/open-props";

import { t } from "./open-props-tokens.ts";

export const card = cn(
  p(t.size._3),
  color(t.blue._7),
  boxShadow(shadows.shadow2),
  transitionTimingFunction(easings.easeOut3),
);
