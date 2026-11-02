// The docs page: one item at a time, from the registry build. The live preview comes from the item's CSF story file (with
// the story ids Storybook builds, its args as controls); an item without one still shows its demo. The source that ships,
// the add command, the tint picker that moves every preview, and the preflight result the published copy passed.
//
// The page is built on the registry's own components, so the chrome is one more reader of the kit: the theme switch, the
// tint group, the story tabs, the controls and the copy buttons are the components on the pages they stand beside.
import { componentFile, items, type CatalogItem } from "./catalog.ts";
import { For, Show, createEffect, createSignal, onCleanup } from "solid-js";
import { GUIDES, type Guide } from "./guides.tsx";
import { Button } from "../registry/button/button.tsx";
import { RadioGroup } from "../registry/radio/radio.tsx";
import { Switch } from "../registry/switch/switch.tsx";
import { Tabs } from "../registry/tabs/tabs.tsx";
import { Controls } from "../stories/controls.tsx";
import { type Args, parseHash, storyOfId } from "@cssints/stories";
import { type SiteEntry, storiesOf } from "../stories/site.ts";
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

const first = (): string => items[0]?.name ?? "";

const start = parseHash(location.hash);

/**
 * One story on the canvas: its args in a signal, a control writing into it, and the story remounted on every change, so an
 * arg that a component reads once (a count, a set of tabs) still lands. A story with no declared controls keeps its args
 * and shows no panel.
 *
 * @param {{ readonly entry: Entry }} props the story to draw
 * @returns {JSX.Element} the canvas and, when the story declares controls, the panel
 */
const StoryCanvas = (props: { readonly entry: SiteEntry }): JSX.Element => {
  const [args, setArgs] = createSignal<Args>(props.entry.args);
  const controlled = (): boolean => Object.keys(props.entry.argTypes).length > 0;

  return (
    <>
      <Show keyed when={args()}>
        {(current) => props.entry.view(current)}
      </Show>
      <Show when={controlled()}>
        <section class="docs__section">
          <h2 class="docs__heading">Controls</h2>
          <p class="docs__note">
            The args this story declares. A change remounts it: a prop the component reads once — a
            count, a set of tabs — still arrives.
          </p>
          <Controls
            argTypes={props.entry.argTypes}
            values={args()}
            onChange={(name, value) => setArgs((previous) => ({ ...previous, [name]: value }))}
          />
          <Button tone="quiet" size="sm" onClick={() => setArgs(props.entry.args)}>
            reset
          </Button>
        </section>
      </Show>
    </>
  );
};

