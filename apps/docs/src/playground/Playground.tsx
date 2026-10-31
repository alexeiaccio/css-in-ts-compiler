import { createStatus, createTabs } from "@cssints/headless";
import { createSignal, For, onSettled, Show } from "solid-js";

import { type Compiled, type Files, start } from "./client.ts";
import { type Editor, mount } from "./editor.ts";
import { ids, load } from "./examples.ts";
import { canvas } from "./hyper.ts";
import { previewDocument } from "./preview.ts";
import { decode, encode, exampleOf } from "./share.ts";
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
// the project the page opens with: a slice of csssky (apps/docs/examples/csssky)
const DEFAULT = "csssky";

// The page: an editor, the engine in a worker (client.ts), and what it made. The code is in the URL hash, so a link is a share.
export default function Playground() {
  const [result, setResult] = createSignal<Compiled>();
  const [status, setStatus] = createSignal("Loading the engine…");
  const [tab, setTab] = createSignal<Tab>("preview");
  const [doc, setDoc] = createSignal("");
  const [problem, setProblem] = createSignal("");
  const copied = createStatus();
  const [files, setFiles] = createSignal<Files>({});
  const [active, setActive] = createSignal("");
  const [project, setProject] = createSignal("");
  // the name of a file being added; a rename of an existing tab is the tabs' own
  const [naming, setNaming] = createSignal<{ value: string }>();
  const [types, setTypes] = createSignal("");
  const engine = start();
  let host: HTMLDivElement | undefined;
  let frame: HTMLIFrameElement | undefined;
  let editor: Editor | undefined;
  let version = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let shown: { r: Extract<Compiled, { ok: true }>; runtime: string } | undefined;

  const show = () => {
    if (!shown) return;
    const { r, runtime } = shown;
    setDoc(previewDocument(r.css, r.files, r.entry, runtime, canvas()));
  };

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
    if (r.ok) {
      shown = { r, runtime: await engine.runtime() };
      show();
    }
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
    // the display settings are classes and data attributes of <html>: a mode or a palette changed there is the preview's too
    const modes = new MutationObserver(() => show());
    modes.observe(document.documentElement, { attributes: true });
    void (async () => {
      const id = exampleOf(location.hash) ?? (location.hash ? "" : DEFAULT);
      const all = (await decode(location.hash)) ?? (await load(id || DEFAULT)) ?? {};
      const first = Object.keys(all)[0]!;
      setProject(id);
      setFiles(all);
      setActive(first);
      editor = mount(host!, all, first, {
        change: (name, text) => changed({ ...files(), [name]: text }),
        checked: (errors, ms) =>
          setTypes(
            `Types: ${errors ? `${errors} error${errors === 1 ? "" : "s"}` : "ok"} · ${ms} ms`,
          ),
        formatted: setStatus,
      });
      await run(all);
    })();
    return () => {
      modes.disconnect();
      window.removeEventListener("message", message);
      clearTimeout(timer);
      editor?.destroy();
      engine.stop();
    };
  });

  const share = async () => {
    await navigator.clipboard.writeText(location.href);
    copied.show("Link copied");
    setTimeout(copied.clear, 1500);
  };
  // a project of apps/docs/examples replaces the files (what was edited is gone: Copy link first)
  const open = async (id: string) => {
    const all = await load(id || DEFAULT);
    if (!all) return;
    setProject(id || DEFAULT);
    update(all, Object.keys(all)[0]);
  };
  // A new name for a file: `.ts` unless it has an extension
  const named = (name: string) => (/\.\w+$/.test(name) ? name : `${name}.ts`);
  const commit = () => {
    const n = naming();
    setNaming(undefined);
    const name = n?.value.trim().replace(/^\.?\//, "");
    if (!n || !name || Object.hasOwn(files(), name)) return;
    const to = named(name);
    update({ ...files(), [to]: "" }, to);
  };
  // a renamed file keeps its place (the first is the entry)
  const rename = (from: string, label: string) => {
    const name = label.trim().replace(/^\.?\//, "");
    if (!name || name === from || Object.hasOwn(files(), name)) return;
    const to = named(name);
    update(
      Object.fromEntries(Object.entries(files()).map(([k, v]) => [k === from ? to : k, v])),
      to,
    );
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
  const names = () => Object.keys(files());
  // the tab of the file open: the tabs are controlled by `active`, so a click is a request the page takes
  const openAt = () => Math.max(0, names().indexOf(active()));
  // One registry per list (close, rename, the Delete key; the output's arrows). The example tabs that plugin/markdown.ts builds
  // stay radios that the CSS switches: they must work prerendered, before any script runs.
  const tabs = createTabs({
    get items() {
      return names().length;
    },
    get value() {
      return openAt();
    },
    closable: true,
    renamable: true,
    label: (index) => names()[index],
    onValueChange: (index) => {
      const name = names()[index];
      if (name) update(files(), name);
    },
    onClose: (index) => {
      const name = names()[index];
      if (name) remove(name);
    },
    onRename: (index, label) => {
      const name = names()[index];
      if (name) rename(name, label);
    },
  });
  const output = createTabs({
    items: TABS.length,
    get value() {
      return TABS.findIndex(([id]) => id === tab());
    },
    onValueChange: (index) => {
      const next = TABS[index];
      if (next) setTab(next[0]);
    },
  });

  return (
    <div class={s.page}>
      <div class={s.bar}>
        <h1 class={s.heading}>Playground</h1>
        <span class={s.status} role="status">
          {status()} · <span data-types>{types()}</span>
        </span>
        <select
          class={s.button}
          aria-label="Example"
          onChange={(e) => void open(e.currentTarget.value)}
        >
          <option value="" selected={project() === ""} hidden>
            Your files
          </option>
          <For each={ids}>
            {(id) => (
              <option value={id} selected={project() === id}>
                {id}
              </option>
            )}
          </For>
        </select>
        <button type="button" class={s.button} onClick={() => void open(project())}>
          Reset
        </button>
        <button
          type="button"
          class={s.button}
          title="Format the file with oxfmt (Shift+Alt+F)"
          onClick={() => void editor?.format()}
        >
          Format
        </button>
        <button type="button" class={s.button} onClick={() => void share()}>
          Copy link
        </button>
        <span class={s.status} {...copied.statusProps}>
          {copied.message()}
        </span>
      </div>
      <div class={s.split}>
        <div class={s.column}>
          <div class={s.tabs} {...tabs.tablistProps} aria-label="Files">
            <For each={names()}>
              {(name, i) => (
                <span>
                  <div
                    class={s.tab({ on: active() === name })}
                    {...tabs.tabProps(i())}
                    onDblClick={tabs.renameProps(i()).onDblClick}
                    title="Double-click to rename"
                  >
                    <Show when={tabs.renameProps(i()).editing()} fallback={name}>
                      <input
                        {...tabs.renameProps(i()).inputProps}
                        class={s.button}
                        ref={(el) => queueMicrotask(() => el.focus())}
                      />
                    </Show>
                  </div>
                  <Show when={names().length > 1}>
                    <button type="button" class={s.tab({ on: false })} {...tabs.closeProps(i())}>
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
                  aria-label="File name"
                  value={n().value}
                  ref={(el) => queueMicrotask(() => el.focus())}
                  onInput={(e) => setNaming({ value: e.currentTarget.value })}
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
            {...tabs.tabpanelProps(openAt())}
            tabindex={-1}
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
          <div class={s.tabs} {...output.tablistProps} aria-label="Output">
            <For each={TABS}>
              {([id, label], i) => (
                <button type="button" class={s.tab({ on: tab() === id })} {...output.tabProps(i())}>
                  {label}
                </button>
              )}
            </For>
          </div>
          <div
            class={s.pane}
            {...output.tabpanelProps(TABS.findIndex(([id]) => id === tab()))}
            tabindex={-1}
          >
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
