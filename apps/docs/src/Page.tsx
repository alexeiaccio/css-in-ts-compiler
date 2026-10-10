import type { Style } from "cssints";
import * as css from "cssints" with { type: "cssints" };
import { frame } from "cssints/frame" with { type: "cssints" };
import { surface } from "cssints/surface" with { type: "cssints" };
import { useLocation } from "@solidjs/router";
import {
  createEffect,
  createMemo,
  createSignal,
  For,
  Loading,
  onSettled,
  Show,
  useContext,
} from "solid-js";

import { DocsContext, type Meta, url } from "./docs.ts";
import { gtOutline, gtSidebar } from "./layout.ts" with { type: "cssints" };
import { t } from "./theme.ts" with { type: "cssints" };

const main: Style = css.cn(
  css.minWidth("0"),
  css.width("100%"),
  css.maxWidth(t.layout.contentWidth),
  css.marginInline("auto"),
  css.padding(t.space.xl, t.space.lg, t.space._3xl),
  gtSidebar(css.padding(t.space._2xl, t.space.xl, t.space._3xl)),
);
const meta = css.cn(
  css.margin("0"),
  css.marginBottom(t.space.sm),
  css.fontSize(t.fontSize.xs),
  css.color(t.color.textLow),
);
const title = css.cn(
  css.margin("0"),
  css.marginBottom(t.space.xl),
  css.fontSize(t.fontSize._2xl),
  css.fontWeight(t.fontWeight.bold),
  css.lineHeight(t.lineHeight.tight),
  css.letterSpacing("-0.01em"),
  gtSidebar(css.fontSize(t.fontSize._3xl)),
);

// Two cards of one look: a frame (its radius is concentric with whatever it sits in) on a surface a step off the page.
const card = css.cn(
  frame().radius(t.radius.lg).padding(4).border(t.border.width),
  surface().color(t.color.bgSubtle),
  css.borderColor(t.color.border),
  css.display("block"),
  css.textDecoration("none"),
  css.color(t.color.text),
  css.transition("border-color 0.15s"),
  css.hover(css.borderColor(t.color.accent), surface().contrast(0.03)),
  css.focusVisible(css.outline("2px solid", t.color.accent), css.outlineOffset("2px")),
);
const cardLabel = css.cn(
  css.display("block"),
  css.fontSize(t.fontSize.xs),
  css.color(t.color.textLow),
);
const cardTitle = css.cn(css.display("block"), css.fontWeight(t.fontWeight.semiBold));
const cardText = css.cn(
  css.display("block"),
  css.marginTop(t.space.xs),
  css.fontSize(t.fontSize.sm),
  css.color(t.color.textMedium),
);
const start = css.cn(
  css.grid().templateColumns("repeat(auto-fit, minmax(200px, 1fr))").gap(3),
  css.marginBottom(t.space._2xl),
);
const pager = css.cn(
  css.grid().templateColumns("repeat(2, minmax(0, 1fr))").gap(3),
  css.marginTop(t.space._3xl),
);
const next = css.cn(css.gridColumn("2"), css.textAlign("right"));

const aside = css.cn(
  css.display("none"),
  gtOutline(
    css.display("block"),
    css.position("sticky"),
    css.top(t.layout.headerHeight),
    css.alignSelf("start"),
    css.maxHeight("calc(100dvh - var(--layout-header-height))"),
    css.overflowY("auto"),
    css.padding(t.space._2xl, t.space.lg),
  ),
);
const asideTitle = css.cn(
  css.margin("0"),
  css.marginBottom(t.space.sm),
  css.fontSize(t.fontSize.xs),
  css.fontWeight(t.fontWeight.semiBold),
  css.textTransform("uppercase"),
  css.letterSpacing("0.06em"),
  css.color(t.color.textLow),
);
const outlineList = css.cn(
  css.listStyle("none"),
  css.margin("0"),
  css.padding("0"),
  css.borderLeft(t.border.width, "solid", t.color.border),
);
const outlineLink = css.cv({
  base: css.cn(
    css.display("block"),
    css.padding(t.space.xs, t.space.md),
    css.marginLeft("-1px"),
    css.borderLeft("1px solid transparent"),
    css.fontSize(t.fontSize.xs),
    css.lineHeight(t.lineHeight.snug),
    css.color(t.color.textMedium),
    css.textDecoration("none"),
    css.hover(css.color(t.color.text)),
    css.attr(
      "aria-current",
      "location",
    )(css.cn(css.color(t.color.accentStrong), css.borderLeftColor(t.color.accent))),
  ),
  variants: {
    heading: { true: css.cn(css.fontWeight(t.fontWeight.medium), css.color(t.color.text)) },
  },
});

