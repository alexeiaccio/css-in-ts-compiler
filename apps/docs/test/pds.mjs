// The docs build reading its pages from the cssints PDS (plugin/pds.ts, plugin/portable-text.ts): the Portable Text of a page comes
// back as the markdown it was written from, the reader pages through the account's documents and ignores what is not the site's,
// and a PDS that cannot be read FAILS the build instead of falling back to the files. Against a PDS served from this process.
//
// With DOCS_PDS_DUMP=<file> (the records of the importer's `--out`, from effects-of-atmosphere: `pnpm --filter @eoa/cms-import
// cssints --root <this checkout> --dry-run --out <file>`) it also builds the real pages both ways, from the files and from the
// records, and asserts they are the same (no type-check of the code blocks: DOCS_HOVERS=0).
import assert from "node:assert/strict";
import { once } from "node:events";
import { readFileSync } from "node:fs";
import { createServer } from "node:http";

import { Marked } from "marked";

import { docsSource, loadPdsPages, pdsConfig } from "../plugin/pds.ts";
import { portableTextToMarkdown } from "../plugin/portable-text.ts";

const fixtures = new URL("./fixtures/pds/", import.meta.url);
const read = (name) => readFileSync(new URL(name, fixtures), "utf8");

let failed = 0;
const check = async (name, run) => {
  try {
    await run();
    console.log(`ok   ${name}`);
  } catch (error) {
    failed++;
    console.log(`FAIL ${name}\n${error.stack}`);
  }
};

const DID = "did:plc:4kvsgtskbbigk57wth4vcoiy";
const PUBLICATION = `at://${DID}/site.standard.publication/cssints-docs`;
const instant = async () => {};

// --- the pair: what the importer writes, this writes back ---------------------------------------------------------------------
// test/fixtures/pds/ is the importer's output for a page with every construct the docs use (effects-of-atmosphere,
// tools/cms-import: `markdownToPortableText` and `portableTextToMarkdown` of kitchen-sink.md)
const sink = read("kitchen-sink.md");
const sinkBlocks = JSON.parse(read("kitchen-sink.pt.json"));

await check("a page comes back as the markdown the importer's own serializer writes", () => {
  assert.equal(portableTextToMarkdown(sinkBlocks), read("kitchen-sink.roundtrip.md"));
});

await check("a page comes back as the same page: the html of both is one", () => {
  const marked = new Marked();
  assert.equal(
    marked.parse(portableTextToMarkdown(sinkBlocks)),
    marked.parse(sink),
    "every construct of the docs: marks, links, lists, loose items with code and tables, quotes, fences, tables, html, rules",
  );
});

await check(
  "text is literal: markup in it is escaped, and a block is left out when markdown has no word for it",
  () => {
    const span = (text, marks = []) => ({ _type: "span", _key: text, text, marks });
    const block = (...children) => ({ _type: "block", style: "normal", children, markDefs: [] });
    assert.equal(
      portableTextToMarkdown([
        block(span("2 * 3 [x] <y> # no")),
        { _type: "media", variation: "default" },
        block(span("say "), span("loudly ", ["strong"]), span("now")),
      ]),
      "2 \\* 3 \\[x\\] \\<y> # no\n\nsay **loudly** now\n",
    );
  },
);

// --- a PDS in this process ---------------------------------------------------------------------------------------------------
const heading = (depth, text) => ({
  _type: "block",
  _key: `h${text}`,
  style: `h${depth}`,
  children: [{ _type: "span", _key: "s", text, marks: [] }],
  markDefs: [],
});
const document = ({ uid, file, order, blocks, ...rest }) => ({
  uri: `at://${DID}/ing.lexicon.cms.document/en-${uid}`,
  cid: "bafy",
  value: {
    $type: "ing.lexicon.cms.document",
    type: "doc",
    uid,
    lang: "en",
    publication: PUBLICATION,
    data: { title: uid, group: "Guide", file, order },
    body: [{ sectionType: "richText", variation: "default", primary: { content: blocks } }],
    createdAt: "2026-10-24T00:00:00.000Z",
    ...rest,
  },
});
const page = (uid, file, order) => document({ uid, file, order, blocks: [heading(2, uid)] });

const site = () => [
  // out of order on purpose: the order is the documents' own
  page("themes", "docs/API.md", 5),
  document({ uid: "overview", file: "README.md", order: 0, blocks: sinkBlocks }),
  page("api-reference", "docs/API.md", 3),
  page("install", "README.md", 1),
  page("tokens", "docs/API.md", 4),
];

