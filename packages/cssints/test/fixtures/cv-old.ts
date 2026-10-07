import { _cv } from "cssints";
import { cv, p } from "cssints" with { type: "cssints" };

// the old way: _cv is gone, cv() is the function
export const button = _cv(cv({ base: p(2) }));
