// vite dev with HMR, driven as packages/cssints/test/hmr does: edit a file, wait for the watcher, read what the browser
// would be told (the payloads of the client's hot channel) and what it would get when it asks again.
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { setTimeout as sleep } from "node:timers/promises";

import { createServer } from "vite";

const root = `${import.meta.dirname}/..`;
const app = `${root}/src/Shell.tsx`;
const original = readFileSync(app, "utf8");

const server = await createServer({ root, logLevel: "warn", server: { port: 0 } });
await server.listen();
const client = server.environments.client;
const sent = [];
const send = client.hot.send.bind(client.hot);
client.hot.send = (payload, ...rest) => (sent.push(payload), send(payload, ...rest));
const SHEET = "virtual:cssints.css";
const base = server.resolvedUrls.local[0];
const get = async (path) => (await fetch(new URL(path, base))).text();

const edit = async (from, to) => {
  sent.length = 0;
  const changed = Promise.withResolvers();
  server.watcher.once("change", changed.resolve);
  writeFileSync(app, readFileSync(app, "utf8").replace(from, to));
  await changed.promise;
  await sleep(1500);
  // The browser applies the update by asking for the module again; the sheet follows when that transform ran.
  const code = await get("/src/Shell.tsx");
  await sleep(500);
  const paths = sent.flatMap((p) =>
    p.type === "update" ? p.updates.map((u) => u.path) : [p.type],
  );
  return { paths, code };
};

try {
  const html = await get("/");
  assert.ok(html.includes("/src/index.tsx"), html);
  const before = await get("/src/Shell.tsx");
  assert.ok(before.includes("_$template"), "Solid compiled the component for the client");
  assert.ok(!before.includes("cssints/src/index.ts"), "no engine code reaches the client");
  const sheet0 = await get(`/@id/__x00__${SHEET}`);
  assert.match(sheet0, /min-height: 100dvh/);

  // A style edit: new class in the component, new rule in the sheet, no reload.
  const style = await edit(
    "no: css.fontWeight(t.fontWeight.medium)",
    "no: css.fontWeight(t.fontWeight.normal)",
  );
  console.log("style edit:", style.paths);
  assert.ok(!style.paths.includes("full-reload"), style.paths);
  assert.ok(
    style.paths.some((p) => p.endsWith("/src/Shell.tsx")),
    style.paths,
  );
  assert.ok(
    style.paths.some((p) => p.includes(SHEET)),
    style.paths,
  );
  assert.notEqual(before.match(/"no": "([^"]+)"/)?.[1], style.code.match(/"no": "([^"]+)"/)?.[1]);
  assert.match(await get(`/@id/__x00__${SHEET}`), /font-weight: var\(--font-weight-normal\)/);

  // A component edit: the component is replaced, the classes and the sheet stay.
  const component = await edit("{props.title}</h1>", "{props.title}!</h1>");
  console.log("component edit:", component.paths);
  assert.ok(!component.paths.includes("full-reload"), component.paths);
  assert.ok(
    component.paths.some((p) => p.endsWith("/src/Shell.tsx")),
    component.paths,
  );
  assert.equal(component.paths.filter((p) => p.includes(SHEET)).length, 0, component.paths);
  assert.ok(component.code.includes("props.title"));
} finally {
  writeFileSync(app, original);
  await server.close();
}
console.log("dev: HMR on a style edit and on a component edit ok");
process.exit(0);
