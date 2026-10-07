import { _cv } from "cssints";
import * as css from "cssints" with { type: "cssints" };
import { frame } from "cssints/frame" with { type: "cssints" };
import { createEffect, For } from "solid-js";
import type { JSX } from "@solidjs/web";

import { ph } from "./icons.ts" with { type: "cssints" };
import { gtMobile, gtPhone, gtRail, gtTablet, narrow } from "./layout.ts" with { type: "cssints" };
import { t } from "./theme.ts" with { type: "cssints" };

// Mu's shell: below 800 one column with a bottom bar; from 800 the navigation (icons) beside a 600 px column; from 1100 a
// right rail; from 1300 the navigation with labels and a wider rail. One grid, centred; the parts that do not fit are
// display: none.
const root = css.cn(
  css.display("grid"),
  css.gridTemplateColumns("minmax(0, 1fr)"),
  css.justifyContent("center"),
  css.minHeight("100dvh"),
  css.bg(t.color.bg()),
  css.color(t.color.text()),
  css.fontFamily(
    '"Inter Variable", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  ),
  css.fontSize(t.fontSize.md()),
  css.lineHeight(t.lineHeight.relaxed()),
  gtMobile(css.gridTemplateColumns(t.layout.leftNavMinimalWidth(), t.layout.centerWidth())),
  gtRail(
    css.gridTemplateColumns(
      t.layout.leftNavMinimalWidth(),
      t.layout.centerWidth(),
      t.layout.rightRailNarrowWidth(),
    ),
  ),
  gtTablet(
    css.gridTemplateColumns(t.layout.leftNavWidth(), t.layout.centerWidth(), t.layout.rightRailWidth()),
  ),
);

const sticky = css.cn(css.position("sticky"), css.top(0), css.alignSelf("start"));

const nav = css.cn(
  css.display("none"),
  gtMobile(
    css.flex().direction("column").alignItems("center").gap(1),
    sticky,
    css.height("100dvh"),
    css.padding(t.space.sm()),
  ),
  gtTablet(css.alignItems("stretch")),
);

const brand = css.cn(
  css.fontSize(t.fontSize["2xl"]()),
  css.fontWeight(t.fontWeight.bold()),
  css.color(t.color.accent()),
  css.textDecoration("none"),
  css.padding(t.space.md()),
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
  css.bg(t.color.bg()),
  css.borderTop(t.border.width(), "solid", t.color.border()),
  gtMobile(css.display("none")),
);

const navItem = _cv(
  css.cv({
    base: css.cn(
      css.flex().alignItems("center").gap(3),
      css.textDecoration("none"),
      css.color(t.color.textHigh()),
      css.fontWeight(t.fontWeight.medium()),
      css.hover(css.bg(t.color.bgMuted())),
      // the router sets aria-current="page" on the link of the page that is open
      css.attr(
        "aria-current",
        "page",
      )(css.cn(css.fontWeight(t.fontWeight.bold()), css.color(t.color.text()))),
    ),
    variants: {
      place: {
        side: css.cn(
          css.minHeight(t.layout.navItem()),
          css.paddingInline(t.space.md()),
          css.borderRadius(t.radius.button()),
        ),
        bar: css.cn(
          css.flex().direction("column").justifyContent("center").gap(1),
          css.flexGrow(1),
          css.height("100%"),
          css.fontSize(t.fontSize.xs()),
        ),
      },
    },
    defaultVariants: { place: "side" },
  }),
);

const icon = css.cn(css.width(t.layout.navIcon()), css.height(t.layout.navIcon()));
const sideLabel = css.cn(css.display("none"), gtTablet(css.display("inline")));
const barLabel = css.cn(css.display("none"), gtPhone(css.display("inline")));

const column = css.cn(
  css.containerType("inline-size"),
  css.containerName("column"),
  css.minHeight("100dvh"),
  css.paddingBottom("calc(52px + env(safe-area-inset-bottom))"),
  gtMobile(css.paddingBottom("0"), css.borderInline(t.border.width(), "solid", t.color.border())),
);

const header = css.cn(
  css.position("sticky"),
  css.top(0),
  css.zIndex(5),
  css.flex().alignItems("center"),
  css.minHeight(t.layout.headerHeight()),
  css.paddingInline(t.gutter.base()),
  css.bg(t.color.bg()),
  css.borderBottom(t.border.width(), "solid", t.color.border()),
  narrow(css.paddingInline(t.gutter.compact())),
);
const title = css.cn(
  css.fontSize(t.fontSize.xl()),
  css.fontWeight(t.fontWeight.bold()),
  css.margin("0"),
  narrow(css.fontSize(t.fontSize.lg())),
);

const rail = css.cn(
  css.display("none"),
  gtRail(css.display("block"), sticky, css.padding(t.space.lg())),
);
const card = css.cn(
  frame().radius(t.radius.lg()).padding(3).border(t.border.width()),
  css.bg(t.color.bgSubtle()),
  css.borderColor(t.color.border()),
  css.flex().direction("column").gap(3),
);
const note = css.cn(
  frame().padding(2).border(t.border.width()),
  css.bg(t.color.accentSoft()),
  css.color(t.color.accentStrong()),
  css.borderColor(t.color.accentSoft()),
  css.fontSize(t.fontSize.sm()),
);
const cardText = css.cn(
  css.margin("0"),
  css.color(t.color.textMedium()),
  css.fontSize(t.fontSize.sm()),
);

const items = [
  { href: "/", label: "Home", icon: css.cn(ph("house"), icon) },
  { href: "/profile/bsky.app", label: "bsky.app", icon: css.cn(ph("user-circle"), icon) },
  { href: "/settings", label: "Settings", icon: css.cn(ph("gear"), icon) },
];

function NavItem(props: { href: string; label: string; icon: string; place: "side" | "bar" }) {
  return (
    <a href={props.href} class={navItem({ place: props.place })} aria-label={props.label}>
      <span class={props.icon} />
      <span class={props.place === "side" ? sideLabel : barLabel}>{props.label}</span>
    </a>
  );
}

// The screen's title bar; it also sets the document title.
export function Header(props: { title: string }) {
  createEffect(
    () => props.title,
    (name) => {
      document.title = `${name} · sky`;
    },
  );
  return (
    <header class={header}>
      <h1 class={title}>{props.title}</h1>
    </header>
  );
}

// The frame of every screen: navigation, centre column, right rail, bottom bar.
export function Shell(props: { children?: JSX.Element }) {
  return (
    <div class={root}>
      <nav class={nav} aria-label="Main">
        <a href="/" class={brand}>
          sky
        </a>
        <For each={items}>{(item) => <NavItem {...item} place="side" />}</For>
      </nav>
      <main class={column}>{props.children}</main>
      <aside class={rail}>
        <div class={card}>
          <strong>sky</strong>
          <p class={cardText}>
            A read-only client for Bluesky, written to show what cssints can do.
          </p>
          <div class={note}>No login, no posting.</div>
        </div>
      </aside>
      <nav class={bar} aria-label="Main">
        <For each={items}>{(item) => <NavItem {...item} place="bar" />}</For>
      </nav>
    </div>
  );
}
