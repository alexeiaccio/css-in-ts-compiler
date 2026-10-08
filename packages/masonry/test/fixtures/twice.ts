import { masonry } from "@cssints/masonry" with { type: "cssints" };

// @ts-expect-error a method is used once
export const a = masonry().gap(1).gap(2);
