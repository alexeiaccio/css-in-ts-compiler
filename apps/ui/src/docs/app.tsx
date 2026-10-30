// The docs page: one widget at a time, from the registry build. The live preview, the source that
// ships, the add command, the tint picker that moves every preview, and the preflight result the
// published copy passed.
import { componentFile, items, type CatalogItem } from "./catalog.ts";
import { For, Show, createEffect, createSignal, onCleanup } from "solid-js";
import { demos } from "./demos.tsx";
import { GUIDES, type Guide } from "./guides.tsx";
import type { JSX } from "@solidjs/web";

import "./docs.css";

const HOST = "https://packages.cssints.dev";

/** A preset is the reference theme's two numbers: the hue and the chroma of the tint scale. */
const TINTS: ReadonlyArray<{
  readonly name: string;
  readonly hue: string;
  readonly chroma: string;
}> = [
  { name: "neutral", hue: "0", chroma: "0" },
  { name: "indigo", hue: "284.23", chroma: "0.25049" },
  { name: "blue", hue: "266.315", chroma: "0.22049" },
  { name: "red", hue: "27.0726", chroma: "0.181447" },
];

interface Preflight {
  readonly version: string;
  readonly files: number;
  readonly passedAt: string;
}

const isPreflight = (value: unknown): value is Preflight =>
  typeof value === "object" &&
  value !== null &&
  "version" in value &&
  "files" in value &&
  "passedAt" in value;

