// a.js and b.js both read space.md from tokens.js. Edit tokens.js on a dev server, re-request both.
// node run.mjs          -> a.js requested first
// node run.mjs b-first  -> b.js requested first
import { readFileSync, writeFileSync } from "node:fs";

import { createServer } from "vite";

const root = import.meta.dirname;
const tokens = `${root}/tokens.js`;
const original = readFileSync(tokens, "utf8");
const order = process.argv[2] === "b-first" ? ["b", "a"] : ["a", "b"];

const server = await createServer({ root, configFile: `${root}/vite.config.js`, logLevel: "warn" });
await server.listen();
const values = async () => {
  const out = {};
  for (const name of order) out[name] = (await server.transformRequest(`/${name}.js`)).code.match(/= "(.*)"/)[1];
  return out;
};

try {
  const before = await values();
  const changed = new Promise((r) => server.watcher.once("change", r));
  writeFileSync(tokens, original.replace("md: 4", "md: 6"));
  await changed;
  await new Promise((r) => setTimeout(r, 1000));
  const after = await values();
  for (const name of order) console.log(`${name}.js  ${before[name]} -> ${after[name]}  ${before[name] === after[name] ? "STALE" : "fresh"}`);
} finally {
  writeFileSync(tokens, original);
  await server.close();
  process.exit();
}
