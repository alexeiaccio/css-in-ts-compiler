import { bg, borderRadius, cn, color, flex, p } from "cssints" with { type: "cssints" };

import { ring } from "./ring.ts" with { type: "cssints" };

// The plugin is imported with the attribute, like cssints: no registration, no type augmentation. Its members return class strings.
const field = cn(
  p(2),
  bg("white"),
  color("#0f172a"),
  borderRadius("8px"),
  ring().width("thin").color("#2563eb"),
);
const strong = cn(
  p(2),
  bg("white"),
  color("#0f172a"),
  borderRadius("8px"),
  ring().width(1).color("#dc2626"),
);
export default function App() {
  return (
    <div className={cn(flex().direction("column").gap(4), p(4), bg("#f1f5f9"))}>
      <input className={field} defaultValue="thin blue ring" />
      <input className={strong} defaultValue="1 step red ring" />
    </div>
  );
}
