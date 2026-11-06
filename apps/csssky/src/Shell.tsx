import type { Style } from "cssints";
import * as css from "cssints" with { type: "cssints" };
import { frame } from "cssints/frame" with { type: "cssints" };
import { useBeforeLeave, useLocation } from "@solidjs/router";
import { createEffect, createSignal, For, onCleanup, Show } from "solid-js";
import type { JSX } from "@solidjs/web";

import { ph } from "./icons.ts" with { type: "cssints" };
import { railQuery } from "./breakpoints.ts";
import { gtMobile, gtPhone, gtRail, gtTablet, narrow } from "./layout.ts" with { type: "cssints" };
import Home from "./screens/Home.tsx";
import { t } from "./theme.ts" with { type: "cssints" };

// Mu's shell: below 800 one column with a bottom bar; from 800 the navigation (icons) beside a 600 px column; from 1100 a
// right rail; from 1300 the navigation with labels and a wider rail. One grid, centred; the parts that do not fit are
// display: none. A thread opened from the feed does not replace the column above 1100: the thread takes the rail's place
// beside it (600 + 400), and the feed keeps its rows, its tab and its scroll.
const root = css.cn(
  css.display("grid"),
  css.gridTemplateColumns("minmax(0, 1fr)"),
  css.justifyContent("center"),
  css.minHeight("100dvh"),
  css.bg(t.color.bg),
  css.color(t.color.text),
  css.fontFamily(
    '"Inter Variable", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  ),
  css.fontSize(t.fontSize.md),
  css.lineHeight(t.lineHeight.relaxed),
  gtMobile(css.gridTemplateColumns(t.layout.leftNavMinimalWidth, t.layout.centerWidth)),
);
// The rail's column, or the thread's while a thread is open (the rail is not rendered then).
const rootNo = css.cn(
  gtRail(
    css.gridTemplateColumns(
      t.layout.leftNavMinimalWidth,
      t.layout.centerWidth,
      t.layout.rightRailNarrowWidth,
    ),
  ),
  gtTablet(
    css.gridTemplateColumns(t.layout.leftNavWidth, t.layout.centerWidth, t.layout.rightRailWidth),
  ),
);
const rootSplit = css.cn(
  gtRail(
    css.gridTemplateColumns(
      t.layout.leftNavMinimalWidth,
      css.calc(t.layout.centerWidth, "+", t.layout.threadWidth),
    ),
  ),
  gtTablet(
    css.gridTemplateColumns(
      t.layout.leftNavWidth,
      css.calc(t.layout.centerWidth, "+", t.layout.threadWidth),
    ),
  ),
);

const sticky = css.cn(css.position("sticky"), css.top(0), css.alignSelf("start"));

const nav = css.cn(
  css.display("none"),
  gtMobile(
    css.flex().direction("column").alignItems("center").gap(1),
    sticky,
    css.height("100dvh"),
    css.padding(t.space.sm),
  ),
  gtTablet(css.alignItems("stretch")),
);

const brand = css.cn(
  css.fontSize(t.fontSize._2xl),
  css.fontWeight(t.fontWeight.bold),
  css.color(t.color.accent),
  css.textDecoration("none"),
  css.padding(t.space.md),
  css.textAlign("center"),
  gtTablet(css.textAlign("start")),
);

const bar = css.cn(
  css.position("fixed"),
  css.left("0"),
  css.right("0"),
  css.bottom("0"),
  css.zIndex(10),
  css.flex().alignItems("center").justifyContent("space-around"),
  css.height("calc(52px + env(safe-area-inset-bottom))"),
  css.paddingBottom("env(safe-area-inset-bottom)"),
  css.bg(t.color.bg),
  css.borderTop(t.border.width, "solid", t.color.border),
  gtMobile(css.display("none")),
);

const navItem = css.cv({
  base: css.cn(
    css.flex().alignItems("center").gap(3),
    css.textDecoration("none"),
    css.color(t.color.textHigh),
    css.fontWeight(t.fontWeight.medium),
    css.hover(css.bg(t.color.bgMuted)),
    // the router sets aria-current="page" on the link of the page that is open
    css.attr(
      "aria-current",
      "page",
    )(css.cn(css.fontWeight(t.fontWeight.bold), css.color(t.color.text))),
  ),
  variants: {
    place: {
      side: css.cn(
        css.minHeight(t.layout.navItem),
        css.paddingInline(t.space.md),
        css.borderRadius(t.radius.button),
      ),
      bar: css.cn(
        css.flex().direction("column").justifyContent("center").gap(1),
        css.flexGrow(1),
        css.height("100%"),
        css.fontSize(t.fontSize.xs),
      ),
    },
  },
  defaultVariants: { place: "side" },
});

const icon = css.cn(css.width(t.layout.navIcon), css.height(t.layout.navIcon));
const sideLabel = css.cn(css.display("none"), gtTablet(css.display("inline")));
const barLabel = css.cn(css.display("none"), gtPhone(css.display("inline")));

// A pane is a column a screen draws itself in: a container named "column", so the screens' rules (narrow, the profile
// header) read the width of their own pane, 600 in the feed and 400 while a thread sits beside it.
const pane = css.cn(
  css.containerType("inline-size"),
  css.containerName("column"),
  css.minHeight("100dvh"),
  css.paddingBottom("calc(52px + env(safe-area-inset-bottom))"),
  gtMobile(css.paddingBottom("0"), css.borderInline(t.border.width, "solid", t.color.border)),
);
// The feed: the column itself on "/", its own scroller beside a thread (the window does not scroll then). Below the rail's
// breakpoint it is not on screen at all.
const feedSplit = css.cn(
  pane,
  css.display("none"),
  gtRail(css.display("block"), css.height("100dvh"), css.overflowY("auto")),
);
const feedGone = css.cn(pane, css.display("none"));
// The screen that is not the feed: the whole column (pane), or the thread's pane. Its start border is the feed's end border
// while the two are side by side.
const detailSplit = css.cn(
  pane,
  gtRail(css.height("100dvh"), css.overflowY("auto"), css.borderInlineStart("0")),
);
// The 600 px column, or the feed and the thread side by side from the rail's breakpoint (the Shell marks itself split).
const main = css.cn(
  css.display("grid"),
  css.gridTemplateColumns("minmax(0, 1fr)"),
  css.minHeight("100dvh"),
  css.attr(
    "data-split",
    "yes",
  )(gtRail(css.gridTemplateColumns(t.layout.centerWidth, t.layout.threadWidth))),
);

const header = css.cn(
  css.position("sticky"),
  css.top(0),
  css.zIndex(5),
  css.flex().alignItems("center"),
  css.minHeight(t.layout.headerHeight),
  css.paddingInline(t.gutter.base),
  css.bg(t.color.bg),
  css.borderBottom(t.border.width, "solid", t.color.border),
  narrow(css.paddingInline(t.gutter.compact)),
);
const title = css.cn(
  css.fontSize(t.fontSize.xl),
  css.fontWeight(t.fontWeight.bold),
  css.margin("0"),
  narrow(css.fontSize(t.fontSize.lg)),
);

const rail = css.cn(
  css.display("none"),
  gtRail(css.display("block"), sticky, css.padding(t.space.lg)),
);
const card = css.cn(
  frame().radius(t.radius.lg).padding(3).border(t.border.width),
  css.bg(t.color.bgSubtle),
  css.borderColor(t.color.border),
  css.flex().direction("column").gap(3),
);
const note = css.cn(
  frame().padding(2).border(t.border.width),
  css.bg(t.color.accentSoft),
  css.color(t.color.accentStrong),
  css.borderColor(t.color.accentSoft),
  css.fontSize(t.fontSize.sm),
);
const cardText = css.cn(
  css.margin("0"),
  css.color(t.color.textMedium),
  css.fontSize(t.fontSize.sm),
);

const items = [
  { href: "/", label: "Home", icon: css.cn(ph("house"), icon) },
  { href: "/profile/bsky.app", label: "bsky.app", icon: css.cn(ph("user-circle"), icon) },
  { href: "/settings", label: "Settings", icon: css.cn(ph("gear"), icon) },
];

function NavItem(props: { href: string; label: string; icon: Style; place: "side" | "bar" }) {
  return (
    <a href={props.href} class={navItem({ place: props.place })} aria-label={props.label}>
      <span class={props.icon} />
      <span class={props.place === "side" ? sideLabel : barLabel}>{props.label}</span>
    </a>
  );
}

// The screen's title bar; it also sets the document title. `heading` hands the h1 to a screen that moves the focus into
// itself (a thread opened beside the feed).
export function Header(props: { title: string; heading?: (el: HTMLHeadingElement) => void }) {
  createEffect(
    () => props.title,
    (name) => {
      document.title = `${name} · sky`;
    },
  );
  return (
    <header class={header}>
      <h1 class={title} tabindex={-1} ref={props.heading}>
        {props.title}
      </h1>
    </header>
  );
}

const threadPath = /^\/profile\/[^/]+\/post\/[^/]+$/;
const isThread = (path: string) => threadPath.test(path);

// The frame of every screen: navigation, the feed, the screen, right rail, bottom bar. The feed is the Shell's own pane so
// that opening a thread does not unmount it: it keeps its pages, its tab and its scroll while the thread sits beside it.
export function Shell(props: { children?: JSX.Element }) {
  const location = useLocation();
  const path = () => location.pathname;

  // A thread opened from the feed is split out of it: the two panes exist, the rail yields. Below the rail's breakpoint the
  // thread replaces the column, as it did before, and so does a thread opened from anywhere but the feed.
  const [split, setSplit] = createSignal(isThread(path()));
  const media = window.matchMedia(railQuery);
  const [wide, setWide] = createSignal(media.matches);
  const listen = (e: MediaQueryListEvent) => setWide(e.matches);
  media.addEventListener("change", listen);
  onCleanup(() => media.removeEventListener("change", listen));

  let feed!: HTMLDivElement;
  let feedScroll = 0;
  let paneLeft = false; // the feed pane held the offset when the thread was left

  useBeforeLeave((e) => {
    // the router's location, not window.location: a popstate has written the new URL before the guard runs
    const from = path();
    const to = typeof e.to === "string" ? e.to : "";
    if (from === "/" && isThread(to)) {
      feedScroll = window.scrollY; // the window's offset is the pane's once the pane scrolls
      setSplit(true); // before the route renders: the thread mounts in its pane, not in the column
      paneLeft = false;
    } else if (isThread(from) && split() && wide()) {
      feedScroll = feed.scrollTop;
      paneLeft = true;
    }
  });
  createEffect(
    () => path(),
    (p, before) => {
      if (isThread(p) && before === "/" && wide()) feed.scrollTop = feedScroll;
      if (!isThread(p) && split()) setSplit(false);
      // back to the feed from beside the thread: the router has put the window back at the feed's offset already, but the
      // document was still the height of the panes then, so the offset was clamped: put it back once the column is one
      if (p === "/" && before && isThread(before) && paneLeft) {
        paneLeft = false;
        requestAnimationFrame(() => window.scrollTo(0, feedScroll));
      }
    },
  );
  // the feed is not re-rendered when the thread closes, so its title is set here on the way back
  createEffect(
    () => path(),
    (p) => {
      if (p === "/") document.title = "Home · sky";
    },
  );

  // the feed's rows: on "/", and beside the thread while it is open. Below the rail's breakpoint it is not mounted.
  const master = () => path() === "/" || (split() && wide());
  const feedLook = () => (path() === "/" ? pane : split() ? feedSplit : feedGone);
  const detail = () => (split() ? detailSplit : pane);
  return (
    <div class={split() ? css.cn(root, rootSplit) : css.cn(root, rootNo)}>
      <nav class={nav} aria-label="Main">
        <a href="/" class={brand}>
          sky
        </a>
        <For each={items}>{(item) => <NavItem {...item} place="side" />}</For>
      </nav>
      <main class={main} data-split={split() ? "yes" : undefined}>
        <div class={feedLook()} data-pane="feed" ref={(el) => (feed = el)}>
          <Show when={master()}>
            <Home />
          </Show>
        </div>
        <Show when={path() !== "/"}>
          <div class={detail()} data-pane="detail">
            {props.children}
          </div>
        </Show>
      </main>
      <Show when={!split()}>
        <aside class={rail}>
          <div class={card}>
            <strong>sky</strong>
            <p class={cardText}>
              A read-only client for Bluesky, written to show what cssints can do.
            </p>
            <div class={note}>No login, no posting.</div>
          </div>
        </aside>
      </Show>
      <nav class={bar} aria-label="Main">
        <For each={items}>{(item) => <NavItem {...item} place="bar" />}</For>
      </nav>
    </div>
  );
}
