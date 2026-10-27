import { createListbox, createSwitch } from "@cssints/headless";
import * as css from "cssints" with { type: "cssints" };
import { For, Show, createEffect, onSettled } from "solid-js";

import { stories, storyAt, storyOfId } from "./stories.ts";
import { t } from "./theme.ts" with { type: "cssints" };

// The shell is built on @cssints/headless too: the story rail is a listbox (single-select, follows focus, roving tabindex
// and type-ahead included) and the dark switch is a switch. Both are styled through their ARIA state with attr() and
// within(), which is the point of headless: the widget owns no look, the class reads what it announced.

const root = css.cn(
  css.display("grid"),
  css.gridTemplateColumns("15rem minmax(0, 1fr)"),
  css.minHeight("100dvh"),
  css.bg(t.color.bg),
  css.color(t.color.text),
  css.fontSize(t.fontSize.md),
);

const rail = css.cn(
  css.display("flex"),
  css.flexDirection("column"),
  css.gap(4),
  css.padding(t.space.md),
  css.bg(t.color.surface),
  css.borderInlineEnd("1px solid", t.color.border),
  css.position("sticky"),
  css.top(0),
  css.height("100dvh"),
  css.overflow("auto"),
);

const brand = css.cn(
  css.margin(0),
  css.fontSize(t.fontSize.sm),
  css.fontWeight("700"),
  css.letterSpacing("0.08em"),
  css.textTransform("uppercase"),
  css.color(t.color.muted),
);

const list = css.cn(
  css.display("flex"),
  css.flexDirection("column"),
  css.gap(1),
  css.margin(0),
  css.padding(0),
  css.listStyle("none"),
);

const option = css.cn(
  css.display("flex"),
  css.alignItems("center"),
  css.padding("6px 10px"),
  css.borderRadius(t.radius.sm),
  css.color(t.color.muted),
  css.cursor("pointer"),
  css.userSelect("none"),
  css.hover(css.color(t.color.text)),
  css.attr("aria-selected", "true")(
    css.bg(t.color.accentSoft),
    css.color(t.color.text),
    css.fontWeight("600"),
  ),
);

const footer = css.cn(
  css.display("flex"),
  css.alignItems("center"),
  css.justifyContent("space-between"),
  css.gap(3),
  css.marginTop("auto"),
  css.fontSize(t.fontSize.sm),
  css.color(t.color.muted),
);

const track = css.cn(
  css.group(),
  css.position("relative"),
  css.width("36px"),
  css.height("20px"),
  css.flexShrink(0),
  css.padding(0),
  css.border("1px solid", t.color.border),
  css.borderRadius(t.radius.full),
  css.bg(t.color.bg),
  css.cursor("pointer"),
  css.transition("background-color 150ms, border-color 150ms"),
  css.attr("aria-checked", "true")(css.bg(t.color.accent), css.border("1px solid", t.color.accent)),
);

const knob = css.cn(
  css.position("absolute"),
  css.top("2px"),
  css.left("2px"),
  css.width("14px"),
  css.height("14px"),
  css.borderRadius(t.radius.full),
  css.bg(t.color.muted),
  css.transition("transform 150ms, background-color 150ms"),
  css.within(css.attr("aria-checked", "true"))(
    css.transform("translateX(16px)"),
    css.bg(t.color.onAccent),
  ),
);

const main = css.cn(css.display("flex"), css.flexDirection("column"), css.minWidth(0));

const header = css.cn(
  css.display("flex"),
  css.alignItems("baseline"),
  css.gap(3),
  css.padding("10px 24px"),
  css.borderBottom("1px solid", t.color.border),
  css.bg(t.color.bg),
  css.position("sticky"),
  css.top(0),
  css.zIndex(1),
);

const title = css.cn(css.margin(0), css.fontSize(t.fontSize.lg), css.fontWeight("700"));

const slug = css.cn(
  css.fontSize(t.fontSize.sm),
  css.color(t.color.muted),
  css.fontFamily("ui-monospace, SFMono-Regular, Menlo, monospace"),
);

const canvas = css.cn(css.padding(t.space.lg), css.flexGrow(1));

// The lab: a rail of the stories in `src/stories`, the picked one in the canvas, and the @cssints/devtools overlay (in dev)
// for what its classes came from. The hash holds the Storybook story id, so a reload, an HMR update or a pasted link lands
// on the story; the rail writes it without a history entry, so the back button is not a walk through the rail.
export default function Lab() {
  const start = storyOfId(location.hash.slice(1));
  const index = stories.indexOf(start);
  const nav = createListbox({
    items: stories.map((story) => `${story.title} · ${story.name}`),
    label: "Stories",
    selectionMode: "single",
    followsFocus: true,
    defaultSelected: [index],
    onValueChange: (selected) => {
      const story = storyAt(selected[0] ?? index);
      history.replaceState(null, "", `#${story.id}`);
    },
  });
  const entry = () => storyAt(nav.selected()[0] ?? index);

  // A link to another story (typed, or the back button over one) fires hashchange and no change of the selection: the rail
  // follows it, through the listbox's own click. Our own replaceState fires nothing, so this cannot loop.
  onSettled(() => {
    const follow = () => {
      const at = stories.indexOf(storyOfId(location.hash.slice(1)));
      if (at !== nav.selected()[0]) {
        nav.clickOption(at);
      }
    };
    addEventListener("hashchange", follow);
    return () => removeEventListener("hashchange", follow);
  });

  const dark = createSwitch({
    defaultValue: document.documentElement.classList.contains("dark"),
  });
  createEffect(
    () => dark.checked(),
    (checked) => {
      document.documentElement.classList.toggle("dark", checked);
    },
  );

  return (
    <div class={root}>
      <aside class={rail}>
        <p class={brand}>cssints lab</p>
        <ul {...nav.listboxProps} class={list}>
          <For each={stories}>
            {(story, at) => (
              <li {...nav.optionProps(at())} class={option}>
                {story.title} · {story.name}
              </li>
            )}
          </For>
        </ul>
        <div class={footer}>
          <span>dark</span>
          <button {...dark.switchProps} class={track} aria-label="Dark theme">
            <span class={knob} />
          </button>
        </div>
      </aside>
      <main class={main}>
        <header class={header}>
          <h1 class={title}>{entry().title}</h1>
          <code class={slug}>{entry().id}</code>
        </header>
        <div class={canvas}>
          <Show when={entry()} keyed>
            {(story) => {
              const View = story.view;
              return <View />;
            }}
          </Show>
        </div>
      </main>
    </div>
  );
}
