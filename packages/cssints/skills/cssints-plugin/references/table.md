# The entries of a `scope()` table

Entries are told apart by their shape. A key that starts with `#` is private (not exported, invisible to an embedding
scope); `uses` names it without the `#`. `--_x` is `--<scope>-x` everywhere in the scope; in raw CSS `&` is the
kernel's class and `&(mod.key)` the class of a kernel of an embedded scope.

| Shape                                             | What it is                                                                                |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `width: "<length [0,∞]> \| thin"`                 | A local syntax name: `<width>` in this scope's grammars                                   |
| `"-webkit-font-smoothing": "auto \| antialiased"` | A typed property not in mdn-data, exported camel-cased (`webkitFontSmoothing`)            |
| `{ css, atProperty?, requires? }`                 | A kernel: `css` a string (raw) or `(css) => style \| style[]`                             |
| `{ rule, layer? }`                                | A global rule (no class), identified by its content                                       |
| `{ layers: ["app", "viewer"], before? }`          | Top-level layers, after the engine's (or before with `before: true`)                      |
| `{ polyfills, css?, script?, parentVars? }`       | A runtime: the fallback for targets that lack a BCD key                                   |
| `{ props, message }`                              | Conflicts: a `cn()` with the member and one of `props` (names or RegExps) is an error     |
| `{ tokens }`                                      | A token set from `createTokens`: `<tokens.color.accent>` in grammars is that token's type |
| `mod: otherScope`                                 | An embedded scope: `uses: ["mod.key"]`, `<mod.name>` in grammars, `&(mod.key)` in raw CSS |
| `{ uses?, group?, chain: { ... } }`               | A chain member: `x().m(v).n(w)`                                                           |
| `{ args, uses?, group? }`                         | A call member: its function is the entry of the same name in `.build({ ... })`            |
| `{ args, value, label? }` / `fn({ ... })`         | A value member: returns a CSS value (`fn()` when `args` is a tuple or `arg<T>()`)         |

## Kernels

```ts
"#core": {
  css: (css) => [
    css.vars({ "--_gap": "1rem", "--_fade": fade }), // defaults on the element; a keyframes() name carries its rule
    css.display("flex"),
    css.animation("var(--_fade) 200ms"),
    css.hover(css.opacity(0.8)),
    css.media("(width >= 40rem)")(css.padding("1rem")),
    css.nest("& > * + *")(css.marginInlineStart("var(--_gap)")), // children: & and a combinator
  ],
  requires: ["css.at-rules.property", { key: "css.types.color.oklch.relative_syntax", exact: true }],
},
"#raw": {
  css: "& { --_x: 1 } &(base.mark) > & { --_y: 2 }",
  atProperty: '@property --_w { syntax: "<length>"; inherits: false; initial-value: 2px; }',
},
```

- Printed once in `_.k`, sorted by key (`<scope>.<entry>`), whatever the order of `uses`; at-rule kernels
  (`keyframes()`) before the kernel that names them. A styles kernel prints in the sheet's order (a shorthand before
  its longhands; fewer conditions first), so the order you write does not matter.
- Not allowed in a styles kernel: `firstThatWorks()`, a member's marker (another plugin member), `nest()` with a
  selector that does not start with `&` and a combinator.
- Build errors: two keys that declare one custom property, two keys that print one marker, two styles kernels of one
  member that set one element property.

## Chain members

```ts
ring: {
  uses: ["core", "fallback"],
  group: true, // adds _g-<scope> after the kernel markers
  chain: {
    width: { args: "<width>", spacing: true, emit: (v) => [["--_w", v]] },
    color: { args: "<color>", emit: (v) => [["--_c", v]] },
    plain: { args: "", excludes: ["color"], emit: () => [["--_c", "currentColor"]] }, // no value; color() no longer offered
  },
},
```

`emit` returns `[property, value][]`: a custom property's value is not checked, any other property is checked like a
`css.*` call (and counts for conflicts).

## Call members

```ts
look: { args: ["<color>", "$tokens", "$overrides", { "size?": "<base.gap>", "in?": "app | viewer" }], uses: ["order"] },
icon: { args: arg<"home" | "star">() },
reset: { args: [{ "media?": arg<boolean>(), "prose?": arg<boolean>() }] },
// ...
.build({
  look: (color, tokens, overrides, { size, in: source }) => ({
    decls: [["--_c", color], ["--_s", size ?? "0"]],
    uses: ["base.mark"],
    themes: [{ tokens, overrides, selector: ":root", layer: source ?? "app" }],
  }),
  icon: (name) => ({ decls: [["--_icon", name]] }),
  reset: ({ media }) => ({
    layers: { layers: ["reset"], before: true },
    globals: media ? [{ css: "img { display: block }", layer: "reset" }] : [],
  }),
})
```

`build` returns `{ decls?, uses?, globals?, themes?, layers? }`:

- `decls`: declarations of the member's own class (in `_.a`, or under the user's condition).
- `uses`: more kernels, globals, layers or runtimes, by key or `mod.key`.
- `globals: { css, layer? }[]`: rules with no class, identified by content; may set one custom property in several
  layers (looks).
- `themes: { tokens, overrides, selector, layer?, scope? }[]`: `createGlobalTheme` made by a member, checked against
  the token set and read by `check.contrast`.
- `layers`: a list, or `{ layers, before: true }`.

The positional form puts a type error on the call, with the position in the message (`look(2): ...`), not on the
argument. A grammar part arrives as checked text; a token as its `var(--name)`.

## Value members

```ts
tint: { args: "<color> <percentage>", value: ([color, share]) => new CSSColorValue(`color-mix(in oklab, ${color}, white ${share})`) },
shade: fn({
  args: ["<color>", { "by?": "<percentage>", "dark?": arg<boolean>() }],
  label: "tint.shade",
  value: ([c, { by = "10%", dark }]): string => `color-mix(in oklab, ${c}, ${dark ? "black" : "white"} ${by})`,
}),
```

- With a grammar `args`, the parts are joined by a space, so `"<color> <color>"` cannot tell `"red", "blue"` from
  `"red blue"`: check `parts.length` or use a tuple.
- `value` runs at build time, once per call; the call is replaced by its CSS text. It throws for values the grammar
  cannot reject (units it cannot compute, a failed accessibility rule): `fluid` rejects `em` and fails WCAG 1.4.4.
- What `value` returns must be a string or a Typed OM value (`cssints: tint() value must return a string or a Typed OM
value`). A result that does not fit the property is that property's error at the same site.

## Identity and HMR

A scope is its content (the table, the source of its functions, the scopes it embeds), hashed. Running the module
again with the same content is nothing; another content under the same name replaces it (an edit in dev). Two
modules that define one name with different content: `scope "x" is defined twice with different content`. A closure
the hash does not see (icons' collection) is fine as long as the table and code are the same.
