---
name: cssints
description: >-
  Write, review and fix styles in a project that uses cssints, the CSS-in-TypeScript compiler (a Vite plugin that
  runs css.* calls at build time and replaces them with atomic class strings). Load it when code imports from
  "cssints" with { type: "cssints" }, uses cn(), cx(), cv(), css.* members, media()/hover()/container()/within(),
  createTokens, createGlobalTheme, check.contrast, or an @cssints/* package (layout, motion, fluid, fonts, reset,
  tokens, icons, ...), and when a build fails with a "cssints:" message such as "must be known at build time",
  "without the attribute", "unexpected ... expected <...>", "overlap without one containing the other" or
  "wraps ... the marker of kernel".
---

# cssints: styles in TypeScript, compiled at build time

Every `css.*` call runs at build time in Vite's Module Runner and is replaced by a class string. The values are
checked against the CSS grammars (mdn-data) twice: in the types, where the call is, and again by the build, with the
file and the place of the call. One sheet, `virtual:cssints.css`, holds every rule once, in `@layer`s. The browser
gets class strings, `cx` and the few lines behind `cv`. The reference is `docs/API.md` of the cssints repository; the
parts below are what you need most of the time.

If the cssints MCP server is configured, prefer it for checks: `check_declaration` (is this value valid, and the
message the build would give), `check_support` (browser support for the project's browserslist), `check_contrast`,
`compile` (a module's classes, CSS, errors and warnings), `search_docs` and `list_plugins`. On a running dev server
of an app with `cssints({ devtools: true })` (`url`, default `http://localhost:5173`): `explain_class` (a class from
the DOM → its declarations, conditions, layer, tokens and the call that made it), `module_styles` (a file's calls and
their CSS) and `dev_errors` (the build errors Vite has now). In a headless Chromium (playwright-core):
`inspect_element` (a CSS selector → the element's classes by call, the winner per property, what it overrides, ✓/✗
against the computed style) and `why_property` (why one property has its value), with `hover`, `focus`, `width` and
`height`. Without it, the build is the check: run the dev server or `vite build` and read the message.

## Setup

```ts
// vite.config.ts
import cssints, { cssTarget, targets } from "cssints/vite";

export default {
  plugins: [cssints()], // any order beside React, Solid, ... plugins
  css: { transformer: "lightningcss", lightningcss: { targets }, devSourcemap: true },
  build: { cssMinify: "lightningcss", cssTarget },
};
```

- The entry imports `"virtual:cssints.css"` once. `tsconfig.json` needs `"types": ["vite/client"]`.
- `targets` and `cssTarget` come from the browserslist (`BROWSERSLIST`, else `package.json` / `.browserslistrc`, else
  `defaults`), read from `process.cwd()`: run Vite from the app's folder. Support warnings read the config of Vite's
  `root`, and each is said at the `css.*` call that made it, once per file per build (in dev, again after an edit).
- `devSourcemap: true` maps each class rule in Chrome's Styles pane to the call that made it; in a build,
  `build: { sourcemap: true }` (or `"hidden"`) maps the sheet asset too (bundle analysers split its bytes by module).

## The import attribute

```ts
import { cx } from "cssints"; // runtime: the only member without the attribute
import { cn, cv, hover, media, p } from "cssints" with { type: "cssints" }; // build time
import * as css from "cssints" with { type: "cssints" }; // the same, as a namespace
import { stack } from "./stack.ts" with { type: "cssints" }; // your own helper module, run at build time
```

- A build-time member imported without the attribute is a build error:
  `imports build-time p from "cssints" without the attribute`.
- Plugin packages are imported with the attribute too: `import { stack } from "@cssints/layout" with { type: "cssints" }`.
- `import type { Style } from "cssints"` needs no attribute.

## Arguments are build-time values

`p(n)` with `n` a prop, a parameter or state fails: `css arguments must be known at build time: n is not defined
where the call is evaluated`. The types do not catch it. Choose at runtime between styles made at build time:

```tsx
<div className={cx(base, on && p(4))} />          // a condition: cx skips falsy values
<button className={button({ size })} />            // a cv() variant
<div style={style(token.set(accent, "#dc2626"))} /> // a token set inline (static values)
<div style={{ "--accent": value }} />              // a dynamic value: a plain style prop
```

A helper module imported with the attribute may take parameters (`stack(4)`): each call is a site of its own. A call
the run does not reach (`false && p(4)`, a branch) still gets its class string.

## Properties and values

- Every property is a camelCase member (`paddingLeft`, `alignItems`); short names `p pt pr pb pl`, `m mt mr mb ml`,
  `bg`. There is no `items` or `justify`.
- A bare number is a spacing step of 0.25rem in `padding*`, `margin*`, `gap*`, `inset*`: `p(4)` is `1rem`. Elsewhere
  it is a `<number>`: `opacity(0.5)`; `width(4)` is a type error, write `width("4rem")`.
- Parts are joined by a space: `border("1px solid", accent)`, `padding("1rem 2rem")`, `margin("0", "auto")`.
- Keywords are written in their canonical case: `color("RED")` is an error that says to write `"red"`.
- `flex()` and `grid()` with no argument set `display` and chain container properties without the prefix:
  `flex().direction("column").alignItems("center").gap(2)`. With an argument they are the shorthand
  (`flex("1")`, a plain style that does not chain). Item properties (`flexGrow`, `alignSelf`) are plain members.
- CSS functions are calls: `calc(t.space.md, "*", 2)`, `clamp("1rem", "2vw", "2rem")`, `colorMix("in oklab", a, "black 15%")`,
  `linearGradient("to right", [a, "25%"], "blue")`. Clashing names end in `Fn`: `colorFn`, `translateFn`, `attrFn`.
- `firstThatWorks("100dvh", "100vh")` is a value with fallbacks in one class.
- `keyframes({ from: opacity(0), to: opacity(1) })` returns a name for `animation(fade, "200ms")`.

## Merging: cn, cx, cv

- `cn(...)` merges at build time into one string; the later of one property wins (`cn(p(4), p(2))` is `p(2)`). A
  longhand beats its shorthand whatever the order. Two properties that overlap without one containing the other
  (`borderTop` and `borderColor`, `marginLeft` and `marginInline`) are a build error: set one, or the longhands.
- `cx(...)` joins strings at runtime (skips falsy values, flattens arrays; no clsx objects). It sees no conflicts.
- `cv({ base, variants, defaultVariants, compoundVariants })` is the function you call; props are typed. A variant
  wins over the base, a compound (`{ size: "lg", tone: "loud", class: p(6) }`) over both. Values are `css.*` styles,
  never CSS strings.

```ts
const button = cv({
  base: cn(p(2), fontSize("1rem")),
  variants: { size: { sm: p(1), lg: p(4) }, disabled: { true: opacity(0.5) } },
  defaultVariants: { size: "sm" },
});
button({ size: "lg", disabled: true });
```

## Conditions and layers

Conditions are wrappers that nest: `hover(bg("#eee"))`, `media("(width >= 40rem)")(p(4))`, `md(hover(...))`.

- Pseudo-classes: `hover`, `focus`, `focusVisible`, `active`, `disabled` and the other standard ones without arguments.
- `media(q)`, `container("sidebar (width < 30rem)")`, `supports("(display: grid)")`; queries are checked, and a range
  needs parentheses: `(width >= 40rem)`, not `min-width > 40rem`. Bind them once: `const md = media("(width >= 40rem)")`.
- `attr("aria-current", "page")(color("blue"))`; `attr(name)` is presence; `op` is `=`, `~=`, `|=`, `^=`, `$=`, `*=`.
- Parent state: `group()` (or `group("card")`) marks the ancestor, `within(hover, "card")(...)` reads it.
- Layer = number of conditions: none `_.a`, one `_.b`, up to four (`_.e`); a fifth is an error. More conditions win.
  In one layer the sheet orders rules (pseudo-classes by their usual order, queries by min-width, `attr()` after
  pseudo-classes), not your argument order.
- `global(selector, ...styles)` is a rule with no class (a reset): in `_.k`, below every class. It takes `media()`,
  `container()` and `supports()`, not `hover` (put the state in the selector).
- `layers("app", "author", "viewer")` declares top-level layers after the engine's; `{ before: true }` before them.
- No pseudo-elements and no `:has()` in 0.1.

A condition wraps declarations. A plugin member that is only a kernel's marker class (`pretty()`, `balance()`,
`frame()` with no method, `group()`) cannot go under a condition: `:hover wraps _balance-prettyCore, the marker of
kernel balance.prettyCore, with no declaration of its own`. Put the member outside, and the condition around one of
its methods (`cn(skeleton(), hover(skeleton().highlight("white")))`) or a plain property.

## Tokens, themes, contrast

```ts
const t = createTokens({
  color: { $type: "color", bg: { $value: "#ffffff" }, fg: { $value: "#111827" } },
  space: { $type: "dimension", md: { $value: "1rem" } },
});
createGlobalTheme(t, media("(prefers-color-scheme: dark)"), {
  color: { bg: "#0b0b0f", fg: "#f3f4f6" },
});
createGlobalTheme(t, ".brand", { color: { fg: "#7c2d12" } });
check.contrast(t.color.fg, t.color.bg, { min: 4.5 }); // every theme too; below min is a build error
export const card = cn(bg(t.color.bg), color(t.color.fg), p(t.space.md));
```

A token is its `var(--name)` and fits where a value of its type fits. Pass the token, not `"var(--color-bg)"` (a
warning). Single tokens: `token.color("#2563eb", "accent")` (named, settable) or `token.color("#6b7280")` (private).
DTCG JSON, Figma exports, references `{color.accent}`, derived values and layers of themes:
[references/tokens.md](references/tokens.md).

## Plugin packages: which one

Import them with the attribute, except `@cssints/tokens` and `@cssints/ramp` (plain data for `createTokens`). A
member returns a class string (or a value) that goes into `cn()`/`cx()`. Details and gotchas:
[references/plugins.md](references/plugins.md).

| Need                                        | Package                                                      |
| ------------------------------------------- | ------------------------------------------------------------ |
| Stacks, clusters, sidebars, auto grids      | `@cssints/layout`: `stack()`, `cluster()`, `sidebar()`, ...  |
| A length that grows with the viewport       | `@cssints/fluid`: `fontSize(fluid("1rem", "1.5rem"))`        |
| Web fonts with a metric-matched fallback    | `@cssints/fonts`: `font(family, { provider })`               |
| A CSS reset below every style               | `@cssints/reset`: `reset({ media?, prose? })`                |
| Ready-made tokens (Open Props, Radix, ...)  | `@cssints/tokens/<set>`: data for `createTokens`             |
| A palette with contrast steps               | `@cssints/ramp`: `ramp(base, { mode, ... })` into tokens     |
| Icons as a mask class                       | `@cssints/icons`: `icons({ provider, ... })`                 |
| Looks per `data-mode` (app, author, viewer) | `@cssints/mise-en-mode`: `look(t, name, source, overrides)`  |
| Eased gradients                             | `@cssints/gradient`: `gradient(kind, dir, from, to, ...)`    |
| Enter and exit animations                   | `@cssints/motion`: `motion().preset("fade-in")`              |
| Animations on scroll into view              | `@cssints/reveal`: `reveal().preset("slide-in-up")`          |
| Styles while a sticky header is stuck       | `@cssints/stuck`: `sticky().top("0")`, `stuck(styles)`       |
| Balanced headings, no orphans               | `@cssints/balance`: `balance()`, `pretty()`                  |
| Squircle corners                            | `@cssints/squircle`: `squircle().radius("24px")`             |
| Masonry                                     | `@cssints/masonry`: `masonry().columns("12rem")`             |
| Image placeholders from the image's colours | `@cssints/placeholder`: `backgroundImage(placeholder(path))` |
| Loading skeletons in one phase              | `@cssints/skeleton`: `skeleton().radius("50%")`              |
| Concentric radius, parent-relative colour   | `cssints/frame`: `frame()`; `cssints/surface`: `surface()`   |

A member conflicts with the properties its kernel sets: `cn(stack(), display("grid"))` is a build error. Use the
member's methods instead.

## Build errors

Read the message: it names the property or the member, the bad value and what the grammar expected, and it points at
the call. The common ones, with fixes: [references/errors.md](references/errors.md).

## Rules of thumb

- Make every style at module level or in a helper module; choose between them at runtime with `cx`, `cv` or tokens.
- Prefer `cn()` to `cx()` when the parts are fixed: it is checked for conflicts and leaves nothing at runtime.
- Prefer a token and a theme to a second style for each colour mode.
- Write `check.contrast` for each text/background pair you use; it checks every theme.
- A support warning is not an error: the value works where the targets have it. LightningCSS lowers what it can
  (`oklch()` gets a fallback) and those values do not warn.
- Styles of a library on cssints are evaluated by the app's plugin; such a package must be a direct dependency.
