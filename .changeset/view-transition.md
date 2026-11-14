---
"@cssints/headless": minor
---

`createViewTransition`: the runner around `document.startViewTransition`. `run(update)` applies the update exactly once, starts a transition when the API exists and motion is not reduced, and resolves even when the platform skips it (a duplicate name, a supersede). `persist()` is the default case (`view-transition-name: match-element`, the browser names the element), `name(id)` is the morph pair with a deterministic prefixed name, and `state()` reports `supported` / `active`. Reduced motion and a browser without the API are one inert path. Its behaviour is `packages/apg-specs/specs/patterns/view-transition.qnt`; the DOM is checked against it by the differential walk.
