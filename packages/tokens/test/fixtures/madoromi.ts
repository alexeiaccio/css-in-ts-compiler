import { bg, borderColor, cn, color } from "cssints" with { type: "cssints" };

import { t } from "./madoromi-tokens.ts";

export const page = cn(
  bg(t.madoromi.kami),
  color(t.madoromi.roles.text),
  borderColor(t.madoromi.ansi.blue),
);
