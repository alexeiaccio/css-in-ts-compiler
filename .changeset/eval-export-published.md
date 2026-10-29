---
"cssints": patch
---

`cssints/eval` is in the published manifest: `publishConfig.exports` shadows the top-level one at publish time, and the subpath
was only in the latter (a consumer resolved it through the `./*` wildcard, without its own types).