export const Docs = (): JSX.Element => {
  const [name, setName] = createSignal(start.name || first());
  const [story, setStory] = createSignal(start.story);
  const [tint, setTint] = createSignal(TINTS[0] ?? { name: "neutral", hue: "0", chroma: "0" });
  const [copied, setCopied] = createSignal("");

  // The tint is two custom properties every scale token is computed from at `:root`, so it is set there: on the preview
  // section alone the declarations would already be resolved and nothing would move.
  createEffect(
    () => tint(),
    (preset) => {
      document.documentElement.style.setProperty("--hue-tint", preset.hue);
      document.documentElement.style.setProperty("--chroma-tint", preset.chroma);
    },
  );

  // The dark look is a `data-mode` scope of the theme, not a second theme module: set, every token inside moves at once;
  // removed, the page follows the system preference again, which is the one thing the switch cannot say.
  const [isDark, setIsDark] = createSignal(false);
  createEffect(
    () => isDark(),
    (on) => {
      if (on) {
        document.documentElement.setAttribute("data-mode", "dark");
      } else {
        document.documentElement.removeAttribute("data-mode");
      }
    },
  );

  const follow = (): void => {
    const next = parseHash(location.hash);
    setName(next.name || first());
    setStory(next.story);
  };
  // one-shot: the listener is attached once, in the component body, and removed with it
  window.addEventListener("hashchange", follow);
  onCleanup(() => {
    window.removeEventListener("hashchange", follow);
  });

  const item = (): CatalogItem | undefined => items.find((entry) => entry.name === name());
  // a guide is a page of its own: a hash that names one renders it instead of a widget
  const guide = (): Guide | undefined => GUIDES.find((entry) => entry.name === name());
  // the stories of the current item, and the one the hash names (or the first, which is what `#button` means)
  const stories = (): ReadonlyArray<SiteEntry> => storiesOf(name());
  const entry = (): SiteEntry | undefined => {
    const named = storyOfId(stories(), story() ?? "");
    return named ?? stories()[0];
  };
  const at = (): number => {
    const current = entry();
    return current ? stories().findIndex((candidate) => candidate.id === current.id) : 0;
  };

  const pick = (index: number): void => {
    const next = stories()[index];
    if (!next) {
      return;
    }
    setStory(next.id);
    history.replaceState(null, "", `#${next.id}`);
  };

  const link = (id: string): string => `${location.origin}${location.pathname}#${id}`;

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
          <RadioGroup
            values={TINTS.map((preset) => preset.name)}
            value={tint().name}
            onValueChange={(value) => {
              const preset = TINTS.find((candidate) => candidate.name === value);
              if (preset) {
                setTint(preset);
              }
            }}
          >
            {(value) => value}
          </RadioGroup>
        </div>
        <div class="docs__mode">
          <Switch value={isDark()} onValueChange={setIsDark}>
            dark
          </Switch>
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
          {(current) => (
            <>
              <h1 class="docs__title">{current().title}</h1>
              <p class="docs__description">{current().description}</p>

              <Show when={entry()}>
                {(story) => (
                  <div class="docs__story">
                    <code>{story().id}</code>
                    <Button tone="quiet" size="sm" onClick={() => void copy(link(story().id))}>
                      {copied() === link(story().id) ? "copied" : "copy link"}
                    </Button>
                  </div>
                )}
              </Show>

              <section class="docs__preview">
                <Show when={stories().length > 0} fallback={<p>No story yet.</p>}>
                  <Show
                    when={stories().length > 1}
                    fallback={
                      <Show when={entry()} keyed>
                        {(story) => <StoryCanvas entry={story} />}
                      </Show>
                    }
                  >
                    <Tabs
                      items={stories().length}
                      value={at()}
                      onValueChange={pick}
                      tab={(index) => stories()[index]?.name ?? ""}
                      panel={(index) => (
                        <Show when={stories()[index]} keyed>
                          {(story) => <StoryCanvas entry={story} />}
                        </Show>
                      )}
                    />
                  </Show>
                </Show>
              </section>

              <section class="docs__section">
                <h2 class="docs__heading">Add it</h2>
                <div class="docs__command">
                  <code>{command(current().name)}</code>
                  <Button tone="quiet" size="sm" onClick={() => void copy(command(current().name))}>
                    {copied() === command(current().name) ? "copied" : "copy"}
                  </Button>
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
                  when={current().files.some((file) =>
                    file.target.endsWith(`${current().name}.css`),
                  )}
                  fallback={
                    <>
                      <p class="docs__note">
                        Styles live in{" "}
                        <code>{`src/registry/${current().name}/${current().name}.tsx`}</code>:{" "}
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
                    <code>{`src/registry/${current().name}/${current().name}.ts`}</code>:
                    declarations checked against the CSS grammar, states written with{" "}
                    <code>css.attr()</code> and the pseudo-class wrappers, selectors as the{" "}
                    <code>ui-*</code> contract the markup uses. A script compiles it to{" "}
                    <code>{current().name}.css</code> before the item is built.
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
                    ...current().files.filter((file) => file === componentFile(current())),
                    ...current().files.filter((file) => file !== componentFile(current())),
                  ]}
                >
                  {(file) => (
                    <details class="docs__file" open={file === componentFile(current())}>
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
