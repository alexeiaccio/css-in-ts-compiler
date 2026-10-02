import * as css from "cssints" with { type: "cssints" };
import { frame } from "cssints/frame" with { type: "cssints" };
import { createSignal } from "solid-js";

import { Header } from "../Shell.tsx";
import { apply, load, MODES, save, type Settings } from "../settings.ts";
import { t } from "../theme.ts" with { type: "cssints" };

const section = css.cn(
  css.flex().direction("column").gap(3),
  css.padding(t.gutter.base),
  css.borderBottom(t.border.width, "solid", t.color.border),
  css.margin("0"),
);
const heading = css.cn(
  css.fontSize(t.fontSize.lg),
  css.fontWeight(t.fontWeight.bold),
  css.margin("0"),
);
const hint = css.cn(css.margin("0"), css.color(t.color.textMedium), css.fontSize(t.fontSize.sm));
const row = css.cn(css.flex().alignItems("center").gap(3));
const option = css.cn(css.flex().alignItems("center").gap(2));
const control = css.cn(css.accentColor(t.color.accent), css.margin("0"));
const slider = css.cn(control, css.flexGrow(1));

// The derived accent colours, drawn from the tokens: they follow the slider and the mode.
const swatch = css.cn(
  css.flex().direction("column").alignItems("center").gap(1),
  css.fontSize(t.fontSize.xs),
  css.color(t.color.textMedium),
);
const chip = css.cn(
  css.width(t.avatar.feed),
  css.height(t.avatar.feed),
  css.borderRadius(t.radius.sm),
  css.border(t.border.width, "solid", t.color.border),
);
const swatches = [
  ["accent", css.cn(chip, css.bg(t.color.accent))],
  ["hover", css.cn(chip, css.bg(t.color.accentHover))],
  ["strong", css.cn(chip, css.bg(t.color.accentStrong))],
  ["soft", css.cn(chip, css.bg(t.color.accentSoft))],
] as const;

// The two square flags: a button made of two frames (the inner radius follows the outer one) and the two avatar sizes.
const button = css.cn(
  frame().radius(t.radius.button).padding(1),
  css.bg(t.color.accent),
  css.display("inline-flex"),
);
const buttonLabel = css.cn(
  frame().padding(3),
  css.bg(t.color.accentHover),
  css.color(t.color.onAccent),
  css.fontWeight(t.fontWeight.semiBold),
);
const avatar = css.cn(css.bg(t.color.accent), css.display("block"));
const avatarBig = css.cn(
  avatar,
  css.width(t.avatar.feed),
  css.height(t.avatar.feed),
  css.borderRadius(t.radius.avatar),
);
const avatarSmall = css.cn(
  avatar,
  css.width("24px"),
  css.height("24px"),
  css.borderRadius(t.radius.avatarSmall),
);

const fieldset = css.cn(css.border("0"), css.padding("0"), css.margin("0"), section);

export default function SettingsScreen() {
  const [s, setS] = createSignal(load());
  const set = (patch: Partial<Settings>) => {
    const next = { ...s(), ...patch };
    setS(next);
    save(next);
    apply(next);
  };
  return (
    <>
      <Header title="Settings" />
      <section class={section}>
        <h2 class={heading}>Accent hue</h2>
        <div class={row}>
          <input
            type="range"
            class={slider}
            min="-180"
            max="180"
            step="1"
            aria-label="Accent hue"
            value={s().hue}
            onInput={(e) => set({ hue: e.currentTarget.valueAsNumber })}
          />
          <output data-testid="hue">{s().hue}</output>
        </div>
        <div class={row}>
          {swatches.map(([name, cls]) => (
            <div class={swatch}>
              <span class={cls} data-testid={`swatch-${name}`} />
              {name}
            </div>
          ))}
        </div>
        <p class={hint}>0 is the default pink. Every accent colour is derived from this one hue.</p>
      </section>
      <fieldset class={fieldset}>
        <legend class={heading}>Theme</legend>
        {MODES.map((m) => (
          <label class={option}>
            <input
              type="radio"
              class={control}
              name="mode"
              value={m}
              checked={s().mode === m}
              onChange={() => set({ mode: m })}
            />
            {m}
          </label>
        ))}
        <p class={hint}>System follows the browser; dim is a soft black.</p>
      </fieldset>
      <section class={section}>
        <h2 class={heading}>Shapes</h2>
        <label class={option}>
          <input
            type="checkbox"
            class={control}
            checked={s().squareButtons}
            onChange={(e) => set({ squareButtons: e.currentTarget.checked })}
          />
          Square buttons
        </label>
        <label class={option}>
          <input
            type="checkbox"
            class={control}
            checked={s().squareAvatars}
            onChange={(e) => set({ squareAvatars: e.currentTarget.checked })}
          />
          Square avatars
        </label>
        <div class={row}>
          <span class={button} data-testid="button">
            <span class={buttonLabel} data-testid="button-label">
              Button
            </span>
          </span>
          <span class={avatarBig} data-testid="avatar" />
          <span class={avatarSmall} data-testid="avatar-small" />
        </div>
      </section>
    </>
  );
}
