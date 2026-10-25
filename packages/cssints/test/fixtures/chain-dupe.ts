import { sx } from "cssints" with { type: "cssints" };

// The types reject a second value of a property; at build time the later one wins, as in cn().
export const a = sx().p(4).p(2).bg("red");
