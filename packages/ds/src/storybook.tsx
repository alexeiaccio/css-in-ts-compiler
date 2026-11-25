import type { JSX } from "@solidjs/web";
import type { Control } from "@cssints/stories";
import * as css from "cssints" with { type: "cssints" };
import { For, Show, createMemo, createSignal, onSettled } from "solid-js";

import { type Entry, stories as shipped } from "./stories.ts";
import { t } from "./theme.ts" with { type: "cssints" };
import { type Args, type Channel, channel as broadcast, parseView, viewUrl } from "./view.ts";

type Panels = "both" | "rail" | "canvas";

type StoryEntry = Entry<JSX.Element>;

const shell = css.cn(
  css.display("grid"),
  css.gridTemplateColumns("16rem minmax(0, 1fr)"),
  css.minHeight("100dvh"),
  css.bg(t.color.page),
  css.color(t.color.text),
  css.fontSize(t.font.size),
);

const rail = css.cn(
  css.display("flex"),
  css.flexDirection("column"),
  css.gap(t.space.lg),
  css.padding(t.space.lg),
  css.bg(t.color.surface),
  css.borderInlineEnd("1px solid", t.color.line),
  css.overflow("auto"),
);

const group = css.cn(css.display("grid"), css.gap(t.space.xs));

const heading = css.cn(
  css.margin(0),
  css.fontSize(t.font.sizeSm),
  css.fontWeight("700"),
  css.letterSpacing("0.08em"),
  css.textTransform("uppercase"),
  css.color(t.color.muted),
);

const button = css.cn(
  css.padding(t.space.sm, t.space.md),
  css.border("1px solid", "transparent"),
  css.borderRadius(t.radius.md),
  css.bg("transparent"),
  css.color(t.color.text),
  css.fontSize(t.font.sizeSm),
  css.textAlign("start"),
  css.cursor("pointer"),
  css.focusVisible(css.outline("2px solid", t.color.focusRing), css.outlineOffset("2px")),
  css.attr("aria-current", "true")(
    css.bg(t.color.accent),
    css.color(t.color.onAccent),
    css.border("1px solid", t.color.accent),
  ),
);

const bar = css.cn(
  css.display("flex"),
  css.alignItems("center"),
  css.justifyContent("space-between"),
  css.gap(t.space.md),
  css.paddingBlockEnd(t.space.md),
  css.borderBlockEnd("1px solid", t.color.line),
);

const chip = css.cn(
  css.padding(t.space.sm, t.space.md),
  css.border("1px solid", t.color.line),
  css.borderRadius(t.radius.md),
  css.bg(t.color.surface),
  css.color(t.color.text),
  css.fontSize(t.font.sizeSm),
  css.cursor("pointer"),
  css.focusVisible(css.outline("2px solid", t.color.focusRing), css.outlineOffset("2px")),
);

const note = css.cn(css.fontSize(t.font.sizeSm), css.color(t.color.muted));

const row = css.cn(css.display("grid"), css.gap(t.space.xs));

const canvas = css.cn(
  css.display("grid"),
  css.alignItems("center"),
  css.justifyItems("center"),
  css.padding(t.space.xl),
  css.minWidth(0),
);

const control = css.cn(
  css.padding(t.space.sm, t.space.md),
  css.border("1px solid", t.color.line),
  css.borderRadius(t.radius.md),
  css.bg(t.color.surface),
  css.color(t.color.text),
  css.fontSize(t.font.sizeSm),
);

export interface StorybookProps {
  /** The stories; the package's own unless a host passes another set. */
  readonly stories?: ReadonlyArray<StoryEntry>;
  /** The story to open, else the URL's, else the first one. */
  readonly story?: string;
  /** Which half this document is: `both` is the page, `rail` the popped panels, `canvas` the bare story. */
  readonly panels?: Panels;
  /** How a panels window is opened: `window.open` in the page, a fake in a test. */
  readonly open?: (url: string) => Window | null;
  readonly channel?: Channel;
}

/**
 * The DS's storybook: a rail of stories, the canvas that draws the picked story's `view` with its args, and the controls its
 * `argTypes` declare. The panels detach into a window of their own — the page keeps the canvas and the story is drawn in it
 * natively, with no frame anywhere — and the two documents stay in step over a `BroadcastChannel`.
 *
 * @param {StorybookProps} props the stories, the story to open, the half this document is, the channel and the open call
 * @returns {JSX.Element} the rail, the canvas, or both, as `panels` says
 */