// The first sentences of Start here: the slugs are pages of this site (test/browser.mjs follows every link).
const START = [
  ["install", "Install", "The Vite plugin, the stylesheet import, the frameworks."],
  ["authoring-surface", "Write styles", "Names, values, numbers, flex() and grid() chains."],
  ["tokens", "Tokens and themes", "Typed design tokens, themes, contrast checks."],
] as const;

// The built pages carry their article as static html beside the hidden root (plugin/docs.ts): once the app has a page to show,
// the static copy goes and the root appears in the same task.
export const reveal = () => {
  document.getElementById("prerender")?.remove();
  document.getElementById("root")!.hidden = false;
};

function Article(props: { html: string }) {
  const location = useLocation();
  createEffect(
    () => [props.html, location.hash] as const,
    ([, hash]) => {
      reveal();
      if (hash) document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView();
    },
  );
  return <div class="prose" innerHTML={props.html} />;
}

function Outline(props: { entries: Meta["entries"] }) {
  const [current, setCurrent] = createSignal("");
  onSettled(() => {
    // the last heading or term that has reached the top of the window
    const update = () => {
      let id = "";
      for (const e of props.entries) {
        const el = document.getElementById(e.id);
        if (!el) continue;
        if (el.getBoundingClientRect().top > 96) break;
        id = e.id;
      }
      setCurrent(id);
    };
    window.addEventListener("scroll", update, { passive: true });
    update();
    return () => window.removeEventListener("scroll", update);
  });
  return (
    <ul class={outlineList}>
      <For each={props.entries}>
        {(e) => (
          <li>
            <a
              href={`#${e.id}`}
              class={outlineLink({ heading: e.depth < 5 })}
              // the router owns aria-current="page" and data-active on links to the open page; an authored value is left alone
              aria-current={current() === e.id ? "location" : "false"}
            >
              {e.text}
            </a>
          </li>
        )}
      </For>
    </ul>
  );
}

function Doc(props: { page: Meta }) {
  const { pages, html } = useContext(DocsContext);
  const content = createMemo(() => html[props.page.slug]?.().then((m) => m.default));
  const at = () => pages.indexOf(props.page);
  return (
    <>
      <main class={main}>
        <Show when={props.page.meta}>
          <p class={meta}>{props.page.meta}</p>
        </Show>
        <h1 class={title} innerHTML={props.page.titleHtml} />
        <Show when={props.page.slug === "overview"}>
          <nav class={start} aria-label="Start here">
            <For each={START}>
              {([slug, name, text]) => (
                <a href={url(slug)} class={card}>
                  <span class={cardTitle}>{name}</span>
                  <span class={cardText}>{text}</span>
                </a>
              )}
            </For>
          </nav>
        </Show>
        <Loading fallback={<p class={meta}>Loading…</p>}>
          <Article html={content() ?? ""} />
        </Loading>
        <nav class={pager} aria-label="Pages">
          <Show when={pages[at() - 1]}>
            {(prev) => (
              <a href={url(prev().slug)} class={card}>
                <span class={cardLabel}>Previous</span>
                <span class={cardTitle}>{prev().title}</span>
              </a>
            )}
          </Show>
          <Show when={pages[at() + 1]}>
            {(following) => (
              <a href={url(following().slug)} class={css.cn(card, next)}>
                <span class={cardLabel}>Next</span>
                <span class={cardTitle}>{following().title}</span>
              </a>
            )}
          </Show>
        </nav>
      </main>
      <aside class={aside} aria-label="On this page">
        <Show when={props.page.entries.length > 0}>
          <h2 class={asideTitle}>On this page</h2>
          <Outline entries={props.page.entries} />
        </Show>
      </aside>
    </>
  );
}

function NotFound() {
  onSettled(reveal);
  return (
    <main class={main}>
      <h1 class={title}>Page not found</h1>
      <a href={url("")} class={card}>
        <span class={cardTitle}>Back to the home page</span>
      </a>
    </main>
  );
}

export default function Page(props: { slug: string }) {
  const { pages } = useContext(DocsContext);
  const page = createMemo(() => pages.find((p) => p.slug === props.slug));
  createEffect(
    () => (page() ? `${page()!.title} · cssints` : "Not found · cssints"),
    (name) => {
      document.title = name;
    },
  );
  return (
    <Show when={page()} fallback={<NotFound />}>
      {(found) => <Doc page={found()} />}
    </Show>
  );
}
