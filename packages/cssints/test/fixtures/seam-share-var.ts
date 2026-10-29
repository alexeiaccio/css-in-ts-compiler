import { cn } from "cssints" with { type: "cssints" };

import { guest, tenant } from "./seam-kit" with { type: "cssints" };

export const a = cn(tenant().width("2px"), guest().width("1px"));
