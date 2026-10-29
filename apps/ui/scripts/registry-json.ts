// Emits the shadcn registry items for the starters: `r/<name>.json`, one per component, with the
// component, its sheet, its fixture, the driver it walks with, the test and the config, plus
// `r/registry.json`, the index a registry CLI and the docs site read.
//
// A copy lands flat in `src/components/ui/`, so every file keeps its relative imports and the test
// runs with the same `vitest.browser.config.ts` the theme arrives with.
//
//   node scripts/registry-json.ts
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const read = (path: string): string => readFileSync(join(root, path), "utf8");

const target = (name: string): string => `src/components/ui/${name}`;

interface ItemFile {
  readonly path: string;
  readonly target: string;
  readonly type: "registry:ui" | "registry:file";
  readonly content: string;
}

const file = (targetPath: string, type: ItemFile["type"], source: string): ItemFile => ({
  path: targetPath.replace("src/components/ui/", ""),
  target: targetPath,
  type,
  content: read(source),
});

interface Starter {
  readonly name: string;
  readonly title: string;
  readonly description: string;
  /**
   * The component styles itself with cssints (macros and tokens in the `.tsx`): the item needs the plugin, ships the source
   * only, and its test is the combinations suite (`test/combos.mjs`). The older starters ship a compiled sheet instead.
   */
  readonly styled?: boolean;
  /** Files of the kit a copy of this component needs beside it (relative to `src/registry`). */
  readonly with?: ReadonlyArray<string>;
  /** Other items this one is composed with (their files arrive here too, `with`). */
  readonly also?: ReadonlyArray<string>;
}

const STARTERS: ReadonlyArray<Starter> = [
  {
    name: "card",
    title: "Card",
    description: "A surface and a frame with parts: `Card.Header`, `Card.Body`, `Card.Footer`",
    styled: true,
    with: ["render.tsx", "theme.ts", "tokens.ts"],
  },
  {
    name: "field",
    title: "Field",
    description:
      "A label, a control, a hint and an error: the ids and the ARIA are `createField`'s",
    styled: true,
    also: ["@cssints/input"],
    with: ["input/input.tsx", "render.tsx", "theme.ts", "tokens.ts"],
  },
  {
    name: "input",
    title: "Input",
    description: "A text field on the neutral theme, and the control `Field` puts in by default",
    styled: true,
    with: ["render.tsx", "theme.ts", "tokens.ts"],
  },
  {
    name: "switch",
    title: "Switch",
    description: "APG switch on @cssints/headless, on the neutral theme, with its scenario test",
  },
  {
    name: "disclosure",
    title: "Disclosure",
    description:
      "APG disclosure on @cssints/headless, on the neutral theme, with its scenario test",
  },
  {
    name: "button",
    title: "Button",
    description:
      "APG button and toggle button: `tone` and `size` variants, and `render` for a link",
    styled: true,
    with: ["render.tsx", "theme.ts", "tokens.ts"],
  },
  {
    name: "checkbox",
    title: "Checkbox",
    description: "APG checkbox, including the mixed tri-state, on @cssints/headless",
  },
  {
    name: "radio",
    title: "Radio group",
    description: "APG radio group with roving tabindex or aria-activedescendant focus",
  },
  {
    name: "tabs",
    title: "Tabs",
    description: "APG tabs: roving tabindex, automatic or manual activation, wrapped arrows",
  },
  {
    name: "accordion",
    title: "Accordion",
    description: "APG accordion: multiple or single expansion, headed triggers, collapsible",
  },
];

// A styled component is source that needs cssints in the project's build: no compiled sheet, no copied conformance test
// (the behaviour is `@cssints/headless`'s, tested there; the look is one component's, and the combinations suite covers the
// pairs). The older starters still ship the sheet their copy reads.
const kitFiles = (item: Starter) => [
  file(target(`${item.name}.tsx`), "registry:ui", `src/registry/${item.name}/${item.name}.tsx`),
  ...(item.with ?? []).map((path) =>
    file(target(path.split("/").at(-1) ?? path), "registry:file", `src/registry/${path}`),
  ),
];

