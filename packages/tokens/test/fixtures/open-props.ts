import {
  boxShadow,
  cn,
  color,
  fontSize,
  letterSpacing,
  p,
  transitionTimingFunction,
} from "cssints" with { type: "cssints" };

import { t } from "./open-props-tokens.ts";

export const card = cn(
  p(t.size._3),
  color(t.blue._7),
  fontSize(t.text._2),
  letterSpacing(t.tracking._1),
  boxShadow(t.shadow.shadow2),
  transitionTimingFunction(t.ease.easeOut3),
);
