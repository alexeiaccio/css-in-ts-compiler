import { reset } from "@cssints/reset" with { type: "cssints" };
import { bg, borderRadius, cn, color, flex, p } from "cssints" with { type: "cssints" };

import { t } from "./tokens.ts" with { type: "cssints" };

reset();

const panel = cn(
  bg(t.color.bg),
  color(t.color.fg),
  p(4),
  borderRadius("12px"),
  flex().direction("column").gap(2),
);

export default function App() {
  return (
    <div className={cn(flex().direction("column").gap(3), p(4), bg("#e5e7eb"))}>
      <section className={panel}>default look</section>
      <section className={panel} data-mode="dark">
        data-mode="dark": the app's look, and the viewer's on top of it
      </section>
      <article className={cn(panel, "post")} data-mode="hero">
        data-mode="hero" inside article.post: the author's look, confined to the article
      </article>
      <section className={panel} data-mode="hero">
        data-mode="hero" outside the article: no look
      </section>
    </div>
  );
}
