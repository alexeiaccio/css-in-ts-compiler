import * as css from "cssints" with { type: "cssints" };

import "./eval-timeout-wait.ts";
import { late } from "./eval-timeout-late.ts";

export const slow = css.cn(css.color(late));
