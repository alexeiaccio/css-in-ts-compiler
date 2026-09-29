import { resolve } from "node:path";

import { createServer } from "vite";

import cssints from "../src/plugin.mjs";

const root = import.meta.dirname;
const server = await createServer({ root, configFile: false, logLevel: "warn", server: { middlewareMode: true, watch: null }, plugins: [cssints()] });
const client = server.environments.client;
let failed = false;
for (const f of process.argv.slice(2)) {
  console.log(`################ ${f}`);
  try {
    const r = await client.transformRequest(`/${f}`);
    const cssId = r.code.match(/^import "([^"]*cssints\.css[^"]+)";/)?.[1];
    console.log("--- code\n" + r.code.replace(/^import "[^"]*cssints\.css[^"]+";\n/, ""));
    console.log("--- css\n" + ((await client.transformRequest(cssId.replace("/@id/__x00__", "\0")))?.code.match(/const __vite__css = (".*")/)?.[1] ?? "").replace(/^"|"$/g, "").replace(/\\n/g, "\n"));
  } catch (e) {
    failed = true;
    console.log("FAIL " + e.message.split("\n")[0]);
  }
}
await server.close();
process.exit(failed ? 1 : 0);
