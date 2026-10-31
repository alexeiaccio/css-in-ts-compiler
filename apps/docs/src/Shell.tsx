import { createDrawer, createHotkeys, type Drawer } from "@cssints/headless";
import type { Style } from "cssints";
import * as css from "cssints" with { type: "cssints" };
import { useLocation } from "@solidjs/router";
import type { JSX } from "@solidjs/web";
import { createEffect, createSignal, For, onCleanup, Show, useContext } from "solid-js";

import { DocsContext, url } from "./docs.ts";
import { ph } from "./icons.ts" with { type: "cssints" };
import { gtOutline, gtSidebar, reduced } from "./layout.ts" with { type: "cssints" };
import { Search } from "./Search.tsx";
import { SettingsPanel } from "./SettingsPanel.tsx";
import { t } from "./theme.ts" with { type: "cssints" };

const root: Style = css.cn(
  css.minHeight("100dvh"),
  css.bg(t.color.bg),
  css.color(t.color.text),
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
  css.flex().alignItems("center").gap(2),
  css.fontSize(t.fontSize.lg),
  css.fontWeight(t.fontWeight.bold),
  css.color(t.color.text),
  css.textDecoration("none"),
  css.marginRight(t.space.sm),
  css.flexShrink(0),
);
// The wordmark in the logo's colours (#663399, #00FFE8, #3178C6), each taken lighter or darker where the page would hide it
// (the cyan on white, the purple and the blue on the dark page).
const wordCss = css.color(css.lightDark("#663399", "#a77bd6"));
const wordIn = css.color(css.lightDark("#00877b", "#00ffe8"));
const wordTs = css.color(css.lightDark("#3178c6", "#5b9be0"));
const alpha = css.cn(
  css.alignSelf("flex-start"),
  css.marginLeft("-5px"),
  css.marginTop("2px"),
  css.fontSize("10px"),
  css.fontWeight(t.fontWeight.semiBold),
  css.lineHeight(1),
  css.color(t.color.textMedium),
  css.letterSpacing("0.04em"),
);
const logo = css.cn(css.width("28px"), css.height("28px"), css.flexShrink(0));

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
const playIcon = css.cn(ph("play-circle"), icon);

// The sidebar's box, wherever it sits: the drawer's panel below 900 px, the site's column above it.
const sidebar = css.cn(
  css.overflowY("auto"),
  css.overscrollBehavior("contain"),
  css.padding(t.space.lg),
  css.bg(t.color.bg),
  css.borderRight(t.border.width, "solid", t.color.border),
);
// Below 900 px: the drawer's panel under the header, off screen until the drawer opens (createDrawer in Shell).
const drawerPanel = css.cv({
  base: css.cn(
    sidebar,
    css.position("fixed"),
    css.top(t.layout.headerHeight),
    css.bottom("0"),
    css.left("0"),
    css.zIndex(20),
    css.width("min(320px, 86vw)"),
    reduced(css.transition("none")),
  ),
  variants: {
    open: {
      // visible at once: the focus moves into the panel before the first frame, and a hidden panel cannot take it
      true: css.cn(
        css.transform("none"),
        css.visibility("visible"),
        css.boxShadow("0 8px 32px var(--color-shadow)"),
        css.transition("transform 0.2s ease-out, visibility 0s"),
      ),
      // and still visible while it slides out: the visibility goes when the slide is over, not before it
      false: css.cn(
        css.transform("translateX(-100%)"),
        css.visibility("hidden"),
        css.transition("transform 0.2s ease-out, visibility 0s linear 0.2s"),
      ),
    },
  },
  defaultVariants: { open: false },
});
// From 900 px: the column beside the page, sticky, with no backdrop and no lock (the drawer is not modal there).
const column = css.cn(
  sidebar,
  css.position("sticky"),
  css.top(t.layout.headerHeight),
  css.bottom("0"),
  css.left("0"),
  css.zIndex(1),
  css.width("auto"),
  css.height("calc(100dvh - var(--layout-header-height))"),
);
// A modal drawer's backdrop; the primitive hides it (the hidden attribute) when the drawer is closed or not modal.
const backdrop = css.cn(
  css.position("fixed"),
  css.inset("0"),
  css.zIndex(10),
  css.bg("oklch(0 0 0 / 0.4)"),
);

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

const footer = css.cn(
  css.maxWidth("1440px"),
  css.marginInline("auto"),
  css.padding(t.space.lg),
  css.fontSize(t.fontSize.sm),
  css.color(t.color.textLow),
);
const footerLink = css.cn(
  css.color(t.color.textMedium),
  css.hover(css.color(t.color.text)),
  css.focusVisible(css.outline("2px solid", t.color.accent)),
);

const GROUPS = ["Guide", "Reference", "Packages", "Project"] as const;

