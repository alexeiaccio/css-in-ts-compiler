// "cssints/plugin": what a plugin module is written with. A plugin is a module that exports members of a `scope()`
// (scope.ts); user code imports it `with { type: "cssints" }`, and its calls are sites like those of `css.*`. There is no
// registration: the style a member returns carries its kernel, runtime and conflicts, and the engine learns them there.
// Build time only (Node, the Module Runner): the types say a member returns a class string, as `cssints` does.
//
// This file and scope.ts are what the "types" condition of package.json points at: signatures and one-line bodies, the
// engine is scope-engine.ts.
import type { Part, Style } from "./parts.ts";

export { arg, scope } from "./scope.ts";
export type {
  ArgsDef,
  Chain,
  Css,
  Entry,
  Impl,
  KernelDef,
  Made,
  Members,
  Pending,
  Scope,
  Table,
  Typed,
} from "./scope.ts";
export type { Conflict, Decl, GlobalRule, Kernel, Runtime, ThemeRule } from "./author-types.ts";
export type { Part, Style };
