import { createServer } from "vite";

import cssints from "../src/plugin.mjs";

const root = import.meta.dirname;
const plugins = cssints();
const server = await createServer({ root, configFile: false, logLevel: "warn", server: { middlewareMode: true, watch: null }, plugins });
const client = server.environments.client;
let failed = false;
for (const f of process.argv.slice(2)) {
  console.log(`################ ${f}`);
  try {
    const r = await client.transformRequest(`/${f}`);
    console.log("--- code\n" + r.code);
    console.log("--- css\n" + plugins[0].api.sheet([`${root}/${f}`]));
  } catch (e) {
    failed = true;
    console.log("FAIL " + e.message.split("\n")[0]);
  }
}
await server.close();
process.exit(failed ? 1 : 0);
