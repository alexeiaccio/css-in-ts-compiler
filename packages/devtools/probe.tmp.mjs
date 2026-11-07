import { once, on } from "node:events";
import { join } from "node:path";
import { createServer } from "vite";
import cssints from "cssints/vite";
const here = import.meta.dirname;
const app = join(here, "test/fixtures/app");
const server = await createServer({ root: app, configFile: false, logLevel: "warn", server: { port: 0 }, plugins: [cssints()] });
await server.listen();
try {
  const out = await server.environments.client.transformRequest("/@fs" + join(here, "src/vitals/index.ts"));
  console.log("hot context in the module:", /createHotContext|import\.meta\.hot/.test(out.code), "len", out.code.length);
  const sheet = await server.environments.client.transformRequest("\0virtual:cssints.css");
  console.log("sheet loaded:", sheet.code.length);
  const ws = new WebSocket(`ws://localhost:${server.config.server.port}/?token=${server.config.webSocketToken}`, "vite-hmr");
  await once(ws, "open");
  const messages = on(ws, "message");
  ws.send(JSON.stringify({ type: "custom", event: "cssints:edits:get" }));
  for (let i = 0; i < 20; i++) {
    const msg = JSON.parse((await messages.next()).value[0].data);
    if (msg.type === "custom") console.log("event:", msg.event, JSON.stringify(msg.data).slice(0, 120));
    if (msg.type === "custom" && msg.event === "cssints:edits") break;
  }
  ws.close();
} finally { await server.close(); }
