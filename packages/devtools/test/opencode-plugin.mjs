// The OpenCode plugin of @cssints/devtools (src/opencode.ts) on a fake plugin context: the command `cssints-devtools` is
// registered with ctx.command.transform, runs with the id of its session and the text after it, and tells every outcome in
// that session (ctx.session.synthetic). The dev servers are files in a temporary repository (cssints/devtools-link).
//   no argument: none runs; one runs (attached); several run (listed, none attached)
//   an id or a part of it picks one (an exact id wins over a longer one); no match lists the servers
//   `off` detaches the servers this session is attached to, `off <id>` that server; stale files are ignored and removed
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { register, serverId, sessionOf } from "cssints/devtools-link";

import plugin, { COMMAND } from "../src/opencode.ts";

assert.equal(COMMAND, "cssints-devtools");
const git = mkdtempSync(join(tmpdir(), "devtools-plugin-"));
mkdirSync(join(git, ".git"));
mkdirSync(join(git, "apps/docs"), { recursive: true });
mkdirSync(join(git, "apps/docs-x"), { recursive: true });

const said = [];
let command;
let disposed = false;
const ctx = {
  location: { directory: join(git, "packages/x") },
  command: {
    transform: (callback) => {
      callback({ add: (c) => (command = c) });
      return Promise.resolve({ dispose: () => Promise.resolve((disposed = true)) });
    },
  },
  session: { synthetic: (input) => Promise.resolve(said.push(input)) },
};
const cleanup = await plugin.setup(ctx);
assert.equal(plugin.id, "cssints.devtools");
assert.equal(command.name, "cssints-devtools");
const run = async (sessionID, text = "") => {
  await command.execute({ sessionID, prompt: { text }, delivery: "steer" });
  return said.at(-1);
};
const urls = (n) => `http://localhost:${5000 + n}/`;
const docs = join(git, "apps/docs");
const docsX = join(git, "apps/docs-x");

// none runs: told in the session that was asked
let said1 = await run("ses_a");
assert.equal(said1.sessionID, "ses_a");
assert.match(said1.text, /No cssints dev server .* runs in /);
assert.equal(sessionOf(git, "apps-docs"), undefined);

// one runs: this session is attached to it
const off1 = register(git, docs, urls(1));
said1 = await run("ses_a");
assert.match(
  said1.text,
  /^Attached this session \(ses_a\) to the dev server apps-docs \(http:\/\/localhost:5001\//,
);
assert.equal(sessionOf(git, "apps-docs"), "ses_a");

// several run: listed with their ids, root and url, and none is attached by this call
const off2 = register(git, docsX, urls(2));
said1 = await run("ses_b");
assert.match(said1.text, /^2 dev servers run; none is attached/);
assert.match(
  said1.text,
  /- apps-docs {2}http:\/\/localhost:5001\/ {2}.*apps\/docs {2}\(session ses_a\)/,
);
assert.match(said1.text, /- apps-docs-x {2}http:\/\/localhost:5002\//);
assert.equal(sessionOf(git, "apps-docs"), "ses_a", "unchanged");
assert.equal(sessionOf(git, "apps-docs-x"), undefined);

// an id picks one; an exact id wins over the longer one that contains it; a part of an id does too
said1 = await run("ses_b", "apps-docs");
assert.match(said1.text, /^Attached this session \(ses_b\) to the dev server apps-docs \(/);
assert.equal(sessionOf(git, "apps-docs"), "ses_b", "replaced");
said1 = await run("ses_c", "docs-x");
assert.match(said1.text, /dev server apps-docs-x /);
assert.equal(sessionOf(git, "apps-docs-x"), "ses_c");
// a part that two ids contain is ambiguous; one that none contains lists what runs
said1 = await run("ses_d", "docs");
assert.match(said1.text, /^2 dev servers run that match "docs"; none is attached/);
said1 = await run("ses_d", "nothing");
assert.match(said1.text, /^No running dev server matches "nothing"\. Running:\n- apps-docs /);
assert.equal(sessionOf(git, "apps-docs"), "ses_b");

// off: the servers this session is attached to; off <id>: that one
said1 = await run("ses_z", "off");
assert.equal(said1.text.split("\n")[0], "This session is not attached to any dev server.");
said1 = await run("ses_b", "off");
assert.match(said1.text, /^Detached from apps-docs: /);
assert.equal(sessionOf(git, "apps-docs"), undefined);
assert.equal(sessionOf(git, "apps-docs-x"), "ses_c", "another session's server stays");
said1 = await run("ses_z", "off apps-docs-x");
assert.match(said1.text, /^Detached from apps-docs-x: /);
assert.equal(sessionOf(git, "apps-docs-x"), undefined);
said1 = await run("ses_z", "off nothing");
assert.match(said1.text, /^No running dev server matches "nothing"\./);

// a crash leaves a file with a dead pid: ignored, removed, never attached
off1();
off2();
const stale = join(git, "node_modules/.cache/cssints-devtools", `${serverId(git, docs)}.json`);
writeFileSync(stale, JSON.stringify({ root: docs, pid: 2 ** 22 + 1, url: urls(1) }));
said1 = await run("ses_e");
assert.match(said1.text, /No cssints dev server .* runs in /);
assert.ok(!existsSync(stale), "the stale file is removed");

// the notice asks the model for no work, and the plugin unloads
assert.match(said1.text, /run no tools/);
await cleanup();
assert.ok(disposed);
rmSync(git, { recursive: true });
console.log("devtools opencode plugin ok");
