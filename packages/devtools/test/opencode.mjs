// The dev server side of "ask OpenCode" (cssints({ devtools: true, opencode })): a fake OpenCode V2 service (the registration
// file of Service.discover, /api/info, and the four session calls) and a dev server on fixtures/app. The page is a websocket
// client of Vite's HMR channel: it sends `cssints:devtools:ask` and reads `cssints:devtools:asked`.
//   the prompt reaches the service as sent, with the agent and skills of the option and the repository as the directory;
//   the status goes running (with the session id), then completed; no service is a message, not a crash; with the option
//   off, the overlay's entry has no way to ask and the server ignores the event.
// The link probe (`cssints:devtools:link`, answered by `linked`): found or not, never a session; `opencode.mjs missing` (run
// from here) is the same probe with @opencode/client not installed: a message that says what to do.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { once } from "node:events";
import { register as hook } from "node:module";
import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

import cssints from "cssints/vite";
import { attach, serverId, servers } from "cssints/devtools-link";
import { createServer } from "vite";

import { startFake } from "./fake-opencode.mjs";

const here = import.meta.dirname;
const app = join(here, "fixtures/app");
const repo = join(here, "../../.."); // the nearest folder up from the app with a .git (a file in a worktree)

// ---------- no session is attached to start with (a failed run may have left one)
attach(repo, serverId(repo, app));
attach(repo, serverId(repo, here));

// ---------- the fake service
const fake = await startFake();
const { calls } = fake;
const { register } = fake;

// ---------- a dev server and a page that speaks to it
const serve = async (opencode, root = app) => {
  const server = await createServer({
    root,
    configFile: false,
    logLevel: "error",
    server: { port: 5293, strictPort: false },
    plugins: [cssints({ devtools: true, ...(opencode ? { opencode } : {}) })],
  });
  await server.listen();
  const url = server.resolvedUrls.local[0];
  const socket = new WebSocket(url.replace("http", "ws"), "vite-hmr");
  await once(socket, "open");
  const asked = [];
  const linked = [];
  socket.addEventListener("message", (e) => {
    const m = JSON.parse(e.data);
    if (m.type === "custom" && m.event === "cssints:devtools:asked") asked.push(m.data);
    if (m.type === "custom" && m.event === "cssints:devtools:linked") linked.push(m.data);
  });
  const probe = async () => {
    const n = linked.length;
    socket.send(JSON.stringify({ type: "custom", event: "cssints:devtools:link" }));
    await until("linked", () => linked.length > n);
    return linked.at(-1);
  };
  const ask = (ref, prompt) =>
    socket.send(
      JSON.stringify({ type: "custom", event: "cssints:devtools:ask", data: { ref, prompt } }),
    );
  const until = async (what, check, ms = 5000) => {
    for (const end = Date.now() + ms; Date.now() < end; await sleep(50)) if (check()) return;
    throw new Error(`timed out: ${what}: ${JSON.stringify(asked)}`);
  };
  const entry = await (await fetch(`${url}@id/virtual:cssints/devtools`)).text();
  return { server, socket, asked, linked, probe, ask, until, entry };
};

const PROMPT = [
  "Instruction: make the heading bigger",
  "Styled by (file:line, the call as written):",
  "- src/Card.tsx:12",
  '  color("blue")',
].join("\n");

// the server puts the app on top of what the page built: the root against the repository, and where it listens
const local = (x) => x.server.resolvedUrls.local[0].replace("127.0.0.1", "localhost");
const APP = (where, x, text = PROMPT) =>
  `App: ${where} (${local(x)}); file paths below are relative to it\n${text}`;
const sent = () => calls.findLast((c) => c.path.endsWith("/prompt")).body.text;

// ---------- the client is not installed: the probe says so
if (process.argv[2] === "missing") {
  hook(
    `data:text/javascript,${encodeURIComponent(
      "export const resolve = (s, c, next) => s.startsWith('@opencode/client') ? Promise.reject(Object.assign(new Error('Cannot find package'), { code: 'ERR_MODULE_NOT_FOUND' })) : next(s, c);",
    )}`,
  );
  register();
  const t = await serve({});
  const l = await t.probe();
  assert.equal(l.connected, false);
  assert.match(l.message, /@opencode\/client is not installed/);
  assert.equal(l.directory, repo);
  t.socket.close();
  await t.server.close();
  fake.close();
  process.exit(0);
}

