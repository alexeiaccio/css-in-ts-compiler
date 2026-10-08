import type { Style } from "cssints";
import * as css from "cssints" with { type: "cssints" };
import { useLocation } from "@solidjs/router";
import type { JSX } from "@solidjs/web";
import { createEffect, createSignal, For, onSettled, useContext } from "solid-js";

import { DocsContext } from "./docs.ts";
import { ph } from "./icons.ts" with { type: "cssints" };
import { gtOutline, gtSidebar, reduced } from "./layout.ts" with { type: "cssints" };
import { cycle, mode, next } from "./mode.ts";
import { sans } from "./prose.ts" with { type: "cssints" };
import { Search } from "./Search.tsx";
import { t } from "./theme.ts" with { type: "cssints" };

export const REPO = "https://github.com/alexeiaccio/css-in-ts-compiler";

const root: Style = css.cn(
  css.minHeight("100dvh"),
  css.bg(t.color.bg),
  css.color(t.color.text),
  css.fontFamily(sans),
  css.fontSize(t.fontSize.md),
);

const header = css.cn(
  css.position("sticky"),
  css.top("0"),
  css.zIndex(30),
  css.flex().alignItems("center").gap(2),
  css.height(t.layout.headerHeight),
  css.paddingInline(t.space.lg),
  css.bg(t.color.bg),
  css.borderBottom(t.border.width, "solid", t.color.border),
);

const brand = css.cn(
  css.fontSize(t.fontSize.lg),
  css.fontWeight(t.fontWeight.bold),
  css.color(t.color.text),
  css.textDecoration("none"),
  css.marginRight(t.space.sm),
  css.flexShrink(0),
);
const brandMark = css.cn(css.color(t.color.accent));

const iconButton = css.cn(
  css.flex().alignItems("center").justifyContent("center"),
  css.flexShrink(0),
  css.width("36px"),
  css.height("36px"),
  css.padding("0"),
  css.border("0", "none"),
  css.borderRadius(t.radius.sm),
  css.bg("transparent"),
  css.color(t.color.textMedium),
  css.cursor("pointer"),
  css.hover(css.bg(t.color.bgMuted), css.color(t.color.text)),
  css.focusVisible(css.outline("2px solid", t.color.accent), css.outlineOffset("2px")),
);
const menuButton = css.cn(gtSidebar(css.display("none")));
const icon = css.cn(css.width("20px"), css.height("20px"));
const menuIcon = { list: css.cn(ph("list"), icon), x: css.cn(ph("x"), icon) };
const modeIcon = {
  system: css.cn(ph("desktop"), icon),
  light: css.cn(ph("sun"), icon),
  dark: css.cn(ph("moon"), icon),
};

// The sidebar is a drawer under the header (hidden from tab order while closed) until 900 px, then a sticky column.
const side = css.cv({
  base: css.cn(
    css.position("fixed"),
    css.top(t.layout.headerHeight),
    css.bottom("0"),
    css.left("0"),
    css.zIndex(20),
    css.width("min(320px, 86vw)"),
    css.overflowY("auto"),
    css.overscrollBehavior("contain"),
    css.padding(t.space.lg),
    css.bg(t.color.bg),
    css.borderRight(t.border.width, "solid", t.color.border),
    css.transition("transform 0.2s ease-out, visibility 0.2s"),
    reduced(css.transition("none")),
    gtSidebar(
      css.position("sticky"),
      css.height("calc(100dvh - var(--layout-header-height))"),
      css.width("auto"),
      css.transform("none"),
      css.visibility("visible"),
      css.zIndex(1),
    ),
  ),
  variants: {
    open: {
      true: css.cn(
        css.transform("none"),
        css.visibility("visible"),
        css.boxShadow("0 8px 32px var(--color-shadow)"),
      ),
      false: css.cn(css.transform("translateX(-100%)"), css.visibility("hidden")),
    },
  },
  defaultVariants: { open: false },
});
const backdrop = css.cv({
  base: css.cn(
    css.display("none"),
    css.position("fixed"),
    css.inset("0"),
    css.zIndex(10),
    css.bg("oklch(0 0 0 / 0.4)"),
  ),
  variants: { open: { true: css.cn(css.display("block"), gtSidebar(css.display("none"))) } },
});

