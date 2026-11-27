// A screen: a list of blocks taken from the catalog — a starter, one of its stories and the args it is drawn with. This is
// the shape A2UI describes (an agent describes a screen, the app draws it with its own components) without the wire
// protocol: the catalog is the registry, and a name or an arg the catalog does not declare is an error rather than a guess.
//
// Everything here is plain data so it can be tested and published: `catalogOf` is what an agent reads, `parseScreen` and
// `checkScreen` are what the renderer trusts. A screen is only drawn when it has no problems — a closed catalog is the
// point, and half-drawn garbage is worse than a refusal.
import { type Args, type Entry, parseHash } from "@cssints/stories";

/** A block of a screen: a starter, one of its stories (left out: the first) and the args it is drawn with. */
export interface ScreenBlock {
  readonly starter: string;
  readonly story?: string | undefined;
  readonly args?: Args | undefined;
}

export interface Screen {
  readonly title?: string | undefined;
  readonly blocks: ReadonlyArray<ScreenBlock>;
}

/** One story as the catalog describes it: its id, the args the story itself uses (JSON values only) and every arg it takes. */
export interface CatalogStory {
  readonly id: string;
  readonly name: string;
  /** The story's own args, without the ones that are not JSON (a formatter function is an arg, not data). */
  readonly args: Args;
  /** The arg names a block may set: the story's args and the controls it declares. */
  readonly declares: ReadonlyArray<string>;
}

export interface CatalogEntry {
  readonly name: string;
  readonly title: string;
  readonly description: string;
  readonly stories: ReadonlyArray<CatalogStory>;
}

/** What is wrong with a screen, and where: `block 2 (bars)` or `screen`. */
export interface ScreenProblem {
  readonly at: string;
  readonly message: string;
}

/**
 * A value a catalog can carry: `JSON.stringify` keeps it as it is.
 *
 * @param {unknown} value the value a story's args declare
 * @returns {boolean} whether the value survives a round trip through JSON
 */
const isJson = (value: unknown): boolean => {
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return true;
  }
  if (typeof value === "number") {
    return Number.isFinite(value);
  }
  if (Array.isArray(value)) {
    return value.every(isJson);
  }
  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>).every(isJson);
  }
  return false;
};

const plain = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * The catalog the site can describe: the registry's items in their order, each with the stories it ships and what each of
 * them takes. `entries` are the loader's stories (`@cssints/stories`), so an item without a story file has an empty list —
 * a starter that is only a component is still in the catalog, it just cannot be a block with args.
 *
 * @param {ReadonlyArray<{ name: string }>} items the registry's items, in the index's order
 * @param {ReadonlyArray<Entry>} entries every story of the site
 * @returns {ReadonlyArray<CatalogEntry>} the catalog, ready for `JSON.stringify`
 */
export const catalogOf = (
  items: ReadonlyArray<{
    readonly name: string;
    readonly title: string;
    readonly description: string;
  }>,
  entries: ReadonlyArray<Entry>,
): ReadonlyArray<CatalogEntry> =>
  items.map((item) => ({
    name: item.name,
    title: item.title,
    description: item.description,
    stories: entries
      .filter((entry) => entry.item === item.name)
      .map((entry) => ({
        id: entry.id,
        name: entry.name,
        args: Object.fromEntries(Object.entries(entry.args).filter(([, value]) => isJson(value))),
        declares: [...new Set([...Object.keys(entry.args), ...Object.keys(entry.argTypes)])],
      })),
  }));

/**
 * A screen from text: JSON, as a hash carries it. Only the shape is checked here — whether the names and args exist is
 * `checkScreen`'s, which needs the catalog.
 *
 * @param {string} text the JSON of a screen
 * @returns {{ screen?: Screen; problems: ReadonlyArray<ScreenProblem> }} the screen, or what stopped it
 */
