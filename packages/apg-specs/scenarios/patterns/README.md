# Pattern scenarios — our own non-APG patterns

One file per pattern: `<pattern>.spec.json`, in the format of
[`../apg/README.md`](../apg/README.md) (same envelope, steps and expectations;
`src/scenario.ts` decodes it, so a step outside the documented vocabulary is
`unsupported` rather than silently dropped).

There is no upstream test to port here: a scenario is written from the pattern's
own spec, so `source` is `spec`, `commit` is `null` and the file says which spec
it came from in `notes`. `skipped` names the behaviours the spec deliberately
does not model, with the reason. `resizable-panels` is the first one: a group of
window splitters, `specs/patterns/resizable-panels.qnt`.
