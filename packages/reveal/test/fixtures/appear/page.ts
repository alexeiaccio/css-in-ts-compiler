import { appear } from "@cssints/reveal" with { type: "cssints" };

// 1000px of page above the box: the default activation range is `entry 100% exit 0%`, so in an 800x600 viewport the box
// (1000..1100px) is fully in from scrollY 500; the animation plays over its own 400ms.
export const box = appear().preset("fade-in").duration("400ms").easing("linear");