// answers listRecords from `records`, `size` at a time, or as `mode` says
const serve = async (records, mode = "ok", size = 2) => {
  const requests = [];
  const server = createServer((request, response) => {
    const url = new URL(request.url, "http://x");
    requests.push(url);
    const answer = (status, body, type = "application/json") => {
      response.writeHead(status, { "content-type": type });
      response.end(typeof body === "string" ? body : JSON.stringify(body));
    };
    if (mode === "down" || (mode === "flaky" && requests.length === 1))
      return answer(503, { error: "Unavailable" });
    if (mode === "missing") return answer(400, { error: "InvalidRequest" });
    if (mode === "garbage") return answer(200, "<html>a captive portal</html>", "text/html");
    const from = Number(url.searchParams.get("cursor") ?? 0);
    return answer(200, {
      records: records.slice(from, from + size),
      ...(from + size < records.length ? { cursor: String(from + size) } : {}),
    });
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  return {
    requests,
    env: { DOCS_PDS_URL: `http://127.0.0.1:${server.address().port}`, DOCS_PDS_DID: DID },
    close: async () => {
      server.close();
      await once(server, "close");
    },
  };
};

const withPds = async (records, mode, run) => {
  const pds = await serve(records, mode);
  try {
    return await run(pds);
  } finally {
    await pds.close();
  }
};

await check(
  "the pages come in the order the site lists them, and each is the markdown of its page",
  async () => {
    await withPds(site(), "ok", async (pds) => {
      const pages = await loadPdsPages(pds.env, { wait: instant });
      assert.deepEqual(
        pages.map((p) => [p.file, p.slug, p.order]),
        [
          ["README.md", "overview", 0],
          ["README.md", "install", 1],
          ["docs/API.md", "api-reference", 3],
          ["docs/API.md", "tokens", 4],
          ["docs/API.md", "themes", 5],
        ],
      );
      assert.equal(pages[0].markdown, read("kitchen-sink.roundtrip.md"));
      assert.equal(pages[1].markdown, "## install\n");
      assert.ok(pds.requests.length > 1, "five documents, two to a page: the cursor is followed");
      assert.ok(
        pds.requests.every((u) => u.searchParams.get("collection") === "ing.lexicon.cms.document"),
      );
      assert.ok(pds.requests.every((u) => u.searchParams.get("repo") === DID));
    });
  },
);

await check(
  "what is not the site's is left alone: another type, another publication, another locale",
  async () => {
    const foreign = [
      document({
        uid: "post",
        file: "README.md",
        order: 9,
        blocks: [heading(1, "post")],
        type: "post",
      }),
      document({
        uid: "elsewhere",
        file: "README.md",
        order: 9,
        blocks: [heading(1, "elsewhere")],
        publication: `at://${DID}/site.standard.publication/other`,
      }),
      document({ uid: "fr", file: "README.md", order: 9, blocks: [heading(1, "fr")], lang: "fr" }),
    ];
    await withPds([...foreign, ...site()], "ok", async (pds) => {
      const pages = await loadPdsPages(pds.env, { wait: instant });
      assert.deepEqual(
        pages.map((p) => p.slug),
        ["overview", "install", "api-reference", "tokens", "themes"],
      );
    });
  },
);

await check("a PDS that blinks once is tried again", async () => {
  await withPds(site(), "flaky", async (pds) => {
    const waits = [];
    const pages = await loadPdsPages(pds.env, { wait: (ms) => Promise.resolve(waits.push(ms)) });
    assert.equal(pages.length, 5);
    assert.deepEqual(waits, [1000]);
  });
});

await check(
  "a PDS that stays down fails the build, after three tries, and the error says what happened",
  async () => {
    await withPds(site(), "down", async (pds) => {
      const waits = [];
      await assert.rejects(
        loadPdsPages(pds.env, { wait: (ms) => Promise.resolve(waits.push(ms)) }),
        /cannot read http:\/\/127\.0\.0\.1:\d+\/xrpc\/com\.atproto\.repo\.listRecords.*answered 503/,
      );
      assert.equal(pds.requests.length, 3);
      assert.deepEqual(waits, [1000, 2000]);
    });
  },
);

await check("a refusal that would be the same next time is not tried again", async () => {
  await withPds(site(), "missing", async (pds) => {
    await assert.rejects(loadPdsPages(pds.env, { wait: instant }), /answered 400/);
    assert.equal(pds.requests.length, 1);
  });
});

await check("nothing listening fails the build", async () => {
  const pds = await serve([]);
  const env = pds.env;
  await pds.close();
  await assert.rejects(loadPdsPages(env, { wait: instant }), /cannot read/);
});

await check("an answer that is not a list of records fails the build", async () => {
  await withPds(site(), "garbage", async (pds) => {
    await assert.rejects(loadPdsPages(pds.env, { wait: instant }), /cannot read/);
  });
});

await check(
  "an account with no pages fails the build, rather than building an empty site",
  async () => {
    await withPds([], "ok", async (pds) => {
      await assert.rejects(loadPdsPages(pds.env, { wait: instant }), /holds no page of README\.md/);
    });
  },
);

await check(
  "a file with no pages fails the build, rather than building a site without its reference",
  async () => {
    const readme = site().filter((r) => r.value.data.file === "README.md");
    await withPds(readme, "ok", async (pds) => {
      await assert.rejects(
        loadPdsPages(pds.env, { wait: instant }),
        /holds no page of docs\/API\.md/,
      );
    });
  },
);

await check("a page that cannot be read fails the build and names the document", async () => {
  const broken = (change) => {
    const record = page("broken", "README.md", 2);
    change(record.value);
    return [...site(), record];
  };
  const fails = (records, message) =>
    withPds(records, "ok", (pds) =>
      assert.rejects(loadPdsPages(pds.env, { wait: instant }), message),
    );
  await fails(
    broken((v) => (v.data.order = "2")),
    /en-broken: data\.order is not a number/,
  );
  await fails(
    broken((v) => (v.data.file = "docs/Other.md")),
    /en-broken: data\.file is not one of README\.md, docs\/API\.md/,
  );
  await fails(
    broken((v) => (v.body = [])),
    /en-broken: the page does not start with a heading/,
  );
  await fails(
    broken(
      (v) => (v.body[0].primary.content = [{ _type: "block", style: "normal", children: [] }]),
    ),
    /en-broken: the page does not start with a heading/,
  );
});

await check("two pages with one slug fail the build, because a slug is a URL", async () => {
  await withPds([...site(), page("tokens", "README.md", 2)], "ok", async (pds) => {
    await assert.rejects(
      loadPdsPages(pds.env, { wait: instant }),
      /two pages have the slug "tokens"/,
    );
  });
});

await check("the first page has to be the overview, which is /overview", async () => {
  const without = site().filter((r) => r.value.uid !== "overview");
  await withPds(without, "ok", async (pds) => {
    await assert.rejects(
      loadPdsPages(pds.env, { wait: instant }),
      /first page of README\.md is "install", not "overview"/,
    );
  });
});

await check(
  "the source is the files unless the environment says the PDS, and a typo is an error",
  () => {
    assert.equal(docsSource({}), "repo");
    assert.equal(docsSource({ DOCS_SOURCE: "" }), "repo");
    assert.equal(docsSource({ DOCS_SOURCE: "repo" }), "repo");
    assert.equal(docsSource({ DOCS_SOURCE: "pds" }), "pds");
    assert.throws(() => docsSource({ DOCS_SOURCE: "PDS" }), /DOCS_SOURCE is "PDS"/);
  },
);

await check("the PDS and the account default to cssints.dev's", () => {
  assert.deepEqual(pdsConfig({}), {
    service: "https://pds.cssints.dev",
    did: DID,
    publication: PUBLICATION,
  });
  assert.equal(pdsConfig({ DOCS_PDS_URL: "http://localhost:1/" }).service, "http://localhost:1");
});

// --- the real pages, both ways ----------------------------------------------------------------------------------------------
const dump = process.env.DOCS_PDS_DUMP;
if (dump) {
  await check("the real pages built from the PDS are the pages built from the files", async () => {
    process.env.DOCS_HOVERS ??= "0";
    const { buildPages } = await import("../plugin/markdown.ts");
    const records = JSON.parse(readFileSync(dump, "utf8"))
      .filter((r) => r.collection === "ing.lexicon.cms.document")
      .map((r) => ({
        uri: `at://${DID}/${r.collection}/${r.rkey}`,
        cid: "bafy",
        value: r.record,
      }));
    assert.ok(records.length > 30, `${records.length} documents`);
    await withPds(records, "ok", async (pds) => {
      const files = await buildPages("/");
      Object.assign(process.env, pds.env, { DOCS_SOURCE: "pds" });
      const served = await buildPages("/").finally(() => delete process.env.DOCS_SOURCE);
      assert.deepEqual(
        served.map((p) => p.slug),
        files.map((p) => p.slug),
        "the same URLs, in the same order",
      );
      for (const [i, p] of served.entries()) assert.deepEqual(p, files[i], `/${p.slug}`);
      console.log(`     ${served.length} pages, ${records.length} documents from the PDS`);
    });
  });
} else {
  console.log("skip the real pages (DOCS_PDS_DUMP is not set)");
}

if (failed) {
  console.log(`${failed} failed`);
  process.exit(1);
}
