import { createContext } from "solid-js";

import type { Page } from "../plugin/markdown.ts";

export type Meta = Omit<Page, "html">;
export interface Docs {
  pages: Meta[];
  /** the html of a page by slug: a chunk each */
  html: Record<string, () => Promise<{ default: string }>>;
}
// The pages come from virtual:docs, which only index.tsx can import (plugin/docs.ts says why).
export const DocsContext = createContext<Docs>();
