import { motion } from "@cssints/motion" with { type: "cssints" };

// @ts-expect-error no such preset
export const a = motion().preset("spin");
