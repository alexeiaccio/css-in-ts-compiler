/* oxlint-disable */
import { gzipSync, brotliCompressSync } from "node:zlib";
import { rolldown } from "/Users/a.tukachev/github/css-in-ts-compiler/node_modules/.bun/node_modules/rolldown/dist/index.mjs";
import { transform } from "/Users/a.tukachev/github/css-in-ts-compiler/node_modules/.bun/node_modules/lightningcss/node/index.mjs";
import { FEATS, read } from "./lib.mjs";

const dir = new URL(".", import.meta.url).pathname;
async function min(source, name) {
  const b = await rolldown({
    input: "entry",
    plugins: [
      {
        name: "v",
        resolveId: (id) => (id === "entry" ? "\0entry" : null),
        load: (id) => (id === "\0entry" ? source : null),
      },
    ],
    logLevel: "silent",
  });
  const { output } = await b.generate({ format: "esm", minify: true });
  return output[0].code.trim();
}
const row = (name, s) =>
  console.log(
    name.padEnd(44),
    String(Buffer.byteLength(s)).padStart(6),
    String(gzipSync(s, { level: 9 }).length).padStart(6),
    String(brotliCompressSync(s).length).padStart(6),
  );
const engine = read("engine.js");
const call = (feats) =>
  `${engine.replace("export default", "const poly =")}\npoly(${JSON.stringify(feats)});`;
const noProbe = engine.replace(/  if \(!force\) \{[\s\S]*?\n  \}\n/, "");
console.log("JS".padEnd(44), "min B".padStart(6), "gzip".padStart(6), "brotli".padStart(6));
const full = await min(call(FEATS));
row("engine + probe + sentinel, frame + surface", full);
row("engine + probe + sentinel, frame only", await min(call([FEATS[0]])));
row(
  "engine, no probe (always on), frame + surface",
  await min(
    `${noProbe.replace("export default", "const poly =")}\npoly(${JSON.stringify(FEATS)}, 1);`,
  ),
);
row(
  "engine, no sentinel/transition listener",
  await min(call(FEATS).replace(/  d\.addEventListener\(\s*"transitionrun",[\s\S]*?\);\n/, "")),
);
console.log("\nminified source:\n" + full + "\n");
console.log("CSS".padEnd(44), "min B".padStart(6), "gzip".padStart(6), "brotli".padStart(6));
for (const f of [
  "kernels/frame.css",
  "kernels/frame.fallback.css",
  "kernels/surface.css",
  "kernels/surface.fallback.css",
  "kernels/poly.css",
]) {
  const c = transform({ filename: f, code: Buffer.from(read(f)), minify: true }).code.toString();
  row(f.replace("kernels/", ""), c);
}