// The pages of the sidebar, in the drawer's panel below 900 px and in the column above it: one list, two hosts.
function Groups() {
  const { pages } = useContext(DocsContext);
  return (
    <For each={GROUPS}>
      {(group) => (
        <>
          <h2 class={groupTitle}>{group}</h2>
          <ul class={list}>
            <For each={pages.filter((p) => p.group === group)}>
              {(page) => (
                <li>
                  <a href={url(page.slug)} class={link}>
                    {page.title}
                  </a>
                </li>
              )}
            </For>
          </ul>
        </>
      )}
    </For>
  );
}

// The drawer's panel. It keeps the slide it had (drawerPanel's transform and visibility) instead of the primitive's `hidden`, which
// is display: none and would cut the transition; `visibility: hidden` already keeps the closed panel out of the tab order and the
// accessibility tree, and focus and Tab find the panel through this id (like createConfirm). The `hidden` it is given is the
// landing page's, which has no sidebar at all. Above 900 px the panel is not rendered: a column is not a dialog.
function Panel(props: { drawer: Drawer; hidden: boolean }) {
  return (
    <nav
      {...props.drawer.contentProps}
      class={drawerPanel({ open: props.drawer.open() })}
      aria-label="Pages"
      hidden={props.hidden}
    >
      <Groups />
    </nav>
  );
}

// The frame of every page: header (menu, brand, search, links), the sidebar of pages, and the page. Without JavaScript the app draws
// nothing: the built page's static copy (plugin/docs.ts) carries its own nav, so this drawer is the app's, not the document's way in.
export function Shell(props: { children?: JSX.Element }) {
  const [open, setOpen] = createSignal(false);
  // one keydown listener for the app: "/" and Cmd/Ctrl+K (Search.tsx)
  const hotkeys = createHotkeys();
  onCleanup(() => hotkeys.dispose());
  const location = useLocation();
  // the landing page is the whole width: no sidebar, no drawer
  const home = () => location.pathname.replace(/\/$/, "") === url("").replace(/\/$/, "");
  // Below 900 px the sidebar is a modal drawer; from 900 it is the column (layout.ts's gtSidebar). The primitive has no viewport, so
  // the breakpoint is watched here and handed over as `modal`; `breakpoint` only documents the number.
  const query = window.matchMedia("(width >= 900px)");
  const [wide, setWide] = createSignal(query.matches);
  const onQuery = (event: MediaQueryListEvent) => setWide(event.matches);
  query.addEventListener("change", onQuery);
  onCleanup(() => query.removeEventListener("change", onQuery));
  const drawer = createDrawer({
    id: "sidebar",
    side: "left",
    breakpoint: 900,
    get open() {
      return open();
    },
    onOpenChange: setOpen,
    get modal() {
      return !wide();
    },
  });
  // a link to another page closes the drawer behind it
  createEffect(
    () => location.pathname,
    () => {
      setOpen(false);
    },
  );
  // growing past the breakpoint turns the panel back into the column: the drawer lets go of the focus and the scroll lock
  createEffect(
    () => wide(),
    (isWide) => {
      if (isWide) {
        setOpen(false);
      }
    },
  );
  return (
    <div class={root}>
      <header class={header}>
        <button
          {...drawer.triggerProps}
          type="button"
          class={css.cn(iconButton, menuButton)}
          style={home() ? { display: "none" } : undefined}
          aria-label="Menu"
        >
          <span class={open() ? menuIcon.x : menuIcon.list} />
        </button>
        <a href={url("")} class={brand}>
          <img
            src={`${import.meta.env.BASE_URL}logo.svg`}
            alt=""
            class={logo}
            width="28"
            height="28"
          />
          <span>
            <span class={wordCss}>css</span>
            <span class={wordIn}>in</span>
            <span class={wordTs}>ts</span>
          </span>
          <sup class={alpha} title="0.x, alpha: the API can still change">
            alpha
          </sup>
        </a>
        <Search hotkeys={hotkeys} />
        <a href={url("playground")} class={iconButton} aria-label="Playground" title="Playground">
          <span class={playIcon} />
        </a>
        {/* the settings trigger and its panel: one component, the panel in a portal (SettingsPanel.tsx) */}
        <SettingsPanel triggerClass={iconButton} />
      </header>
      <div class={home() ? undefined : body}>
        <Show when={wide()} fallback={<Panel drawer={drawer} hidden={home()} />}>
          <nav id="sidebar" class={column} aria-label="Pages" hidden={home()}>
            <Groups />
          </nav>
        </Show>
        <div {...drawer.backdropProps} class={backdrop} />
        {props.children}
      </div>
      <footer class={footer}>
        MIT license ·{" "}
        <a href={url("credits")} class={footerLink}>
          Credits
        </a>
      </footer>
    </div>
  );
}
