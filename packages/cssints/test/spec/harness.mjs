// A dev server with plugin.mjs on a temp copy of a card/button/tokens app. The watcher is manual and every
// ssr transform of an app file can be held at a gate after its source was read, so tests pick the interleaving.
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";

import { createServer } from "vite";

import cssints from "../../src/plugin.mjs";

export const CLIENT = ["card", "button"];
const pad = (v) => `css.p(${100 * (v + 1)} + space.md)`;
const SOURCE = {
  tokens: (v) => `export const space = { md: ${v + 1} };\n`,
  card: (v) => `import { css } from "cssints" with { type: "cssints" };\nimport { space } from "./tokens";\nexport const src = ${v};\nexport const card = ${pad(v)};\n`,
  button: (v) => `import { css } from "cssints" with { type: "cssints" };\nimport { space } from "./tokens";\nexport const src = ${v};\nexport const button = css.cn(css.flex().alignItems("center"), ${pad(v)});\n`,
};

export async function start() {
  const root = mkdtempSync(join(import.meta.dirname, "..", ".tmp-"));
  const path = (f) => join(root, `${f}.ts`);
  const disk = { card: 0, button: 0, tokens: 0 };
  for (const f in disk) writeFileSync(path(f), SOURCE[f](0));

  let progress = 0;
  const gated = new Set();
  const waiting = new Map(); // file -> resolvers of held ssr transforms
  const spy = {
    name: "spy",
    async transform(_, id) {
      progress++;
      const f = basename(id, ".ts");
      if (this.environment.name !== "ssr" || !(f in disk) || !gated.has(f)) return;
      await new Promise((r) => waiting.set(f, [...(waiting.get(f) ?? []), r]));
      progress++;
    },
    hotUpdate() {
      progress++;
    },
  };
  const server = await createServer({
    root,
    configFile: false,
    logLevel: "silent",
    server: { middlewareMode: true, watch: null, ws: false },
    plugins: [cssints(), spy],
  });
  const client = server.environments.client;
  const errors = [];

  // Let the server run until nothing moves: every transform is done or held at a gate.
  const settle = async () => {
    for (let last = -1, quiet = 0; quiet < 3; ) {
      await new Promise((r) => setTimeout(r, 15));
      quiet = progress === last ? quiet + 1 : 0;
      last = progress;
    }
  };

  // What the next request of a client module gets: its cached transform result (null: re-transform).
  const served = (c) => {
    const mod = client.moduleGraph.getModuleById(path(c));
    const r = mod?.transformResult ?? (typeof mod?.invalidationState === "object" ? mod.invalidationState : null);
    if (!r) return null;
    const cls = r.code.match(new RegExp(`${c} = "([^"]+)"`))[1].split(" ");
    const rem = cls.map((k) => globalThis.__cssints.rules.get(k)?.match(/padding:([\d.]+)rem/)?.[1]).find(Boolean);
    const n = Math.round(Number(rem) * 4);
    return { src: Number(r.code.match(/src = (\d+)/)[1]), self: Math.floor(n / 100) - 1, tokens: (n % 100) - 1 };
  };

  return {
    disk,
    errors,
    settle,
    served,
    gate: (...fs) => fs.forEach((f) => gated.add(f)),
    ungate: () => gated.clear(),
    held: (f) => waiting.get(f)?.length ?? 0,
    edit(f) {
      writeFileSync(path(f), SOURCE[f](++disk[f]));
    },
    async watch(f) {
      server.watcher.emit("change", path(f));
      await settle();
    },
    async request(c) {
      client.transformRequest(`/${c}.ts`).then(() => progress++, (e) => (progress++, errors.push(`${c}: ${String(e?.message ?? e).split("\n")[0]}`)));
      await settle();
    },
    async release(f) {
      const rs = waiting.get(f) ?? [];
      waiting.delete(f);
      rs.forEach((r) => r());
      await settle();
    },
    async close() {
      gated.clear();
      for (const rs of waiting.values()) rs.forEach((r) => r());
      await settle(); // a transform still running when the ssr environment closes waits for its 30s timeout
      await server.close();
      rmSync(root, { recursive: true, force: true });
    },
  };
}
