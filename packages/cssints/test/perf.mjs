// Engine cost at scale (cssints-grrd, docs/research/engine-cost.md). Generates a React app of N css.* modules
// and measures the plugin in it.
//   node perf.mjs gen <n> <dir>     write the app; <dir>/node_modules links to apps/demo/node_modules
//   node perf.mjs dev <dir>         dev cold start: server up, then every module requested concurrently
//   node perf.mjs seq <dir>         dev, modules requested one at a time: per-transform split
//   node perf.mjs build <dir>       vite build with the same split
// Evaluation time is split by patching ModuleRunner: self time of cssints/css-grammar module bodies (library),
// of app module bodies including the __site calls they make (user), of fetchModule RPCs (fetch), of Node imports.
import { mkdirSync, readdirSync, readFileSync, symlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { build, createServer } from "vite";
import { ModuleRunner } from "vite/module-runner";

import { instrument } from "../src/plugin.mjs";

// PLUGIN=../src/other.mjs compares another version of the plugin (A/B in one session)
const { default: cssints } = await import(process.env.PLUGIN ?? "../src/plugin.mjs");

const [cmd, arg, arg2] = process.argv.slice(2);

function gen(n, dir) {
  const w = (f, s) => (mkdirSync(join(dir, f, ".."), { recursive: true }), writeFileSync(join(dir, f), s));
  w("index.html", `<div id="root"></div><script type="module" src="/src/main.tsx"></script>\n`);
  w("vite.config.ts", `import { defineConfig } from "vite";\nimport cssints from "cssints/vite";\nexport default defineConfig({ plugins: [cssints()], css: { transformer: "lightningcss" }, build: { cssMinify: "lightningcss", minify: false } });\n`);
  w("src/tokens/colors.ts", `export const colors = { ${[..."01234567"].map((i) => `c${i}: "#${(0x3b82f6 + i * 0x101010).toString(16).slice(-6)}"`).join(", ")}, text: "#111827", muted: "#6b7280", border: "#e5e7eb" };\n`);
  w("src/tokens/space.ts", `export const space = { xs: 1, sm: 2, md: 4, lg: 6, xl: 8 };\nexport const radius = { sm: "0.25rem", md: "0.5rem", lg: "1rem" };\n`);
  w("src/tokens/type.ts", `export const size = { sm: "0.875rem", md: "1rem", lg: "1.25rem" };\nexport const weight = { normal: "400", bold: "600" };\n`);
  const names = Array.from({ length: n }, (_, i) => `C${i}`);
  names.forEach((name, i) => {
    const child = i ? names[Math.floor((i - 1) / 4)] : null; // a tree: every module imports its parent-level component
    const sp = ["xs", "sm", "md", "lg", "xl"][i % 5];
    w(`src/components/${name}.tsx`, `import { _cv, cx } from "cssints";
import { css, cn, cv, CSS, display, alignItems, gap, p, bg, color, borderRadius, fontSize, fontWeight, border } from "cssints" with { type: "cssints" };
import { colors } from "../tokens/colors";
import { radius, space } from "../tokens/space";
import { size, weight } from "../tokens/type";
${child ? `import { ${child} } from "./${child}";\n` : ""}
const root = [display("flex"), alignItems("center"), gap(space.${sp}), p(space.md + ${i % 3}), bg(colors.c${i % 8}), borderRadius(radius.md)];
const title = css.cn(css.fontSize(size.lg), css.fontWeight(weight.bold), css.color(colors.text));
const body = css.cn(css.flex().alignItems("flex-start").justifyContent("space-between"), css.p(space.sm));
const muted = [color(colors.muted), fontSize(size.sm), border("1px solid", colors.border)];
const inset = css.m(CSS.rem(${(i % 4) + 1}));
const box = cv({
  base: cn(borderRadius("${(i % 3) + 1}px"), css.lineHeight("1.5")),
  variants: { tone: { plain: color("#111827"), loud: cn(color("${"#" + (0x100000 + i * 997).toString(16).slice(-6)}"), fontWeight("700")) } },
  defaultVariants: { tone: "plain" },
});

export function ${name}({ loud = false }: { loud?: boolean }) {
  const hover = css.opacity("0.${(i % 9) + 1}");
  return (
    <div className={cx(...root, loud && hover)}>
      <h2 className={cx(title)}>${name}</h2>
      <p className={cx(body, ...muted, inset)}>{_cv(box, { tone: loud ? "loud" : "plain" })}</p>
      ${child ? `<${child} loud={!loud} />` : ""}
    </div>
  );
}
`);
  });
  w("src/main.tsx", `import "cssints/layers.css";\nimport { createRoot } from "react-dom/client";\n${names.map((c) => `import { ${c} } from "./components/${c}";`).join("\n")}\ncreateRoot(document.getElementById("root")!).render(<>${names.map((c) => `<${c} />`).join("")}</>);\n`);
  try {
    symlinkSync(join(import.meta.dirname, "../../../apps/demo/node_modules"), join(dir, "node_modules"));
  } catch {}
}

// ---- measurement
const t = { library: 0, user: 0, node: 0, "fetch library": 0, "fetch user": 0, "fetch node": 0, imports: 0, importMs: [] };
const kind = (id) => (/node_modules|^(?!\/@fs)[a-z@]/.test(id) ? "node" : /packages\/(cssints|css-grammar)\//.test(id) ? "library" : "user");
const stack = [];
const frame = async (bucket, fn) => {
  const t0 = performance.now();
  stack.push(0);
  try {
    return await fn();
  } finally {
    const dt = performance.now() - t0;
    t[bucket] += dt - stack.pop();
    if (stack.length) stack[stack.length - 1] += dt;
  }
};
const P = ModuleRunner.prototype;
const { directRequest, getModuleInformation, import: imp } = P;
P.directRequest = function (url, mod, cs) {
  return frame(kind(mod.id), () => directRequest.call(this, url, mod, cs));
};
P.getModuleInformation = function (...a) {
  return frame(`fetch ${kind(a[0])}`, () => getModuleInformation.apply(this, a));
};
P.import = async function (url) {
  const t0 = performance.now();
  try {
    return await imp.call(this, url);
  } finally {
    t.imports++;
    t.importMs.push(performance.now() - t0);
  }
};

const transforms = [];
function timed(plugin) {
  const tr = plugin.transform;
  return {
    ...plugin,
    async transform(code, id) {
      const t0 = performance.now();
      const r = await tr.call(this, code, id);
      if (r && this.environment.name === "client") transforms.push(performance.now() - t0);
      return r;
    },
  };
}

const median = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)] ?? 0;
const ms = (x) => `${Math.round(x)}`;
const report = (label, wall) => {
  const files = readdirSync(join(arg, "src/components")).map((f) => join(arg, "src/components", f));
  const ins = files.map((f) => {
    const code = readFileSync(f, "utf8");
    const t0 = performance.now();
    for (let k = 0; k < 20; k++) instrument(code, f);
    return (performance.now() - t0) / 20;
  });
  const n = t.imports || 1;
  console.log(JSON.stringify({
    label, plugin: process.env.PLUGIN ?? "current", modules: files.length, wall: ms(wall), evaluations: t.imports,
    evalTotal: ms(t.importMs.reduce((a, b) => a + b, 0)),
    perEval: { first: +(t.importMs[0] ?? 0).toFixed(1), median: +median(t.importMs).toFixed(2), mean: +(t.importMs.reduce((a, b) => a + b, 0) / n).toFixed(2), ...Object.fromEntries(Object.entries(t).filter(([k, v]) => typeof v === "number" && k !== "imports").map(([k, v]) => [k, +(v / n).toFixed(2)])) },
    transform: { median: +median(transforms).toFixed(2) },
    instrument: +median(ins).toFixed(3),
  }));
};

if (cmd === "gen") gen(Number(arg), arg2);
else if (cmd === "dev" || cmd === "seq") {
  const t0 = performance.now();
  const server = await createServer({ root: arg, configFile: false, logLevel: "warn", server: { port: 0, watch: null, preTransformRequests: cmd === "dev" }, css: { transformer: "lightningcss" }, plugins: [timed(cssints())] });
  await server.listen();
  const client = server.environments.client;
  const ids = readdirSync(join(arg, "src/components")).map((f) => `/src/components/${f}`);
  if (cmd === "dev") await client.transformRequest("/src/main.tsx");
  if (cmd === "dev") await Promise.all(ids.map((u) => client.transformRequest(u)));
  else for (const u of ids) await client.transformRequest(u);
  report(cmd, performance.now() - t0);
  await server.close();
  process.exit(0);
} else if (cmd === "build") {
  process.chdir(arg); // the plugin's private server takes process.cwd() as root, like the vite CLI
  const t0 = performance.now();
  await build({ root: arg, configFile: false, logLevel: "warn", css: { transformer: "lightningcss" }, build: { cssMinify: "lightningcss", minify: false, write: false }, plugins: [timed(cssints())] });
  report("build", performance.now() - t0);
  process.exit(0);
}
