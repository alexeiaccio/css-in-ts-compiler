// The catalog the docs site renders, read from the registry build itself: the same JSON the CLI
// fetches, so a page cannot describe an item that was not published.
import index from "../../r/registry.json";

export interface ItemFile {
  readonly path: string;
  readonly target: string;
  readonly type: string;
  readonly content: string;
}

export interface CatalogItem {
  readonly name: string;
  readonly title: string;
  readonly description: string;
  readonly files: ReadonlyArray<ItemFile>;
}

// `r/registry.json` is a module in the same directory and is not an item, so what the glob returns
// is only known after the check below.
const sources = import.meta.glob<{ readonly default: Partial<CatalogItem> }>("../../r/*.json", {
  eager: true,
});

const order = new Map(index.items.map((item, at) => [item.name, at]));

/** Every starter, in the index's order; `theme` is not a page (it arrives with any starter). */
/**
 * Whether a module the glob found is an item: `r/registry.json` sits in the same directory.
 *
 * @param {Partial<CatalogItem>} item one module's default export
 * @returns {boolean} true for a starter the page can render
 */
const isItem = (item: Partial<CatalogItem>): item is CatalogItem =>
  item.name !== undefined &&
  item.name !== "theme" &&
  item.title !== undefined &&
  item.description !== undefined &&
  Array.isArray(item.files) &&
  item.files.every((file) => "content" in file);

export const items: ReadonlyArray<CatalogItem> = Object.values(sources)
  .map((module) => module.default)
  .filter(isItem)
  .sort((a, b) => (order.get(a.name) ?? 0) - (order.get(b.name) ?? 0));

/**
 * The component file of an item: the one a reader opens first.
 *
 * @param {CatalogItem} item the starter
 * @returns {ItemFile | undefined} its `.tsx`, when the item has one
 */
export const componentFile = (item: CatalogItem): ItemFile | undefined =>
  item.files.find((file) => file.target.endsWith(`/${item.name}.tsx`));
