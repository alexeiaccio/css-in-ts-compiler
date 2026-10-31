import { type Tabs as TabsController, type TabsOptions, createTabs } from "@cssints/headless";
import { For, Show, createEffect, createUniqueId } from "solid-js";
import type { JSX } from "@solidjs/web";
import { Accordion } from "../accordion/accordion.tsx";

import * as css from "cssints" with { type: "cssints" };

import { t } from "../theme.ts" with { type: "cssints" };

const rootClass = css.display("flex") + " " + css.flexDirection("column");
const listClass = css.cn(
  css.display("flex"),
  // At 320 px and 200 % text four labels do not fit on one line; wrapping is the reflow (G1). The
  // tabs keep their natural width (a flex item's `min-width` is `auto`), so a label is never clipped.
  css.flexWrap("wrap"),
  css.gap(t.space._1),
  css.borderBottom("1px solid", t.color.border),
);
const tabClass = css.cn(
  css.padding(t.space._2, t.space._3),
  // 2.5.8: 24 x 24 CSS px, whatever the label. The padding alone gives 33 px of height and 33 px of
  // width for a one-letter label today, so these only hold the floor if a smaller padding arrives.
  css.minHeight("24px"),
  css.minWidth("24px"),
  // 2.4.12: a browser that reveals the focused tab scrolls it to the top of its scrollport, where a
  // sticky header sits; this keeps it 40 px clear (the registry test puts a 32 px header above it).
  css.scrollMarginTop(t.space._10),
  css.bg("transparent"),
  css.border("none"),
  css.borderBottom("2px solid", "transparent"),
  css.color(t.color.muted),
  css.fontSize(t.font.size),
  css.cursor("pointer"),
  css.hover(css.color(t.color.text)),
  css.focusVisible(css.outline("2px solid", t.color.focusRing), css.outlineOffset("-2px")),
  // The underline is heavier when selected, not only a different colour: 3 px against 2 px is the
  // non-colour cue 1.4.1 asks for (G4).
  css.attr("aria-selected", "true")(
    css.color(t.color.text),
    css.borderBottom("3px solid", t.color.highlight),
  ),
  css.attr("aria-disabled", "true")(css.color(t.color.textDisabled), css.cursor("not-allowed")),
);
const panelClass = css.cn(css.padding(t.space._3, 0));

/**
 * APG tabs, styled: a tablist, its tabs and the panels they show.
 *
 * The primitive owns the selection, the roving tab stop and the activation mode (automatic or
 * manual); the host owns the DOM, so this component moves focus to whichever tab the primitive
 * reports as focused — that is what makes a keyboard user's arrow key land somewhere.
 *
 * `value` makes it controlled; without it the tabs own the selection. `onValueChange` is a
 * request — a controlled host may ignore it.
 */
export interface TabsProps extends Omit<TabsOptions, "id"> {
  /** How many tabs; `tab` and `panel` are called per index. */
  readonly items: number;
  readonly tab: (index: number) => JSX.Element;
  readonly panel?: (index: number) => JSX.Element;
  /**
   * The host's narrow breakpoint (TetraLogical: below 800 px). Wide it renders the tablist, narrow it renders
   * the same sections as an accordion, one open, over the same selection. The host measures and passes it —
   * or the fixture listens to `matchMedia("(max-width: 799px)")` — so this stays testable without a resize.
   */
  readonly narrow?: boolean;
  /** The primitive, once: a scenario fixture needs it; a page rarely does. */
  readonly onReady?: (tabs: TabsController) => void;
}

export const Tabs = (props: TabsProps): JSX.Element => {
  const tabs = createTabs({
    items: props.items,
    get value() {
      return props.value;
    },
    defaultSelected: props.defaultSelected,
    orientation: props.orientation,
    activation: props.activation,
    disabled: props.disabled,
    focusablePanels: props.focusablePanels,
    get onValueChange() {
      return props.onValueChange;
    },
  });
  props.onReady?.(tabs);

  let list: HTMLElement | undefined;
  const tabElements = (): HTMLElement[] => [
    ...(list?.querySelectorAll<HTMLElement>('[role="tab"]') ?? []),
  ];
  createEffect(
    () => tabs.focused(),
    (index) => {
      const element = tabElements()[index];
      if (index >= 0 && element !== undefined && document.activeElement !== element) {
        element.focus();
      }
    },
  );

  return (
    <div class={rootClass}>
      {/* Only one mode is in the DOM, so the other is not in the accessibility tree at all: not a hidden
          focusable control, not a second Tab stop for the same section. */}
      <Show when={props.narrow !== true}>
        <div
          {...tabs.tablistProps}
          ref={(element) => {
            list = element;
          }}
          data-part="tablist"
          class={listClass}
        >
          <For each={Array.from({ length: props.items }, (_, index) => index)}>
            {(index) => (
              <button {...tabs.tabProps(index)} data-part="tab" class={tabClass}>
                {props.tab(index)}
              </button>
            )}
          </For>
        </div>
        <For each={Array.from({ length: props.items }, (_, index) => index)}>
          {(index) => (
            <div {...tabs.tabpanelProps(index)} data-part="tabpanel" class={panelClass}>
              {props.panel?.(index)}
            </div>
          )}
        </For>
      </Show>
      {/* The narrow mode is the accordion skin (chevron before the label); its open set is the tabs'
          selection, so shrinking after selecting section 3 opens section 3 and expanding it selects tab 3. */}
      <Show when={props.narrow === true}>
        <Accordion
          items={props.items}
          value={[tabs.selected()]}
          collapsible={false}
          disabledItems={props.disabled}
          trigger={(index) => props.tab(index)}
          panel={(index) => props.panel?.(index)}
          onValueChange={(expanded) => {
            const index = expanded[0];
            if (index !== undefined) {
              tabs.select(index);
            }
          }}
        />
      </Show>
    </div>
  );
};

export interface TabsFallbackProps {
  /** How many sections; `tab` is the heading and the link text, `panel` the content. */
  readonly items: number;
  readonly tab: (index: number) => JSX.Element;
  readonly panel?: (index: number) => JSX.Element;
  /** A section's own id (default `${base}-section-<index>`), shared with the interactive panels. */
  readonly sectionId?: (index: number) => string;
}

/**
 * The no-JS fallback: a list of in-page links, then one heading and the full content per section — the
 * markup a server sends and a reader without script keeps. The host renders it and removes it when the
 * interactive `Tabs` mounts, so the two never meet in the accessibility tree.
 */
export const TabsFallback = (props: TabsFallbackProps): JSX.Element => {
  const base = createUniqueId();
  const idOf = (index: number): string => props.sectionId?.(index) ?? `${base}-section-${index}`;
  const indices = (): number[] => Array.from({ length: props.items }, (_, index) => index);
  return (
    <div data-part="tabs-fallback">
      <ul data-part="fallback-toc">
        <For each={indices()}>
          {(index) => (
            <li>
              <a href={`#${idOf(index)}`}>{props.tab(index)}</a>
            </li>
          )}
        </For>
      </ul>
      <For each={indices()}>
        {(index) => (
          <section id={idOf(index)} data-part="fallback-section">
            <h2>{props.tab(index)}</h2>
            {props.panel?.(index)}
          </section>
        )}
      </For>
    </div>
  );
};
