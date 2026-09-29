// Risk 4 on the Module Runner prototype: edit tokens.ts, both card.ts and button.ts must pick it up.
// ORDER=button-first flips which file is re-requested first after the edit.
import { readFileSync, writeFileSync } from "node:fs";
import { setTimeout as sleep } from "node:timers/promises";

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
  const changed = Promise.withResolvers();
  server.watcher.once("change", changed.resolve);
  writeFileSync(tokens, original.replace("md: 4", "md: 6"));
  await changed.promise;
  await sleep(3000);
  const after = await classes();
  for (const name of order)
    console.log(
      `${name.padEnd(6)} ${before[name]} -> ${after[name]}  ${before[name] === after[name] ? "STALE" : "fresh"}`,
    );
} finally {
  writeFileSync(tokens, original);
  await server.close();
  process.exit(0);
}
