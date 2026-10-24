// The pages of README.md and docs/API.md, read from the cssints PDS instead of the repository. Node only (plugin/markdown.ts calls it).
//
// DOCS_SOURCE=repo (the default) is the build as it was: the two markdown files. DOCS_SOURCE=pds reads one CMS document per page
// from the account that publishes the site (https://pds.cssints.dev, `com.atproto.repo.listRecords`, public: no login) and turns
// each back into the markdown of that page (plugin/portable-text.ts); everything after that is the same build. The documents are
// written by the importer of effects-of-atmosphere (tools/cms-import, `cssints` script) and, from then on, by the CMS admin.
//
// A build that reads the PDS FAILS when it cannot: the PDS is down, answers an error, has no pages, or has a page it cannot
// read. It does not fall back to the files. Once the PDS is the source, the files are an import source that goes stale, and a
// green deploy of stale pages over fresh ones is worse than no deploy: the failed build leaves the site as it was. Going back
// to the files is a decision (DOCS_SOURCE=repo), not something a network error does.
import { setTimeout as sleep } from "node:timers/promises";

import { portableTextToMarkdown } from "./portable-text.ts";

export type DocsSource = "repo" | "pds";

export const docsSource = (env: Record<string, string | undefined> = process.env): DocsSource => {
  const source = env.DOCS_SOURCE || "repo";
  if (source === "repo" || source === "pds") return source;
  throw new Error(`DOCS_SOURCE is "${source}": expected "repo" (the markdown files) or "pds"`);
};

export interface PdsPage {
  /** the page's URL: the document's uid */
  slug: string;
  /** the file the page came from; the relative links of the page are relative to it */
  file: (typeof PDS_FILES)[number];
  /** where the page stands among those of its file */
  order: number;
  markdown: string;
}

/** The files the PDS stands in for. The rest of the pages (the packages' READMEs, the changelog) are still read from the repository. */
export const PDS_FILES = ["README.md", "docs/API.md"] as const;

const DEFAULT_SERVICE = "https://pds.cssints.dev";
const DEFAULT_DID = "did:plc:4kvsgtskbbigk57wth4vcoiy";
const DOCUMENTS = "ing.lexicon.cms.document";

export interface PdsConfig {
  service: string;
  did: string;
  /** the documents of the site, not of whatever else the account holds */
  publication: string;
}

export const pdsConfig = (env: Record<string, string | undefined> = process.env): PdsConfig => {
  const did = env.DOCS_PDS_DID || DEFAULT_DID;
  return {
    service: (env.DOCS_PDS_URL || DEFAULT_SERVICE).replace(/\/+$/, ""),
    did,
    publication: `at://${did}/site.standard.publication/cssints-docs`,
  };
};

export interface Transport {
  fetch?: typeof fetch;
  /** how many times a read is tried */
  attempts?: number;
  /** the wait before the next try, in ms; a test passes one that does not wait */
  wait?: (ms: number) => Promise<unknown>;
}

// a read that may be tried again: the network, a server that is busy or down. A 4xx will answer the same next time.
const retryable = (status: number) => status >= 500 || status === 408 || status === 429;

const read = async (url: string, { fetch: get = fetch, attempts = 3, wait = sleep }: Transport) => {
  let failure = "";
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const response = await get(url, { signal: AbortSignal.timeout(20_000) });
      if (response.ok) return (await response.json()) as unknown;
      failure = `answered ${response.status}`;
      if (!retryable(response.status)) break;
    } catch (error) {
      failure = error instanceof Error ? error.message : String(error);
    }
    if (attempt < attempts) await wait(1000 * 2 ** (attempt - 1));
  }
  throw new Error(`the docs build cannot read ${url}: ${failure}`);
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

// every record of the collection, page by page
const records = async (config: PdsConfig, transport: Transport) => {
  const found: unknown[] = [];
  let cursor: string | undefined;
  do {
    const query = new URLSearchParams({ repo: config.did, collection: DOCUMENTS, limit: "100" });
    if (cursor) query.set("cursor", cursor);
    const page = await read(
      `${config.service}/xrpc/com.atproto.repo.listRecords?${query}`,
      transport,
    );
    if (!isObject(page) || !Array.isArray(page.records))
      throw new Error(`${config.service} did not answer a list of records`);
    found.push(...(page.records as unknown[]));
    cursor = typeof page.cursor === "string" && page.cursor !== "" ? page.cursor : undefined;
  } while (cursor);
  return found;
};

// a document of the site that cannot be read is an error, not a page that quietly is not there
const pageOf = (value: Record<string, unknown>, uri: string): PdsPage => {
  const { uid, data, body } = value;
  const named = isObject(data) ? data.file : undefined;
  const file = PDS_FILES.find((f) => f === named);
  const order = isObject(data) ? data.order : undefined;
  if (typeof uid !== "string" || uid === "") throw new Error(`${uri}: no uid`);
  if (!file) throw new Error(`${uri}: data.file is not one of ${PDS_FILES.join(", ")}`);
  if (typeof order !== "number" || !Number.isFinite(order))
    throw new Error(`${uri}: data.order is not a number`);
  const blocks = (Array.isArray(body) ? body : [])
    .filter((entry) => isObject(entry) && entry.sectionType === "richText")
    .flatMap((entry) => (isObject(entry) && isObject(entry.primary) ? entry.primary.content : []));
  const markdown = portableTextToMarkdown(blocks);
  // markdown.ts takes the first token of a page to be its heading
  if (!/^#{1,6} /.test(markdown)) throw new Error(`${uri}: the page does not start with a heading`);
  return { slug: uid, file, order, markdown };
};

// the pages of README.md and docs/API.md, in the order the site lists them
export const loadPdsPages = async (
  env: Record<string, string | undefined> = process.env,
  transport: Transport = {},
): Promise<PdsPage[]> => {
  const config = pdsConfig(env);
  const pages = (await records(config, transport))
    .filter(isObject)
    .flatMap((record) => {
      const value = record.value;
      const uri = typeof record.uri === "string" ? record.uri : "a document";
      return isObject(value) &&
        value.type === "doc" &&
        value.lang === "en" &&
        value.publication === config.publication
        ? [pageOf(value, uri)]
        : [];
    })
    // the site lists README.md's pages first, then the reference
    .sort((a, b) => PDS_FILES.indexOf(a.file) - PDS_FILES.indexOf(b.file) || a.order - b.order);

  for (const file of PDS_FILES)
    if (!pages.some((page) => page.file === file))
      throw new Error(`${config.service} holds no page of ${file} for ${config.publication}`);
  const slugs = pages.map((page) => page.slug);
  const taken = slugs.find((slug, i) => slugs.indexOf(slug) !== i);
  if (taken) throw new Error(`two pages have the slug "${taken}", and a slug is a URL`);
  // the site's first page is /overview
  if (pages[0]?.slug !== "overview")
    throw new Error(`the first page of README.md is "${pages[0]?.slug}", not "overview"`);
  return pages;
};
