// Emits the shadcn registry items for the starters: `r/<name>.json`, one per component, with the
// component, its sheet, its fixture, the driver it walks with, the test and the config, plus
// `r/registry.json`, the index a registry CLI and the docs site read.
//
// A copy lands flat in `src/components/ui/`, so every file keeps its relative imports and the test
// runs with the same `vitest.browser.config.ts` the theme arrives with.
//
//   node scripts/registry-json.ts
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const read = (path: string): string => readFileSync(join(root, path), "utf8");
const templateRoot = join(root, "..", "..", "templates", "solid-vite");
const readTemplate = (path: string): string => readFileSync(join(templateRoot, path), "utf8");

const target = (name: string): string => `src/components/ui/${name}`;

interface ItemFile {
  readonly path: string;
  readonly target: string;
  readonly type: "registry:ui" | "registry:file";
  readonly content: string;
}

const content = (targetPath: string, type: ItemFile["type"], text: string): ItemFile => ({
  path: targetPath.replace("src/components/ui/", ""),
  target: targetPath,
  type,
  content: text,
});

// A copy lands flat in `src/components/ui/`, while a component is authored one directory deeper
// (`src/registry/<name>/`): an import of a kit file loses its `../` (and the directory it names,
// if any) and keeps the file name it has in the copy (`../theme.ts` is `./theme.ts` there,
// `../input/input.tsx` and `../button/button.tsx` are `./input.tsx` and `./button.tsx`). A kit
// file is the only thing a registry source imports with `../`, so the rewrite is the whole rule.
const flatten = (text: string): string =>
  text.replaceAll(/"\.\.\/(?:[\w-]+\/)?([\w.-]+\.tsx?)"/g, '"./$1"');

const file = (targetPath: string, type: ItemFile["type"], source: string): ItemFile =>
  content(targetPath, type, flatten(read(source)));

interface Starter {
  readonly name: string;
  readonly title: string;
  readonly description: string;
  /** The item also ships its conformance test: the fixture, the driver it walks with and the browser config. */
  readonly tested?: boolean;
  /** Files of the kit a copy of this component needs beside it (relative to `src/registry`). */
  readonly with?: ReadonlyArray<string>;
  /** Other items this one is composed with (their files arrive here too, `with`). */
  readonly also?: ReadonlyArray<string>;
}

