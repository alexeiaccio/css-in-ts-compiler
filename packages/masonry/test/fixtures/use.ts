import { cn, media, p, token } from "cssints" with { type: "cssints" };
import { masonry } from "@cssints/masonry" with { type: "cssints" };

const space = token.length("24px", "space-md");

export const plain = masonry();
export const wall = cn(masonry().columns("12rem").gap(4), p(2));
export const tokens = masonry().gap(space);
export const wide = media("(width >= 40rem)")(masonry().columns("20rem"));
