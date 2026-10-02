import { segmentize } from "@atcute/bluesky-richtext-segmenter";
import type { Facet } from "@atcute/bluesky-richtext-segmenter";
import * as css from "cssints" with { type: "cssints" };
import { For, Match, Switch } from "solid-js";

import { t } from "../theme.ts" with { type: "cssints" };
import { safeHref } from "./model.ts";
import type { Feature } from "./model.ts";

const text = css.cn(
  css.margin("0"),
  css.whiteSpace("pre-wrap"),
  css.overflowWrap("anywhere"),
  css.lineHeight(t.lineHeight.snug),
);
const link = css.cn(
  css.color(t.color.link),
  css.textDecoration("none"),
  css.hover(css.textDecoration("underline")),
);

// Text with its facets. The offsets are UTF-8 bytes, which segmentize handles; a link goes to feature.uri, never to the
// visible text (often shortened), and only http(s). Tags have no search without a login, so they are only coloured.
export function RichText(props: { text: string; facets?: Facet<Feature>[] }) {
  return (
    <p class={text}>
      <For each={segmentize(props.text, props.facets)}>
        {(seg) => {
          const f = seg.features?.[0];
          return (
            <Switch fallback={seg.text}>
              <Match when={f?.$type === "app.bsky.richtext.facet#link" && safeHref(f.uri ?? "")}>
                {(href) => (
                  <a class={link} href={href()} target="_blank" rel="noopener noreferrer nofollow">
                    {seg.text}
                  </a>
                )}
              </Match>
              <Match when={f?.$type === "app.bsky.richtext.facet#mention" && f.did}>
                {(did) => (
                  <a class={link} href={`/profile/${did()}`}>
                    {seg.text}
                  </a>
                )}
              </Match>
              <Match when={f?.$type === "app.bsky.richtext.facet#tag"}>
                <span class={link}>{seg.text}</span>
              </Match>
            </Switch>
          );
        }}
      </For>
    </p>
  );
}