const selected = (): string => location.hash.replace(/^#/, "") || (items[0]?.name ?? "");

export const Docs = (): JSX.Element => {
  const [name, setName] = createSignal(selected());
  const [tint, setTint] = createSignal(TINTS[0] ?? { name: "neutral", hue: "0", chroma: "0" });
  const [copied, setCopied] = createSignal("");

  const follow = (): void => {
    setName(selected());
  };
  // one-shot: the listener is attached once, in the component body, and removed with it
  window.addEventListener("hashchange", follow);
  onCleanup(() => {
    window.removeEventListener("hashchange", follow);
  });

  const item = (): CatalogItem | undefined => items.find((entry) => entry.name === name());
  // a guide is a page of its own: a hash that names one renders it instead of a widget
  const guide = (): Guide | undefined => GUIDES.find((entry) => entry.name === name());

  // Solid 2 has no `createResource`: the current item's result is a plain fetch into a signal. An
  // item published before the preflight existed has no file, and the section stays hidden.
  const [preflight, setPreflight] = createSignal<Preflight>();
  // the body's first load and a first effect run can name the same item; one request is enough
  let requested: string | undefined;
  const load = async (target: string): Promise<void> => {
    if (requested === target) {
      return;
    }
    requested = target;
    setPreflight(undefined);
    // a guide has no published item to ask about; only a widget page has a preflight result
    if (GUIDES.some((entry) => entry.name === target)) {
      return;
    }
    const response = await fetch(`${HOST}/r/${target}.result.json`).catch(() => undefined);
    const body: unknown =
      response?.ok === true ? await response.json().catch(() => undefined) : undefined;
    const result = isPreflight(body) ? body : undefined;
    // a slower response for an item the reader already left must not land
    if (target === name()) {
      setPreflight(result);
    }
  };
  // a one-shot side effect is a plain call in Solid 2; the write it makes would be rejected
  // inside the component's owned scope, so it is deferred one microtask past it
  queueMicrotask(() => {
    void load(name());
  });
  createEffect(
    () => name(),
    (target) => {
      void load(target);
    },
  );

  const command = (target: string): string => `npx shadcn@latest add @cssints/${target}`;

  const copy = async (text: string): Promise<void> => {
    await navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(""), 1500);
  };

  return (
    <div class="docs">
      <aside class="docs__nav">
        <p class="docs__brand">cssints ui</p>
        <p class="docs__lede">
          Styled APG widgets for Solid 2. The behaviour is <code>@cssints/headless</code> from npm;
          what you copy is the skin and the test.
        </p>
        <nav aria-label="Guides">
          <p class="docs__label">Guides</p>
          <For each={GUIDES}>
            {(entry) => (
              <a
                class={`docs__link${entry.name === name() ? " docs__link--active" : ""}`}
                href={`#${entry.name}`}
                aria-current={entry.name === name() ? "page" : undefined}
              >
                {entry.title}
              </a>
            )}
          </For>
        </nav>
        <nav aria-label="Components">
          <p class="docs__label">Components</p>
          <For each={items}>
            {(entry) => (
              <a
                class={`docs__link${entry.name === name() ? " docs__link--active" : ""}`}
                href={`#${entry.name}`}
                aria-current={entry.name === name() ? "page" : undefined}
              >
                {entry.title}
              </a>
            )}
          </For>
        </nav>
        <div class="docs__tints">
          <p class="docs__label">Tint</p>
          <div class="demo-row">
            <For each={TINTS}>
              {(preset) => (
                <button
                  class={`docs__chip${preset.name === tint().name ? " docs__chip--active" : ""}`}
                  onClick={() => setTint(preset)}
                >
                  {preset.name}
                </button>
              )}
            </For>
          </div>
        </div>
      </aside>

      <main class="docs__main">
        <Show when={guide()} keyed>
          {(entry) => <entry.Page />}
        </Show>
        <Show
          when={item()}
          fallback={
            <Show when={!guide()}>
              <p>Pick a widget.</p>
            </Show>
          }
        >
          {(entry) => (
            <>
              <h1 class="docs__title">{entry().title}</h1>
              <p class="docs__description">{entry().description}</p>

              <section
                class="docs__preview"
                style={`--hue-tint: ${tint().hue}; --chroma-tint: ${tint().chroma}`}
              >
                {/* keyed: a different widget is a different component, not the same one with a new name */}
                <Show when={demos[entry().name]} keyed fallback={<p>No demo yet.</p>}>
                  {(Example) => <Example />}
                </Show>
              </section>

              <section class="docs__section">
                <h2 class="docs__heading">Add it</h2>
                <div class="docs__command">
                  <code>{command(entry().name)}</code>
                  <button class="docs__chip" onClick={() => void copy(command(entry().name))}>
                    {copied() === command(entry().name) ? "copied" : "copy"}
                  </button>
                </div>
                <p class="docs__note">
                  Solid 2 (<code>2.0.0-rc.13</code>) and Vite+ are required; see the starter
                  template in the repository. The theme arrives with the first starter.
                </p>
              </section>

              <Show when={preflight()}>
                {(result) => (
                  <section class="docs__section">
                    <h2 class="docs__heading">Conformance</h2>
                    <p class="docs__note">
                      Published as <code>{result().version}</code>: the copied test passed before
                      the release was written ({result().files} files,{" "}
                      {result().passedAt.slice(0, 10)}).
                    </p>
                  </section>
                )}
              </Show>

              <section class="docs__section">
                <h2 class="docs__heading">How the component is written</h2>
                <p class="docs__note">
                  Styles live in <code>{`src/registry/${entry().name}/${entry().name}.tsx`}</code>:{" "}
                  <code>cn()</code> and <code>cv()</code> with the theme's tokens, states read off
                  the attributes the widget announces (<code>css.attr()</code>,{" "}
                  <code>css.within()</code>), and <code>render</code> replacing a part with another
                  component or tag. The declarations are checked against the CSS grammar and the
                  theme against <code>check.contrast</code> at build time.
                </p>
                <p class="docs__note">
                  A copy ships that source, so <strong>your project needs cssints</strong> in its
                  Vite config; <code>theme.ts</code> with <code>tokens.ts</code> arrives with the
                  item, and <code>theme.css</code> is the same theme compiled for a project without
                  the plugin. The look is composed beside other components: <code>Card</code> hands
                  its inner radius down through <code>frame()</code>, a <code>data-mode</code> scope
                  moves every token of the subtree, and a <code>Toolbar</code>'s size reaches the
                  buttons it holds.
                </p>
              </section>

              <section class="docs__section">
                <h2 class="docs__heading">Add it</h2>
                <div class="docs__command">
                  <code>{command(entry().name)}</code>
                  <button class="docs__chip" onClick={() => void copy(command(entry().name))}>
                    {copied() === command(entry().name) ? "copied" : "copy"}
                  </button>
                </div>
                <p class="docs__note">
                  Solid 2 (<code>2.0.0-rc.13</code>) and Vite+ are required; see the starter
                  template in the repository. The theme arrives with the first starter.
                </p>
              </section>

              <Show when={preflight()}>
                {(result) => (
                  <section class="docs__section">
                    <h2 class="docs__heading">Conformance</h2>
                    <p class="docs__note">
                      Published as <code>{result().version}</code>: the copied test passed before
                      the release was written ({result().files} files,{" "}
                      {result().passedAt.slice(0, 10)}).
                    </p>
                  </section>
                )}
              </Show>

              <section class="docs__section">
                <h2 class="docs__heading">How the component is written</h2>
                <Show
                  when={entry().files.some((file) => file.target.endsWith(`${entry().name}.css`))}
                  fallback={
                    <>
                      <p class="docs__note">
                        Styles live in{" "}
                        <code>{`src/registry/${entry().name}/${entry().name}.tsx`}</code>:{" "}
                        <code>cn()</code> and <code>cv()</code> with the theme's tokens, states read
                        off the attributes the widget announces (<code>css.attr()</code>,{" "}
                        <code>css.within()</code>), and <code>render</code> replacing a part with
                        another component or tag. The declarations are checked against the CSS
                        grammar and the theme against <code>check.contrast</code> at build time.
                      </p>
                      <p class="docs__note">
                        A copy ships that source, so <strong>your project needs cssints</strong> in
                        its Vite config (and the theme: <code>theme.ts</code> with{" "}
                        <code>tokens.ts</code> arrives with the item). The look is composed beside
                        other components: <code>Card</code> hands its inner radius down through{" "}
                        <code>frame()</code>, a <code>data-mode</code> scope moves every token of
                        the subtree, and an ancestor's <code>data-size="sm"</code> sizes what it
                        holds.
                      </p>
                    </>
                  }
                >
                  <p class="docs__note">
                    The skin is authored on cssints,{" "}
                    <code>{`src/registry/${entry().name}/${entry().name}.ts`}</code>: declarations
                    checked against the CSS grammar, states written with <code>css.attr()</code> and
                    the pseudo-class wrappers, selectors as the <code>ui-*</code> contract the
                    markup uses. A script compiles it to <code>{entry().name}.css</code> before the
                    item is built.
                  </p>
                  <p class="docs__note">
                    What you copy is that compiled sheet, so{" "}
                    <strong>your project needs no cssints plugin</strong>: the cssints helpers run
                    at build time here, once, and a copy that imported them could not run its own
                    conformance test. The theme works the same way — tokens compiled to custom
                    properties.
                  </p>
                </Show>
              </section>

              <section class="docs__section">
                <h2 class="docs__heading">Source</h2>
                <p class="docs__note">
                  The first file is the component; the rest are what <code>add</code> writes.
                </p>
                <For
                  each={[
                    ...entry().files.filter((file) => file === componentFile(entry())),
                    ...entry().files.filter((file) => file !== componentFile(entry())),
                  ]}
                >
                  {(file) => (
                    <details class="docs__file" open={file === componentFile(entry())}>
                      <summary>
                        <code>{file.target}</code>
                      </summary>
                      <pre class="docs__code">
                        <code>{file.content}</code>
                      </pre>
                    </details>
                  )}
                </For>
              </section>
            </>
          )}
        </Show>
      </main>
    </div>
  );
};