const STARTERS: ReadonlyArray<Starter> = [
  {
    tested: false,
    name: "card",
    title: "Card",
    description: "A surface and a frame with parts: `Card.Header`, `Card.Body`, `Card.Footer`",
    with: ["render.tsx", "theme.ts", "tokens.ts"],
  },
  {
    name: "field",
    tested: false,
    with: ["input/input.tsx", "render.tsx", "theme.ts", "tokens.ts"],
    title: "Field",
    description:
      "A label, a control, a hint and an error: the ids and the ARIA are `createField`'s",
    also: ["@cssints/input"],
  },
  {
    name: "dialog",
    tested: false,
    with: ["render.tsx", "theme.ts", "tokens.ts"],
    title: "Dialog",
    description:
      "APG modal dialog: a scrim, a panel on the surface, focus in and back, and Escape or the backdrop to close",
    also: ["@cssints/button"],
  },
  {
    name: "drawer",
    tested: true,
    with: ["render.tsx", "theme.ts", "tokens.ts"],
    title: "Drawer",
    description:
      "An edge-anchored panel on Dialog (Modal): a side rail or a bottom sheet, with the focus trap, Escape, the backdrop, the scroll lock and the focus return",
    also: ["@cssints/button"],
  },
  {
    name: "input",
    tested: false,
    with: ["render.tsx", "theme.ts", "tokens.ts"],
    title: "Input",
    description: "A text field on the neutral theme, and the control `Field` puts in by default",
  },
  {
    name: "toolbar",
    title: "Toolbar",
    description:
      "A toolbar: `role=toolbar`, a name, and a size the controls inside read as their context",
    tested: false,
    with: ["render.tsx", "theme.ts", "tokens.ts"],
  },
  {
    name: "button-group",
    tested: false,
    with: ["render.tsx", "theme.ts", "tokens.ts"],
    title: "Button group",
    description:
      "Buttons in one line: the corners two neighbours share and the border between them are the group's, not a prop's",
    also: ["@cssints/button"],
  },
  {
    name: "switch",
    tested: true,
    with: ["theme.ts", "tokens.ts"],
    title: "Switch",
    description: "APG switch on @cssints/headless, on the neutral theme, with its scenario test",
  },
  {
    name: "disclosure",
    tested: true,
    with: ["theme.ts", "tokens.ts"],
    title: "Disclosure",
    description:
      "APG disclosure on @cssints/headless, on the neutral theme, with its scenario test",
  },
  {
    name: "button",
    tested: false,
    with: ["render.tsx", "theme.ts", "tokens.ts"],
    title: "Button",
    description:
      "APG button and toggle button: `tone` and `size` variants, and `render` for a link",
  },
  {
    name: "checkbox",
    tested: true,
    with: ["theme.ts", "tokens.ts"],
    title: "Checkbox",
    description: "APG checkbox, including the mixed tri-state, on @cssints/headless",
  },
  {
    name: "radio",
    tested: true,
    with: ["theme.ts", "tokens.ts"],
    title: "Radio group",
    description: "APG radio group with roving tabindex or aria-activedescendant focus",
  },
  {
    name: "tabs",
    tested: true,
    with: ["theme.ts", "tokens.ts"],
    title: "Tabs",
    description: "APG tabs: roving tabindex, automatic or manual activation, wrapped arrows",
  },
  {
    name: "accordion",
    tested: true,
    with: ["theme.ts", "tokens.ts"],
    title: "Accordion",
    description: "APG accordion: multiple or single expansion, headed triggers, collapsible",
  },
  {
    name: "separator",
    tested: false,
    with: ["render.tsx", "theme.ts", "tokens.ts"],
    title: "Separator",
    description:
      "A rule between two groups: `role=separator` with its orientation, or a decorative `role=none`",
  },
  {
    name: "badge",
    tested: false,
    with: ["render.tsx", "theme.ts", "tokens.ts"],
    title: "Badge",
    description:
      "A small label in three tones, a pill at 999px because the theme's steps stop at 16px",
  },
  {
    name: "skeleton",
    tested: false,
    with: ["render.tsx", "theme.ts", "tokens.ts"],
    title: "Skeleton",
    description: "A placeholder box that pulses only when the reader has not asked for less motion",
  },
  {
    name: "alert",
    tested: false,
    with: ["render.tsx", "theme.ts", "tokens.ts"],
    title: "Alert",
    description: "APG alert: a title and a body in a live region, with an `invalid` tone",
  },
  {
    name: "dropzone",
    tested: true,
    with: ["render.tsx", "theme.ts", "tokens.ts"],
    title: "Drop zone",
    description:
      "A file drop target: a dashed zone, a browse button over the primitive's hidden input, and a live region for the last batch",
    also: ["@cssints/button"],
  },
  {
    name: "meter",
    tested: false,
    with: ["render.tsx", "theme.ts", "tokens.ts"],
    title: "Meter",
    description: "APG meter: a track and the fill of the value, on `createMeter`",
  },
  {
    name: "breadcrumb",
    tested: false,
    with: ["render.tsx", "theme.ts", "tokens.ts"],
    title: "Breadcrumb",
    description:
      "APG breadcrumb: a trail whose current page is marked `aria-current=page` and painted from it",
  },
  {
    name: "treeview",
    tested: false,
    with: ["render.tsx", "theme.ts", "tokens.ts"],
    title: "Tree view",
    description: "APG tree view: roving focus, expanded rows and levels on `createTreeview`",
  },
  {
    name: "menu",
    tested: false,
    with: ["render.tsx", "theme.ts", "tokens.ts"],
    title: "Menu",
    description:
      "APG menu button: one trigger, a list with a roving tab stop, arrows, Home and End, Escape and a click outside to close; a variant gives the rows checkbox and radio items",
    also: ["@cssints/button"],
  },
  {
    name: "menubar",
    tested: true,
    with: ["render.tsx", "theme.ts", "tokens.ts"],
    title: "Menubar",
    description:
      "APG menu and menubar: a roving bar whose menus float under their items, rows with one tab stop, and nested submenus that open beside the parent row",
  },
  {
    name: "tooltip",
    tested: false,
    with: ["render.tsx", "theme.ts", "tokens.ts"],
    title: "Tooltip",
    description:
      "APG tooltip: a text bubble on hover and on focus, wired to its trigger by `aria-describedby`",
    also: ["@cssints/button"],
  },
  {
    name: "popover",
    tested: true,
    with: ["render.tsx", "theme.ts", "tokens.ts"],
    title: "Popover",
    description:
      "A non-modal panel anchored to a trigger: a dialog surface that flips at the viewport edge, closes on an outside press or Escape, and returns the focus",
    also: ["@cssints/button"],
  },
  {
    name: "date-picker",
    tested: true,
    with: ["render.tsx", "theme.ts", "tokens.ts"],
    title: "Date picker",
    description:
      "A calendar in a popover: a 6x7 month grid with arrows, Home and End, PageUp and PageDown, min and max, and the chosen day on the trigger",
    also: ["@cssints/button"],
  },
  {
    name: "select",
    tested: false,
    with: ["render.tsx", "theme.ts", "tokens.ts"],
    title: "Select",
    description:
      "APG select-only combobox: the button that shows the chosen label is the combobox, a floating listbox follows it with `aria-activedescendant`, and Enter, Tab or a click commits",
    also: ["@cssints/button"],
  },
  {
    name: "command-palette",
    tested: true,
    with: ["render.tsx", "theme.ts", "tokens.ts"],
    title: "Command palette",
    description:
      "A modal dialog with a search field: the primitive filters the commands, `aria-activedescendant` marks the active row, and arrows, Enter, Escape and a hotkey are its keys",
    also: ["@cssints/button"],
  },
  {
    name: "textarea",
    tested: false,
    with: ["render.tsx", "theme.ts", "tokens.ts"],
    title: "Textarea",
    description:
      "A multi-line field styled like `Input`, and the control `Field` puts in with `render`",
  },
  {
    name: "slider",
    tested: false,
    with: ["render.tsx", "theme.ts", "tokens.ts"],
    title: "Slider",
    description:
      "APG slider: the rail, the fill and the thumb, with the fill's share of the rail from `aria-valuenow`",
  },
  {
    name: "slider-multithumb",
    tested: true,
    with: ["render.tsx", "theme.ts", "tokens.ts"],
    title: "Range slider",
    description:
      "APG multi-thumb slider: two thumbs whose bounds follow each other, and the interval between them as the fill",
  },
  {
    name: "spinbutton",
    tested: false,
    with: ["render.tsx", "theme.ts", "tokens.ts"],
    title: "Spinbutton",
    description:
      "APG spinbutton: a number field with steppers it disables at the bounds, and the id a `Field` names it by",
  },
  {
    name: "checkbox-group",
    tested: false,
    with: ["checkbox/checkbox.tsx", "render.tsx", "theme.ts", "tokens.ts"],
    title: "Checkbox group",
    description:
      "APG tri-state checkbox group: three of the kit's `Checkbox`, and the all/none/mixed parent derived from them",
    also: ["@cssints/checkbox"],
  },
  {
    name: "toast",
    tested: true,
    // no APG pattern and no Quint spec: the fixture and the browser test are the whole oracle
    with: ["render.tsx", "theme.ts", "tokens.ts"],
    title: "Toast",
    description:
      "A queue of toasts in a portalled fixed stack: info, success and error tones, a close button, and a countdown that pauses while the pointer or the focus is on the toast",
  },
  {
    tested: true,
    name: "table",
    with: ["theme.ts", "tokens.ts"],
    title: "Table",
    description:
      "A data table on a native `<table>`: sortable headers whose arrow is `aria-sort`, row selection with a select-all that covers the rendered rows, and a numeric column right-aligned from the column's hint",
  },
  {
    tested: true,
    name: "pagination",
    with: ["theme.ts", "tokens.ts"],
    title: "Pagination",
    description:
      "A page list in a nav: the current page is `aria-current=page` and painted from it, the elided runs are text, the ends stay in place, and one live status announces the count",
  },
];

