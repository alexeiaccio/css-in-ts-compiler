// The appearance settings, kept in localStorage and written onto <html>: the mode and the two square flags as classes
// (theme.ts), the hue as --hue-accent. index.html has an inline copy of apply() that runs before the first paint;
// test/settings.mjs checks that the two agree.
export const KEY = "sky.settings";
// hue.accent of tokens.json (Mu pink): the slider is Witchsky's shift from it, -180 to 180.
export const BASE_HUE = 345;
export const MODES = ["system", "light", "dim", "dark"] as const;
export type Mode = (typeof MODES)[number];

export interface Settings {
  hue: number;
  mode: Mode;
  squareButtons: boolean;
  squareAvatars: boolean;
}

export const defaults: Settings = {
  hue: 0,
  mode: "system",
  squareButtons: false,
  squareAvatars: false,
};

/** Reads stored JSON; each field that is missing or invalid takes its default, the others are kept. */
export function parse(raw: string | null): Settings {
  let o: Partial<Record<keyof Settings, unknown>> = {};
  try {
    const v: unknown = JSON.parse(raw ?? "");
    if (v && typeof v === "object") o = v;
  } catch {
    // not JSON: defaults
  }
  return {
    hue:
      typeof o.hue === "number" && Number.isInteger(o.hue) && Math.abs(o.hue) <= 180
        ? o.hue
        : defaults.hue,
    mode: MODES.find((m) => m === o.mode) ?? defaults.mode,
    squareButtons: o.squareButtons === true,
    squareAvatars: o.squareAvatars === true,
  };
}

/** The stored settings, or the defaults (also where storage is blocked). */
export function load(): Settings {
  try {
    return parse(localStorage.getItem(KEY));
  } catch {
    return defaults;
  }
}

/** Stores the settings; a blocked storage keeps them for the session only. */
export function save(s: Settings): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // private mode or a full quota
  }
}

/** The CSS hue of a slider position. */
export const hueOf = (shift: number): number => (BASE_HUE + shift + 360) % 360;

/** Puts the settings on <html>: theme classes and the one custom property the accent colours derive from. */
export function apply(
  s: Settings,
  root: Pick<HTMLElement, "classList" | "style"> = document.documentElement,
): void {
  for (const m of ["light", "dim", "dark"]) root.classList.toggle(m, s.mode === m);
  root.classList.toggle("square-buttons", s.squareButtons);
  root.classList.toggle("square-avatars", s.squareAvatars);
  root.style.setProperty("--hue-accent", String(hueOf(s.hue)));
}