// ---------- on: the prompt reaches the service
{
  register();
  const t = await serve({ agent: "plan", skills: ["cssints"] });
  assert.match(t.entry, /ask: \(ref, prompt\) => hot\.send\("cssints:devtools:ask"/);
  assert.match(t.entry, /link: \(\) => hot\.send\("cssints:devtools:link"\)/);

  // the probe finds the service and creates no session; no service is no message but a fact; starting it later is found
  assert.deepEqual(await t.probe(), { connected: true, url: fake.url(), directory: repo });
  assert.deepEqual(
    calls.map((c) => c.path),
    ["/api/info"],
    "only the service's info was read",
  );
  fake.unregister();
  assert.deepEqual(await t.probe(), { connected: false, directory: repo });
  register();
  assert.equal((await t.probe()).connected, true);
  calls.length = 0;
  t.ask(1, PROMPT);
  await t.until("completed", () => t.asked.some((a) => a.status === "completed"));
  assert.deepEqual(
    t.asked.map((a) => [a.ref, a.status, a.id]),
    [
      [1, "running", "ses_fake1"],
      [1, "completed", "ses_fake1"],
    ],
  );
  const create = calls.find((c) => c.path === "/api/session");
  assert.equal(create.body.agent, "plan");
  assert.equal(
    create.body.location.directory,
    repo,
    "the session runs in the repository of the app",
  );
  const prompt = calls.find((c) => c.path === "/api/session/ses_fake1/prompt");
  assert.equal(
    prompt.body.text,
    APP("packages/devtools/test/fixtures/app", t),
    "the prompt is sent as the overlay built it, the app on top",
  );
  assert.deepEqual(prompt.body.skills, [{ id: "cssints" }]);
  assert.deepEqual(
    calls.map((c) => c.path.replace("/api/", "")).filter((p) => p !== "info"),
    [
      "session",
      "session/ses_fake1/prompt",
      "experimental/session/ses_fake1/wait",
      "session/ses_fake1",
    ],
  );

  // the agent did not finish: the status says so, with the session id
  fake.outcome("failed");
  t.asked.length = 0;
  t.ask(2, PROMPT);
  await t.until("failed", () => t.asked.some((a) => a.status === "failed"));
  assert.deepEqual(t.asked.at(-1), { ref: 2, status: "failed", id: "ses_fake1" });

  // a prompt without a shape is dropped
  const before = calls.length;
  t.socket.send(
    JSON.stringify({ type: "custom", event: "cssints:devtools:ask", data: { prompt: 1 } }),
  );
  await sleep(300);
  assert.equal(calls.length, before);

  // no service runs: a message that says what to do
  fake.unregister();
  t.asked.length = 0;
  t.ask(3, PROMPT);
  await t.until("unavailable", () => t.asked.length > 0);
  assert.equal(t.asked[0].status, "unavailable");
  assert.match(t.asked[0].message, /No OpenCode service is running/);
  t.socket.close();
  await t.server.close();
}

// ---------- /cssints-devtools: the session a dev server's prompts go to (the command's files, devtools-link.ts)
{
  register();
  fake.outcome("succeeded");
  const id = serverId(repo, app);
  const other = serverId(repo, here);
  const t = await serve({});
  const u = await serve({}, here);

  // each server announces itself while it runs, with its root, pid and url
  assert.deepEqual(
    servers(repo).sort((x, y) => x.id.localeCompare(y.id)),
    [
      { id: other, root: here, pid: process.pid, url: local(u) },
      { id, root: app, pid: process.pid, url: local(t) },
    ].sort((x, y) => x.id.localeCompare(y.id)),
    "two dev servers",
  );

  // attached: the prompt goes to that session, which is not created; the probe says which
  attach(repo, id, "ses_attached");
  assert.equal((await t.probe()).session, "ses_attached");
  assert.equal((await u.probe()).session, undefined, "the other server has none");
  calls.length = 0;
  t.ask(1, PROMPT);
  await t.until("attached completed", () => t.asked.some((a) => a.status === "completed"));
  assert.deepEqual(
    t.asked.map((a) => [a.ref, a.status, a.id]),
    [
      [1, "running", "ses_attached"],
      [1, "completed", "ses_attached"],
    ],
  );
  assert.ok(!calls.some((c) => c.path === "/api/session" && c.method === "POST"), "no new session");
  assert.equal(
    calls.find((c) => c.path.endsWith("/prompt")).path,
    "/api/session/ses_attached/prompt",
  );
  assert.equal(sent(), APP("packages/devtools/test/fixtures/app", t));

  // a root equal to the repository is ".", and a prompt past the cut loses its end, not the App line or the Instruction
  const r = await serve({}, repo);
  r.ask(1, `${PROMPT}\n${"x".repeat(20000)}`);
  await r.until("repository root", () => r.asked.some((a) => a.status === "completed"));
  const long = sent();
  assert.equal(long.length, 16000, "cut to the server's bound");
  assert.ok(long.startsWith(APP(".", r, "").trimEnd()), long.slice(0, 200));
  assert.ok(long.includes("Instruction: make the heading bigger"), "the Instruction is kept");
  r.socket.close();
  await r.server.close();

  // the other server is not attached: its prompt opens a new session
  calls.length = 0;
  u.ask(2, PROMPT);
  await u.until("new session", () => u.asked.some((a) => a.status === "completed"));
  assert.equal(u.asked[0].id, "ses_fake1");
  assert.ok(calls.some((c) => c.path === "/api/session" && c.method === "POST"));
  assert.equal(sent(), APP("packages/devtools/test", u), "a root two levels under the repository");

  // detached: back to a new session per prompt
  attach(repo, id);
  assert.equal((await t.probe()).session, undefined);
  t.asked.length = 0;
  t.ask(3, PROMPT);
  await t.until("detached completed", () => t.asked.some((a) => a.status === "completed"));
  assert.equal(t.asked[0].id, "ses_fake1");

  // the session is gone: failed, with the way out
  attach(repo, id, "ses_gone");
  t.asked.length = 0;
  t.ask(4, PROMPT);
  await t.until("gone", () => t.asked.length > 0);
  assert.equal(t.asked[0].status, "failed");
  assert.match(
    t.asked[0].message,
    /ses_gone is gone.*Run \/cssints-devtools in an OpenCode session/,
  );
  attach(repo, id);

  // a closed server leaves no file; a crash leaves a stale pid, which is ignored and removed
  await u.server.close();
  assert.deepEqual(
    servers(repo).map((x) => x.id),
    [id],
  );
  const stale = join(repo, "node_modules/.cache/cssints-devtools/stale.json");
  writeFileSync(
    stale,
    JSON.stringify({ root: here, pid: 2 ** 22 + 1, url: "http://localhost:1/" }),
  );
  assert.deepEqual(
    servers(repo).map((x) => x.id),
    [id],
  );
  assert.ok(!existsSync(stale), "the stale file is removed");
  t.socket.close();
  u.socket.close();
  await t.server.close();
  assert.deepEqual(servers(repo), []);
}

// ---------- off (the default): no way to ask, and the event is ignored
{
  register();
  const before = calls.length;
  const t = await serve(undefined);
  assert.ok(!t.entry.includes("cssints:devtools:ask"), "the entry has no ask");
  assert.ok(!t.entry.includes("cssints:devtools:link"), "the entry has no probe");
  t.ask(1, PROMPT);
  t.socket.send(JSON.stringify({ type: "custom", event: "cssints:devtools:link" }));
  await sleep(500);
  assert.deepEqual(t.asked, []);
  assert.deepEqual(t.linked, []);
  assert.equal(calls.length, before, "the service was not called");
  t.socket.close();
  await t.server.close();
}

fake.close();
execFileSync(process.execPath, [import.meta.filename, "missing"], { stdio: "inherit" });
console.log("devtools opencode ok");