export const Storybook = (props: StorybookProps) => {
  const all = () => props.stories ?? shipped;
  const fromUrl = parseView(location.search, props.panels ?? "both");
  const first = all().find((entry) => entry.id === (props.story ?? fromUrl.story)) ?? all()[0];

  const [current, setCurrent] = createSignal<StoryEntry | undefined>(first);
  const [args, setArgs] = createSignal<Args>(first?.args ?? {});
  const [detached, setDetached] = createSignal(false);
  const bus = props.channel ?? broadcast();

  const mine = () => props.panels ?? "both";
  const showRail = () => mine() === "rail" || (mine() === "both" && !detached());
  const showCanvas = () => mine() !== "rail";

  const open = props.open ?? ((url: string) => window.open(url, "cssints-ds-panels"));

  const shown = (value: Args[string]) =>
    typeof value === "string" || typeof value === "number" ? String(value) : "";

  const pick = (entry: StoryEntry) => {
    setCurrent(entry);
    setArgs(entry.args);
    history.replaceState(null, "", viewUrl(location.pathname, entry.id, mine()));
  };

  onSettled(() => {
    const stop = bus.listen((message) => {
      if (message.type === "story") {
        const entry = all().find((candidate) => candidate.id === message.id);
        if (entry !== undefined && entry.id !== current()?.id) {
          setCurrent(entry);
          setArgs(entry.args);
        }
      }
      if (message.type === "args") {
        setArgs(message.args);
      }
      if (message.type === "detached") {
        setDetached(message.on);
      }
    });
    if (mine() !== "rail") {
      return stop;
    }
    const farewell = () => bus.send({ type: "detached", on: false });
    window.addEventListener("pagehide", farewell);
    return () => {
      stop();
      window.removeEventListener("pagehide", farewell);
      farewell();
    };
  });

  const detach = () => {
    const entry = current();
    if (entry === undefined || open(viewUrl(location.pathname, entry.id, "rail")) === null) {
      return;
    }
    setDetached(true);
    bus.send({ type: "detached", on: true });
  };

  const choose = (entry: StoryEntry) => {
    pick(entry);
    bus.send({ type: "story", id: entry.id });
  };

  const setArg = (name: string, value: Args[string]) => {
    const next = { ...args(), [name]: value };
    setArgs(next);
    bus.send({ type: "args", args: next });
  };

  const numeric = (
    name: string,
    spec: Extract<Control, { type: "number" | "range" }>,
    value: () => Args[string],
  ) => (
    <input
      class={control}
      type={spec.type}
      min={spec.min}
      max={spec.max}
      step={spec.step}
      value={shown(value())}
      onInput={(event) => {
        const next = Number(event.currentTarget.value);
        setArg(name, Number.isNaN(next) ? event.currentTarget.value : next);
      }}
    />
  );

  const controlOf = (name: string, spec: Control) => {
    const value = () => args()[name];
    return (
      <label class={row}>
        <span class={note}>{name}</span>
        <Show when={spec.type === "boolean"}>
          <input
            type="checkbox"
            checked={value() === true}
            onChange={(event) => setArg(name, event.currentTarget.checked)}
          />
        </Show>
        <Show when={spec.type === "select" ? spec : undefined}>
          {(select) => (
            <select
              class={control}
              value={shown(value())}
              onChange={(event) => setArg(name, event.currentTarget.value)}
            >
              <For each={select().options}>
                {(option) => <option value={option}>{option}</option>}
              </For>
            </select>
          )}
        </Show>
        <Show when={spec.type === "text"}>
          <input
            class={control}
            type="text"
            value={shown(value())}
            onInput={(event) => setArg(name, event.currentTarget.value)}
          />
        </Show>
        <Show when={spec.type === "number" || spec.type === "range"}>
          {numeric(name, spec as Extract<Control, { type: "number" | "range" }>, value)}
        </Show>
      </label>
    );
  };

  const controls = createMemo<ReadonlyArray<readonly [string, Control]>>(() =>
    Object.entries(current()?.argTypes ?? {}).map(([name, spec]) => [name, spec] as const),
  );

  const sections = createMemo(() => {
    const byItem = new Map<string, StoryEntry[]>();
    for (const entry of all()) {
      byItem.set(entry.item, [...(byItem.get(entry.item) ?? []), entry]);
    }
    return [...byItem].map(([item, entries]) => ({ item, entries }));
  });

  const story = () => {
    const entry = current();
    return entry === undefined ? <span class={note}>no stories</span> : entry.view(args());
  };

  return (
    <div class={shell} data-part="storybook" data-panels={mine()}>
      <Show when={showRail()}>
        <nav class={rail} data-part="rail">
          <div class={bar}>
            <h1 class={heading}>@cssints/ds</h1>
            <Show when={mine() === "both"}>
              <button type="button" class={chip} data-part="detach" onClick={detach}>
                Panels in a window
              </button>
            </Show>
          </div>
          <For each={sections()}>
            {(section) => (
              <div class={group}>
                <h2 class={heading}>{section.item}</h2>
                <For each={section.entries}>
                  {(entry) => (
                    <button
                      type="button"
                      class={button}
                      data-story={entry.id}
                      aria-current={current()?.id === entry.id ? "true" : undefined}
                      onClick={() => choose(entry)}
                    >
                      {entry.name}
                    </button>
                  )}
                </For>
              </div>
            )}
          </For>
          <div class={group} data-part="controls">
            <h2 class={heading}>Controls</h2>
            <For each={controls()}>{([name, spec]) => controlOf(name, spec)}</For>
            <Show when={Object.keys(current()?.argTypes ?? {}).length === 0}>
              <span class={note}>this story declares no controls</span>
            </Show>
          </div>
        </nav>
      </Show>
      <Show when={showCanvas()}>
        <main class={canvas} data-part="canvas" data-story={current()?.id}>
          {story()}
        </main>
      </Show>
    </div>
  );
};
