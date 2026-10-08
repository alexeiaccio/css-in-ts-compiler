import { animationDuration, cn } from "cssints" with { type: "cssints" };
import { motion } from "@cssints/motion" with { type: "cssints" };

export const a = cn(motion().preset("fade-in"), animationDuration("1s"));
