// The flex() / grid() chain lists (CONTEXTS in lib.mjs) against mdn-data appliesto. Fails when mdn-data gets
// a container property that is in neither list nor the exceptions below. Run: node contexts.mjs
import { createRequire } from "node:module";

import { CONTEXTS } from "../src/lib.mjs";

const mdn = createRequire(import.meta.resolve("@cssints/css-grammar/mdn"))("mdn-data/css/properties.json");
const CONTAINER = /(flex|grid)Containers/i;
// mdn-data says allElements, but they align the items of a container
const ALL_ELEMENTS = new Set(["align-items", "justify-items", "place-items"]);
// Container properties that are not chain methods: not layout properties, masonry drafts, the grid shorthand.
const NOT_OURS = /^(overflow(-.*)?|dominant-baseline|reading-.*|align-tracks|justify-tracks|masonry-auto-flow|grid)$/;

const ours = new Set(Object.values(CONTEXTS).flat());
const bad = [
  ...[...ours].filter((p) => !CONTAINER.test(mdn[p]?.appliesto) && !ALL_ELEMENTS.has(p)).map((p) => `${p}: mdn-data appliesto is ${mdn[p]?.appliesto}`),
  ...Object.entries(mdn)
    .filter(([p, d]) => d.status === "standard" && CONTAINER.test(d.appliesto) && !ours.has(p) && !NOT_OURS.test(p))
    .map(([p, d]) => `${p}: a container property (${d.appliesto}); add it to CONTEXTS in lib.mjs or to the exceptions here`),
];
console.log(bad.length ? bad.join("\n") : `contexts: ${ours.size} container properties match mdn-data`);
process.exit(bad.length ? 1 : 0);
