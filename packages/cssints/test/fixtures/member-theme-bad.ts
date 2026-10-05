import { modes } from "./member-theme-kit.ts" with { type: "cssints" };
import { t } from "./member-theme-defs.ts" with { type: "cssints" };

export const a = modes("dark", t, { mem: { bg: "blu" } });
