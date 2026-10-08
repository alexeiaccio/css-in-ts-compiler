import { p } from "cssints" with { type: "cssints" };

export function Box(items: string[]) {
  for (const name of items) return p(name.length > 2 ? 4 : 8);
}
