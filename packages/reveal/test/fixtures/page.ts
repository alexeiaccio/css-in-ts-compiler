import { reveal } from "@cssints/reveal" with { type: "cssints" };

// 1000px of page above the box: in an 800x600 viewport it enters between scrollY 400 and 500
export const box = reveal().range("entry 0% entry 100%").duration("200ms").easing("linear");
