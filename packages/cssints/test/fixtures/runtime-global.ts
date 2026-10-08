import { p } from "cssints" with { type: "cssints" };

export const Box = (open: () => boolean) => p(open() ? 4 : 8);
