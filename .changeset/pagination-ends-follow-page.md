---
"@cssints/headless": minor
---

`createPagination`'s previous and next controls follow the current page: `previousProps` and `nextProps` are getters over an offset, and their `onClick` resolves the page when it runs. A host that spreads the object onto an anchor once can now step past the first move, which it could not before — the second click on Next targeted the page it was already on. `packages/headless/test/pagination.browser.test.tsx` covers it (next twice, then previous).
