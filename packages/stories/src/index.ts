// The CSF 3 loader a cssints storybook reads: the modules an app globs in, the entries with Storybook's ids out, and the
// controls a story declares. The chrome is the app's (a rail of headless widgets, a tablist of the kit's, a native window),
// and so is the renderer: `Node` is whatever a `view` returns, so the same loader serves the docs site, the lab and
// cssints-native.
import { createComponent } from "solid-js";

/** A control a story declares for one of its args: only what is declared gets a row in the panel. */
export type Control =
  | { readonly type: "boolean" }
  | { readonly type: "select"; readonly options: ReadonlyArray<string> }
  | { readonly type: "text" }
  | {
      readonly type: "number";
      readonly min?: number;
      readonly max?: number;
      readonly step?: number;
    }
  | { readonly type: "range"; readonly min: number; readonly max: number; readonly step?: number };

export type ArgTypes = Readonly<Record<string, Control>>;

/**
 * The part of CSF 3 that is read: a default `meta` export (title, component, args, argTypes) and one object per named export
 * for a story. Storybook 11 keeps CSF 3 support, so a story file moves into a real Storybook unchanged; the ids this module
 * builds are the ones Storybook builds (`button--primary`).
 *
 * `argTypes` is the one extension: Storybook infers a control from a component's props, which a Solid component does not
 * carry at run time, so a story declares the controls it wants by hand.
 */
export interface Meta<Props extends object = Record<string, unknown>, Node = unknown> {
  readonly title: string;
  readonly component?: (props: Props) => Node;
  /** Arguments every story of the file starts from. */
  readonly args?: Partial<Props>;
  readonly argTypes?: ArgTypes;
}

export interface Story<Props extends object = Record<string, unknown>, Node = unknown> {
  /** The name in the rail, instead of the export's own. */
  readonly name?: string;
  /** Arguments this story adds to the meta's. */
  readonly args?: Partial<Props>;
  /** Markup instead of the meta's component: a story that composes several widgets. */
  readonly render?: (args: Props) => Node;
}

/** The values a story renders with: the meta's args, the story's, and whatever a control wrote since. */
export type Args = Record<string, unknown>;

/** One story: the id Storybook would give it, its args and controls, and the view that draws it. */
export interface Entry<Node = unknown> {
  /** `button--primary`: the item's name and the story's, kebab-cased, as Storybook builds a story id. */
  readonly id: string;
  /** The item the file documents (`button`), from its path; in an app without a registry, the file's own name. */
  readonly item: string;
  readonly title: string;
  readonly name: string;
  /** The meta's args with the story's over them, before any control moves them. */
  readonly args: Args;
  /** The controls this story declares; a story with none gets no panel. */
  readonly argTypes: ArgTypes;
  /** Renders the story with the args it is given. */
  readonly view: (args: Args) => Node;
}

/** A CSF module: the `import.meta.glob` result an app passes to `entries`. */
export type Module<Node = unknown> = {
  readonly default: Meta<Record<string, unknown>, Node>;
} & Record<string, unknown>;

const kebab = (text: string): string =>
  text
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .toLowerCase();

const viewOf = <Node>(
  meta: Meta<Record<string, unknown>, Node>,
  story: Story<Record<string, unknown>, Node>,
): ((args: Args) => Node) => {
  if (story.render) {
    const render = story.render;
    return (args) => render(args);
  }
  const component = meta.component;
  if (!component) {
    throw new Error(
      `stories: a story of "${meta.title}" has no render and its meta has no component`,
    );
  }
  // The component's return type is the app's node type, which this package cannot name: the app parameterizes `entries`.
  return (args) => createComponent(component as never, args as never) as Node;
};

/**
 * Every story of every CSF module given, sorted by item and then by id.
 *
 * Within a file an ES module namespace lists its exports alphabetically, which is the order Storybook gives a component's
 * stories by default, and the sort keeps it.
 *
 * @param {Readonly<Record<string, Module<Node>>>} modules the CSF modules, keyed by their path (an `import.meta.glob` result)
 * @param {(path: string) => string} itemOf the item a module documents, from its path; a story beside its component names
 *   the directory, which is the default
 * @returns {ReadonlyArray<Entry<Node>>} the stories, sorted
 */
export const entries = <Node = unknown>(
  modules: Readonly<Record<string, Module<Node>>>,
  itemOf: (path: string) => string = (path) => path.split("/").at(-2) ?? "",
): ReadonlyArray<Entry<Node>> => {
  const found: Array<Entry<Node>> = [];
  for (const [path, module] of Object.entries(modules)) {
    const meta = module.default;
    const item = itemOf(path);
    for (const [exported, value] of Object.entries(module)) {
      if (exported === "default") {
        continue;
      }
      // The plugin adds exports of its own to a module it compiles (`__cssints_hoisted`, `$$moduleUrl`): a story is an object.
      if (typeof value !== "object" || value === null) {
        continue;
      }
      const story = value as Story<Record<string, unknown>, Node>;
      const name = story.name ?? exported;
      found.push({
        id: `${kebab(item)}--${kebab(name)}`,
        item,
        title: meta.title,
        name,
        args: { ...meta.args, ...story.args },
        argTypes: meta.argTypes ?? {},
        view: viewOf(meta, story),
      });
    }
  }
  return found.sort((a, b) => a.item.localeCompare(b.item) || a.id.localeCompare(b.id));
};

/**
 * The story an id names.
 *
 * @param {ReadonlyArray<Entry<Node>>} stories the stories of the app
 * @param {string} id the id, `button--primary`
 * @returns {Entry<Node> | undefined} the story, or nothing when no file declares it
 */
export const storyOfId = <Node>(
  stories: ReadonlyArray<Entry<Node>>,
  id: string,
): Entry<Node> | undefined => stories.find((entry) => entry.id === id);

/**
 * A hash split into the page it names and the story, if it names one: `#button--primary` is the button's primary story,
 * `#button` its first, `#installation` a guide. The split is on the first `--`, which no item or guide name holds.
 *
 * @param {string} hash the raw `location.hash`, with or without its `#`
 * @returns {{ name: string, story: string | undefined }} the page and the full story id
 */
export const parseHash = (hash: string): { name: string; story: string | undefined } => {
  const raw = hash.replace(/^#/, "");
  const at = raw.indexOf("--");
  return at === -1 ? { name: raw, story: undefined } : { name: raw.slice(0, at), story: raw };
};
