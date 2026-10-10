// The preview: a sandboxed iframe (no same-origin access: the code in it is the user's) with the sheet, a hyperscript `h` for
// the JSX the compile left, and the files run as the bodies of functions (compile.ts `asBody`), each once, by its id. The entry's
// default export, else `App`, else its first function, is called with no props and what it returns is put in the page. A failure
// goes to the parent as a message.

import type { Output } from "./compile.ts";

const safe = (json: string) => json.replace(/</g, "\\u003c");

export const previewDocument = (
  css: string,
  files: Record<string, Output>,
  entry: string,
  runtime: string,
): string => `<!doctype html>
<meta charset="utf-8">
<style>body{margin:16px;font:16px system-ui,sans-serif}${css.replace(/<\/style/gi, "<\\/style")}</style>
<div id="root"></div>
<script type="module">
const send = (message) => parent.postMessage({ playground: message }, "*");
addEventListener("error", (e) => send({ error: e.message }));
addEventListener("unhandledrejection", (e) => send({ error: String(e.reason?.message ?? e.reason) }));
try {
  const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor;
  const h = (tag, props, ...kids) => {
    props = props ?? {};
    if (typeof tag === "function") return tag({ ...props, children: kids.length < 2 ? kids[0] : kids });
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (v == null || v === false) continue;
      if (k === "className" || k === "class") el.className = Array.isArray(v) ? v.filter(Boolean).join(" ") : v;
      else if (k === "style") typeof v === "string" ? (el.style.cssText = v) : Object.assign(el.style, v);
      else if (/^on[A-Z]/.test(k) && typeof v === "function") el.addEventListener(k.slice(2).toLowerCase(), v);
      else el.setAttribute(k, v === true ? "" : v);
    }
    const add = (c) => {
      if (Array.isArray(c)) c.forEach(add);
      else if (c != null && c !== false) el.append(c instanceof Node ? c : String(c));
    };
    kids.forEach(add);
    return el;
  };
  const Fragment = (p) => p.children;
  const bodies = ${safe(JSON.stringify(Object.fromEntries(Object.entries(files).map(([n, o]) => [`/${n}`, o.body]))))};
  const runtime = await new AsyncFunction("__imp", ${safe(JSON.stringify(runtime))})(() => ({}));
  const loaded = {};
  const load = (id) =>
    (loaded[id] ??= new AsyncFunction("__imp", "h", "Fragment", bodies[id])(imp, h, Fragment));
  const imp = (name) => (name.startsWith("/") ? load(name) : name === "cssints" ? runtime : {});
  const exports = await load(${safe(JSON.stringify(`/${entry}`))});
  const main = exports.default ?? exports.App ?? Object.values(exports).find((v) => typeof v === "function");
  if (typeof main !== "function") send({ empty: true });
  else {
    const out = main({});
    document.getElementById("root").append(out instanceof Node ? out : String(out ?? ""));
    send({ ok: true });
  }
} catch (e) {
  send({ error: String(e?.message ?? e) });
}
</script>`;
