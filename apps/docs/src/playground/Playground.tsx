import { createSignal, For, onSettled, Show } from "solid-js";

import { type Compiled, start } from "./client.ts";
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

// The page: an editor, the engine in a worker (client.ts), and what it made. The code is in the URL hash, so a link is a share.
export default function Playground() {
  const [result, setResult] = createSignal<Compiled>();
  const [status, setStatus] = createSignal("Loading the engine…");
  const [tab, setTab] = createSignal<Tab>("preview");
  const [doc, setDoc] = createSignal("");
  const [problem, setProblem] = createSignal("");
  const [copied, setCopied] = createSignal(false);
  const engine = start();
  let host: HTMLDivElement | undefined;
  let frame: HTMLIFrameElement | undefined;
  let editor: Editor | undefined;
  let version = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const run = async (text: string) => {
    const mine = ++version;
    setStatus("Compiling…");
    const t0 = performance.now();
    const r = await engine.compile(text);
    if (mine !== version) return;
    setResult(r);
    setProblem("");
    editor?.diagnose(r.ok ? [] : r.errors);
    setStatus(
      r.ok
        ? `Compiled in ${Math.round(performance.now() - t0)} ms · ${r.classes.length} classes`
        : `${r.errors.length} error${r.errors.length === 1 ? "" : "s"}`,
    );
    if (r.ok) setDoc(previewDocument(r.css, r.body, await engine.runtime()));
    history.replaceState(null, "", `${location.pathname}${location.search}#${await encode(text)}`);
  };

  const changed = (text: string) => {
    clearTimeout(timer);
    timer = setTimeout(() => void run(text), DELAY);
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
      const text = (await decode(location.hash)) ?? example;
      editor = mount(host!, text, changed);
      await run(text);
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
  const reset = () => {
    editor?.set(example);
  };
  const errors = () => {
    const r = result();
    return r && !r.ok ? r.errors : [];
  };
  const text = (t: Exclude<Tab, "preview">) => {
    const r = result();
    return r?.ok ? r[t === "shipped" ? "shipped" : t] : "";
  };

  return (
    <div class={s.page}>
      <div class={s.bar}>
        <h1 class={s.heading}>Playground</h1>
        <span class={s.status} role="status">
          {status()}
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
                    <pre class={s.error}>{`${e.message}\n${e.line}:${e.column}\n${e.frame}`}</pre>
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
