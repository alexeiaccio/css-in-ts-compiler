import { createEffect, createMemo, Loading, useContext } from "solid-js";

import { DocsContext } from "./docs.ts";
import { reveal } from "./Page.tsx";

// The home page: html made at build time (plugin/landing.ts, src/landing/page.ts). Its static copy is in the document, so the swap to
// the app's own root happens once the chunk is in. The shader behind the hero (src/landing/shader.ts) is client only and lazy.
function Content(props: { html: string }) {
  let main: HTMLElement | undefined;
  createEffect(
    () => props.html,
    () => {
      document.title = "cssints";
      reveal();
      const hero = main?.querySelector<HTMLElement>("[data-hero]");
      if (!hero) return;
      const shader = import("./landing/shader.ts").then((m) => m.mount(hero));
      return () => void shader.then((stop) => stop());
    },
  );
  return (
    <main
      ref={(el) => {
        main = el;
      }}
      innerHTML={props.html}
    />
  );
}

export default function Landing() {
  const { landing } = useContext(DocsContext);
  const html = createMemo(() => landing().then((m) => m.default));
  return (
    <Loading fallback={<main />}>
      <Content html={html() ?? ""} />
    </Loading>
  );
}
