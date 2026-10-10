// The /tui page (src/tui/): sky's screen on @bomb.sh/tty in a browser, drawn by ghostty-web. What the code it runs imports
// from Node or the network is answered here:
//   @bomb.sh/tty's esm/wasm.js   unpacks its WASM with node:zlib's brotliDecompressSync at load: unpacked here at build time
//                                into a .wasm asset, which the browser fetches and compiles, with no brotli decoder
//   @cssints/tui[/bomb|/system]  the sources (the package has no dist in the repository)
//   apps/sky-tui/src/styles.ts   built ahead into prop objects by plugin/tui-styles.ts, in a process of its own
//   @atcute/client               from apps/sky's api.ts: src/tui/fixtures.ts, the real client with a fetch handler that
//                                answers from sky's recorded fixtures, so the page makes no request
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import type { Plugin } from "vite";

const tui = join(import.meta.dirname, "../../../packages/tui/src");
const api = join(import.meta.dirname, "../../sky/src/api.ts");
const fixtures = join(import.meta.dirname, "../src/tui/fixtures.ts");
const TUI: Record<string, string> = {
  "@cssints/tui": "index.ts",
  "@cssints/tui/bomb": "bomb.ts",
  "@cssints/tui/system": "system.ts",
};
const styles = join(import.meta.dirname, "../../sky-tui/src/styles.ts");

// The bytes the module would unpack: its own code up to the compile call, run in Node.
const unpack = async (file: string): Promise<Buffer> => {
  const source = readFileSync(file, "utf8").replace(
    /export const compiled = await WebAssembly\.compile\(new Uint8Array\(brotliDecompressSync\(compressed\)\)\);/,
    "export const bytes = brotliDecompressSync(compressed);",
  );
  if (!source.includes("export const bytes")) throw new Error(`docs:tui: ${file} changed shape`);
  const mod = (await import(
    `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`
  )) as { bytes: Buffer };
  return mod.bytes;
};

export default function tuiPlugin(): Plugin {
  let built = "";
  let cache = "";
  return {
    name: "docs:tui",
    enforce: "pre",
    // the optimizer would bundle esm/wasm.js before load() below sees it; ghostty-web found late reloads the page
    config: () => ({ optimizeDeps: { exclude: ["@bomb.sh/tty", "ghostty-web"] } }),
    configResolved(config) {
      cache = join(config.root, "node_modules/.cache/tui");
      execFileSync(process.execPath, [join(import.meta.dirname, "tui-styles.ts"), cache], {
        stdio: "inherit",
      });
      built = join(cache, "styles.mjs");
    },
    resolveId(id, importer) {
      if (importer && id.startsWith(".") && join(dirname(importer), id) === styles) return built;
      if (Object.hasOwn(TUI, id)) return join(tui, TUI[id]!);
      if (id === "@atcute/client" && importer === api) return fixtures;
      return undefined;
    },
    async load(id) {
      const file = id.split("?")[0]!;
      if (/@bomb\.sh[/+]tty.*[/]esm[/]wasm\.js$/.test(file)) {
        const wasm = join(cache, "bomb-tty.wasm");
        writeFileSync(wasm, await unpack(file));
        return `import url from ${JSON.stringify(`${wasm}?url`)};
export const compiled = await WebAssembly.compile(await (await fetch(url)).arrayBuffer());`;
      }
      return undefined;
    },
    // ghostty-web inlines its WASM as a base64 data URL (560 kB of the chunk): the package's own .wasm file instead, an
    // asset fetched once, which the server compresses
    transform(code, id) {
      if (!/ghostty-web[/]dist[/]ghostty-web\.js$/.test(id.split("?")[0]!)) return undefined;
      const out = code.replace(
        /new URL\("data:application\/wasm;base64,[A-Za-z0-9+/=]+", self\.location\)/,
        "new URL(__ghosttyWasm, self.location.href)",
      );
      if (out === code) throw new Error("docs:tui: ghostty-web changed shape");
      return `import __ghosttyWasm from "ghostty-web/ghostty-vt.wasm?url";\n${out}`;
    },
    // /tui has a document of its own, as /playground has (plugin/playground.ts): listed before docs(), so this post hook
    // sees the shell before the overview is written into it
    generateBundle: {
      order: "post",
      handler(_, bundle) {
        const index = bundle["index.html"];
        if (index?.type !== "asset") return;
        const source = String(index.source)
          .replace(/<title>.*?<\/title>/, () => "<title>TUI · cssints</title>")
          .replace(
            '<div id="root"></div>',
            () =>
              '<div id="root"></div><noscript>The TUI page runs a terminal and an app in your browser and needs JavaScript.</noscript>',
          )
          .replace(
            /(name="description"\s+content=")[^"]*/,
            (_all, head: string) =>
              `${head}A live terminal: sky on @bomb.sh/tty, styled with cssints/tui, in Ghostty's emulator compiled to WebAssembly.`,
          );
        this.emitFile({ type: "asset", fileName: "tui/index.html", source });
      },
    },
  };
}
