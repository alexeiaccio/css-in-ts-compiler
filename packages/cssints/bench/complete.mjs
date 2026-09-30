// Completions inside string literals over tsgo's language server: node bench/complete.mjs 'display("|")' ...
// Each argument is a snippet of user code with `|` for the cursor; it is appended to a scratch file in apps/demo/src.
import { spawn } from "node:child_process";
import { writeFileSync, unlinkSync } from "node:fs";
import { pathToFileURL } from "node:url";

const root = `${import.meta.dirname}/../../..`;
const demo = `${root}/apps/demo`;
const file = `${demo}/src/_complete.tsx`;
const uri = pathToFileURL(file).href;
const head = `import * as css from "cssints" with { type: "cssints" };
import { display, color, padding, border, media } from "cssints" with { type: "cssints" };
`;
writeFileSync(file, head);
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
    else if (msg.id !== undefined) send({ id: msg.id, result: null });
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
await request("initialize", {
  processId: process.pid,
  rootUri: pathToFileURL(demo).href,
  capabilities: { textDocument: { completion: { completionItem: {} } } },
  workspaceFolders: [{ uri: pathToFileURL(demo).href, name: "demo" }],
});
notify("initialized", {});
notify("textDocument/didOpen", { textDocument: { uri, languageId: "typescriptreact", version: 1, text: head } });
let version = 1;
for (const snippet of process.argv.slice(2)) {
  const at = snippet.indexOf("|");
  const code = snippet.replace("|", "");
  const text = `${head}${code};\n`;
  notify("textDocument/didChange", { textDocument: { uri, version: ++version }, contentChanges: [{ text }] });
  const pre = `${head}${code.slice(0, at)}`.split("\n");
  const t = performance.now();
  const r = await request("textDocument/completion", {
    textDocument: { uri },
    position: { line: pre.length - 1, character: pre.at(-1).length },
  });
  const ms = performance.now() - t;
  const items = Array.isArray(r.result) ? r.result : (r.result?.items ?? []);
  const labels = items.map((i) => i.label);
  console.log(`${snippet}  ${ms.toFixed(0)} ms, ${labels.length} items: ${labels.slice(0, 12).join(" ")}${labels.length > 12 ? " …" : ""}`);
  if (r.error) console.log(JSON.stringify(r.error));
}
await request("shutdown", null);
notify("exit", null);
server.kill();
unlinkSync(file);
