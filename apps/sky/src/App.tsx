import { _cv } from "cssints";
import {
  bg,
  cn,
  color,
  container,
  cv,
  flex,
  fontWeight,
  p,
} from "cssints" with { type: "cssints" };
import * as css from "cssints" with { type: "cssints" };
import { frame } from "cssints/frame" with { type: "cssints" };
import { createSignal } from "solid-js";

import { mdi } from "./icons.ts" with { type: "cssints" };
import { t } from "./theme.ts" with { type: "cssints" };

const narrow = container("card (width < 24rem)");

const page = cn(css.padding(t.space.md), bg(t.color.page), color(t.color.text));
const box = cn(css.containerType("inline-size"), css.containerName("card"));
const card = cn(
  frame().radius("1.5rem").padding(4).border("1px"),
  bg(t.color.surface),
  css.borderColor("#9ca3af"),
);
const field = cn(
  frame().padding(2).border("1px"),
  flex().alignItems("center").gap(2),
  css.borderColor("#9ca3af"),
  narrow(css.flexDirection("column")),
);
const badge = _cv(
  cv({
    base: cn(fontWeight("600"), css.borderRadius("999px"), p(2)),
    variants: {
      tone: {
        info: cn(bg("#dbeafe"), color("#1e3a8a")),
        danger: cn(bg("#fee2e2"), color("#7f1d1d")),
      },
    },
    defaultVariants: { tone: "info" },
  }),
);

export default function App() {
  const [tone, setTone] = createSignal<"info" | "danger">("info");
  return (
    <main class={page}>
      <div class={box}>
        <div class={card}>
          <div class={[field, tone() === "danger" && p(1), { compact: tone() === "danger" }]}>
            <span class={[mdi("heart"), color(t.color.accent)]} />
            <button
              class={badge({ tone: tone() })}
              onClick={() => setTone(tone() === "info" ? "danger" : "info")}
            >
              {tone()}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
