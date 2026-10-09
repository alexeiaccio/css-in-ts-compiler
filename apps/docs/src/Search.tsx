import type { Style } from "cssints";
import * as css from "cssints" with { type: "cssints" };
import { frame } from "cssints/frame" with { type: "cssints" };
import { surface } from "cssints/surface" with { type: "cssints" };
import { useNavigate } from "@solidjs/router";
import { createMemo, createSignal, For, onSettled, useContext } from "solid-js";

import { DocsContext, url } from "./docs.ts";
import { ph } from "./icons.ts" with { type: "cssints" };
import { gtSidebar } from "./layout.ts" with { type: "cssints" };
import { createIndex, search } from "./lookup.ts";
import { t } from "./theme.ts" with { type: "cssints" };

const wrap: Style = css.cn(
  css.position("relative"),
  css.flexGrow(1),
  css.minWidth("0"),
  css.maxWidth("420px"),
  css.marginLeft("auto"),
);
const field = css.cn(
  css.flex().alignItems("center").gap(2),
  css.height("36px"),
  css.paddingInline(t.space.md),
  css.bg(t.color.bgSubtle),
  css.border(t.border.width, "solid", t.color.border),
  css.borderRadius(t.radius.md),
  css.color(t.color.textLow),
  css.focusWithin(css.borderColor(t.color.accent), css.bg(t.color.bg)),
);
const input = css.cn(
  css.flexGrow(1),
  css.minWidth("0"),
  css.height("100%"),
  css.padding("0"),
  css.border("0", "none"),
  css.outline("none"),
  css.bg("transparent"),
  css.color(t.color.text),
  css.fontSize(t.fontSize.sm),
);
const key = css.cn(
  css.display("none"),
  css.padding("1px 6px"),
  css.border(t.border.width, "solid", t.color.border),
  css.borderRadius(t.radius.xs),
  css.fontSize(t.fontSize.xs),
  gtSidebar(css.display("block")),
);
const icon = css.cn(css.width("16px"), css.height("16px"), css.flexShrink(0));

// A frame passes its inner radius down: the rows are concentric with the panel without a radius of their own.
const panel = css.cn(
  frame().radius(t.radius.lg).padding(2).border(t.border.width),
  surface().color(t.color.bg),
  css.borderColor(t.color.borderStrong),
  css.position("absolute"),
  css.top("calc(100% + 8px)"),
  css.left("0"),
  css.right("0"),
  css.zIndex(40),
  css.boxShadow("0 12px 32px var(--color-shadow)"),
  css.maxHeight("min(70dvh, 480px)"),
  css.overflowY("auto"),
);
const row = css.cn(
  frame().padding(2),
  css.display("block"),
  css.textDecoration("none"),
  css.color(t.color.text),
  css.fontSize(t.fontSize.sm),
  css.hover(surface().contrast(0.05)),
  css.attr("aria-selected", "true")(surface().contrast(0.05)),
);
const rowPage = css.cn(
  css.display("block"),
  css.fontSize(t.fontSize.xs),
  css.color(t.color.textMedium),
);
const empty = css.cn(
  frame().padding(2),
  css.color(t.color.textMedium),
  css.fontSize(t.fontSize.sm),
);

// Search over the headings and terms of the pages. "/" or Ctrl/Cmd+K focuses it; arrows, Enter and Escape drive it.
export function Search() {
  const index = createIndex(useContext(DocsContext).pages);
  const [query, setQuery] = createSignal("");
  const [active, setActive] = createSignal(0);
  const [focused, setFocused] = createSignal(false);
  const hits = createMemo(() => search(index, query()));
  const navigate = useNavigate();
  let inputEl!: HTMLInputElement;

  const done = () => {
    setQuery("");
    inputEl.blur();
  };
  const open = (i: number) => {
    const hit = hits()[i];
    if (!hit) return;
    navigate(`/${hit.slug}${hit.id && `#${hit.id}`}`);
    done();
  };
  const onKey = (e: KeyboardEvent) => {
    const n = hits().length;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setActive((active() + (e.key === "ArrowDown" ? 1 : n - 1)) % Math.max(n, 1));
    } else if (e.key === "Enter") open(active());
    else if (e.key === "Escape") done();
  };

  onSettled(() => {
    const focus = (e: KeyboardEvent) => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test((e.target as Element).tagName);
      if ((e.key === "/" && !typing) || (e.key === "k" && (e.metaKey || e.ctrlKey))) {
        e.preventDefault();
        inputEl.focus();
        inputEl.select();
      }
    };
    window.addEventListener("keydown", focus);
    return () => window.removeEventListener("keydown", focus);
  });

  return (
    <div class={wrap}>
      <label class={field}>
        <span class={css.cn(ph("magnifying-glass"), icon)} />
        <input
          ref={(el) => {
            inputEl = el;
          }}
          class={input}
          type="text"
          placeholder="Search the docs"
          aria-label="Search the docs"
          role="combobox"
          aria-expanded={focused() && query() !== "" ? "true" : "false"}
          aria-controls="search-results"
          autocomplete="off"
          value={query()}
          onInput={(e) => {
            setQuery(e.currentTarget.value);
            setActive(0);
          }}
          onKeyDown={onKey}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        <kbd class={key}>/</kbd>
      </label>
      {focused() && query() !== "" && (
        <div
          id="search-results"
          class={panel}
          role="listbox"
          onMouseDown={(e) => e.preventDefault()}
        >
          {hits().length === 0 ? (
            <div class={empty}>No headings match “{query()}”.</div>
          ) : (
            <For each={hits()}>
              {(hit, i) => (
                <a
                  href={url(`${hit.slug}${hit.id && `#${hit.id}`}`)}
                  class={row}
                  role="option"
                  aria-selected={i() === active() ? "true" : "false"}
                  onClick={done}
                >
                  {hit.text}
                  <span class={rowPage}>{hit.depth === 1 ? "Page" : hit.page}</span>
                </a>
              )}
            </For>
          )}
        </div>
      )}
    </div>
  );
}
