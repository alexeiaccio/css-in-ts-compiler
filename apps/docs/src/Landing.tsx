import { createEffect, createMemo, Loading, useContext } from "solid-js";

import { DocsContext } from "./docs.ts";
import { reveal } from "./Page.tsx";

// The home page: html made at build time (plugin/landing.ts, src/landing/page.ts). Its static copy is in the document, so the swap to
// the app's own root happens once the chunk is in.
function Content(props: { html: string }) {
  createEffect(
    () => props.html,
    () => {
      document.title = "cssints";
      reveal();
    },
  );
  return <main innerHTML={props.html} />;
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
