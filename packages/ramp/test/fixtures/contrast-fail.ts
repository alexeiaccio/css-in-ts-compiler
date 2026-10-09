import { check } from "cssints" with { type: "cssints" };

import { t } from "./tokens.ts";

// step 4 is made for 4.5, at the lowest ratio at or above it: a pair held to a little more fails
check.contrast(t.blue._4, t.bg, { min: 4.6 });
