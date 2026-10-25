import { sx } from "cssints" with { type: "cssints" };

// A chain is properties only: conditions and builders stay outside it.
export const bad = sx().hover("red");
