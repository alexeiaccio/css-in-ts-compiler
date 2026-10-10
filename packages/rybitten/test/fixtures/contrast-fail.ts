import { check } from "cssints" with { type: "cssints" };

import { t } from "./tokens.ts";

// a hue of the wheel on the paper is not made for a ratio
check.contrast(t.hue._1, t.paper._1, { min: 7 });