// A component is one `.tsx` that styles itself with cssints, so a copy needs the plugin in the project's build; the kit files
// it imports arrive beside it. `tested` adds the conformance test a copy can run: the fixture, the DOM driver and the config.
const kitFiles = (item: Starter) => [
  file(target(`${item.name}.tsx`), "registry:ui", `src/registry/${item.name}/${item.name}.tsx`),
  ...(item.with ?? []).map((path) =>
    file(target(path.split("/").at(-1) ?? path), "registry:file", `src/registry/${path}`),
  ),
  ...(item.tested
    ? [
        // What a copy needs beside the component is what the item's own directory holds: a fixture its test mounts, and
        // the driver that walks a scenario. A widget with no spec ships neither (its test mounts the component itself),
        // so the two are read off the files rather than declared a second time. The driver is the item's own name: the
        // generic one is byte-identical across patterns, but a nested one (the menubar's maps a submenu's rows) is not,
        // and a copy that two items write into one file keeps only the last.
        ...[`${item.name}.fixture.tsx`, `${item.name}-driver.ts`]
          .filter((name) => existsSync(join(root, "src/registry", item.name, name)))
          .map((name) => file(target(name), "registry:file", `src/registry/${item.name}/${name}`)),
        file(
          target(`${item.name}.browser.test.tsx`),
          "registry:file",
          `src/registry/${item.name}/${item.name}.browser.test.tsx`,
        ),
        // The copy's own config and the sheet its test loads: the template's, so a project that
        // does not start from the template gets the same setup `npm test` runs.
        content(
          "src/vitest.browser.config.ts",
          "registry:file",
          readTemplate("vitest.browser.config.ts"),
        ),
        content("src/sheet.ts", "registry:file", readTemplate("src/sheet.ts")),
      ]
    : []),
];

