// The display settings, kept in localStorage and written onto <html>: the mode as classes and the text size, density, font and
// corners as data attributes (theme.ts and base.ts hold the rules that read them), the hue as --hue-accent. index.html has an
// inline copy of apply() that runs before the first paint; test/settings.mjs checks that the two agree.
export const KEY = "cssints-docs.settings";
// hue.accent of tokens.json
export const BASE_HUE = 269;
export const OPTIONS = {
  mode: ["system", "light", "dim", "dark"],
  text: ["small", "normal", "large"],
  density: ["compact", "normal", "comfortable"],
  font: ["sans", "serif", "mono"],
  radius: ["sharp", "normal", "round"],
} as const;
export type Choice = keyof typeof OPTIONS;
export type Settings = { hue: number } & { [K in Choice]: (typeof OPTIONS)[K][number] };

export const defaults: Settings = {
  hue: BASE_HUE,
  mode: "system",
  text: "normal",
  density: "normal",
  font: "sans",
  radius: "normal",
};

// Reads stored JSON; each field that is missing or invalid takes its default, the others are kept.
export function parse(raw: string | null): Settings {
  let o: Record<string, unknown> = {};
  try {
    const v: unknown = JSON.parse(raw ?? "");
    if (v && typeof v === "object") o = v as Record<string, unknown>;
  } catch {
    // not JSON: defaults
  }
  const s = { ...defaults };
  if (typeof o.hue === "number" && Number.isInteger(o.hue) && o.hue >= 0 && o.hue < 360)
    s.hue = o.hue;
  for (const k of Object.keys(OPTIONS) as Choice[]) {
    const v = (OPTIONS[k] as readonly unknown[]).find((x) => x === o[k]);
    if (v) (s as Record<Choice, unknown>)[k] = v;
  }
  return s;
}

// The stored settings, or the defaults (also where storage is blocked).
export function load(): Settings {
  try {
    return parse(localStorage.getItem(KEY));
  } catch {
    return defaults;
  }
}

// Stores the settings; a blocked storage keeps them for the session only.
export function save(s: Settings): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // private mode or a full quota
  }
}

// Puts the settings on <html>. Dim is dark with a class of its own, so what follows `.dark` (color-scheme, the code colours)
// follows dim too.
export function apply(
  s: Settings,
  root: Pick<HTMLElement, "classList" | "style" | "dataset"> = document.documentElement,
): void {
  root.classList.toggle("light", s.mode === "light");
  root.classList.toggle("dark", s.mode === "dark" || s.mode === "dim");
  root.classList.toggle("dim", s.mode === "dim");
  root.dataset.text = s.text;
  root.dataset.density = s.density;
  root.dataset.font = s.font;
  root.dataset.radius = s.radius;
  root.style.setProperty("--hue-accent", String(s.hue));
}
