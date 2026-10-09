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

// the URL of a page (a slug, "" for the overview) under the base path the site is served at
export const url = (slug: string) => import.meta.env.BASE_URL + slug;