const starter = (item: Starter) => ({
  $schema: "https://ui.shadcn.com/schema/registry-item.json",
  name: item.name,
  type: "registry:ui",
  title: item.title,
  description: item.description,
  dependencies: ["@cssints/headless", "@cssints/mise-en-mode", "cssints"],
  // Only what the copied test imports. The runner itself (Vite+ with its browser provider, and
  // the Solid 2 plugin) is the project's: its versions have to agree with the project's
  // `solid-js` rc, which this item cannot know. A scenario walk needs the spec packages; a plain
  // browser test does not.
  devDependencies:
    item.tested && existsSync(join(root, "src/registry", item.name, `${item.name}-driver.ts`))
      ? ["@cssints/apg-specs@^0.12.1", "@quint-machine/core@0.1.0"]
      : [],
  registryDependencies: ["@cssints/theme", ...(item.also ?? [])],
  files: kitFiles(item),
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
  "A component is one `.tsx`: styles are `cn()`/`cv()` with the theme's tokens, states are the ARIA",
  "attributes the widget announces (`attr()`, `within()`), and `render` replaces a part with another",
  "component or tag. A copy needs `cssints` in the project's Vite config; `theme.ts` and `tokens.ts`",
  "arrive with it, and `theme.css` is the same theme for a project without the plugin. The",
  "combinations are checked in `src/registry/combos.browser.test.tsx`.",
  "",
];
mkdirSync(join(root, "public"), { recursive: true });
writeFileSync(join(root, "public", "llms.txt"), lines.join("\n"));

process.stdout.write(`${items.length} items in ${out}\n`);
