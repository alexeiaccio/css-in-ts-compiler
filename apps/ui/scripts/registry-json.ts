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
}

const STARTERS: ReadonlyArray<Starter> = [
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
    description: "APG button and toggle button on @cssints/headless, on the neutral theme",
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

const starter = (item: Starter) => ({
  $schema: "https://ui.shadcn.com/schema/registry-item.json",
  name: item.name,
  type: "registry:ui",
  title: item.title,
  description: item.description,
  dependencies: ["@cssints/headless"],
  // Only what the copied test imports. The runner itself (Vite+ with its browser provider, and
  // the Solid 2 plugin) is the project's: its versions have to agree with the project's
  // `solid-js` rc, which this item cannot know.
  devDependencies: ["@cssints/apg-specs@^0.6.0", "@quint-machine/core@0.1.0"],
  registryDependencies: ["@cssints/theme"],
  files: [
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
  ],
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
        files: files.map(({ content, ...file }) => file),
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
  "## How a skin is written",
  "",
  "Each skin is authored on cssints (`src/registry/<name>/<name>.ts`) and compiled to `<name>.css`",
  "by `scripts/component-css.ts`; an item ships the compiled sheet, so a project needs no cssints",
  "plugin and the copy can run the conformance test it arrives with. The theme is compiled from",
  "`tokens.ts` the same way. Every value a skin reads is a theme custom property.",
  "",
];
mkdirSync(join(root, "public"), { recursive: true });
writeFileSync(join(root, "public", "llms.txt"), lines.join("\n"));

process.stdout.write(`${items.length} items in ${out}\n`);
