import {
  accentColor,
  bg,
  border,
  borderBottom,
  borderRadius,
  cn,
  color,
  display,
  flex,
  flexGrow,
  fontSize,
  fontWeight,
  height,
  margin,
  marginBottom,
  padding,
  width,
} from "cssints" with { type: "cssints" };
import { frame } from "cssints/frame" with { type: "cssints" };
import { createSignal } from "solid-js";

import { Header } from "../Shell.tsx";
import { apply, load, MODES, save, type Settings } from "../settings.ts";
import { t } from "../theme.ts" with { type: "cssints" };

const section = cn(
  flex().direction("column").gap(3),
  padding(t.gutter.base),
  borderBottom(t.border.width, "solid", t.color.border),
  margin("0"),
);
const heading = cn(fontSize(t.fontSize.lg), fontWeight(t.fontWeight.bold), margin("0"));
const legend = cn(heading, padding("0"), marginBottom(t.space.md));
const hint = cn(margin("0"), color(t.color.textMedium), fontSize(t.fontSize.sm));
const row = cn(flex().alignItems("center").gap(3));
const option = cn(flex().alignItems("center").gap(2));
const control = cn(accentColor(t.color.accent), margin("0"));
const slider = cn(control, flexGrow(1));

// The derived accent colours, drawn from the tokens: they follow the slider and the mode.
const swatch = cn(
  flex().direction("column").alignItems("center").gap(1),
  fontSize(t.fontSize.xs),
  color(t.color.textMedium),
);
const chip = cn(
  width(t.avatar.feed),
  height(t.avatar.feed),
  borderRadius(t.radius.sm),
  border(t.border.width, "solid", t.color.border),
);
const swatches = [
  ["accent", cn(chip, bg(t.color.accent))],
  ["hover", cn(chip, bg(t.color.accentHover))],
  ["strong", cn(chip, bg(t.color.accentStrong))],
  ["soft", cn(chip, bg(t.color.accentSoft))],
] as const;

// The two square flags: a button made of two frames (the inner radius follows the outer one) and the two avatar sizes.
const button = cn(
  frame().radius(t.radius.button).padding(1),
  bg(t.color.accent),
  display("inline-flex"),
);
const buttonLabel = cn(
  frame().padding(3),
  bg(t.color.accentHover),
  color(t.color.onAccent),
  fontWeight(t.fontWeight.semiBold),
);
const avatar = cn(bg(t.color.accent), display("block"));
const avatarBig = cn(
  avatar,
  width(t.avatar.feed),
  height(t.avatar.feed),
  borderRadius(t.radius.avatar),
);
const avatarSmall = cn(avatar, width("24px"), height("24px"), borderRadius(t.radius.avatarSmall));

const fieldset = cn(border("0"), padding("0"), margin("0"), section);

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
        <legend class={legend}>Theme</legend>
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
