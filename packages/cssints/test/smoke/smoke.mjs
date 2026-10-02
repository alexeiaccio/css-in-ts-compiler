// Fresh-app smoke test: what a user gets from the two tarballs, with none of the repo around it.
//   node test/smoke/smoke.mjs        (bun run test:smoke; not part of `bun run test`: it builds, packs and runs npm install)
// 1. build and npm-pack css-grammar and cssints; 2. write a new Vite 8 + React app in a temp dir ($SMOKE_TMP or the OS
// temp dir); 3. npm install the tarballs; 4. plain `vite build` (not vite-plus): the CSS is there and the eval-time
// code is not in the client bundle (and a library written on cssints, built by tsdown and installed from its own
// tarball, is evaluated by the app's engine); 5. type-check with tsgo and tsc 5.9, and a wrong value must fail; 6. the type
// benches of the repo against the installed dist (skipLibCheck) next to their budgets from the sources.
// The compilers are the repo's (the app needs none to build); everything else comes from npm like a user's install.
import { execFileSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const here = import.meta.dirname;
const repo = resolve(here, "../../../..");
const pkgs = {
  grammar: join(repo, "packages/css-grammar"),
  cssints: join(repo, "packages/cssints"),
  icons: join(repo, "packages/icons"),
};
const tsgo = join(repo, "node_modules/.bin/tsgo");
const vp = join(repo, "node_modules/.bin/vp");
const tsc59 = join(repo, "node_modules/typescript/bin/tsc");

let failed = 0;
const ok = (cond, what, detail = "") => {
  console.log(`${cond ? "ok  " : "FAIL"} ${what}${!cond && detail ? `\n${detail}` : ""}`);
  if (!cond) failed++;
};
const run = (cmd, args, cwd, allowFail = false) => {
  try {
    return {
      code: 0,
      out: execFileSync(cmd, args, { cwd, encoding: "utf8", stdio: "pipe", maxBuffer: 1 << 26 }),
    };
  } catch (e) {
    if (!allowFail)
      throw new Error(`${cmd} ${args.join(" ")} failed in ${cwd}\n${e.stdout}\n${e.stderr}`);
    return { code: e.status, out: `${e.stdout}${e.stderr}` };
  }
};
const files = (dir, base = dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
    d.isDirectory() ? files(join(dir, d.name), base) : [join(dir, d.name).slice(base.length + 1)],
  );

// 1. tarballs
for (const dir of Object.values(pkgs)) {
  run("bun", ["run", "build"], dir);
  for (const f of readdirSync(dir).filter((f) => f.endsWith(".tgz")))
    run("rm", [join(dir, f)], dir);
  run("bun", ["run", "pack:tgz"], dir);
}
const tgz = (dir) =>
  join(
    dir,
    readdirSync(dir).find((f) => f.endsWith(".tgz")),
  );
const tarballs = {
  grammar: tgz(pkgs.grammar),
  cssints: tgz(pkgs.cssints),
  icons: tgz(pkgs.icons),
};
console.log("tarballs");
for (const t of Object.values(tarballs)) {
  const list = run("tar", ["tzf", t], repo)
    .out.trim()
    .split("\n")
    .map((f) => f.replace(/^package\//, ""));
  console.log(
    `  ${t.split("/").pop()}  ${statSync(t).size} bytes, ${list.length} files: ${list.join(" ")}`,
  );
  ok(
    list.every(
      (f) => ["package.json", "LICENSE", "README.md"].includes(f) || f.startsWith("dist/"),
    ),
    `${t.split("/").pop()} ships dist/ only (plus package.json, LICENSE, README)`,
  );
  ok(
    !list.some((f) => /\.tsx?$/.test(f) && !f.endsWith(".d.ts")),
    `${t.split("/").pop()} has no .ts sources`,
  );
}

// 2. the app
const app = mkdtempSync(join(process.env.SMOKE_TMP ?? tmpdir(), "cssints-smoke-"));
console.log(`app: ${app}`);
const put = (name, text) => {
  mkdirSync(join(app, name, ".."), { recursive: true });
  writeFileSync(join(app, name), text);
};
mkdirSync(join(app, "tarballs"));
for (const t of Object.values(tarballs)) cpSync(t, join(app, "tarballs", t.split("/").pop()));
put(
  "package.json",
  JSON.stringify(
    {
      name: "smoke-app",
      private: true,
      type: "module",
      scripts: { build: "vite build" },
      dependencies: { react: "^18.3.1", "react-dom": "^18.3.1" },
      devDependencies: {
        "@types/react": "^18",
        "@types/react-dom": "^18",
        "@iconify-json/mdi": "^1.2.0",
        lightningcss: "^1.32.0",
        vite: "^8.3.0",
      },
      // Not on the registry yet: the dependency of cssints on css-grammar resolves to the tarball.
      overrides: { "@cssints/css-grammar": "file:./tarballs/cssints-css-grammar-0.1.0.tgz" },
    },
    null,
    2,
  ),
);
put(
  "index.html",
  `<!doctype html><html><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>\n`,
);
put(
  "vite.config.ts",
  `import cssints, { targets } from "cssints/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [cssints()],
  css: { transformer: "lightningcss", lightningcss: { targets } },
  build: { cssMinify: "lightningcss", cssTarget: false, minify: false, sourcemap: true },
});
`,
);
put(
  "tsconfig.json",
  JSON.stringify(
    {
      compilerOptions: {
        target: "ES2022",
        lib: ["ES2023", "DOM", "DOM.Iterable"],
        module: "preserve",
        moduleResolution: "bundler",
        jsx: "react-jsx",
        strict: true,
        noEmit: true,
        skipLibCheck: true,
        verbatimModuleSyntax: true,
        allowImportingTsExtensions: true,
        types: ["vite/client"],
      },
      include: ["src", "vite.config.ts"],
      exclude: ["src/bad.ts", "src/bad-lib.ts"],
    },
    null,
    2,
  ),
);
put(
  "src/tokens.ts",
  `import { createTokens } from "cssints" with { type: "cssints" };

export const t = createTokens({ color: { $type: "color", brand: { $value: "#3b82f6" } } });
`,
);
put(
  "src/Button.tsx",
  `import { _cv, cx } from "cssints";
import { bg, cn, color, cv, hover, media, p } from "cssints" with { type: "cssints" };

import { mdi } from "./icons.ts" with { type: "cssints" };
import { ring } from "./ring.ts" with { type: "cssints" };
import { t } from "./tokens.ts" with { type: "cssints" };

const wide = media("(width >= 40rem)");

const button = _cv(
  cv({
    base: cn(p(2), bg(t.color.brand), color("white"), hover(bg("#2563eb")), ring().width("2px"), mdi("home")),
    variants: { size: { lg: wide(p(4)) } },
    defaultVariants: { size: "lg" },
  }),
);

export function Button({ busy }: { busy?: boolean }) {
  return <button className={cx(button(), busy && p(9))}>smoke</button>;
}
`,
);
// a plugin on cssints/plugin: a context with a runtime for a feature the targets of the build lack
put(
  "src/ring.ts",
  `import { context, method } from "cssints/plugin";

export const ring = context({
  name: "ring",
  marker: "_rg",
  kernel: { key: "ring@1", css: "._rg{outline:var(--rg-w) solid}" },
  runtime: {
    polyfills: ["css.at-rules.container.style_queries_for_custom_properties"],
    parentVars: [{ marker: "_rg", read: "--rg-i", write: "--rg-u" }],
    css: ":root[data-cssints-poly] ._rg{--rg-u:0px}",
  },
  methods: { width: method({ grammar: "<length>", emit: (v) => [["--rg-w", v]] }) },
});
`,
);
// icons: a build-time module on @cssints/icons, which reads @iconify-json/mdi from the app's node_modules
put(
  "src/icons.ts",
  `import { icons } from "@cssints/icons" with { type: "cssints" };

export const mdi = icons<typeof import("@iconify-json/mdi/icons.json")>({
  provider: "iconify-json",
  collection: "mdi",
});
`,
);
// the library's style, cv and token, and a theme of the token
put(
  "src/Lib.tsx",
  `import { bg, cn, createGlobalTheme } from "cssints" with { type: "cssints" };
import { button, card } from "cssints-fixture-ui";
import { t } from "cssints-fixture-ui" with { type: "cssints" };

createGlobalTheme(t, ".dark", { color: { brand: "#ef4444" } });
const banner = cn(bg(t.color.brand));

export const Lib = () => <div className={\`\${card} \${banner} \${button({ size: "lg" })}\`}>lib</div>;
`,
);
put(
  "src/main.tsx",
  `import "virtual:cssints.css";
import { createRoot } from "react-dom/client";

import { Button } from "./Button.tsx";
import { Lib } from "./Lib.tsx";

createRoot(document.getElementById("root")!).render(
  <>
    <Button />
    <Lib />
  </>,
);
`,
);
put(
  "src/bad.ts",
  `import { color } from "cssints" with { type: "cssints" };

import { mdi } from "./icons.ts" with { type: "cssints" };

export const wrong = color("blu");
export const typo = mdi("hom");
`,
);
put(
  "src/bad-lib.ts",
  `import { createGlobalTheme } from "cssints" with { type: "cssints" };
import { t } from "cssints-fixture-ui" with { type: "cssints" };

createGlobalTheme(t, ".dark", { color: { nope: "red" } });
`,
);

// 3. install like a user: from the tarballs, npm
const install = run(
  "npm",
  [
    "install",
    "--no-audit",
    "--no-fund",
    ...[tarballs.cssints, tarballs.icons].map((t) => `./tarballs/${t.split("/").pop()}`),
  ],
  app,
);
ok(
  existsSync(join(app, "node_modules/cssints/dist/index.mjs")),
  "npm install: cssints from the tarball",
);
ok(!existsSync(join(app, "node_modules/cssints/src")), "installed cssints has no src/");
ok(
  existsSync(join(app, "node_modules/@cssints/icons/dist/index.mjs")),
  "npm install: @cssints/icons from the tarball",
);
ok(
  !/ERESOLVE|peer dep/i.test(install.out),
  "npm install: no peer dependency warnings",
  install.out,
);
const installed = JSON.parse(readFileSync(join(app, "node_modules/cssints/package.json"), "utf8"));
ok(
  !installed.private && installed.exports["."].default === "./dist/index.mjs",
  "installed manifest points at dist",
);

// 3b. a library written on cssints: built by tsdown against the installed cssints, packed, installed from its tarball
const libDir = `${app}-ui`;
cpSync(join(here, "../pkg/ui"), libDir, { recursive: true });
mkdirSync(join(libDir, "node_modules"), { recursive: true });
symlinkSync(join(app, "node_modules/cssints"), join(libDir, "node_modules/cssints"));
run(vp, ["pack", "--no-config", "src/index.ts", "--dts", "--platform", "neutral"], libDir);
run("npm", ["pack", "--pack-destination", join(app, "tarballs")], libDir);
const uiTgz = join(app, "tarballs/cssints-fixture-ui-0.0.0.tgz");
const uiFiles = run("tar", ["tzf", uiTgz], app).out.trim().split("\n");
ok(
  uiFiles.includes("package/dist/index.js") && uiFiles.includes("package/dist/index.d.ts"),
  "the library tarball has its code and its .d.ts",
  uiFiles.join("\n"),
);
run("npm", ["install", "--no-audit", "--no-fund", uiTgz], app);
ok(
  /from "cssints" with \{ type: "cssints" \}/.test(
    readFileSync(join(app, "node_modules/cssints-fixture-ui/dist/index.js"), "utf8"),
  ),
  "tsdown kept the attributes in the library's JS",
);

// 4. plain vite build; the targets are set, so that the runtime of the plugin is needed (Firefox 128 has no style queries)
process.env.BROWSERSLIST = "chrome 120, firefox 128";
const build = run(join(app, "node_modules/.bin/vite"), ["build"], app);
delete process.env.BROWSERSLIST;
const assets = files(join(app, "dist/assets"));
const css = assets
  .filter((f) => f.endsWith(".css"))
  .map((f) => readFileSync(join(app, "dist/assets", f), "utf8"))
  .join("\n");
const js = assets.filter((f) => f.endsWith(".js"));
const source = js.map((f) => readFileSync(join(app, "dist/assets", f), "utf8")).join("\n");
console.log(build.out.trim().split("\n").slice(-8).join("\n"));
ok(/:hover/.test(css) && /#2563eb/i.test(css), "css: the hover rule");
ok(/(min-width:\s*40rem|width\s*>=\s*40rem)/.test(css), "css: the media condition", css);
ok(
  /@property\s+--/.test(css) && /#3b82f6/i.test(css),
  "css: the token (@property and its value)",
  css,
);
ok(/padding/.test(css), "css: padding from p()");
ok(
  /--rg-w:\s*2px/.test(css) && /\._rg\s*\{/.test(css),
  "css: the kernel and the method of the plugin",
  css,
);
ok(/\._i\s*\{[^}]*mask:\s*var\(--_svg\)/.test(css), "css: the icon kernel (a mask)", css);
ok(/--_svg:\s*url\("data:image\/svg\+xml,/.test(css), "css: the icon as one custom property");
ok(
  /#1d4ed8/i.test(css) && css.match(/@property --color-brand/g)?.length === 1,
  "css: the library's cv and its token, once",
  css,
);
ok(
  /\.dark\s*\{[^}]*--color-brand:\s*#ef4444/.test(css),
  "css: the app's theme of the library's token",
  css,
);
ok(
  css.includes("data-cssints-poly"),
  "css: the fallback of the plugin's runtime (a target lacks the feature)",
);

// the eval-time code must not reach the client bundle: by module (the source maps) and by content
const maps = js
  .filter((f) => existsSync(join(app, "dist/assets", `${f}.map`)))
  .flatMap((f) => JSON.parse(readFileSync(join(app, "dist/assets", `${f}.map`), "utf8")).sources);
const bundled = maps.filter((s) =>
  /node_modules\/(cssints|@cssints|@iconify|@iconify-json|effect|culori|lightningcss|oxc-|magic-string|happy-dom|@mdn|browserslist|mdn-data)\//.test(
    s,
  ),
);
console.log(`  bundled from node_modules: ${[...new Set(bundled)].join(", ")}`);
ok(maps.length > 0, "client bundle has source maps to inspect");
ok(
  bundled.every((s) => /cssints\/dist\/(runtime|parent-vars)\.mjs$/.test(s)),
  "only cssints/dist/runtime.mjs and parent-vars.mjs are bundled from the library",
  bundled.join("\n"),
);
ok(
  bundled.some((s) => s.endsWith("cssints/dist/runtime.mjs")),
  "the browser runtime is in the bundle (cx and _cv)",
);
ok(
  bundled.some((s) => s.endsWith("cssints/dist/parent-vars.mjs")) &&
    source.includes("transitionrun"),
  "the plugin's runtime is in the bundle (the shared parent-vars engine)",
);
ok(
  maps.some((s) => s.includes("cssints-fixture-ui/dist/index.js")) &&
    !source.includes("createTokens"),
  "the library's module is in the bundle, compiled (no build-time call left)",
);
for (const marker of [
  "MacroError",
  "InvalidValueError",
  "parseGrammar",
  "browserslist",
  "culori",
  "oxc-parser",
  "happy-dom",
  "lightningcss",
  "browser-compat-data",
  "TaggedError",
  "__cssints",
  "iconify",
])
  ok(!source.includes(marker), `client bundle does not contain "${marker}"`);

// 5. types: tsgo and tsc 5.9, skipLibCheck like a user's; then the dist declarations themselves
/** @type {[name: string, cmd: string[], noConfig: string[]][]} */
const checkers = [
  ["tsgo", [tsgo], ["--ignoreConfig"]],
  ["tsc 5.9", [process.execPath, tsc59], []],
];
for (const [name, cmd, noConfig] of checkers) {
  const [bin, ...pre] = cmd;
  const good = run(bin, [...pre, "-p", "tsconfig.json"], app, true);
  ok(good.code === 0, `${name}: the app type-checks against dist`, good.out);
  const wrong = run(
    bin,
    [
      ...pre,
      ...noConfig,
      "--noEmit",
      "--strict",
      "--module",
      "preserve",
      "--skipLibCheck",
      "--allowImportingTsExtensions",
      "src/bad.ts",
    ],
    app,
    true,
  );
  ok(wrong.code !== 0 && /blu/.test(wrong.out), `${name}: color("blu") is a type error`, wrong.out);
  ok(/hom/.test(wrong.out), `${name}: mdi("hom") is a type error`, wrong.out);
  const across = run(
    bin,
    [
      ...pre,
      ...noConfig,
      "--noEmit",
      "--strict",
      "--module",
      "preserve",
      "--skipLibCheck",
      "src/bad-lib.ts",
    ],
    app,
    true,
  );
  ok(
    across.code !== 0 && /nope/.test(across.out),
    `${name}: a wrong token path of the library's token is a type error`,
    across.out,
  );
  const lib = run(bin, [...pre, "-p", "tsconfig.json", "--skipLibCheck", "false"], app, true);
  // effect's own declarations (a beta) do not check without skipLibCheck; ours must
  const ours = lib.out.split("\n").filter((l) => /node_modules\/(cssints|@cssints)\//.test(l));
  ok(
    ours.length === 0,
    `${name}: the dist declarations of cssints and css-grammar check without skipLibCheck`,
    ours.join("\n"),
  );
}

// 6. the benches of the repo (users.ts, unused.ts: imports of "cssints" as user code writes them), on dist
const bench = join(app, "bench-types");
mkdirSync(bench);
for (const f of ["empty.ts", "unused.ts", "users.ts", "plugins.ts"])
  cpSync(join(pkgs.cssints, "bench", f), join(bench, f));
cpSync(join(pkgs.cssints, "bench/budget.json"), join(bench, "budget.json"));
const sources = JSON.parse(readFileSync(join(bench, "budget.json"), "utf8"));
run(process.execPath, [join(pkgs.grammar, "bench/budget.mjs"), bench, "--update"], app);
const dist = JSON.parse(readFileSync(join(bench, "budget.json"), "utf8"));
console.log("type cost, skipLibCheck, instantiations net of empty.ts (sources -> dist)");
for (const f of ["unused.ts", "users.ts", "plugins.ts"])
  for (const c of ["tsc", "tsgo"]) {
    const gain = (1 - dist[f][c] / sources[f][c]) * 100;
    console.log(
      `  ${f.padEnd(10)} ${c.padEnd(5)} ${String(sources[f][c]).padStart(7)} -> ${String(dist[f][c]).padStart(7)}  (${gain.toFixed(1)}% less)`,
    );
    ok(dist[f][c] <= sources[f][c] * 1.1, `${f} ${c}: dist costs no more than the sources`);
  }

console.log(failed ? `\n${failed} check(s) failed (app kept in ${app})` : "\nsmoke test passed");
process.exit(failed ? 1 : 0);
