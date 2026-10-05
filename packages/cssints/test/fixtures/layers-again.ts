import { layers } from "cssints" with { type: "cssints" };

// the same names in the same order, from another module: the sheet prints the statement once
layers("app", "author", "viewer");
