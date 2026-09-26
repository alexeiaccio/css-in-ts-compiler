// Risk 4: edit tokens.ts on a live dev server. Both card.ts and button.ts read space.md.
// ORDER=button-first flips which file is re-requested first after the edit.
import { readFileSync, writeFileSync } from "node:fs";

import { createServer } from "vite";

const root = import.meta.dirname;
const tokens = `${root}/tokens.ts`;
const original = readFileSync(tokens, "utf8");
const order = process.env.ORDER === "button-first" ? ["button", "card"] : ["card", "button"];

const server = await createServer({ root, server: { port: 0 }, logLevel: "warn" });
await server.listen();

const classes = async () => {
  const out = {};
  for (const name of order) {
    out[name] = await server.transformRequest(`/${name}.ts`).then(
      (r) => r?.code.match(new RegExp(`${name} = "([^"]+)"`))?.[1],
      (e) => `ERROR ${e.message}`,
    );
  }
  return out;
};

try {
  const before = await classes();
  const changed = new Promise((r) => server.watcher.once("change", r));
  writeFileSync(tokens, original.replace("md: 4", "md: 6"));
  await changed;
  await new Promise((r) => setTimeout(r, 3000));
  const after = await classes();
  for (const name of order) console.log(`${name.padEnd(6)} ${before[name]} -> ${after[name]}  ${before[name] === after[name] ? "STALE" : "fresh"}`);
} finally {
  writeFileSync(tokens, original);
  await server.close();
  process.exit(0);
}
