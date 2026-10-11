// The files in the URL hash: `#files=<deflate-raw of the JSON of {name: text}, base64url>`, so a link holds the whole playground and
// no server does. An older link, `#code=<the one file, deflated>`, still opens. `#example=<id>` names a project of
// apps/docs/examples, which the page loads: the link of a docs page to its example (plugin/markdown.ts) is short.
import type { Files } from "./compile.ts";

const KEY = "files=";
const OLD = "code=";
const ENTRY = "playground.tsx";

const base64 = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
const bytes = (text: string) =>
  Uint8Array.from(atob(text.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));

const pipe = async (
  data: Uint8Array<ArrayBuffer>,
  stream: CompressionStream | DecompressionStream,
) =>
  new Uint8Array(await new Response(new Blob([data]).stream().pipeThrough(stream)).arrayBuffer());

/**
 * The hash for some files.
 * @param {Files} files the files by name, the entry first
 * @returns {Promise<string>} `files=` and their JSON, deflated, in base64url
 */
export const encode = async (files: Files): Promise<string> =>
  KEY +
  base64(
    await pipe(
      new TextEncoder().encode(JSON.stringify(files)),
      new CompressionStream("deflate-raw"),
    ),
  );

/**
 * The files a hash holds.
 * @param {string} hash `location.hash`
 * @returns {Promise<Files | undefined>} the files, or undefined when the hash holds none (or something else)
 */
export const decode = async (hash: string): Promise<Files | undefined> => {
  const value = hash.replace(/^#/, "");
  const key = [KEY, OLD].find((k) => value.startsWith(k));
  if (!key) return undefined;
  try {
    const text = new TextDecoder().decode(
      await pipe(bytes(value.slice(key.length)), new DecompressionStream("deflate-raw")),
    );
    return key === OLD ? { [ENTRY]: text } : (JSON.parse(text) as Files);
  } catch {
    return undefined;
  }
};

/**
 * The hash that opens an example project.
 * @param {string} id the directory of apps/docs/examples
 * @returns {string} `example=` and the id
 */
export const exampleHash = (id: string): string => `example=${id}`;

/**
 * The example a hash names.
 * @param {string} hash `location.hash`
 * @returns {string | undefined} the id, or undefined when the hash names none
 */
export const exampleOf = (hash: string): string | undefined =>
  /^#example=([\w-]+)$/.exec(hash)?.[1];
