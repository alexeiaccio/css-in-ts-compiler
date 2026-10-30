import { createPopover } from "@cssints/headless";
import type { Style } from "cssints";
import * as css from "cssints" with { type: "cssints" };
import { Portal } from "@solidjs/web";
import { createSignal, onCleanup } from "solid-js";

import { ph } from "./icons.ts" with { type: "cssints" };
import {
  apply,
  defaults,
  HUES,
  load,
  OPTIONS,
  save,
  WHEEL,
  type Choice,
  type Settings,
} from "./settings.ts";
import { t } from "./theme.ts" with { type: "cssints" };

const settingsIcon = css.cn(ph("sliders-horizontal"), css.width("20px"), css.height("20px"));

// A popover under its button: createPopover (@cssints/headless) opens it, closes it on Escape or an outside pointerdown, and
// gives the focus back to the button. It is not native `popover` any more, so it is not in the top layer: it renders in a portal
// on <body> at a page position measured from the button, and its z-index has to clear the header's (30).
const panel: Style = css.cn(
  css.zIndex(40),
  css.margin("0"),
  css.width("min(360px, calc(100vw - 32px))"),
  css.maxHeight("calc(100dvh - 72px)"),
  css.overflowY("auto"),
  css.padding(t.space.lg),
  css.bg(t.color.bg),
  css.color(t.color.text),
  css.border(t.border.width, "solid", t.color.borderStrong),
  css.borderRadius(t.radius.md),
  css.boxShadow("0 8px 32px var(--color-shadow)"),
);
const group = css.cn(
  css.border("0"),
  css.margin("0"),
  css.marginBottom(t.space.lg),
  css.padding("0"),
  css.minWidth("0"),
);
const legend = css.cn(
  css.padding("0"),
  css.marginBottom(t.space.sm),
  css.fontSize(t.fontSize.sm),
  css.fontWeight(t.fontWeight.semiBold),
  css.color(t.color.textMedium),
);
const row = css.cn(css.flex().alignItems("center").gap(3), css.flexWrap("wrap"));
const option = css.cn(
  css.flex().alignItems("center").gap(1),
  css.fontSize(t.fontSize.sm),
  css.textTransform("capitalize"),
);
const control = css.cn(css.accentColor(t.color.accent), css.margin("0"));
const slider = css.cn(control, css.flexGrow(1), css.minWidth("0"));
const chip = css.cn(
  css.width("28px"),
  css.height("28px"),
  css.borderRadius(t.radius.sm),
  css.border(t.border.width, "solid", t.color.border),
);
const swatches = [
  ["accent", css.cn(chip, css.bg(t.color.accent))],
  ["strong", css.cn(chip, css.bg(t.color.accentStrong))],
  ["soft", css.cn(chip, css.bg(t.color.accentSoft))],
] as const;
const reset = css.cn(
  css.padding(t.space.xs, t.space.md),
  css.border(t.border.width, "solid", t.color.borderStrong),
  css.borderRadius(t.radius.sm),
  css.bg(t.color.bgSubtle),
  css.color(t.color.text),
  css.fontSize(t.fontSize.sm),
  css.cursor("pointer"),
  css.hover(css.bg(t.color.bgMuted)),
  css.focusVisible(css.outline("2px solid", t.color.accent), css.outlineOffset("2px")),
);

const LABELS: Record<Choice, string> = {
  palette: "Palette",
  mode: "Colour mode",
  text: "Text size",
  density: "Density",
  font: "Font",
  radius: "Corners",
};

const NAMES: Record<string, string> = {
  cssints: "cssints (logo)",
  "open-props": "Open Props",
  "reasonable-colors": "Reasonable Colors",
};
const credits = css.cn(
  css.margin("0", "0", t.space.lg),
  css.fontSize(t.fontSize.xs),
  css.color(t.color.textMedium),
  css.lineHeight(t.lineHeight.snug),
);
const link = css.cn(css.color(t.color.link));

export function SettingsPanel(props: { triggerClass?: string | undefined }) {
  // Controlled, so Escape can close it from anywhere on the page (see the keydown listener below).
  const [open, setOpen] = createSignal(false);
  const popover = createPopover({
    id: "settings",
    placement: "bottom-end",
    get open() {
      return open();
    },
    onOpenChange: setOpen,
  });
  let trigger: HTMLButtonElement | undefined;
  let content: HTMLDivElement | undefined;
  let teardown: (() => void) | undefined;
  // attach is the whole DOM contract of the popover: measure and place, focus in and back, light dismiss. It creates an
  // effect, so it goes in a ref (not onSettled, where Solid 2 forbids reactive primitives) once both elements exist.
  const attach = () => {
    if (trigger !== undefined && content !== undefined && teardown === undefined) {
      teardown = popover.attach(trigger, content);
    }
  };
  onCleanup(() => teardown?.());
  // Escape closes from anywhere on the page, as the native popover did: the primitive reads it from the content, which has the
  // focus while the panel is open, but not after Tab has left it.
  if (typeof document !== "undefined") {
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && open()) {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", escape, true);
    onCleanup(() => document.removeEventListener("keydown", escape, true));
  }
  // Solid 2 reads the committed value until the next flush, so two changes in one task would build on a stale s(): keep the
  // latest here.
  let current = load();
  const [s, setS] = createSignal(current);
  const set = (patch: Partial<Settings>) => {
    const next = (current = { ...current, ...patch });
    setS(next);
    save(next);
    apply(next);
  };
  const choice = (key: Choice) => (
    <fieldset class={group}>
      <legend class={legend}>{LABELS[key]}</legend>
      <div class={row}>
        {OPTIONS[key].map((value) => (
          <label class={option}>
            <input
              type="radio"
              class={control}
              name={key}
              value={value}
              checked={s()[key] === value}
              onChange={() => set({ [key]: value })}
            />
            {NAMES[value] ?? value}
          </label>
        ))}
      </div>
    </fieldset>
  );
  return (
    <>
      <button
        {...popover.triggerProps}
        ref={(element) => {
          trigger = element;
          attach();
        }}
        type="button"
        class={props.triggerClass}
        aria-label="Display settings"
        title="Display settings"
      >
        <span class={settingsIcon} />
      </button>
      <Portal>
        <div
          {...popover.contentProps}
          ref={(element) => {
            content = element;
            attach();
          }}
          style={popover.contentStyle()}
          class={panel}
          aria-label="Display settings"
        >
          {choice("palette")}
          <p class={credits}>
            Itten, Munsell and Albers are cubes of{" "}
            <a class={link} href="https://rybitten.space/">
              RYBitten
            </a>{" "}
            by meodai, read at build time by @cssints/rybitten. Radix, Flexoki, Open Props and
            Reasonable Colors come from @cssints/tokens.
          </p>
          <fieldset class={group}>
            <legend class={legend}>Accent hue</legend>
            <div class={row}>
              <input
                type="range"
                class={slider}
                min="0"
                max={HUES - 1}
                step="1"
                aria-label="Accent hue"
                disabled={!WHEEL.includes(s().palette)}
                value={s().hue}
                onInput={(e) => set({ hue: e.currentTarget.valueAsNumber })}
              />
              <output data-testid="hue">{s().hue}</output>
            </div>
            <div class={row}>
              {swatches.map(([name, cls]) => (
                <span class={cls} title={name} data-testid={`swatch-${name}`} />
              ))}
            </div>
          </fieldset>
          {(Object.keys(OPTIONS) as Choice[]).filter((k) => k !== "palette").map(choice)}
          <button type="button" class={reset} onClick={() => set(defaults)}>
            Reset
          </button>
        </div>
      </Portal>
    </>
  );
}
