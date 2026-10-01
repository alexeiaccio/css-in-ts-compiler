import { padding, firstThatWorks } from "cssints" with { type: "cssints" };

export const a = padding(firstThatWorks("1px", "2px"), firstThatWorks("3px", "4px"));
