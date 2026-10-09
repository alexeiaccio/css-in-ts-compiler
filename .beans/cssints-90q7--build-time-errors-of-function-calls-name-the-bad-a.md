---
# cssints-90q7
title: Build-time errors of function calls name the bad argument
status: in-progress
type: feature
created_at: 2026-10-09T08:56:15Z
updated_at: 2026-10-09T08:56:15Z
---

Follow-up of cssints-6jou (asked 2026-10-09): the type error of a non-math call names the argument ("(argument 2)"), the build-time twin message does not. Make the build error name it too and point at it.
- [ ] Find the argument at build time like Stop does in the types (prefix + var() pending substitution with the twin), only on the failure path (valid calls cost nothing).
- [ ] Message: the twin's wording plus "(argument N)" / "(after argument N)"; the error location (loc) is the bad argument's offset, not the call's, if the site has argument offsets (else the call).
- [ ] Tests: build errors for lightDark arg 2, linearGradient arg 3, oklch arg 5, too few/many; perf.mjs not affected (failure path only).
