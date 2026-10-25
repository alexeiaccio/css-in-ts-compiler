// Emits the shadcn registry items for the starters: `r/<name>.json`, one per component, with
// the component, its sheet, its fixture, the driver it walks with, the test and the config.
//
// A copy lands flat in `src/components/ui/`, so every file keeps its relative imports and the
// test runs with the same `vitest.browser.config.ts` the theme arrives with.
//
//   node scripts/registry-json.ts
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const read = (path: string): string => readFileSync(join(root, path), "utf8");

const target = (name: string): string => `src/components/ui/${name}`;

/** The files every starter ships beside its own: the theme, the walk, and the runner's config. */
const shared = (): Array<ItemFile> => [
  file(target("theme.css"), "registry:file", "src/registry/theme.css"),
];

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

const starter = (name: "switch" | "disclosure") => ({
  $schema: "https://ui.shadcn.com/schema/registry-item.json",
  name,
  type: "registry:ui",
  title: name === "switch" ? "Switch" : "Disclosure",
  description:
    name === "switch"
      ? "APG switch on @cssints/headless, on the neutral theme, with its scenario test"
      : "APG disclosure on @cssints/headless, on the neutral theme, with its scenario test",
  dependencies: ["@cssints/headless"],
  // Only what the copied test imports. The runner itself (Vite+ with its browser provider, and
  // the Solid 2 plugin) is the project's: its versions have to agree with the project's
  // `solid-js` rc, which this item cannot know.
  devDependencies: ["@cssints/apg-specs@^0.6.0", "@quint-machine/core@0.1.0"],
  registryDependencies: ["@cssints/theme"],
  files: [
    file(target(`${name}.tsx`), "registry:ui", `src/registry/${name}/${name}.tsx`),
    file(target(`${name}.css`), "registry:file", `src/registry/${name}/${name}.css`),
    file(
      target(`${name}.fixture.tsx`),
      "registry:file",
      `src/registry/${name}/${name}.fixture.tsx`,
    ),
    file(target("dom-driver.ts"), "registry:file", `src/registry/${name}/dom-driver.ts`),
    file(
      target(`${name}.browser.test.tsx`),
      "registry:file",
      `src/registry/${name}/${name}.browser.test.tsx`,
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
  files: shared(),
};

const items = { theme, switch: starter("switch"), disclosure: starter("disclosure") };

const out = join(root, "r");
mkdirSync(out, { recursive: true });
for (const [name, item] of Object.entries(items)) {
  writeFileSync(join(out, `${name}.json`), `${JSON.stringify(item, null, 2)}\n`);
}

writeFileSync(
  join(out, "registry.json"),
  `${JSON.stringify(
    {
      $schema: "https://ui.shadcn.com/schema/registry.json",
      name: "cssints",
      homepage: "https://ui.cssints.dev",
      items: Object.values(items).map(({ files, ...rest }) => ({
        ...rest,
        files: files.map(({ content, ...file }) => file),
      })),
    },
    null,
    2,
  )}\n`,
);
process.stdout.write(`${Object.keys(items).length} items in ${out}\n`);
