// The example projects of apps/docs/examples/<id>/: one per docs page (plugin/markdown.ts links to it), csssky's slice, the README's.
// The files are text chunks loaded when a project opens; the entry is the file named index.*, the others follow by name.
import type { Files } from "./compile.ts";

const raw = import.meta.glob<string>("../../examples/*/*", { query: "?raw", import: "default" });
const parts = (path: string) => path.split("/").slice(-2) as [string, string];
const entryFirst = (a: string, b: string) =>
  Number(/^index\./.test(b)) - Number(/^index\./.test(a)) || a.localeCompare(b);

/** The ids of the example projects. */
export const ids = [...new Set(Object.keys(raw).map((p) => parts(p)[0]))];

/**
 * The files of an example project.
 * @param {string} id the directory of apps/docs/examples
 * @returns {Promise<Files | undefined>} the files, the entry first, or undefined when there is no such project
 */
export const load = async (id: string): Promise<Files | undefined> => {
  const paths = Object.keys(raw).filter((p) => parts(p)[0] === id);
  if (!paths.length) return undefined;
  const files = await Promise.all(paths.map(async (p) => [parts(p)[1], await raw[p]!()] as const));
  return Object.fromEntries(files.sort(([a], [b]) => entryFirst(a, b)));
};
