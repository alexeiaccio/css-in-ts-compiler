---
name: cssints-plugin
description: >-
  Write or fix a cssints plugin: a module or package that exports members of scope() from "cssints/plugin" (kernels,
  chain/call/value members, conflicts, runtimes with polyfills/css/script/parentVars, lacking(), group markers, token
  themes). Load it when code imports scope, fn, arg or lacking from "cssints/plugin", when you design a new
  @cssints/* package or a member like stack(), motion() or fluid(), when a build says "kernel ... sets",
  "wraps ... the marker of kernel", "scope ... is defined twice", "share a name", "kernels ... both set", or a
  declaration file fails with TS7056/TS2742, and when you write its fixtures, type tests or browser tests.
---

# cssints plugins on `scope()`

A plugin is a module that exports the members of `scope(name, table).build(impl).export()` from `cssints/plugin`.
The table says what the plugin has; the members are typed from it (no types file). User code imports the plugin with
`with { type: "cssints" }`; there is no registration. In user code a member is a class string (or a CSS value), so it
goes into `cn()`, `cx()` and conditions. Everything runs at build time in Vite's Module Runner. Read the user skill
`cssints` first for the styles themselves; the full reference is the "Plugins" section of `docs/API.md`.

If the cssints MCP server is configured, prefer `compile` to see a fixture's classes, sheet, errors and warnings,
`check_declaration` for a kernel's declarations, `check_support` for the BCD keys of `requires`/`polyfills`, and
`search_docs` for the API text.

## The shape

```ts
import { scope } from "cssints/plugin";

export const { ring } = scope("ring", {
  "#core": {
    css: (css) => [css.outline("var(--_w)", "solid", "var(--_c)"), css.outlineOffset("2px")],
  },
  ring: {
    uses: ["core"],
    chain: {
      width: { args: "<length [0,∞]> | thin | thick", spacing: true, emit: (v) => [["--_w", v]] },
      color: { args: "<color>", emit: (v) => [["--_c", v]] },
    },
  },
}).export();
// user code: cn(ring().width(1).color("red")) -> "_ring-core _a _b"; ring().width("red") is a type error
```

- **Names.** The scope name is lowercase letters, digits and `-`, unique in the process (`cssints`, `derived` are
  taken). `--_x` anywhere in the scope is `--<scope>-x`; `&` in raw CSS is the kernel's class `_<scope>-<entry>`;
  `&(mod.key)` is the class of a kernel of an embedded scope. Your CSS never writes the long names.
- **Private keys** start with `#`: used by other entries, not exported. `uses` names them without the `#`, so `#trim`
  beside a public `trim` is an error (`#trim and trim share a name: rename one`).
- **A key is a name** (no dots). A member shown as `fluid.container` is a key `fluidContainer` with
  `label: "fluid.container"`, attached by hand (`Object.assign`).
- `.build({ member: fn })` holds the functions of call members; a scope with only chains and values skips it.

The table entries by shape (syntax names, typed `-props`, kernels, globals, layers, runtimes, conflicts, token sets,
embedded scopes, chain, call and value members): [references/table.md](references/table.md).

## Kernels: styles or raw CSS

A kernel is global CSS printed once in layer `_.k`, keyed to its marker class. Write it **as styles** by default:
`css: (css) => [...]` gets the `css.*` members, checked by the grammar like a user's declarations, plus:

- conditions: `css.hover(...)`, `css.media("(...)")(...)`, `attr()`, `within()`, `container()`, `supports()`;
- `css.nest(selector)(...)` for other elements: one complex selector with `&` (the kernel's class) anywhere:
  `"& > *"`, `"& > * + *"`, `".dark &"`, `":root:has(&)"` (a list is an error);
- `css.vars({ "--_gap": "1rem" })` for custom properties (values not checked);
- `keyframes()`/`positionTry()` names as values (`css.vars({ "--_k": fade })`): their rules go with the kernel; a
  `css.keyframes({ from: css.vars({ "--_p": "100%" }) })` made in the kernel animates the scope's `--<scope>-p`.

A styles kernel **derives its conflicts** (every property that meets one it sets, as `cn()` decides overlap) and its
support warnings are **covered** by the `polyfills` of a runtime in the same `uses`. Raw CSS (`css: "&{...}"`) is still
needed for:

- at-rules the styles cannot write: `@container style(...)` alternation (frame, surface), `&&` specificity tricks;
- a value the grammar does not know yet (write it raw, with a test that fails once the grammar has it);
- a declaration whose support warning nothing should cover and nothing should print (balance's `pretty()`).

Runtime fallback CSS (`@supports not (...) { & {...} }`) is a raw string in the runtime entry, not a kernel.

A raw kernel derives no conflicts and is not compared with others: list a `conflicts` entry. Two styles kernels of
one member that set one element property are an error (`kernels zap and view both set animation, ...: write those in
one kernel`). `atProperty` holds `@property` rules; `requires` holds BCD keys (warnings, never errors);
`{ key, exact: true }` counts a partial implementation as lacking.

A kernel cannot be conditional per site. A member whose style is only markers (no declarations: no method, no
arguments) under `hover()` or `media()` is a build error (`:hover wraps _x-core, the marker of kernel x.core, with no
declaration of its own`). Give the member methods that set custom properties; the kernel reads them, and a condition
can wrap a method.

## Members

- **Chain** `{ uses, chain: { m: { args, spacing?, excludes?, emit } } }`: `x().m(v)`, each method once. `args` is a
  grammar of the parts (`""` for no value); `spacing: true` makes a bare number a 0.25rem step; `emit(v)` returns
  `[prop, value][]` (custom properties unchecked, others checked). Write grammars as literals (`as const` on a
  `const` string).
- **Call** `{ args, uses? }` plus `build({ x: (...args) => ({ decls?, uses?, globals?, themes?, layers? }) })`. `args`:
  a grammar, `arg<T>()` (a TypeScript value, as is), or a tuple of positions: grammars, `"$tokens"`, `"$overrides"`
  (checked against the `$tokens` before it), `"$selector"`, `arg<T>()`, and at the end one object of named leaves
  (`{ "size?": "<length>" }`). Use `args: []` for a member with no arguments.
- **Value** `{ args, value, label? }`: returns a CSS value, not a class. `value` gets the parts as text (a token as
  its `var(--name)`). With a tuple or `arg<T>()` write `fn({ args, value })`. Return a Typed OM value to keep the
  type (`new CSSColorValue(...)`, `CSS.rem()`, `class X extends CSSStyleValue<"length">`, `CSSImageValue`, all from
  `"cssints"` without the attribute in a plugin module); a string (a template literal too) is opaque to the types
  and checked where it lands.
- **`group: true`** on a chain or call member adds the group marker `_g-<scope>`, so
  `within(attr("data-stuck", "top", "~="), "<scope>")(...)` reads that element. One group per scope.
- **Typed properties**: a key that starts with `-` and a grammar (`"-webkit-font-smoothing": "auto | antialiased"`)
  is exported camel-cased (`webkitFontSmoothing`). A property mdn-data knows is an error: use `css.<name>`.
- **Plain functions** the plugin exports (wrapping the user's styles, as `stuck(...styles)`) are fine; anything they
  throw while a site runs is located at that site.

## Conflicts

- **Derived** from styles kernels: `cn(stack(), display("grid"))` gives
  `layout: kernel stack-core sets display, flex-direction, gap (this style also sets display)`. Custom properties and
  `nest()` rules on another subject are left out (a child's margin is not the element's; `.dark &` and `&.on` are
  the element and count).
- **Explicit** `{ props: ["outline", /^outline-/], message: "ring() sets the outline: use its methods" }` in `uses`
  **replaces** what the kernels derive; `props: []` allows everything. Needed for raw kernels, and when a member
  emits a property its own kernel sets (the check reads the member's emits too).

## Runtimes: fallbacks for targets that lack a feature

`"#fb": { polyfills: [bcdKeys], css?, script?, parentVars? }` in a member's `uses`. A client module that uses the
member imports `virtual:cssints/runtime/<scope>.<entry>`; it is empty (`export {};`) unless a browserslist target
lacks a key.

- `css`: fallback rules, added to `_.k` only then (usually `@supports not (...) { & {...} }`); reaches every target.
- `script`: a module specifier the runtime module imports (`"@cssints/reveal/runtime"`), never evaluated at build
  time. Ship it as a package subpath with a `development` condition for `src/`; it probes the feature itself
  (`CSS.supports`) and does nothing where it is native. Reaches every target.
- `parentVars: { marker: "&", read, write, watch? }`: the shared `cssints/parent-vars` script copies custom
  properties from parent to child; it stands on `@property`, so it reaches only targets that have it.
- Coverage: a `requires` key or a styles-kernel warning whose BCD key is in `polyfills` warns only for targets the
  runtime does not reach. Match keys exactly (the key is in parentheses at the end of the warning).
- `lacking(...keys)` returns the build's targets that lack a key (`["firefox 140"]`, `[]` when none): emit fallback
  rules or styles only when needed (`stuck()` adds its attribute rules only then).
- `dependsOn(path)`: call it for every file the plugin reads (an image, an SVG, a font). In dev an edit of the file
  runs the modules that read it again; in `vite build --watch` it is a watched file.

## Errors

What `build`, `value`, `emit` or a kernel's styles throw is a located `MemberError` at the call, prefixed with the
scope. Throw `new Error("cssints: <scope>: <what>, <what to do>")`; name the value and the fix. The grammar errors of
`args` come for free (`ring.width: unexpected "red" ...`, a tuple's `tint.shade(2).by: ...`).

## Exporting, packaging

When the inferred type is too long to print (TS7056) or names an internal file (TS2742) in `vp pack`/`dts`:

```ts
const balanceScope = scope("balance", { ... }).build({ balance: () => ({}) });
type Members = ReturnType<typeof balanceScope.export>;
const members: Members = balanceScope.export();
export const balance: Members["balance"] = members.balance;
```

A package: `cssints` in `peerDependencies`; `exports` with `development` (src) before `types`/`default` (dist); a
`./runtime` subpath for a script (with `sideEffects` listing it); no `.css` file. Export the scope itself
(`export const motionScope = ...`) when another plugin should embed it.

## Testing

Fixtures through the engine (output, errors, a re-run per `BROWSERSLIST`), a type test with `@ts-expect-error`, and
`test:browsers` with a control that must fail: [references/testing.md](references/testing.md).

## Checklist

- [ ] Scope name unique and lowercase; private keys for everything that is not a member.
- [ ] Kernels as styles unless one of the raw cases above; raw kernels have a `conflicts` entry.
- [ ] Every member that may go under a condition has a method or argument that emits a declaration.
- [ ] Defaults of custom properties set on the kernel (`vars()`), so a nested member does not inherit its parent's.
- [ ] `requires` lists the BCD keys; each has a runtime in `polyfills`, or the warning is intended.
- [ ] Fallback CSS and scripts only when `lacking()` or a runtime says so; a script probes and stays off natively.
- [ ] Errors name the scope, the value and the fix; grammars are literals.
- [ ] Fixtures: output, each error, `BROWSERSLIST` modern and old, the runtime module empty or not.
- [ ] Type test: valid calls typed `string` (or the value type), invalid ones under `@ts-expect-error`.
- [ ] Browser test (if there is a runtime or a visual claim): native, fallback forced, and a control that fails.
- [ ] README: example, the CSS it prints, rules, browsers, limits; `docs/API.md` table row if in the cssints repo.
