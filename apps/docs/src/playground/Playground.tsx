import { createSignal, For, onSettled, Show } from "solid-js";

import { type Compiled, type Files, start } from "./client.ts";
import { type Editor, mount } from "./editor.ts";
import example from "./example.txt?raw";
import { previewDocument } from "./preview.ts";
import { decode, encode } from "./share.ts";
import * as s from "./styles.ts";

type Tab = "preview" | "css" | "shipped" | "module" | "js";
const TABS: [Tab, string][] = [
  ["preview", "Preview"],
  ["css", "CSS"],
  ["shipped", "Shipped CSS"],
  ["module", "Module"],
  ["js", "JS"],
];

const DELAY = 300;
const ENTRY = "playground.tsx";

// The page: an editor, the engine in a worker (client.ts), and what it made. The code is in the URL hash, so a link is a share.
export default function Playground() {
  const [result, setResult] = createSignal<Compiled>();
  const [status, setStatus] = createSignal("Loading the engine…");
  const [tab, setTab] = createSignal<Tab>("preview");
  const [doc, setDoc] = createSignal("");
  const [problem, setProblem] = createSignal("");
  const [copied, setCopied] = createSignal(false);
  const [files, setFiles] = createSignal<Files>({ [ENTRY]: example });
  const [active, setActive] = createSignal(ENTRY);
  const [naming, setNaming] = createSignal<{ from?: string; value: string }>();
  const [types, setTypes] = createSignal("");
  const engine = start();
  let host: HTMLDivElement | undefined;
  let frame: HTMLIFrameElement | undefined;
  let editor: Editor | undefined;
  let version = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const run = async (all: Files) => {
    const mine = ++version;
    setStatus("Compiling…");
    const t0 = performance.now();
    const r = await engine.compile(all);
    if (mine !== version) return;
    setResult(r);
    setProblem("");
    editor?.diagnose(r.ok ? [] : r.errors);
    setStatus(
      r.ok
        ? `Compiled in ${Math.round(performance.now() - t0)} ms · ${r.classes.length} classes`
        : `${r.errors.length} error${r.errors.length === 1 ? "" : "s"}`,
    );
    if (r.ok) setDoc(previewDocument(r.css, r.files, r.entry, await engine.runtime()));
    history.replaceState(null, "", `${location.pathname}${location.search}#${await encode(all)}`);
  };

  const changed = (all: Files) => {
    setFiles(all);
    setTypes("Types: checking…");
    clearTimeout(timer);
    timer = setTimeout(() => void run(all), DELAY);
  };
  // the files, edited by the page: the editor follows, and the build runs again
  const update = (all: Files, name = active()) => {
    setActive(name);
    editor?.set(all, name);
    changed(all);
  };

  onSettled(() => {
    // a host that answers /playground with the overview's document: its static copy goes, as Page.tsx does when it has a page
    document.getElementById("prerender")?.remove();
    document.getElementById("root")!.hidden = false;
    document.title = "Playground · cssints";
    const message = (e: MessageEvent<{ playground?: { error?: string } }>) => {
      if (frame && e.source === frame.contentWindow && e.data?.playground?.error)
        setProblem(e.data.playground.error);
    };
    window.addEventListener("message", message);
    void (async () => {
      const all = (await decode(location.hash)) ?? files();
      setFiles(all);
      setActive(Object.keys(all)[0]!);
      editor = mount(host!, all, active(), {
        change: (name, text) => changed({ ...files(), [name]: text }),
        checked: (errors, ms) =>
          setTypes(
            `Types: ${errors ? `${errors} error${errors === 1 ? "" : "s"}` : "ok"} · ${ms} ms`,
          ),
      });
      await run(all);
    })();
    return () => {
      window.removeEventListener("message", message);
      clearTimeout(timer);
      editor?.destroy();
      engine.stop();
    };
  });

  const share = async () => {
    await navigator.clipboard.writeText(location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  const reset = () => update({ [ENTRY]: example }, ENTRY);
  const commit = () => {
    const n = naming();
    setNaming(undefined);
    const name = n?.value.trim().replace(/^\.?\//, "");
    if (!n || !name || name === n.from || Object.hasOwn(files(), name)) return;
    const named = /\.\w+$/.test(name) ? name : `${name}.ts`;
    // a renamed file keeps its place (the first is the entry)
    const all = Object.fromEntries(
      n.from
        ? Object.entries(files()).map(([k, v]) => [k === n.from ? named : k, v])
        : [...Object.entries(files()), [named, ""]],
    );
    update(all, named);
  };
  const remove = (name: string) => {
    const { [name]: _, ...rest } = files();
    update(rest, name === active() ? Object.keys(rest)[0]! : active());
  };
  const errors = () => {
    const r = result();
    return r && !r.ok ? r.errors : [];
  };
  const text = (t: Exclude<Tab, "preview">) => {
    const r = result();
    if (!r?.ok) return "";
    return t === "css" || t === "shipped" ? r[t] : (r.files[active()]?.[t] ?? "");
  };

  return (
    <div class={s.page}>
      <div class={s.bar}>
        <h1 class={s.heading}>Playground</h1>
        <span class={s.status} role="status">
          {status()} · <span data-types>{types()}</span>
        </span>
        <button type="button" class={s.button} onClick={reset}>
          Reset
        </button>
        <button type="button" class={s.button} onClick={() => void share()}>
          {copied() ? "Link copied" : "Copy link"}
        </button>
      </div>
      <div class={s.split}>
        <div class={s.column}>
          <div class={s.tabs} role="tablist" aria-label="Files">
            <For each={Object.keys(files())}>
              {(name) => (
                <span>
                  <button
                    type="button"
                    role="tab"
                    class={s.tab({ on: active() === name })}
                    aria-selected={active() === name ? "true" : "false"}
                    onClick={() => update(files(), name)}
                    onDblClick={() => setNaming({ from: name, value: name })}
                    title="Double-click to rename"
                  >
                    {name}
                  </button>
                  <Show when={Object.keys(files()).length > 1}>
                    <button
                      type="button"
                      class={s.tab({ on: false })}
                      aria-label={`Delete ${name}`}
                      onClick={() => remove(name)}
                    >
                      ×
                    </button>
                  </Show>
                </span>
              )}
            </For>
            <Show
              when={naming()}
              fallback={
                <button
                  type="button"
                  class={s.button}
                  onClick={() => setNaming({ value: "" })}
                  aria-label="Add a file"
                >
                  + File
                </button>
              }
            >
              {(n) => (
                <input
                  class={s.button}
                  aria-label={n().from ? `Rename ${n().from}` : "File name"}
                  value={n().value}
                  ref={(el) => queueMicrotask(() => el.focus())}
                  onInput={(e) => setNaming({ ...n(), value: e.currentTarget.value })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commit();
                    else if (e.key === "Escape") setNaming(undefined);
                  }}
                  onBlur={() => setNaming(undefined)}
                />
              )}
            </Show>
          </div>
          <div
            class={s.editor}
            ref={(el) => {
              host = el;
            }}
          />
          <Show when={result()}>
            {(r) => (
              <div class={s.notes}>
                <For each={errors()}>
                  {(e) => (
                    <pre
                      class={s.error}
                    >{`${e.message}\n${e.file}:${e.line}:${e.column}\n${e.frame}`}</pre>
                  )}
                </For>
                <For each={r().warnings}>{(w) => <pre class={s.warning}>{w}</pre>}</For>
              </div>
            )}
          </Show>
        </div>
        <div class={s.result}>
          <div class={s.tabs} role="tablist" aria-label="Output">
            <For each={TABS}>
              {([id, label]) => (
                <button
                  type="button"
                  role="tab"
                  class={s.tab({ on: tab() === id })}
                  aria-selected={tab() === id ? "true" : "false"}
                  onClick={() => setTab(id)}
                >
                  {label}
                </button>
              )}
            </For>
          </div>
          <div class={s.pane} role="tabpanel">
            <Show
              when={tab() === "preview"}
              fallback={<pre class={s.code}>{text(tab() as Exclude<Tab, "preview">)}</pre>}
            >
              <iframe
                ref={(el) => {
                  frame = el;
                }}
                class={s.frameBox}
                title="Preview"
                sandbox="allow-scripts"
                srcdoc={doc()}
              />
              <Show when={problem()}>
                <pre class={s.error}>{problem()}</pre>
              </Show>
            </Show>
          </div>
        </div>
      </div>
    </div>
  );
}
