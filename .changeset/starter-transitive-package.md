---
"cssints": patch
---

A package written on cssints that arrives behind another one is now compiled too. `packagesOnCssints`
read only the app's own dependencies, so a transitive one — `@cssints/reveal` importing
`@cssints/motion`, the shape of every starter that installs from npm — was externalized in the
evaluation server, and Node loaded its module itself: the `with { type: "cssints" }` attribute that
marks a published package as build-time code is not an attribute Node knows, so the run died with
`Import attribute "type" with value "cssints" is not supported`. The walk now follows the installed
graph (dependencies and peers, from each package's own manifest), so every package on cssints is kept
out of the optimizer and inlined where the engine evaluates it.
