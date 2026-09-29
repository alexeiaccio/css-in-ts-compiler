import { createServer } from "vite";
import { TraceMap, originalPositionFor } from "@jridgewell/trace-mapping";
import cssints from "../src/plugin.ts";

const server = await createServer({
  root: import.meta.dirname,
  configFile: false,
  logLevel: "warn",
  server: { middlewareMode: true, watch: null },
  plugins: [cssints()],
});
const r = await server.environments.client.transformRequest("/fixtures/risk5.ts");
const line = r.code.split("\n").findIndex((l) => l.includes('cx("_lwugp7"')) + 1;
const col = r.code.split("\n")[line - 1].indexOf('"_lwugp7"');
console.log(
  "generated",
  { line, column: col },
  "->",
  originalPositionFor(new TraceMap(r.map), { line, column: col }),
);
await server.close();
process.exit(0);
