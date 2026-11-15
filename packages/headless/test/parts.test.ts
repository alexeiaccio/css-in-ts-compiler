/// <reference types="vite/client" />
import { describe, expect, it } from "vite-plus/test";

// Every props object a primitive returns carries its part name (`data-part`): the shipped props are the only
// stable styling hook a consumer has, so a skin attaches to `[data-part="trigger"]` instead of inventing class
// names per host. Checked in the source because a new primitive copies a neighbouring interface, and because
// `src` is what the package exports in development.
const sources = import.meta.glob("../src/*.ts", { query: "?raw", import: "default", eager: true });
const files = Object.entries(sources).map(([path, text]) => ({
  name: path.replace("../src/", ""),
  text,
}));

/**
 * Props that are not spread onto an element: `renameProps` is the rename *controller* (`onDblClick` plus
 * `begin` / `commit` / `cancel` to drive the edit), and its `inputProps` is the part that names itself.
 */
const NOT_ELEMENT_PROPS = new Set(["TabRenameProps"]);

/** The body of the block opening at `from` (a `{`), by brace matching. */
const block = (text: string, from: number): string => {
  let depth = 0;
  for (let index = from; index < text.length; index++) {
    if (text[index] === "{") depth++;
    else if (text[index] === "}") {
      depth--;
      if (depth === 0) return text.slice(from + 1, index);
    }
  }
  return text.slice(from + 1);
};

const members = (type: string): ReadonlyArray<string> =>
  [...type.matchAll(/(?:^|[\s;{])readonly\s+"?([\w-]+)"?\??:/g)].map((match) => match[1] ?? "");

/** Where an inline object type after a `Props:` declaration opens, if it is inline at all. */
const inlineAt = (text: string, from: number): number => {
  let index = from;
  while (index < text.length && /\s/.test(text[index] ?? "")) index++;
  if (text[index] === "{") return index;
  if (text[index] !== "(") return -1;
  let depth = 0;
  for (; index < text.length; index++) {
    if (text[index] === "(") depth++;
    else if (text[index] === ")" && --depth === 0) break;
  }
  const arrow = text.indexOf("=>", index);
  if (arrow < 0) return -1;
  index = arrow + 2;
  while (index < text.length && /\s/.test(text[index] ?? "")) index++;
  return text[index] === "{" ? index : -1;
};

/** The `*Props` type itself, unless it is another props type's extension (that one is checked here too). */
const declared = (
  text: string,
): ReadonlyArray<{ readonly name: string; readonly body: string }> => {
  const out = [];
  for (const match of text.matchAll(/^export interface (\w+Props)\b([^{]*)\{/gm)) {
    const head = match[2] ?? "";
    if (/\bextends\b/.test(head)) continue;
    out.push({ name: match[1] ?? "", body: block(text, (match.index ?? 0) + match[0].length - 1) });
  }
  for (const match of text.matchAll(/^export type (\w+Props)\s*=\s*([^;]+);/gm)) {
    const alias = match[2] ?? "";
    // an intersection with another props type inherits its member
    if (/\w+Props\b/.test(alias.split("&")[0] ?? "")) continue;
    out.push({ name: match[1] ?? "", body: alias });
  }
  return out;
};

describe("every returned props object names its part", () => {
  it("declares data-part on every exported *Props type", () => {
    const missing = [];
    for (const file of files) {
      for (const { name, body } of declared(file.text)) {
        if (NOT_ELEMENT_PROPS.has(name)) continue;
        if (!members(body).includes("data-part")) missing.push(`${file.name}: ${name}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it("declares data-part on every inline props type a primitive returns", () => {
    const missing = [];
    for (const file of files) {
      for (const match of file.text.matchAll(/readonly (\w+Props):/g)) {
        const at = inlineAt(file.text, (match.index ?? 0) + match[0].length);
        if (at < 0) continue; // a named props type, checked above
        if (!members(block(file.text, at)).includes("data-part")) {
          missing.push(`${file.name}: ${match[1]}`);
        }
      }
    }
    expect(missing).toEqual([]);
  });

  it("gives every part a non-empty name", () => {
    const unnamed = files.flatMap((file) =>
      [...file.text.matchAll(/"data-part":\s*(""\s*|undefined)/g)].map(
        (match) => `${file.name}: ${match[0]}`,
      ),
    );
    expect(unnamed).toEqual([]);
  });
});
