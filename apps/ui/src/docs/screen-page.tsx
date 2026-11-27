// The two pages a hash can name that are not a starter: `#screen=` (a list of blocks drawn by the catalog) and `#catalog`
// (the catalog itself, as JSON). Both are views over `surface.ts`, which is the part that can be wrong: a screen with an
// unknown starter, an unknown story or an undeclared arg is refused whole, with the reasons on the page.
import type { JSX } from "@solidjs/web";
import { type Args, storyOfId } from "@cssints/stories";
import { createMemo, For, Show } from "solid-js";

import { items } from "./catalog.ts";
import { catalogOf, checkScreen, parseScreen, type ScreenProblem } from "./surface.ts";
import { type SiteEntry, stories, storiesOf } from "../stories/site.ts";

/** A block that passed every check: the story to draw and the args it is drawn with. */
interface ResolvedBlock {
  readonly starter: string;
  readonly story: SiteEntry;
  readonly args: Args;
}

/**
 * The blocks of a text, or nothing when the catalog refuses it.
 *
 * @param {string} text a block's reference to the catalog
 * @returns {object | undefined} the title and the blocks, or nothing
 */
const resolve = (
  text: string,
): {
  readonly title?: string;
  readonly blocks: ReadonlyArray<ResolvedBlock>;
  readonly problems: ReadonlyArray<ScreenProblem>;
} => {
  const parsed = parseScreen(text);
  if (parsed.screen === undefined) {
    return { blocks: [], problems: parsed.problems };
  }
  const problems = checkScreen(parsed.screen, catalogOf(items, stories));
  if (problems.length > 0) {
    return { blocks: [], problems };
  }
  const blocks = parsed.screen.blocks.flatMap((block) => {
    const story =
      storyOfId(storiesOf(block.starter), block.story ?? "") ?? storiesOf(block.starter)[0];
    return story === undefined
      ? []
      : [{ starter: block.starter, story, args: { ...story.args, ...block.args } }];
  });
  return { title: parsed.screen.title, blocks, problems };
};

const ProblemList = (props: { readonly problems: ReadonlyArray<ScreenProblem> }): JSX.Element => (
  <div class="docs__note" data-part="screen-problems">
    <p>
      Nothing is drawn: a screen may only use what the catalog declares.{" "}
      <a href="#catalog">The catalog</a> lists every starter, its stories and the args each takes.
    </p>
    <ul>
      <For each={props.problems}>
        {(problem) => (
          <li>
            <code>{problem.at}</code> — {problem.message}
          </li>
        )}
      </For>
    </ul>
  </div>
);

/**
 * A screen from the JSON a `#screen=` hash carries: one block per starter, drawn by the catalog's own story.
 *
 * @param {{ readonly text: string }} props the hash's JSON, decoded
 * @returns {JSX.Element} the blocks, or the reasons there are none
 */
export const ScreenPage = (props: { readonly text: string }): JSX.Element => {
  const result = createMemo(() => resolve(props.text));
  return (
    <section data-part="screen">
      <h1 class="docs__title">{result().title ?? "Screen"}</h1>
      <Show
        when={result().problems.length > 0}
        fallback={
          <For each={result().blocks}>
            {(block) => (
              <section class="docs__preview" data-part="screen-block" data-starter={block.starter}>
                <p class="docs__note">
                  <code>{block.story.id}</code>
                </p>
                {block.story.view(block.args)}
              </section>
            )}
          </For>
        }
      >
        <ProblemList problems={result().problems} />
      </Show>
    </section>
  );
};

/**
 * The catalog as data: every starter, the stories it ships, the args each story uses and the args each one takes. This is
 * what a screen may name — and what an agent reads instead of guessing at props.
 *
 * @returns {JSX.Element} the catalog as a page
 */
export const CatalogPage = (): JSX.Element => {
  const json = (): string =>
    JSON.stringify({ version: 1, items: catalogOf(items, stories) }, null, 2);
  return (
    <section data-part="catalog">
      <h1 class="docs__title">Catalog</h1>
      <p class="docs__description">
        Every starter the site can draw, and for each story the args it uses and the args a caller
        may set. A screen is <code>{'{"blocks":[{"starter":"bars","args":{"label":"…"}}]}'}</code>{" "}
        in a <code>#screen=</code> hash; anything not named here is refused. The same JSON is served
        at <a href="/catalog.json">/catalog.json</a>.
      </p>
      <pre class="docs__code" data-part="catalog-json">
        <code>{json()}</code>
      </pre>
    </section>
  );
};

/**
 * The sink: every starter on one page, its first story drawn live — the catalogue as something you can look at rather
 * than read. Each block links to the item's own page, which has its other stories, its controls and its code.
 *
 * @returns {JSX.Element} every starter on one page
 */
export const SinkPage = (): JSX.Element => (
  <section data-part="sink">
    <h1 class="docs__title">Sink</h1>
    <p class="docs__description">
      Every starter on one page, its first story drawn live. Open one for its code, its controls and
      its conformance record; the same list, with the args each story takes, is{" "}
      <a href="#catalog">the catalog</a>.
    </p>
    <div class="docs__sink">
      <For each={items}>
        {(item) => {
          const story = (): SiteEntry | undefined => storiesOf(item.name)[0];
          return (
            <section class="docs__sink-block" data-part="sink-block" data-item={item.name}>
              <h2>
                <a href={`#${item.name}`}>{item.title}</a>
              </h2>
              <p class="docs__description">{item.description}</p>
              <Show when={story()}>
                {(entry) => <div class="docs__preview">{entry().view(entry().args)}</div>}
              </Show>
            </section>
          );
        }}
      </For>
    </div>
  </section>
);
