---
"@cssints/headless": minor
---

`createToast` takes a `clock` (`systemClock` from `@cssints/machine` by default). The countdown reads it for the deadline
and both timers, so a test passes `createFakeClock()` and advances the countdown deterministically: hovering 800 ms into a
1200 ms toast, holding it past the deadline, and leaving is proven to resume with the 400 ms that were left rather than
restart, with no wall clock and no sleep. The toast suite (headless and the kit's) now runs on the fake clock.
