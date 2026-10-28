---
"@cssints/apg-specs": patch
---

`parseScenarioFile` takes `unknown` rather than `Schema.Json`: a scenario file arrives as a JSON import, whose type has no index signature, so a copy of a test could not pass `tsc` without a cast. The schema was already the check that matters.
