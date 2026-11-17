// Checks a skin before it is shared, because both of its rules fail silently in a browser.
//
// A skin is a directory in the registry with a `skin*.css`: `[data-skin="<name>"]` scoping, part selectors and its own
// token file (`hardware/skin.css` + `hardware/tokens-01.css`). Two things it can get wrong, and neither the build nor a
// screenshot tells you:
//
//   1. A part selector names a part nothing emits. A skin may style the parts a primitive ships (`data-part` on the
//      shipped props, `packages/headless/src/**`) and the parts its own markup declares (`data-part` in its `.tsx`). A
//      name from neither matches zero elements, so the rule is dead CSS that looks fine in review.
//   2. A token the CSS reads is declared nowhere: the skin's own files, or the theme layer (`src/registry/theme.css`,
//      compiled from `tokens.ts`). An undeclared `var(--x)` is an empty value — `unset`, not an error — so a surface
//      loses its background and the page still renders.
//
// The scan is deliberately textual, not a CSS parser: it reads every `[data-part="…"]` and every `var(--…)` in the
// skin's `.css`, with comments and at-rule preludes blanked out first, so text inside them is not a finding. That is
// enough for the two rules and it does not turn a skin into an AST.
//
//   node --experimental-strip-types scripts/skin-check.ts
//
// Exits 1 on any finding; says nothing when the skins agree.
import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

const root = new URL("..", import.meta.url).pathname; // apps/ui
const registry = join(root, "src", "registry");
const headless = join(root, "..", "..", "packages", "headless", "src");

const walk = (dir: string): ReadonlyArray<string> =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return walk(path);
    return entry.isFile() ? [path] : [];
  });

const read = (path: string): string => readFileSync(path, "utf8");

// Line of an offset, for a finding a person can jump to.
const lineAt = (text: string, at: number): number => {
  let line = 1;
  for (let index = 0; index < at; index++) if (text[index] === "\n") line++;
  return line;
};

// Blanks a span, keeping its newlines, so offsets and line numbers survive the edit.
const blank = (text: string): string => text.replace(/[^\n]/g, " ");

// The text a selector scan may read: no comments, no at-rule prelude (`@media (…)`, `@supports (…)`, `@import "…"`).
const scannable = (css: string): string =>
  css
    .replace(/\/\*[\s\S]*?\*\//g, blank)
    .replace(/@(?:media|supports|container|layer|scope|starting-style)\b[^{;]*/g, blank)
    .replace(/@import\b[^;]*;/g, blank);

const names = (text: string, pattern: RegExp): ReadonlyArray<string> =>
  [...text.matchAll(pattern)].map((match) => match[1] ?? "");

// Name and offset of every match, for a finding with a line.
const found = (
  text: string,
  pattern: RegExp,
): ReadonlyArray<{ readonly name: string; readonly at: number }> =>
  [...text.matchAll(pattern)].map((match) => ({ name: match[1] ?? "", at: match.index ?? 0 }));

// The parts the primitives emit: the literal `"data-part": "…"` on their shipped props, the same source shape
// `packages/headless/test/parts.test.ts` guards, so a primitive that copies a neighbour's props without renaming the
// part fails there and this check reads the names that passed.
const primitiveParts = new Set(
  walk(headless)
    .filter((path) => path.endsWith(".ts"))
    .flatMap((path) => names(read(path), /"data-part":\s*"([\w-]+)"/g)),
);

// The theme layer's custom properties. `theme.css` is generated from `tokens.ts` by `scripts/theme-css.ts`, and the
// check above it in CI keeps the two in step, so the sheet is the whole set a skin can lean on.
const themeTokens = new Set(
  names(read(join(registry, "theme.css")), /(?:^|[;{\s])(--[\w-]+)\s*:/gm),
);

interface Skin {
  readonly name: string;
  readonly dir: string;
  /** Every sheet in the directory: the skin's payload and the token file(s) it imports. */
  readonly sheets: ReadonlyArray<string>;
  /** Its markup: where the parts it styles itself are declared, and the custom properties it sets inline. */
  readonly sources: ReadonlyArray<string>;
}

const SKIN_SHEET = /^skin.*\.css$/;

const skins: ReadonlyArray<Skin> = readdirSync(registry, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .flatMap((entry) => {
    const dir = join(registry, entry.name);
    const files = walk(dir);
    // A skin is the directory that ships one: `skin.css`, or a numbered `skin-01.css` when a component carries several.
    if (!files.some((path) => SKIN_SHEET.test(path.slice(dir.length + 1)))) return [];
    return [
      {
        name: entry.name,
        dir,
        sheets: files.filter((path) => path.endsWith(".css")),
        sources: files.filter(
          (path) => /\.tsx?$/.test(path) && !/\.test\./.test(path) && !/\.stories\./.test(path),
        ),
      },
    ];
  });

interface Finding {
  readonly file: string;
  readonly line: number;
  readonly rule: "part" | "token";
  readonly name: string;
}

const findings: Array<Finding> = [];

for (const skin of skins) {
  // What this skin declares itself: the custom properties its own sheet and markup write. A skin styles its own
  // markup (`faceplate`, `key`, `lcd`, …), so its own names are as valid as a primitive's — an undeclared name is the
  // error, not every name this repository does not already know.
  const ownParts = new Set(
    skin.sources.flatMap((path) => {
      const text = read(path);
      return [
        ...names(text, /data-part="([\w-]+)"/g),
        ...names(text, /["']?data-part["']?\s*:\s*["']([\w-]+)["']/g),
      ];
    }),
  );
  const ownTokens = new Set([
    ...skin.sheets.flatMap((path) => names(read(path), /(?:^|[;{\s])(--[\w-]+)\s*:/gm)),
    // `@property --lift` declares a custom property with an initial value and nothing else.
    ...skin.sheets.flatMap((path) => names(read(path), /@property\s+(--[\w-]+)/g)),
    // A value a primitive computes at render time is set inline (`style={{ "--at": … }}`), which is a declaration too.
    ...skin.sources.flatMap((path) => names(read(path), /["'](--[\w-]+)["']\s*:/g)),
  ]);

  for (const path of skin.sheets) {
    const text = scannable(read(path));
    const file = relative(root, path);
    for (const { name, at } of found(text, /data-part\s*=\s*"([\w-]+)"/g)) {
      if (!primitiveParts.has(name) && !ownParts.has(name)) {
        findings.push({ file, line: lineAt(text, at), rule: "part", name });
      }
    }
    for (const { name, at } of found(text, /var\(\s*(--[\w-]+)/g)) {
      if (!ownTokens.has(name) && !themeTokens.has(name)) {
        findings.push({ file, line: lineAt(text, at), rule: "token", name });
      }
    }
  }
}

if (findings.length > 0) {
  findings.sort((a, b) => (a.file === b.file ? a.line - b.line : a.file < b.file ? -1 : 1));
  for (const { file, line, rule, name } of findings) {
    const note =
      rule === "part"
        ? `no primitive emits part "${name}" and the skin does not declare it`
        : `token ${name} is declared by neither the skin nor the theme`;
    process.stderr.write(`${file}:${line}: ${note}\n`);
  }
  process.stderr.write(
    `skin:check: ${findings.length} finding${findings.length === 1 ? "" : "s"} in ${skins.length} skin${skins.length === 1 ? "" : "s"}\n`,
  );
  process.exit(1);
}
