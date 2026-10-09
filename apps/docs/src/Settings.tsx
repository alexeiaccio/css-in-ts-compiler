import * as css from "cssints" with { type: "cssints" };
import { createSignal } from "solid-js";

import { apply, defaults, load, OPTIONS, save, type Choice, type Settings } from "./settings.ts";
import { t } from "./theme.ts" with { type: "cssints" };

// A popover under the header: the browser opens it from the button (popovertarget), closes it on Escape or a click outside,
// and gives the focus back to the button; the panel follows the button in the document, so Tab goes into it.
const panel = css.cn(
  css.position("fixed"),
  css.top(t.layout.headerHeight),
  css.right(t.space.lg),
  css.bottom("auto"),
  css.left("auto"),
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
  mode: "Colour mode",
  text: "Text size",
  density: "Density",
  font: "Font",
  radius: "Corners",
};

export function SettingsPanel() {
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
  return (
    <div id="settings" popover role="dialog" aria-label="Display settings" class={panel}>
      <fieldset class={group}>
        <legend class={legend}>Accent hue</legend>
        <div class={row}>
          <input
            type="range"
            class={slider}
            min="0"
            max="359"
            step="1"
            aria-label="Accent hue"
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
      {(Object.keys(OPTIONS) as Choice[]).map((key) => (
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
                {value}
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      <button type="button" class={reset} onClick={() => set(defaults)}>
        Reset
      </button>
    </div>
  );
}
