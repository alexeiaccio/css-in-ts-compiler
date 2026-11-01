---
"@cssints/headless": minor
---

`createControllable`: an intent the host has not answered yet is one request. A controlled host's value is applied on
Solid's flush, so two dismissals in the same frame (an Escape and a backdrop click, or a second Escape during a
transition) used to ask `onValueChange` twice for the same state; the request path now remembers the intent it is
waiting on for one microtask. A separate, later intent is asked again, so a host that refuses a close is still asked
when the reader asks again.
