// The search over headings and terms (src/lookup.ts) on a few pages: word order, prefixes over the middle of a word, every word,
// the page title as a second place, and a term that matches only its page's name is no hit.
import assert from "node:assert/strict";

import { createIndex, search } from "../src/lookup.ts";

const index = createIndex([
  { slug: "tokens", title: "Tokens", entries: [{ id: "types", text: "Types", depth: 5 }] },
  {
    slug: "frame",
    title: "frame(): concentric radius",
    entries: [{ id: "methods", text: "Methods", depth: 5 }],
  },
  {
    slug: "local",
    title: "Local at-rules: keyframes and positionTry",
    entries: [{ id: "name", text: "The name", depth: 5 }],
  },
  {
    slug: "themes",
    title: "Themes",
    entries: [
      { id: "types", text: "Types", depth: 5 },
      { id: "check", text: "check.contrast", depth: 4 },
    ],
  },
]);
const at = (q) => search(index, q).map((h) => `${h.slug}${h.id && `#${h.id}`}`);

assert.deepEqual(at(""), []);
assert.deepEqual(at("   "), []);
assert.deepEqual(at("zzz"), []);
assert.deepEqual(
  at("frame"),
  ["frame", "local"],
  "a word that starts a word beats one in the middle",
);
assert.deepEqual(at("TOKEN"), ["tokens"], "case does not matter");
assert.deepEqual(
  at("types"),
  ["tokens#types", "themes#types"],
  "terms of both pages, in page order",
);
assert.deepEqual(
  at("types themes"),
  ["themes#types"],
  "every word, the page title counts as a place",
);
assert.deepEqual(at("name"), ["local#name"]);
assert.deepEqual(at("contrast"), ["themes#check"], "a dotted name is found by its second part");
assert.deepEqual(at("methods frame"), ["frame#methods"]);
assert.equal(search(index, "t", 2).length, 2, "the limit");
console.log("docs search ok");
