import { meshGradient } from "../../src/index.ts" with { type: "cssints" };

export const a = meshGradient("red 0% 0%, blue; green, yellow");
