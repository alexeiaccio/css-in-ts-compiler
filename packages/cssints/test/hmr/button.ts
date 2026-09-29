import { css } from "cssints";

import { space } from "./tokens";

// Same padding rule as card.ts: the cross-file duplicate for risk 3.
const pad = css.p(space.md);
const center = css.items("center");

export const button = css.flex(center, pad);
