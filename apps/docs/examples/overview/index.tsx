import {
  bg,
  borderRadius,
  cn,
  color,
  cv,
  flex,
  fontSize,
  fontWeight,
  gap,
  global,
  hover,
  margin,
  media,
  p,
} from "cssints" with { type: "cssints" };

import { t } from "./theme.ts" with { type: "cssints" };

// What cssints is, in one screen: calls that look like CSS, checked against the spec, compiled to atomic classes.
global("body", bg(t.color.bg), color(t.color.text), margin("0"));

const wide = media("(width >= 36rem)");

const card = cn(
  flex().direction("column").gap(t.space.sm),
  p(4),
  bg(t.color.card),
  borderRadius(t.radius.md),
  wide(p(6)),
);
const title = cn(fontSize("1.25rem"), fontWeight(700), margin("0"));
const note = cn(color(t.color.muted), margin("0"));
const button = cv({
  base: cn(
    p(2),
    borderRadius(t.radius.md),
    bg(t.color.accent),
    color(t.color.onAccent),
    hover(bg(t.color.text)),
  ),
  variants: { tone: { quiet: cn(bg("transparent"), color(t.color.accent)) } },
});

export default function App() {
  return (
    <main className={cn(flex().direction("column"), gap(4), p(4))}>
      <section className={card}>
        <h1 className={title}>Atomic classes, typed values</h1>
        <p className={note}>
          Resize the preview: the padding changes at 36rem. Switch the site to dark: the theme
          follows the system colour scheme.
        </p>
        <div className={flex().gap(2)}>
          <button className={button()}>Save</button>
          <button className={button({ tone: "quiet" })}>Cancel</button>
        </div>
      </section>
    </main>
  );
}
