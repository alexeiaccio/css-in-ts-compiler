import { motion } from "@cssints/motion" with { type: "cssints" };

import { appear, reveal } from "@cssints/reveal" with { type: "cssints" };

// motion's kernel and this package's both declare motion's custom properties: they are motion's names, so the scopes
// share them (one element still cannot hold two of these styles: each sets the animation).
export const m = motion().preset("fade-in");
export const r = reveal();
export const a = appear();
