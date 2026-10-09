// node:module for the engine: `createRequire(...)(name)`, which it uses for data and for packages that were left out of the
// module graph in Node. A name that is not in the table is a bug of the playground, not of the user's code.
import { bcd, selectors, targets } from "virtual:playground/data";

const table: Record<string, unknown> = {
  "mdn-data/css/selectors.json": selectors,
  "@mdn/browser-compat-data": bcd,
  // the query is the site's, resolved at build time (plugin/playground.ts)
  browserslist: () => targets,
};

export const createRequire = () => (name: string) => {
  if (!Object.hasOwn(table, name))
    throw new Error(`playground: require("${name}") is not available`);
  return table[name];
};
