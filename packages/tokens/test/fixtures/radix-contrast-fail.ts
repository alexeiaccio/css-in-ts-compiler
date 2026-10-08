import { check } from "cssints" with { type: "cssints" };

import { t } from "./radix-tokens.ts";

check.contrast(t.radix.orange._11, t.radix.orange._2, { min: 4.5 });