const groupTitle = css.cn(
  css.margin("0"),
  css.marginBottom(t.space.xs),
  css.paddingInline(t.space.sm),
  css.fontSize(t.fontSize.xs),
  css.fontWeight(t.fontWeight.semiBold),
  css.textTransform("uppercase"),
  css.letterSpacing("0.06em"),
  css.color(t.color.textLow),
);
const list = css.cn(
  css.listStyle("none"),
  css.margin("0"),
  css.marginBottom(t.space.xl),
  css.padding("0"),
  css.flex().direction("column").gap(0.5),
);
const link = css.cn(
  css.display("block"),
  css.padding(t.space.xs, t.space.sm),
  css.borderRadius(t.radius.sm),
  css.fontSize(t.fontSize.sm),
  css.lineHeight(t.lineHeight.snug),
  css.color(t.color.textMedium),
  css.textDecoration("none"),
  css.hover(css.bg(t.color.bgMuted), css.color(t.color.text)),
  // the router sets aria-current="page" on the link of the page that is open
  css.attr(
    "aria-current",
    "page",
  )(
    css.cn(
      css.bg(t.color.accentSoft),
      css.color(t.color.accentStrong),
      css.fontWeight(t.fontWeight.semiBold),
    ),
  ),
  css.focusVisible(css.outline("2px solid", t.color.accent)),
);

// One grid, centred: the sidebar, the page and its outline (Page.tsx); each is a child of it.
const body = css.cn(
  css.display("grid"),
  css.gridTemplateColumns("minmax(0, 1fr)"),
  css.maxWidth("1440px"),
  css.marginInline("auto"),
  gtSidebar(css.gridTemplateColumns(t.layout.sidebarWidth, "minmax(0, 1fr)")),
  gtOutline(
    css.gridTemplateColumns(t.layout.sidebarWidth, "minmax(0, 1fr)", t.layout.outlineWidth),
  ),
);

const GROUPS = ["Guide", "Reference", "Project"] as const;

function ThemeToggle() {
  return (
    <button
      type="button"
      class={iconButton}
      onClick={cycle}
      aria-label={`Colour mode: ${mode()}. Switch to ${next[mode()]}.`}
      title={`Colour mode: ${mode()}`}
    >
      <span class={modeIcon[mode()]} />
    </button>
  );
}

// The frame of every page: header (menu, brand, search, links), the sidebar of pages, and the page.
export function Shell(props: { children?: JSX.Element }) {
  const { pages } = useContext(DocsContext);
  const [open, setOpen] = createSignal(false);
  const location = useLocation();
  createEffect(
    () => location.pathname,
    () => {
      setOpen(false);
    },
  );
  onSettled(() => {
    const close = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  });
  return (
    <div class={root}>
      <header class={header}>
        <button
          type="button"
          class={css.cn(iconButton, menuButton)}
          aria-label="Menu"
          aria-controls="sidebar"
          aria-expanded={open() ? "true" : "false"}
          onClick={() => setOpen(!open())}
        >
          <span class={open() ? menuIcon.x : menuIcon.list} />
        </button>
        <a href="/" class={brand}>
          <span class={brandMark}>css</span>ints
        </a>
        <Search />
        <a
          href={REPO}
          class={iconButton}
          aria-label="cssints on GitHub"
          target="_blank"
          rel="noreferrer"
        >
          <span class={css.cn(ph("github-logo"), icon)} />
        </a>
        <ThemeToggle />
      </header>
      <div class={body}>
        <nav id="sidebar" class={side({ open: open() })} aria-label="Pages">
          <For each={GROUPS}>
            {(group) => (
              <>
                <h2 class={groupTitle}>{group}</h2>
                <ul class={list}>
                  <For each={pages.filter((p) => p.group === group)}>
                    {(page) => (
                      <li>
                        <a href={`/${page.slug}`} class={link}>
                          {page.title}
                        </a>
                      </li>
                    )}
                  </For>
                </ul>
              </>
            )}
          </For>
        </nav>
        <div class={backdrop({ open: open() })} onClick={() => setOpen(false)} />
        {props.children}
      </div>
    </div>
  );
}