export const parseScreen = (
  text: string,
): { readonly screen?: Screen; readonly problems: ReadonlyArray<ScreenProblem> } => {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch (error) {
    return { problems: [{ at: "screen", message: `not JSON: ${String(error)}` }] };
  }
  if (!plain(value)) {
    return { problems: [{ at: "screen", message: "a screen is an object with blocks" }] };
  }
  const title = value.title;
  if (title !== undefined && typeof title !== "string") {
    return { problems: [{ at: "screen", message: "`title` is a string" }] };
  }
  const blocks = value.blocks;
  if (!Array.isArray(blocks) || blocks.length === 0) {
    return { problems: [{ at: "screen", message: "`blocks` is a non-empty array" }] };
  }
  const problems: ScreenProblem[] = [];
  const parsed: ScreenBlock[] = [];
  blocks.forEach((block, index) => {
    if (!plain(block)) {
      problems.push({ at: `block ${index + 1}`, message: "a block is an object" });
      return;
    }
    const { starter, story, args } = block;
    if (typeof starter !== "string" || starter === "") {
      problems.push({ at: `block ${index + 1}`, message: "`starter` is a name from the catalog" });
      return;
    }
    const at = `block ${index + 1} (${starter})`;
    if (story !== undefined && typeof story !== "string") {
      problems.push({ at, message: "`story` is a story id, like `button--accent`" });
      return;
    }
    if (args !== undefined && !plain(args)) {
      problems.push({ at, message: "`args` is an object" });
      return;
    }
    parsed.push({
      starter,
      ...(typeof story === "string" ? { story } : {}),
      ...(plain(args) ? { args } : {}),
    });
  });
  return problems.length > 0 ? { problems } : { screen: { title, blocks: parsed }, problems };
};

const list = (values: ReadonlyArray<string>): string =>
  values.length === 0 ? "none" : values.map((value) => `\`${value}\``).join(", ");

/**
 * Whether a screen can be drawn: every starter is in the catalog, every named story belongs to its starter, and every arg
 * is one the story declares. Nothing is guessed — a typo is a problem the page shows, not a silently missing prop.
 *
 * @param {Screen} screen the parsed screen
 * @param {ReadonlyArray<CatalogEntry>} catalog what the site can draw
 * @returns {ReadonlyArray<ScreenProblem>} empty when the screen can be drawn
 */
export const checkScreen = (
  screen: Screen,
  catalog: ReadonlyArray<CatalogEntry>,
): ReadonlyArray<ScreenProblem> => {
  const problems: ScreenProblem[] = [];
  screen.blocks.forEach((block, index) => {
    const entry = catalog.find((candidate) => candidate.name === block.starter);
    if (entry === undefined) {
      problems.push({
        at: `block ${index + 1} (${block.starter})`,
        message: `no starter \`${block.starter}\`: the catalog has ${catalog.length}`,
      });
      return;
    }
    const story =
      block.story === undefined
        ? entry.stories[0]
        : entry.stories.find((candidate) => candidate.id === block.story);
    if (story === undefined) {
      problems.push({
        at: `block ${index + 1} (${block.starter})`,
        message:
          block.story === undefined
            ? `\`${block.starter}\` has no story to draw`
            : `\`${block.starter}\` has no story \`${block.story}\`: ${list(entry.stories.map((candidate) => candidate.id))}`,
      });
      return;
    }
    for (const key of Object.keys(block.args ?? {})) {
      if (!story.declares.includes(key)) {
        problems.push({
          at: `block ${index + 1} (${block.starter} · ${story.id})`,
          message: `\`${block.starter}\` does not declare \`${key}\`: ${list(story.declares)}`,
        });
      }
    }
  });
  return problems;
};

/**
 * A screen as a hash carries it: `#screen=` and the encoded JSON.
 *
 * @param {Screen} screen the blocks a screen names and the title over them
 * @returns {string} the hash
 */
export const screenHash = (screen: Screen): string =>
  `#screen=${encodeURIComponent(JSON.stringify(screen))}`;

/**
 * Where a hash points: a screen, the catalog, the sink, or an item and one of its stories.
 *
 * @param {string} hash the address bar's hash, with its `#`
 * @returns {{ kind: "screen"; text: string } | { kind: "catalog" } | { kind: "sink" } | { kind: "item"; name: string; story: string | undefined }} what to draw
 */
export const routeOf = (
  hash: string,
):
  | { readonly kind: "screen"; readonly text: string }
  | { readonly kind: "catalog" }
  | { readonly kind: "sink" }
  | { readonly kind: "item"; readonly name: string; readonly story: string | undefined } => {
  if (hash === "#catalog") {
    return { kind: "catalog" };
  }
  if (hash === "#sink") {
    return { kind: "sink" };
  }
  if (hash.startsWith("#screen=")) {
    return { kind: "screen", text: decodeURIComponent(hash.slice("#screen=".length)) };
  }
  const item = parseHash(hash);
  return { kind: "item", name: item.name, story: item.story };
};
