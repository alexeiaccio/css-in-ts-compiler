// The two design-system specs whose numbers are our data: `palette.json` and `contrast.json`. This script writes them
// from the token set and the engine's own contrast, so a token change cannot leave a figure stale — `solid/test.sh`
// regenerates them into a temp directory and `cmp`s them with the files in this directory (a drift is a `cmp` line).
//
//   node native/solid/specs/from-tokens.ts            rewrites palette.json and contrast.json here in place
//   node native/solid/specs/from-tokens.ts <dir>      writes them into <dir> (the check's own way: it writes nothing)
//
// Where the numbers come from, and why these two are the generated ones:
//   — palette: `@cssints/tokens`' Open Props set (packages/tokens/src/open-props.ts), its blue scale 0..12 on its gray.0
//     page — the hue and the paper that apps/docs/src/palettes.ts maps as the `open-props` palette's accent and bg. Every
//     step's contrast is `packages/cssints/src/color.ts`'s `luminance`/`ratio`, the functions `css.check.contrast`
//     measures with. Open Props and not Radix: its scales are one flat object of hex values a scale is read out of, where
//     Radix's light and dark themes are two sets of overrides, and the docs' mapping of Open Props is step for step.
//   — contrast: the six pairs apps/docs draws and checks in apps/docs/src/theme.ts (text on each paper, the two secondary
//     inks, the link, the accent as a fill and the ink on the accent), at that file's floors. The colours are the
//     palette function's own output (`palettes["open-props"](0).light`), so a role's value is never typed here — and the
//     ratio is the engine's, which is the whole point of the kind: the number is exact in the spec and the figure prints
//     it at two places (`shown`).
// The other two of the four are hand-written, and say so: spacing.json and type-scale.json are apps/docs/src/tokens.json
// (`space` and `fontSize`), where the line height is a role's choice (prose.ts's 1.7, the headings' 1.2) and not a token.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** The repository, from this file (native/solid/specs). */
const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

const { colors } = await import(`${REPO}/packages/tokens/src/open-props.ts`);
const { palettes } = await import(`${REPO}/apps/docs/src/palettes.ts`);
const { luminance, ratio } = await import(`${REPO}/packages/cssints/src/color.ts`);

/** The engine's ratio of two hex colours: the number itself, which the figure prints at two places (`shown`). */
const contrast = (fg: string, bg: string): number => ratio(luminance(fg).lum!, luminance(bg).lum!);

type Leaf = { $value: string };
const steps = (scale: Record<string, Leaf | string>): { name: string; value: string }[] =>
  Object.entries(scale)
    .filter(([name]) => name !== "$type")
    .map(([name, token]) => ({ name, value: ((token as Leaf).$value ?? token) as string }));

const page = (colors.gray["0"] as Leaf).$value;
const palette = {
  kind: "palette",
  title: "The blue and grey scales, on the page",
  intent: `@cssints/tokens' Open Props blue and grey, step by step, with each step's contrast on the page it is read on.`,
  source: "packages/tokens/src/open-props.ts (blue, gray; page gray.0); ratio: color.ts",
  data: { page, hues: [{ name: "Blue", steps: steps(colors.blue) }, { name: "Grey", steps: steps(colors.gray) }] },
};

const light = palettes["open-props"](0).light;
const floors: [string, string, string, number][] = [
  ["text on bg", light.text, light.bg, 7],
  ["textMedium on bgMuted", light.textMedium, light.bgMuted, 4.5],
  ["textLow on bgSubtle", light.textLow, light.bgSubtle, 4.5],
  ["link on bgSubtle", light.link, light.bgSubtle, 4.5],
  ["accent on bg", light.accent, light.bg, 3],
  ["onAccent on accent", light.onAccent, light.accent, 4.5],
];
const contrastSpec = {
  kind: "contrast",
  title: "The docs' colour roles, on their pages",
  intent: `The pairs the documentation site sets text and marks in, each held to WCAG's floor: the ratio is the engine's own.`,
  source: "apps/docs/src/palettes.ts (open-props, light); ratio: cssints/src/color.ts",
  data: floors.map(([label, fg, bg, min]) => ({ label, fg, bg, min, ratio: contrast(fg, bg) })),
};

const out = process.argv[2] ? resolve(process.argv[2]) : dirname(fileURLToPath(import.meta.url));
mkdirSync(out, { recursive: true });
for (const [name, spec] of [
  ["palette.json", palette],
  ["contrast.json", contrastSpec],
] as const) {
  writeFileSync(resolve(out, name), `${JSON.stringify(spec, null, 2)}\n`);
  console.log(`from-tokens: ${resolve(out, name)}`);
}
