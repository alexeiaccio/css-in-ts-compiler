---
"@cssints/headless": patch
---

`createRadioGroup` mounts under Solid 2.0.3: the group's cleanup and its effects are created in the
primitive's body and the ref only names the element it landed on. They used to be created inside the
ref callback through `runWithOwner`, which 2.0.3 rejects — `onCleanup` in a ref callback is
`CLEANUP_IN_FORBIDDEN_SCOPE`, and it threw on mount, halting the whole reactive graph of the host.

Found by the dev console in `effects-of-atmosphere`, which goes blank on 2.0.3 because its mode and
pane controls are radio groups. The behaviour is unchanged: the roving group still attaches,
reconciles and detaches on the same transitions, and the primitive's own suite (37 tests) is green.
