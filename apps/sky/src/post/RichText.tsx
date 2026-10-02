import type { Facet } from "@atcute/bluesky-richtext-segmenter";
import {
  cn,
  color,
  hover,
  lineHeight,
  margin,
  overflowWrap,
  textDecoration,
  whiteSpace,
} from "cssints" with { type: "cssints" };
import { For } from "solid-js";

import { t } from "../theme.ts" with { type: "cssints" };
import { parts } from "./model.ts";
import type { Feature } from "./model.ts";

const text = cn(
  margin("0"),
  whiteSpace("pre-wrap"),
  overflowWrap("anywhere"),
  lineHeight(t.lineHeight.snug),
);
const link = cn(color(t.color.link), textDecoration("none"), hover(textDecoration("underline")));

// Text with its facets: a link goes to feature.uri (http and https only), a mention to the profile route.
export function RichText(props: { text: string; facets?: Facet<Feature>[] }) {
  return (
    <p class={text}>
      <For each={parts(props.text, props.facets)}>
        {(p) =>
          p.link ? (
            <a class={link} href={p.link} target="_blank" rel="noopener noreferrer nofollow">
              {p.text}
            </a>
          ) : p.mention ? (
            <a class={link} href={`/profile/${p.mention}`}>
              {p.text}
            </a>
          ) : p.tag ? (
            <span class={link}>{p.text}</span>
          ) : (
            p.text
          )
        }
      </For>
    </p>
  );
}
