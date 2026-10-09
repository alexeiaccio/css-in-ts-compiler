// @cssints/placeholder: an image's placeholder as an <image>, read from the file at build time. `placeholder(path)` is a
// gradient of the image's colours laid out as the image is (unpic-placeholder's radial gradients); `{ mode: "thumbhash" }`
// is the image's thumbhash rendered as a tiny PNG data URL. One value member of cssints/plugin `scope()`; no runtime.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { CSSImageValue } from "cssints";
import { arg, fn, scope } from "cssints/plugin";

import { decode, gradients, thumbhash } from "./pixels.ts";

/** How the placeholder is drawn: a gradient of the colours (the default), or the thumbhash as a PNG data URL. */
export type Mode = "gradient" | "thumbhash";

// The engine evaluates this module again for every module that imports one that calls placeholder(): results are kept on
// globalThis, which the engine's runner shares, by the hash of the file's content and the mode.
const g = globalThis as typeof globalThis & { __cssintsPlaceholder?: Map<string, string> };

const fail = (message: string, cause?: unknown) => {
  throw new Error(`cssints: placeholder: ${message}`, { cause });
};

const compute = (path: string, mode: Mode) => {
  let bytes: Uint8Array;
  try {
    bytes = readFileSync(resolve(path));
  } catch (e) {
    return fail(`cannot read ${path} (paths are relative to ${process.cwd()})`, e);
  }
  const key = `${createHash("sha256").update(bytes).digest("hex")} ${mode}`;
  const cache = (g.__cssintsPlaceholder ??= new Map<string, string>());
  const hit = cache.get(key);
  if (hit !== undefined) return hit;
  let css: string;
  try {
    const img = decode(bytes);
    const portrait = img.height > img.width;
    css =
      mode === "thumbhash"
        ? `url("${thumbhash(img)}")`
        : gradients(img, portrait ? 3 : 4, portrait ? 4 : 3);
  } catch (e) {
    return fail(`${path}: ${e instanceof Error ? e.message : String(e)}`, e);
  }
  cache.set(key, css);
  return css;
};

const placeholders = scope("placeholder", {
  placeholder: fn({
    args: [arg<string>(), { "mode?": "gradient | thumbhash" }],
    value: ([path, { mode = "gradient" }]) => new CSSImageValue(compute(path, mode as Mode)),
  }),
});

/**
 * `placeholder(path, { mode? })`: a placeholder of the image at `path` (relative to the working directory), read at build
 * time. `mode: "gradient"` (the default) is a list of radial gradients of the image's colours, each where its part of the
 * image is; `mode: "thumbhash"` is the image's thumbhash as a tiny PNG `url()`. An `<image>` for `backgroundImage`. JPEG
 * and PNG; another format or a missing file is a build error at the call.
 */
// The annotation is for the declaration file: the inferred type names a module of cssints that is not exported.
export const placeholder: ReturnType<typeof placeholders.export>["placeholder"] =
  placeholders.export().placeholder;