const compiledFiles = (item: Starter) => [
  file(target(`${item.name}.tsx`), "registry:ui", `src/registry/${item.name}/${item.name}.tsx`),
  file(target(`${item.name}.css`), "registry:file", `src/registry/${item.name}/${item.name}.css`),
  file(
    target(`${item.name}.fixture.tsx`),
    "registry:file",
    `src/registry/${item.name}/${item.name}.fixture.tsx`,
  ),
  file(target("dom-driver.ts"), "registry:file", `src/registry/${item.name}/dom-driver.ts`),
  file(
    target(`${item.name}.browser.test.tsx`),
    "registry:file",
    `src/registry/${item.name}/${item.name}.browser.test.tsx`,
  ),
  file("src/vitest.browser.config.ts", "registry:file", "vitest.browser.config.ts"),
];

const starter = (item: Starter) => ({
  $schema: "https://ui.shadcn.com/schema/registry-item.json",
  name: item.name,
  type: "registry:ui",
  title: item.title,
  description: item.description,
  dependencies: item.styled ? ["@cssints/headless", "cssints"] : ["@cssints/headless"],
  // Only what the copied test imports. The runner itself (Vite+ with its browser provider, and
  // the Solid 2 plugin) is the project's: its versions have to agree with the project's
  // `solid-js` rc, which this item cannot know.
  devDependencies: item.styled ? [] : ["@cssints/apg-specs@^0.6.0", "@quint-machine/core@0.1.0"],
  registryDependencies: ["@cssints/theme", ...(item.also ?? [])],
  files: item.styled ? kitFiles(item) : compiledFiles(item),
});

const theme = {
  $schema: "https://ui.shadcn.com/schema/registry-item.json",
  name: "theme",
  type: "registry:file",
  title: "Neutral theme",
  description:
    "The neutral theme as plain custom properties, derived from React Aria's starter (Apache-2.0)",
  files: [file(target("theme.css"), "registry:file", "src/registry/theme.css")],
};

const items = [theme, ...STARTERS.map(starter)];

const out = join(root, "r");
mkdirSync(out, { recursive: true });
for (const [name, item] of items.map((item) => [item.name, item] as const)) {
  writeFileSync(join(out, `${name}.json`), `${JSON.stringify(item, null, 2)}\n`);
}

writeFileSync(
  join(out, "registry.json"),
  `${JSON.stringify(
    {
      $schema: "https://ui.shadcn.com/schema/registry.json",
      name: "cssints",
      homepage: "https://ui.cssints.dev",
      items: items.map(({ files, ...rest }) => ({
        ...rest,
        files: files.map(({ content: _content, ...file }) => file),
      })),
    },
    null,
    2,
  )}\n`,
);

// The machine-readable index: what an agent reads before it knows which page to open.
const lines = [
  "# cssints ui",
  "",
  "Styled APG starters over `@cssints/headless` (Solid 2), on one neutral theme.",
  "Behaviour is the npm dependency; a starter adds the component, its sheet and its test.",
  "",
  "Install into a Solid 2 + Vite project (see https://ui.cssints.dev for the template):",
  "",
  "```sh",
  "npx shadcn@latest add @cssints/<name>",
  "```",
  "",
  `Registry: https://packages.cssints.dev/r/{name}.json (index: /r/registry.json)`,
  "",
  "## Items",
  "",
  ...STARTERS.map((item) => `- ${item.name}: ${item.description}. \`add @cssints/${item.name}\``),
  "- theme: the neutral theme as plain custom properties; arrives with any starter",
  "",
  "## How a component is written",
  "",
  "A styled component (`button`, `card`, `field`, `input`) is one `.tsx`: styles are `cn()`/`cv()`",
  "with the theme's tokens, states are the ARIA attributes the widget announces (`attr()`,",
  "`within()`), and `render` replaces a part with another component or tag. Such a copy needs",
  "`cssints` in the project's Vite config; the combinations (`Card` + `Button`, `Field` + `Input`)",
  "are checked in this repository's `test/combos.mjs`.",
  "",
  "The older starters (`switch`, `disclosure`, `checkbox`, `radio`, `tabs`, `accordion`) ship a",
  "compiled sheet authored in `src/registry/<name>/<name>.ts`, so a copy needs no plugin and runs",
  "its conformance test as it arrives. The theme is compiled from `tokens.ts` the same way.",
  "",
];
mkdirSync(join(root, "public"), { recursive: true });
writeFileSync(join(root, "public", "llms.txt"), lines.join("\n"));

process.stdout.write(`${items.length} items in ${out}\n`);
