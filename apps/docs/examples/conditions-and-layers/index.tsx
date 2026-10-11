import { reset } from "@cssints/reset" with { type: "cssints" };
import * as css from "cssints" with { type: "cssints" };

import { dark, hasGrid, narrow, tablet, wide } from "./conditions.ts" with { type: "cssints" };

reset();

// The shelf is a container: its cards react to its width. The preview's width decides the media queries.
const shelf = css.cn(css.containerType("inline-size"), css.containerName("shelf"), css.p(3));
const cards = css.cn(
  css.flex().direction("column").gap(3),
  hasGrid(css.grid().templateColumns("1fr").gap(3)),
  tablet(css.grid().templateColumns("1fr 1fr")),
  wide(css.grid().templateColumns("repeat(3, 1fr)")),
);
const card = css.cn(
  css.p(4),
  css.bg("#f1f5f9"),
  css.color("#0f172a"),
  css.borderRadius("12px"),
  css.hover(css.bg("#e2e8f0")),
  tablet(css.hover(css.bg("#cbd5e1"))),
  dark(css.bg("#1e293b"), css.color("#e2e8f0")),
  narrow(css.fontSize("0.875rem")),
);

export default function App() {
  return (
    <div className={shelf}>
      <div className={cards}>
        {["Pins", "Cables", "Plugs", "Fuses", "Relays", "Switches"].map((name) => (
          <div className={card}>{name}</div>
        ))}
      </div>
    </div>
  );
}
