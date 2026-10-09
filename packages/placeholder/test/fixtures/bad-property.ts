import { color } from "cssints" with { type: "cssints" };
import { placeholder } from "@cssints/placeholder" with { type: "cssints" };

// an image is not a colour
export const a = color(placeholder("test/fixtures/img/split.png"));
