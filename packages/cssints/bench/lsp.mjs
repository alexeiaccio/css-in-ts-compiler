// Editor latency: time to diagnostics on a demo file after an edit, over tsgo's language server (stdio).
// node bench/lsp.mjs [file relative to apps/demo] — not part of the budget (wall time varies by machine).
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const root = `${import.meta.dirname}/../../..`;
const demo = `${root}/apps/demo`;
const file = `${demo}/${process.argv[2] ?? "src/components/Button.tsx"}`;
const uri = pathToFileURL(file).href;
const text = readFileSync(file, "utf8");

const server = spawn(`${root}/node_modules/.bin/tsgo`, ["--lsp", "-stdio"], { cwd: demo });
let buf = Buffer.alloc(0);
let id = 0;
const waiting = new Map();
server.stdout.on("data", (d) => {
  buf = Buffer.concat([buf, d]);
  for (;;) {
    const end = buf.indexOf("\r\n\r\n");
    if (end < 0) return;
    const len = +/Content-Length: (\d+)/i.exec(buf.subarray(0, end).toString())[1];
    if (buf.length < end + 4 + len) return;
    const msg = JSON.parse(buf.subarray(end + 4, end + 4 + len).toString());
    buf = buf.subarray(end + 4 + len);
    if (msg.id !== undefined && waiting.has(msg.id)) waiting.get(msg.id)(msg);
    else if (msg.id !== undefined) send({ id: msg.id, result: null }); // server -> client request (config, registration)
  }
});
const send = (m) => {
  const body = JSON.stringify({ jsonrpc: "2.0", ...m });
  server.stdin.write(`Content-Length: ${Buffer.byteLength(body)}\r\n\r\n${body}`);
};
const request = (method, params) => {
  const { promise, resolve } = Promise.withResolvers();
  waiting.set(++id, resolve);
  send({ id, method, params });
  return promise;
};
const notify = (method, params) => send({ method, params });
const diagnostics = async () => {
  const t = performance.now();
  const r = await request("textDocument/diagnostic", { textDocument: { uri } });
  return { ms: performance.now() - t, items: r.result?.items ?? [] };
};

const t0 = performance.now();
await request("initialize", {
  processId: process.pid,
  rootUri: pathToFileURL(demo).href,
  capabilities: { textDocument: { diagnostic: {} } },
  workspaceFolders: [{ uri: pathToFileURL(demo).href, name: "demo" }],
});
notify("initialized", {});
console.log(`initialize        ${(performance.now() - t0).toFixed(0)} ms`);

notify("textDocument/didOpen", {
  textDocument: { uri, languageId: "typescriptreact", version: 1, text },
});
const first = await diagnostics();
console.log(
  `first diagnostics ${first.ms.toFixed(0)} ms (project load included), ${first.items.length} diagnostics`,
);

let version = 1;
const edit = async (label, from, to) => {
  const at = text.indexOf(from);
  if (at < 0) throw new Error(`no ${from} in ${file}`);
  const pos = text.slice(0, at).split("\n");
  const start = { line: pos.length - 1, character: pos.at(-1).length };
  const end = { line: start.line, character: start.character + from.length };
  const t = performance.now();
  notify("textDocument/didChange", {
    textDocument: { uri, version: ++version },
    contentChanges: [{ range: { start, end }, text: to }],
  });
  const d = await diagnostics();
  console.log(
    `${label.padEnd(17)} ${(performance.now() - t).toFixed(0)} ms, ${d.items.length} diagnostics${d.items[0] ? `: ${d.items[0].message.slice(0, 90)}` : ""}`,
  );
  notify("textDocument/didChange", {
    textDocument: { uri, version: ++version },
    contentChanges: [
      {
        range: { start, end: { line: start.line, character: start.character + to.length } },
        text: from,
      },
    ],
  });
  await diagnostics();
};
for (let i = 0; i < 3; i++) {
  await edit("valid edit", 'fontSize("0.875rem")', 'fontSize("0.9rem")');
  await edit("invalid edit", 'fontWeight("500")', 'fontWeight("bald")');
}
await request("shutdown", null);
notify("exit", null);
server.kill();
