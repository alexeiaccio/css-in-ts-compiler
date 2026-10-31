# CSS in TS

The 0.x API, **alpha**: it can still change between minor versions. Setup (the Vite plugin, the stylesheet import) is in the [README](../README.md). Decisions and findings are in [wayfinder.md](wayfinder.md).

Every `ts` block here is type-checked against the workspace `cssints` types by `packages/cssints/test/docs.mjs` (`bun run test`). A line that ends in `// error` must fail to type-check. Blocks fenced `ts skip` (output) are not checked. A few blocks show a build-time error that the types cannot see; their comments give the message.

### Authoring surface (decided 2026-09-29, cssints-5dbi)

- **Import.** `with { type: "cssints" }` marks code that runs at build time: cssints itself, plugins such as icons, and your own helper modules. The plugin finds call sites by this attribute. Nothing is imported without it: the few runtime lines a module needs (`__cx` for a `cn()` with runtime arguments, `__cv` for a `cv()`) are imported by the plugin. Using a build-time member without the attribute is a build error.
- **Names.** Every mdn property as camelCase (`paddingLeft`, `alignItems`, `justifyContent`), plus a short set: `p pt pr pb pl`, `m mt mr mb ml`, `bg`. Everything is available both as named exports and through the namespace (`css.p`). There is no `items` or `justify`: they were ambiguous (`align-items` or `align-content`, `justify-content` or `justify-items`).
- **Numbers.** A bare number is a spacing step of 0.25rem in `padding*`, `margin*`, `gap*` and `inset*` (`p(4)` is `1rem`). In any other property it is a CSS `<number>`: `opacity(0.5)`, `zIndex(3)`.
- **Values.** A property takes one or more parts joined by a space. Each part is a string or a Typed OM value: `border("1px solid", accent)`, `padding(CSS.rem(1), CSS.rem(2))`, `padding("1rem 2rem")`. Parts are checked against the mdn grammar in types and again at build time. `CSS.px`, `rem`, `em`, `percent`, `number`, `CSSUnitValue` and `CSSColorValue` come from `cssints`, imported with the attribute.
- **Editor.** A bad part is marked on that part: `padding("2px", "red")` puts the error on `"red"`, with the message of the whole value. While a string is not a value yet, the editor offers the keywords of the property that the word under the cursor begins (`display("fl…")` gives `flex`, `flow`, `flow-root`; `border("1px", "so…")` gives `solid`), and all of them in an empty part (`border("1px", "")`; an empty part is an error). The offer is the keywords of the whole grammar, not only those that fit at that point, it stops once the string is valid, and functions such as `rgb(` are not offered.
- **Math.** `calc()`, `min()`, `max()`, `clamp()` and the other CSS Values 4 math functions are accepted wherever their type is, as strings (`width("calc(100% - 2rem)")`, checked by the build: `calc(1px + 2s)` is an error) and as calls that take tokens (`calc(t.space.md, "*", 2)`, see "Functions").
- **Layout contexts.** `flex()` and `grid()` without arguments set `display` and chain only their container properties. Names drop only the context prefix: `flex().direction("column").wrap("wrap").alignItems("center").justifyContent("space-between")`, `grid().templateColumns("1fr 2fr").gap(4)`. Plain styles do not chain; merge them with `cn(...)`, or write the style as a `sx()` (below), which chains every property. Item properties (`flexGrow`, `alignSelf`, `gridColumn`, `order`) are plain functions.
- **`flex(...parts)` and `grid(...parts)` are the shorthand properties.** With at least one argument the call is the `flex` (or `grid`) property, checked by its grammar like any member: `flex("1")`, `flex(1)` and `flex("1 1 0")` are `flex: 1`, `flex: 1` and `flex: 1 1 0`, `grid("auto / 1fr 1fr")` is `grid: auto / 1fr 1fr`. A bare number is a `<number>` here, not a spacing step. The result is a plain style: it sets no `display` and does not chain. The types tell the two forms apart by overload.
- **`container` is the condition.** `container("sidebar (width < 30rem)")` is a query; the `container` shorthand property is written with its longhands `containerName` and `containerType`.
- **Arguments are build-time values.** The plugin runs your module at build time and replaces each call with a class string. A literal, a `const`, a token or a value from another attributed module works. A value that exists only at runtime (a prop, state) does not: `p(n)` with `n` a parameter is a build error (`css arguments must be known at build time: n is not defined where the call is evaluated`) that points at the call, also when the local is named like a global (`open`, `name`) or like a module binding. The types do not catch it: a helper module may take parameters (below), so a `string` or `number` is a fine argument there. Choose between styles with `cn(base, on && p(4))` (see "Runtime: `cn`, `cv`"), a `cv` variant, or a token set in a `style` prop. A helper module imported with the attribute may take parameters, because each call of it is a site with its own arguments: `stack(4)` below is a build-time call in the file that makes it.
- **Top-level code runs at build time.** A call the run does not reach (`false && p(4)`, a branch not taken, a ternary arm) still gets its class string: it is evaluated after the module has loaded, like a call inside a function, so its arguments may use the bindings of the module but not the locals of the branch. A `cv(...)` at the top of a module works too: during the build it is the same function the browser gets, so `button({ size: "lg" })` at the top of a module gives its classes.

```ts
// stack.ts
import * as css from "cssints" with { type: "cssints" };

export const stack = (gap: number) => css.flex().direction("column").gap(gap);

// elsewhere: import { stack } from "./stack.ts" with { type: "cssints" }; ... className={stack(4)}
```

### Basic usage

```tsx
import { alignItems, cn, justifyContent, p } from "cssints" with { type: "cssints" };
import * as css from "cssints" with { type: "cssints" };

export const A = () => (
  <div
    className={cn(
      css.display("flex"),
      alignItems("center"),
      justifyContent("center"),
      prop && p(4),
    )}
  >
    Hello, world!
  </div>
);
// or with a layout context
export const B = () => (
  <div className={cn(css.flex().alignItems("center").justifyContent("center"), prop && css.p(4))}>
    Hello, world!
  </div>
);
```

Output for `A`:

```tsx skip
import { _cx as __cx } from "cssints";

export const A = () => (
  <div className={__cx([], "_1s47490 _1ob5z5m _cn8dee", prop && "_lwugp7")}>Hello, world!</div>
);
```

The static arguments of `cn` are one class string; `prop && p(4)` depends on a runtime value, so it stays an argument of the runtime call, and the `p(4)` in it is already its class.

```css
@layer _.k, _.a, _.b, _.c, _.d, _.e;
@layer _.a {
  ._lwugp7 {
    padding: 1rem;
  }
  ._1ob5z5m {
    align-items: center;
  }
  ._1s47490 {
    display: flex;
  }
  ._cn8dee {
    justify-content: center;
  }
}
```

- **The class names** are a hash of the declaration (and its conditions), so the same declaration gives the same class in every file.
- **One sheet.** All rules are in `virtual:cssints.css`, each once, sorted by layer, then condition, then shorthand before longhand (`border` before `border-top`, counted from Chrome's own expansion of each shorthand), then class name. So a longhand wins over a shorthand that contains it, whatever the order of the arguments: `cn(pl(2), p(4))` keeps `padding-left: 0.5rem`.
- **`cn()` keeps the later of the same property.** `cn(p(4), p(2))` is `p(2)`: the earlier declaration is dropped at build time (also for an alias: `wordWrap` is `overflowWrap`). Under different conditions both stay, because they are in different layers: `cn(md(p(6)), p(2))`. Two properties that overlap without one containing the other are a build error, because the sheet cannot order them by the arguments: `cn(borderTop("1px solid red"), borderColor("blue"))` both set `border-top-color`; so do a physical and a logical side (`marginLeft` and `marginInline`, `width` and `inlineSize`), since which physical side a logical one is depends on the writing mode. A logical property inside a physical shorthand that sets every side is contained, not overlapping: `cn(border(...), borderInline(...))` is fine, and `borderInline` wins. A style in a runtime argument is compared with the static arguments at build time, and replaces the classes it overrides while it is active (see "Runtime: `cn`, `cv`"). A declaration can be a list (`append()` in `cssints/plugin`): two of them of one property under the same conditions join their values instead of the later replacing the earlier, one beside a plain value of the property is a build error, and a list has no `firstThatWorks()` fallbacks (2026-10-31, cssints-674d).
- **A layout context** gives one string: `flex().alignItems("center")` is `"_1s47490 _1ob5z5m"`.
- **Also exported:** `css` (the namespace as a value) and `chain`, `cn`, `cv`, `firstThatWorks`, `media`, `container`, `supports`, `attr`, `within`, `group`, `global`, `token`, `style`, `createTokens`, `createGlobalTheme`, `check`. Nothing is exported for the browser: the runtime is the plugin's.

### Without runtime

```tsx
import * as css from "cssints" with { type: "cssints" };

export const C = () => (
  <div className={css.cn(css.flex().alignItems("center").justifyContent("center"), css.p(4))}>
    Hello, world!
  </div>
);
```

Output:

```tsx skip
export const C = () => <div className="_1s47490 _1ob5z5m _cn8dee _lwugp7">Hello, world!</div>;
```

- **`cn(...)`** merges styles at build time into one class string. With arguments that are all known at build time nothing is left at runtime and the runtime is not imported.

### Conditions and layers (decided 2026-09-29, cssints-kpq1)

Conditions are wrapper functions. A wrapper takes styles and returns them under its condition. Wrappers nest.

```ts
import * as css from "cssints" with { type: "cssints" };

const md = css.media("(width >= 40rem)");
const [tablet, wide] = css.media("(width >= 40rem)", "(width >= 60rem)");
const { sm, lg } = css.media({ sm: "(width >= 30rem)", lg: "(width >= 60rem)" });
const dark = css.media("(prefers-color-scheme: dark)");
const narrow = css.container("sidebar (width < 30rem)");
const grid = css.supports("(display: grid)");

export const styles = css.cn(
  css.p(2),
  md(css.pl("8ch"), css.pt(4)),
  css.hover(css.bg("#eee")),
  md(css.hover(css.bg("#ddd"))),
  prop && lg(css.p(8)),
);
export const forms = css.cn(
  dark(css.bg("#111")),
  narrow(css.m(0)),
  grid(css.display("grid")),
  tablet(css.m(1)),
  wide(css.m(2)),
  sm(css.m(3)),
);
```

- **Pseudo-classes** are ready-made wrappers named after the selector: `hover`, `focus`, `focusVisible`, `active`, `disabled`, and so on: 49 of them, from mdn-data `selectors.json` (standard pseudo-classes without arguments). Functional ones (`:nth-child()`) are not wrappers.
- **Query strings are checked** against the mdn-data grammar (`<media-query-list>`, `<container-condition>`, `<supports-condition>`), in types and at build time, like property values. A range needs parentheses: `(width > 40rem)`, not `min-width > 40rem`. `supports()` takes property declarations; a typo in the property (`(display: grdi)`) is a build error, not a type error.
- **Layer = number of conditions.** A style with no condition goes to `_.a`, one condition to `_.b`, two to `_.c`, and so on up to `_.e`. A fifth condition is a build error. A media query, a container query, `supports` and a pseudo-class each count as one. `_.k` comes first and holds kernels, global rules, token and theme rules. A theme or a plugin rule may name a **top-level** layer instead (`createGlobalTheme(t, selector, overrides, { layer: "app" })`, a plugin's `globals: [{ css, layer: "app" }]`): the layers you declare with `layers()` (see "Themes") come after the class layers, so a look beats the engine's `:root` fallbacks (Mise en Mode's `@layer app, author, viewer`), and those declared with `{ before: true }` come before `_.k`, so every style beats them (`@cssints/reset`'s `@layer reset`).
- **Order inside a layer** comes from the sorted stylesheet. Each condition has a rank: a pseudo-class by its place in the list (`link`, `visited`, `any-link`, `focus-within`, `hover`, `focus`, `focus-visible`, `active` first), a media or container query by its min-width in px (`(min-width: X)` or `(width >= X)` in px, rem or em; 0 when none can be read). Rules sort by the ranks of their chain. With equal layers, `hover(...)` beats `md(...)` by specificity.
- **Class names** hash the declaration together with its condition chain.
- **Bindings.** `const md = media(...)`, and its tuple and object forms, are build-time only: the client has `null` in their place, so keep them in the module that uses them or import them from a module with the attribute.
- Attributes and parent states are conditions too: `attr()`, `group()` and `within()` (below). Pseudo-elements (`::before`, `::placeholder`) are not part of 0.1.
- **A condition wraps declarations, not a kernel's marker** (cssints-q83n). A plugin member's kernel is global CSS keyed to its marker class, so the marker applies wherever the class is, whatever the condition. A member with declarations of its own is fine under a condition: `hover(frame().padding(2))` makes the custom property conditional, and the kernel reads it. A member with none, `pretty()` of `@cssints/balance`, `frame()` with no method, `group()`, gives the condition nothing to wrap, so it is a build error at the call, also inside `cn()`, beside other styles, nested or in a `cv()` variant: `cssints: :hover wraps _balance-prettyCore, the marker of kernel balance.prettyCore, with no declaration of its own: a kernel is global CSS keyed to its marker class and cannot be conditional, …`. Put the member outside the condition. The types do not catch it (a member is a class string there).

Output of `styles`; each form in `forms` gives one more rule in `_.b` (`dark`, `narrow` and `grid` in a block of their own before `:hover`):

```css
@layer _.a {
  ._1t8gqy5 {
    padding: 0.5rem;
  }
}
@layer _.b {
  ._16f8jrr:hover {
    background-color: #eee;
  }
  @media (width >= 40rem) {
    ._1q848uz {
      padding-top: 1rem;
    }
    ._t70zhd {
      padding-left: 8ch;
    }
  }
  @media (width >= 60rem) {
    ._1khcbr2 {
      padding: 2rem;
    }
  }
}
@layer _.c {
  @media (width >= 40rem) {
    ._ronnd2:hover {
      background-color: #ddd;
    }
  }
}
```

### Global rules, attributes and parent states (decided 2026-10-03, cssints-635k, cssints-eaob)

```ts
import * as css from "cssints" with { type: "cssints" };

const dark = css.media("(prefers-color-scheme: dark)");

// a reset: rules with no class
css.global("*, *::before, *::after", css.boxSizing("border-box"));
css.global("body", css.margin("0"), css.margin("8px")); // the later margin wins
css.global(":root", css.colorScheme("light"), dark(css.colorScheme("dark")));
css.global("a[href^='http'] > b", css.color("red"));
css.global("a[href", css.color("red")); // error: a bracket is open
css.global("a >", css.color("red")); // selector: unexpected end in "a >", expected <complex-selector-list>
css.global("a", css.hover(css.color("red"))); // global() takes media(), container() and supports() conditions, not :hover: write the state in the selector

// an attribute state, and the state of a marked ancestor
export const row = css.cn(css.group(), css.p(2));
export const link = css.cn(
  css.color("gray"),
  css.attr("aria-current", "page")(css.color("blue")),
  css.within(css.hover)(css.textDecoration("underline")),
);
export const icon = css.attr("href", ".pdf", "$=")(css.opacity(0.8));
export const nested = css.cn(
  css.group("card"),
  css.within(css.focusVisible, "card")(css.outline("2px solid")),
);
css.attr("a b"); // error: a name has no space
css.attr("a", "x", "!="); // error: not an operator
css.within(css.media("(width >= 40rem)")); // error: a media query is not a state
```

- **`css.global(selector, ...styles)`** is a rule with no class: `body{margin:0}`. The styles are member calls (`margin("0")`, `cn(...)`), checked by the grammar of each property like a class's (types at the member call, the build at the call of `global()`, with the support warnings). One property twice is the later one, as in `cn()`; two that overlap without one containing the other are the same build error. A `media()`, `container()` or `supports()` condition around a style makes an at-rule block around the rule (`@media (prefers-color-scheme: dark){:root{color-scheme:dark}}`); `hover`, `attr()` and `within()` are errors there, since a global rule has the selector for that (`a:hover`). A marker or kernel of a plugin member (`frame()`, `icons()`) is an error too: they need a class. A `firstThatWorks()` prints as in a class. The call returns nothing (`void`; the client has `undefined` in its place).
- **The selector** is a string checked at build time against `<complex-selector-list>` (css-selectors-4, mdn-data's grammar; `css-grammar/src/selector.ts` is a recogniser written over it, since the value twin drops the whitespace a selector is made of): type, `*`, `#id`, `.class`, `[attr]` with its operators, pseudo-classes and pseudo-elements, the combinators (descendant, `>`, `+`, `~`, `||`) and a list. The arguments of `:is()`, `:not()`, `:nth-child()` are balanced but not read (the grammar says `<any-value>`). `&` and a leading combinator are errors. A unknown pseudo-class is fine, as in the grammar. In the types the check is cheap: not empty, brackets and quotes pair up (about 180 instantiations a call); the build reads the rest and puts the message on the call.
- **The sheet.** A global rule is in the sheet of the module that calls it, once, in layer `_.k`: after the kernels, before the token sets and themes, in source order (by file, then call). It sets declarations on elements by selector, so it carries no hash class and no layer number; classes (`_.a` to `_.e`) are in later layers and win over it, so a reset in `_.k` never fights a component. Import a module with its `global()` calls (`import "./reset.ts"`) to have them, as for a theme. A token that a global rule reads has its `@property` rule in the same sheet.
- **`@font-face` and the other at-rules stay in CSS** (`keyframes()` and `positionTry()` are the local ones): `global()` takes a selector and declarations, and an at-rule with no selector is not one.
- **`attr(name, value?, op?)`** is a condition like `hover`: `attr("aria-current", "page")(color(...))` is `._x[aria-current="page"]{...}`. No value is presence (`[disabled]`). The value is always quoted for you (`"` and `\` escaped); `op` is `=` (default), `~=` (a word of a list), `|=`, `^=`, `$=` or `*=`. The name is an identifier (`aria-current`, `data-state`; no namespaces, no `[`, `=` or spaces), the value a string, and the case flag (`i`) is not offered. It counts as one condition (a layer, as `hover`). Among the rules of a layer it sorts after every pseudo-class, so an attribute state beats `hover` on the same property. Two `attr()` conditions that can both match and set one property sort by class name: keep them exclusive (`[aria-current=page]` and `[aria-current=false]`).
- **`group(name?)` and `within(state, name?)`** are the state of a marked ancestor. `group()` is a style that adds the fixed class `_g` (`group("card")` adds `_g-card`); it has no rule of its own, so the ancestor needs nothing else. `within(hover)(color("red"))` is `:where(._g:hover) ._x{color:red}`; `within(hover, "card")` reads the `_g-card` ancestor (any ancestor with that class, not the nearest one; use names to tell nested groups apart). A plugin member with `group: true` is the group named after its scope (`within(hover, "stuck")` reads `sticky()`, see "Plugins"). `state` is a pseudo-class wrapper or `attr(...)`, not a `media()` and not another `within()`. It counts as one condition.
- **Specificity of `within()` is one class.** `:where()` has none, so `:where(._g:hover) ._x` is as specific as `._x:hover` and `._x[aria-current="page"]`. Without it the ancestor's class would make `within(hover)` (0,3,0) beat `hover` (0,2,0) whatever the order, and a nested `md(within(hover)(...))` would fight the sheet's own order. Now the order decides, as for every condition: in a layer the ancestor's state comes first, then the pseudo-classes, then attributes, so an element's own state wins over its group's.
- **`:has()` is not offered** (`has(...)`): it is a selector on the ancestor that looks down, `:where(._x:has(...))` would be a rule on another element than the class, and `within()` plus `group()` already say what it is used for in a card. It is a pseudo-class with arguments, like `:nth-child()`.

```css
@layer _.k {
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }
  body {
    margin: 8px;
  }
  :root {
    color-scheme: light;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      color-scheme: dark;
    }
  }
  a[href^="http"] > b {
    color: red;
  }
}
@layer _.b {
  :where(._g:hover) ._72037 {
    text-decoration: underline;
  }
  ._fc1pxh[aria-current="page"] {
    color: blue;
  }
  ._pl3vkk[href$=".pdf"] {
    opacity: 0.8;
  }
}
```

### Tokens (decided 2026-09-29, cssints-o00x)

A token is a Typed OM value whose `toString()` is `var(--name)`. It fits anywhere a value of its type fits: `color(blue)`, `border("1px solid", blue)`. In math and in other CSS functions it is a part of a call: `calc(t.space.md, "*", 2)`, `var(t.space.sm, "4px")` (see "Functions").

```tsx
import * as css from "cssints" with { type: "cssints" };

const blue = css.token.color("blue", "color-primary"); // --color-primary, can be set
const gap = css.token.length("16px", { var: "gap", inherit: false });
const muted = css.token.color("#6b7280"); // --_<hash>, private

export const A = () => <div className={css.cn(css.color(blue), css.gap(gap), css.color(muted))} />;
export const B = () => <div style={css.style(css.color(blue), css.token.set(blue, "red"))} />; // { "--color-primary": "red", color: "var(--color-primary)" }
css.token.set(muted, "red"); // error: private tokens cannot be set
```

- **Types:** `token.<type>` exists for the types that `@property` `syntax` allows: `color`, `length`, `percentage`, `lengthPercentage`, `number`, `integer`, `angle`, `time`, `customIdent`, `resolution`, `url`, `image`, `transformList`, and two that it does not: `easingFunction` (`<easing-function>`) and `shadow` (a list of box shadows, `<shadow>#`). Those two have `syntax: "*"`: the browser takes any value and does not check or animate it, and the initial value is still checked by the grammar; the alternative, no `@property` rule, would lose `inherits` and the default outside `:root`. A token fits only the typed parts of its type, with two exceptions: an `integer` also fits `<number>`, and a `url` also fits `<image>` (a `url()` is an image). A `url` token in a `<url>`-only position (`markerStart`) is fine, an `image` token there is an error. A relative `url()` in a `<url>` token resolves against the page, not the stylesheet. The initial value is checked against that type's grammar, in types and at build time. A browser drops an `@property` rule whose initial value depends on a font size (`1rem`, `1em`, `1ch`), so such a value is the initial value in px at a 16px font (`1rem` is `16px`; `1ex` and `1ch` are `8px`, `1lh` is `19.2px`, the fallbacks of CSS) and the value itself goes on `:root` (`:where(*)` when the token does not inherit): `@property --gap{…initial-value:16px}` and `:root{--gap:1rem}`, so the token follows the user's font size. On `:root` an `em` is the root's font size, as `rem`; a token that does not inherit takes the `em` of each element.
- **Names:** a name (a string, or `{ var, inherit }`) gives `--name`, and the token can be set. Without a name the variable is `--_<hash>` of the file and site, and the token is private. `inherits` defaults to `true`.
- **Output:** one `@property` per token at the top of the global sheet, after the layer statement and outside the layers, once however many modules use it. Two tokens with one name are a build error at the second.

```css
@property --color-primary {
  syntax: "<color>";
  inherits: true;
  initial-value: blue;
}
```

- **`style()` and `token.set()`** are build-time and take static values; the result is a style object, custom properties first. A dynamic value is set with a plain `style={{ "--color-primary": value }}`; a typed runtime setter is not part of 0.1.
- **A token of the wrong type** is an error that names the token: `color: unexpected "1px" in "1px", expected <color> ("var(--gap)" is checked as "1px": a token stands for a value of its type)`.
- **A raw `env()` or `if()`** in a string part (`margin("env(safe-area-inset-top)", "auto")`) stands for any run of values, commas included, in any property, and the rest of the value is still checked: `margin("env(x)", "red")` is an error. Only the call's shape is checked (the conditions of an `if()`). **A raw `var(--name)`** is for a token, and a token is already its `var()`: a string that writes the `var()` of a declared token is a build warning that names the token to pass (`padding: "var(--space-sm)" is the token space.sm: pass the token itself, and css.var(token, fallback) for a fallback`). Any other custom property is left alone (a library's like `--shiki-light`, a plugin's own after namespacing like `--motion-o`, one an inline style or a script sets), and the scope's own `--_x` of a `scope()` kernel stays a string.
- Design-token constraints and math (DTCG, Ariakit Tailwind) are researched in `docs/research/design-tokens.md`.

#### Themes (decided 2026-09-29, cssints-exof)

Tokens come from an inline DTCG-shaped `const` object. Every leaf is a token (see "Tokens") reached by property access. Values are DTCG values or CSS strings checked by the grammar of their `$type`. Aliases use DTCG `{path}` references.

```tsx
import * as css from "cssints" with { type: "cssints" };

const t = css.createTokens({
  color: {
    $type: "color",
    bg: { $value: "#ffffff" },
    fg: { $value: "#111827" },
    accent: { $value: "oklch(62% 0.19 259)" },
    link: { $value: "{color.accent}" },
  },
  space: { $type: "dimension", md: { $value: "16px" } },
});

const dark = css.media("(prefers-color-scheme: dark)");
css.createGlobalTheme(t, dark, { color: { bg: "#0b0b0f", fg: "#f3f4f6" } });
css.createGlobalTheme(t, ".light", { color: { bg: "#fff" } });
css.createGlobalTheme(t.color, css.container("(width < 30rem)"), { bg: "#eee" });

css.check.contrast(t.color.fg, t.color.bg, { min: 4.5 });

export const A = () => (
  <div className={css.cn(css.bg(t.color.bg), css.color(t.color.fg), css.p(t.space.md))} />
);
css.createGlobalTheme(t, dark, { color: { nope: "red" } }); // error: no token at this path
css.createGlobalTheme(t, css.hover, { color: { bg: "red" } }); // error: a pseudo-class is not a theme condition
```

- **Types:** `$type` is inherited through groups, and a token needs one (it is not guessed from the value). It maps to a token type: `color` to `color`, `dimension` to `length`, `number` to `number`, `duration` to `time`, `fontWeight` to `number` (keywords such as `bold` become 700), `cubicBezier` to `easingFunction`, `shadow` to `shadow`. `fontFamily`, `strokeStyle` and the other composite types (`border`, `transition`, `gradient`, `typography`) are an error. A value is a CSS string of the type's grammar, or the DTCG form: `{ colorSpace, components, alpha? }`, `{ value, unit }` (`px` or `rem`, `ms` or `s`), a number, `[x1, y1, x2, y2]` (`cubic-bezier(x1, y1, x2, y2)`), `{ color, offsetX, offsetY, blur, spread, inset? }` or an array of them (the parts are DTCG values or CSS strings, without references). The initial value follows the rule of "Tokens": `{ value: 1, unit: "rem" }` is `initial-value:16px` and `:root{--space-md:1rem}`.
- **A leaf may be its value:** when the group's `$type` is in scope, a token is the value itself, as a theme's overrides take it — `color: { $type: "color", bg: "#fff", link: "{color.accent}" }`. A string is a value of the group's type, an alias `{path}` included, and a number is one for `number` and `fontWeight`; anything else stays `{ $value }` as in DTCG: a DTCG object (`{ colorSpace, components }`, `{ value, unit }`, a shadow), and a token with its own `$type`, `$description` or `$extensions`. A value with no `$type` in its group is an error, in the types and at build time (a type is not guessed from the value). The same tokens, spelled both ways:

```ts
import * as css from "cssints" with { type: "cssints" };

const short = css.createTokens({
  color: { $type: "color", bg: "#fff", edge: "oklch(80% 0.02 259)" },
  space: { $type: "dimension", sm: "4px", md: "8px" },
  hue: { $type: "number", accent: 345 },
});
const long = css.createTokens({
  color: {
    $type: "color",
    bg: { $value: "#fff" },
    edge: { $value: "oklch(80% 0.02 259)" },
  },
  space: { $type: "dimension", sm: { $value: "4px" }, md: { $value: { value: 8, unit: "px" } } },
  hue: { $type: "number", accent: { $value: 345 } },
});
css.padding(short.space.md, long.space.md);
css.createTokens({ color: { bg: "#fff" } }); // error: no $type in scope
```

- **Names:** the variable name is the kebab-case path (`--color-bg`). A second argument to `createTokens` maps a path (an array of names) to a name, or to `{ var, inherit }`.

- **Support warnings** (cssints-tuyw): a token value goes through the same support check as a property value, since it reaches the same browsers: the initial value of `token.<type>()` and of a `createTokens()` leaf, an override of `createGlobalTheme()` (its references replaced by their literals) and a `token.set()` value. It is checked as a value of a property that takes its type (`color` for a colour, `width` for a length, `transform` for a transform list; `custom-ident` and `resolution` have none), so `oklch()` warns for a target without it, like `color: oklch(...)`. A warning is given once per token (or theme value) and BCD feature per build, and a dev server gives it again after each edit, as for properties. It names the token path and, for a theme, the theme: `createTokens(): color.accent value: "oklch()" in "oklch(0.62 0.19 259)" is not supported by chrome 109 (css.types.color.oklch)`, `createGlobalTheme(): color.accent value in .light: "oklch()" in ...`, `token.color() initial value of --name: ...`, `token.set() value of --name: ...`. An alias has the same warning for its own token, since its `@property` rule holds the same literal. A value that goes into the sheet gets no warning when a fallback below handles it for the targets (the bullet "No warning for what LightningCSS lowers" below says what LightningCSS lowers); an inline `token.set()` value never goes through LightningCSS and keeps the warning, as does a value LightningCSS cannot lower (`color-mix()` over a token in a class).
- **Fallbacks for older targets** (cssints-33pa): a browser that cannot parse the initial value of an `@property` rule (`oklch()` in Chrome 109) drops the rule, and the token has no value at all. When some target lacks a value, the engine writes it for that target (transforming `--x:value` through LightningCSS with the lacking targets and taking the first declaration, `#db4aa7` for `oklch(0.637 0.203 345)`) and nothing changes for a target set that has it, byte for byte:
  - **A plain token** (`token.color("oklch(0.637 0.203 345)", "accent")`, a `createTokens()` leaf): `@property --accent{…initial-value:#db4aa7}` and `:root{--accent:oklch(0.637 0.203 345)}`, which LightningCSS lowers like any custom property (`--accent:#db4aa7`, then the wide-gamut `lab()` under `@supports (color: lab(0% 0 0))`). A browser that parses the value gets the wide one, so a modern browser reads the same colour as before, written as `lab()` (`:where(*)` stands for `:root` when the token does not inherit).
  - **A derived token or a theme value that holds `var()`** (`oklch(0.637 0.203 {hue.accent})`, `color-mix()` over a token, `{path}` references): LightningCSS cannot lower a value with `var()`. Its default is the lowered literal (the references replaced by the values the tokens start with) and the live value comes after it under `@supports` of the literal itself, the feature the value needs and no table of features: `:root{--accent:#db4aa7}` then `@supports (color:oklch(0.637 0.203 345)){:root{--accent:oklch(0.637 0.203 var(--hue-accent))}}`. A browser that parses the literal reads the live value, so the hue slider works; one that does not keeps the default, unless the runtime of the next bullet computes the value. A theme does the same inside its own rule, `@supports (…){@media (…){:root{…}}}` or `@supports (…){.dark{…}}`, after the default of that theme. An alias (`{color.accent}` as the whole value) stays live, since it needs no feature of its own, and reads the default of its target. A theme that sets a token a derived token depends on declares that derived token again (live, as above), and an older browser keeps the default of the derived token there.
  - The support warning for those values is gone: the fallback handles it. A token value that LightningCSS leaves alone keeps its warning and its single declaration, as today.
  - Checked in Chromium 109 (`apps/csssky/test/old-browser.mjs`: Mu pink in real colours, light and dark, before the runtime of the next bullet moves anything) and Chrome 154 (the colours stay `oklch()` and follow the slider). The cost on csssky is one more `:root` declaration per token and one `@supports` rule per derived value: 27.97 kB to 29.58 kB of CSS with the default targets.
- **Derived tokens in older browsers: a runtime** (cssints-i9xo). Where a target cannot parse a derived colour (`oklch(0.637 0.203 var(--hue-accent))`, `lab(from color(from var(--color-accent) srgb-linear …) …)`), the slider would do nothing. The engine then ships a small browser module, `cssints/derived`, that computes the live values in JavaScript. Tokens are not members, so this is not a plugin you import: the engine registers the runtime itself when a derived colour needs it, and delivers it the way it delivers a plugin's runtime (`virtual:cssints/runtime/derived`, empty, `export {};`, unless a browserslist target lacks a feature the literals need and has `@property`; the same `needed()` decision). The client modules that use such a token import it. With targets that parse every value nothing is written or shipped: csssky built for `chrome 154` is byte-identical to a build without the runtime.
  - **The data** is one custom property on `:root` in layer `_.k` (`--_derived`, JSON in a string) with only what the sheet uses: `p`, the literals a browser must parse for the runtime to stay idle (the same literals as the `@supports` tests); `b`, the template of each derived colour of the default theme (`oklch(0.637 0.203 var(--hue-accent))`); `t`, per theme in sheet order, its condition (a selector, or `@media (…)`) and the templates it sets, `0` for a token it sets to a literal. A token that a theme overrides with a plain `{path}` alias stays live and is released by the runtime.
  - **The runtime** does nothing without a `document`, and nothing when the browser parses every `p` (Chrome 154 gets the same CSS as an old one and writes nothing on `<html>`). Otherwise it picks the themes that apply to `<html>` (`matches()` of the selector, `matchMedia()` of the condition), evaluates the templates over the computed values of the inputs (`--hue-accent` and any other token a template reads; the runtime's own results are used as they are, not read back), and writes the results as inline custom properties on `<html>`, as `rgb()`. It runs again on any attribute change of `<html>` (class, style: the slider, the theme classes) and when a theme's media query changes (`prefers-color-scheme`), and once the stylesheet has loaded if it was not there at the start. It reads every input before the first write, so one input costs one style recalculation. A token it cannot compute at the moment (an input is missing) keeps its static default.
  - **The subset** is hex, `rgb()`/`rgba()`, `oklch()`, `oklab()`, `lab()`, `color(srgb | srgb-linear …)`, `color-mix()` in `srgb`, `srgb-linear`, `oklab` or `lab` (shares that add up to 100%), the names `black`, `white` and `transparent`; relative colour (`from`) with the channel keywords, numbers, percentages, `deg`, `+ - * /`, parentheses, `calc()`, `clamp()`, `min()`, `max()` and `var()`. A colour outside sRGB is clipped to it (an old browser has no wider gamut). Anything else (`light-dark()`, `hsl()`, a polar `color-mix()`, a wide-gamut `color()`, another unit), a derived token that is not a colour, one that does not inherit, and a value in a `container()` theme stays at its static default, and the build warns, naming the token and the target: `tf.color.mixed: "color-mix(in oklch, …)" stays at its static default in chrome 109: the runtime for derived tokens does not evaluate "oklch"`. The themes it reads are those of `<html>` (`:root`, a selector that matches it, a media query), not of an element inside the page. A template should read plain tokens and derived tokens, not an alias of a derived token (it would be read one update late).
  - **Cost.** `cssints/derived` is 7.2 kB minified, 3.1 kB gzipped; csssky's CSS grows by the data (29.6 kB to 31.4 kB with the default targets, about 0.6 kB gzipped). The colours of the default theme take 10 µs of JavaScript per input; in Chromium 109 a slider input costs 1.2 ms against 0.6 ms for the style recalculation alone, which the browser pays on any change of the hue. Checked in `apps/csssky/test/old-browser.mjs`: in Chromium 109 the four accent steps, the label's onAccent and the page background at hues 0, ±90 and ±180 are within 1/255 of the pixels Chrome 154 paints, in light, dim, dark and system under a light and a dark scheme, and the system scheme changing recomputes them; `packages/cssints/test/derived-runtime.mjs` holds the evaluator to culori (the maths of `check.contrast`) on the csssky templates and random inputs.
- **Themes:** `createGlobalTheme(tokens, condition | selector, overrides, { layer?, scope? }?)` re-declares the overridden tokens under a `media()` condition on `:root`, or under a selector. Under `container()` it declares them on `:where(*)`, since `:root` has no container above it and would never match. `layer` names a top-level layer for the rule (`{ layer: "app" }` puts an app look in `@layer app`, above the engine's `:root` fallbacks) that `layers()` has declared, in this module or one it imports: an undeclared layer is a build error at the call. Without `layer` the rule is in `_.k`. `scope` (with a selector) confines the rule to a subtree, `@scope (article.post) { [data-mode="hero"] { ... } }`, so a foreign look cannot repaint the rest of the page; it is a selector, checked by the build like the one of `global()` and balanced in the types, and it is an error with a condition (`:root` is not inside a scope). Overrides are checked against the token types, and an unknown path is a type error; they take the same values as tokens, and `tokens` may be a group (`t.color`). `supports()` and pseudo-classes are not themes: `createGlobalTheme(t, hover, …)` is a type error, and a build error when the types are bypassed. A module that uses a token gets the theme rules that set it, with the `@property` rules of the tokens it uses and of those their values refer to, not of every token the theme sets.
- **`layers(...names)`** declares top-level layers in order. The sheet prints `@layer app, author, viewer;` once, right after the engine's `@layer _.k, _.a, …;`, however many modules declare it (a module's sheet has the statements of its own `layers()` calls and of the layers it uses). The same names again are fine; names in another order (`layers("viewer", "app")` after the one above), or sharing layers without one statement holding the other (`layers("viewer", "base")`), are a build error at the second call, since the sheet could not say which comes first. A statement that holds another is printed first; statements that share nothing are printed longest first. A name is letters, digits, `_` and `-`.
- **`layers(...names, { before: true })`** declares them before the engine's: the sheet prints `@layer reset;` above `@layer _.k, _.a, …;`, so `_.k`, the classes and every layer declared after rank above what is in them (a reset that any style beats). The rules above hold among the statements before, in the same order; a layer declared both before and after (`layers("reset")` once `layers("reset", { before: true })` has run, or the other way) is a build error at the second call. A stylesheet's own layer goes between a reset and cssints with `layers("reset", "base", { before: true })`.

```ts
import * as css from "cssints" with { type: "cssints" };

css.layers("app", "author", "viewer");
const t = css.createTokens({ color: { $type: "color", bg: { $value: "#fff" } } });
css.createGlobalTheme(t, '[data-mode="dark"]', { color: { bg: "#000" } }, { layer: "viewer" });
css.createGlobalTheme(
  t,
  '[data-mode="hero"]',
  { color: { bg: "#123" } },
  { layer: "author", scope: "article.post" },
);
css.createGlobalTheme(t, ".x", { color: { bg: "#000" } }, { scope: "a[href" }); // error: unbalanced brackets in the scope
css.layers(); // error: a declaration has a name
css.layers("reset", { before: true }); // @layer reset; before @layer _.k, _.a, …;
```

- **The value in the type:** a token carries the value of its definition as text, inferred: `t.color.base` is `Token<"color", true, "#545434">` on hover. An alias carries its reference (`"{color.base}"`: a theme can change the base), a number or `{ value, unit }` its CSS text (`"150ms"`), a DTCG colour object and anything from a JSON import (`$value` widens to `string` there) `string`. It is the `:root` definition, not what a theme shows. A `Token<K, S, V>` fits wherever a `Token<K>` does.
- **A key that starts with a digit** is read as `_` and the key: `"2xs"` in the data is `t.space._2xs` in code, and the overrides of a theme follow the set (`{ space: { _2xs: "3px" } }`). The variable (`--space-2xs`), references (`{space.2xs}`) and the DTCG data keep the key; `2xs` and `_2xs` in one group is a build error.
- **Aliases:** `@property initial-value` must be computationally independent, so it gets the flattened literal. The alias stays live as a `var()` declaration on `:root`. A theme re-declares the aliases that depend on an overridden token (all of them, through chains), since `var()` is substituted where it is declared. A `{path}` must name a token of the same `$type`; a cycle is an error.
- **Derived tokens** (cssints-5y5a): a `$value` may refer to other tokens inside a CSS value, `"color-mix(in oklab, {color.accent}, black 15%)"` or `"calc({space.md} * 2)"`. It stays live CSS: the `@property` initial value takes the targets' literals, the `:root` declaration keeps `var(--color-accent)`, and a theme that sets `color.accent` declares every token derived from it again (through chains), so a hover colour follows the brand colour. A derived token needs its `$type` (or its group's); in the editor its value is checked as the type's grammar with each `{path}` in place as a value of that token's type, so a missing path or a value that is not of the type is a type error.

```ts
import * as css from "cssints" with { type: "cssints" };

export const t = css.createTokens({
  color: {
    $type: "color",
    accent: { $value: "#2563eb" },
    hover: { $value: "color-mix(in oklab, {color.accent}, black 15%)" },
  },
});
css.createGlobalTheme(t, ".brand", { color: { accent: "#db2777" } }); // hover follows
```

- **References in overrides** (cssints-q6l0): an override takes `{path}` too, as the whole value (`"{radius.sm}"`) or inside a CSS value (`"oklch(0.7 0.1 {hue.accent})"`). The theme declares `var(--target)`, so the value is live; tokens derived from the overridden token are declared again as above. Order does not matter: the declarations of one rule belong to one element, and a `var()` reads that element's own value of the target, so a theme that sets `hue.accent` and a colour made of it needs no particular order. A reference to no token, a whole-value reference to a token of another type, a value that is not of the token's type with each reference replaced by its target's value (a literal at build time, a value of the target's type in the editor), and a cycle through the base tokens and the theme are errors. Paths are from the root of the tokens, so give the root (`t`) to a theme that refers to another group; the editor rejects a reference outside the group it is given.

```ts
import * as css from "cssints" with { type: "cssints" };

export const t = css.createTokens({
  hue: { $type: "number", accent: { $value: 345 } },
  radius: { $type: "dimension", sm: { $value: "4px" }, md: { $value: "8px" } },
  color: { $type: "color", accent: { $value: "oklch(0.6 0.2 {hue.accent})" } },
});
css.createGlobalTheme(t, ".square", { radius: { md: "{radius.sm}" } });
css.createGlobalTheme(t, ".dim", {
  hue: { accent: 12 },
  color: { accent: "oklch(0.7 0.1 {hue.accent})" },
});
css.createGlobalTheme(t, ".x", { radius: { md: "{hue.accent}" } }); // error: a number, not a length
```

- **JSON input:** `createTokens` takes a DTCG file imported as JSON, `import tokens from "./tokens.json" with { type: "json" }`. The editor knows the tree (`t.color.bg`, and a wrong path is a type error) but not the types, since a JSON import widens `$type` to `string`: each token is a token of any type there, and its values, references and use in a property (and in `check.contrast`) are checked at build time.
- **JSON from Figma** (cssints-ow16): the token file of a Figma tool is DTCG with a few additions, and createTokens reads what is DTCG in it:
  - **Figma's own export** (Variables view, Export modes) writes one DTCG file per mode. The default mode's file is the tokens, and the file of another mode is a theme as it is: `createGlobalTheme(t, dark, darkJson)` takes `{ $value }` leaves and skips `$type`, `$description` and `$extensions` (`com.figma.*`, the root's `com.figma.modeName`); a key that starts with a digit (`500`) is the set's `_500`. A theme declares every token of the file, the unchanged ones too. Figma writes a FLOAT variable as a `number` token (`5`), which a length property does not take: `calc(t.radius, "*", "1px")`, or `$type: "dimension"` with a `{ value, unit }` in the file. A colour is `{ colorSpace: "srgb", components, alpha, hex }`, read as `color(srgb …)`.
  - **TokensBrücke** with "DTCG 2025.10 format" is DTCG too. Its modes in `$extensions.mode` are not read: with "Split modes into separate files" each mode is a file, as above. Each file has the collection as its top-level key and refers across collections by it (`{Primitives.color.blue}`), so the files of all collections go into one createTokens: `createTokens({ ...primitives, ...semantic })`.
  - **Tokens Studio** is not read directly: its legacy format has `value` and `type` without `$`, its own types (`spacing`, `fontSizes`, `borderRadius`, `boxShadow`, …), unitless dimensions, math (`{spacing.base} * 2`) and colour modifiers in `$extensions`. Style Dictionary with `@tokens-studio/sd-transforms` resolves all of that; a format of six lines writes the result as DTCG, which createTokens takes (checked with style-dictionary 5.6 and sd-transforms 2.0; the aliases are resolved to their values, and a theme is a second build over the sets of a theme of `$themes.json`):

```js
import StyleDictionary from "style-dictionary";
import { register } from "@tokens-studio/sd-transforms";

register(StyleDictionary);
const DTCG = { fontSize: "dimension", lineHeight: "number", opacity: "number" }; // the types sd-transforms leaves
StyleDictionary.registerFormat({
  name: "cssints/dtcg",
  format: ({ dictionary }) => {
    const out = {};
    for (const t of dictionary.allTokens) {
      let group = out;
      for (const key of t.path.slice(0, -1)) group = group[key] ??= {};
      const type = t.$type ?? t.type;
      group[t.path.at(-1)] = { $type: DTCG[type] ?? type, $value: t.$value ?? t.value };
    }
    return JSON.stringify(out, null, 2);
  },
});
await new StyleDictionary({
  source: ["tokens/**/*.json"],
  preprocessors: ["tokens-studio"],
  platforms: {
    cssints: {
      transformGroup: "tokens-studio",
      files: [{ destination: "tokens.json", format: "cssints/dtcg" }],
    },
  },
}).buildAllPlatforms();
```

- **Build errors** for what would be misread: `value`/`type` without `$` (`global.Main.0 has value and type without $, the legacy format of Tokens Studio …`), `$themes` or `$metadata` in the tree, a Tokens Studio type (the error names the DTCG type: `"spacing" is a Tokens Studio type: its DTCG type is "dimension"`), math outside `calc()` (`write "calc({spacing.base} * 2)"`), a Tokens Studio colour modifier (`$extensions["studio.tokens"].modify`), a Figma boolean (`com.figma.type: "boolean"` on a number), and more than one mode in `$extensions` (`mode`, or `modes` of `com.figma`). `string`, `boolean`, `fontFamily` and the composite types are errors as before (no token type), so leave them out of the file (Figma: a collection without them; TokensBrücke: no styles). Samples of each tool are in `packages/cssints/test/fixtures/importers`.
- **The sheet:** token sets and themes are rules of layer `_.k`, after the global rules of `css.global()` and before the class layers. They set custom properties only, and no class does, so the layer order never decides between them; `_.k` is the lowest layer, so your own unlayered `--color-bg` rule wins over a theme. The `:root` rules of aliases come first, then themes under a condition, then themes under a selector, each in source order, so a selector theme beats a condition theme on the same element. A module has the rules of the tokens it uses, from wherever they were made, and of the tokens those are made of (the references of a derived token or of a theme value, through chains: a `hue.accent` that no class uses still gets its `@property` rule), and its own; import a theme module (`import "./theme.ts"`) to have all of it.
- **`css.check.contrast(fg, bg, { min })`** computes the WCAG 2.x contrast ratio (`min` from 1 to 21) for the default values and for every theme that sets either token or one they are aliases of. It reads themes one at a time, except those of one selector: themes with the same selector (and scope) meet on one element, so they are read together, laid over each other in the order of the cascade (no layer first, then the declared layers in order, then source order). A viewer look that sets only the text colour is checked on the background of the app look under the same selector. Themes of different selectors, or a selector and a condition, are still read one at a time, not in their combinations. A value that is set at run time (a slider that sets `--hue-accent` on `<html>`) belongs to no theme and is checked at its default only; a theme per value would put each rule in the sheet and hold it to the thresholds of the other themes, since a check applies to every theme that touches its tokens, so measure a range outside the build (apps/csssky `test/contrast.mjs`). A ratio below `min` is a build error that names the theme and both resolved values (the ratio is cut, not rounded: 4.499 is 4.49). A value the check cannot evaluate (`color-mix()`, a relative colour, `light-dark()`, `currentColor`, a system colour) or a translucent one is a warning that names the token; a build says it once, and a dev server says it again after each edit. A derived token (or a theme value with `{path}` references) is read in each theme by putting that theme's values, or the defaults, in place of its references, through a chain of derived tokens: a ratio when the result is a colour (`oklch(0.6 0.2 {hue.accent})`), a warning that names the theme when it is not (`color-mix()` over another token), and a theme that sets any token a checked colour depends on, directly, through an alias or through references, is checked. The colour library (culori, `culori/fn`: 27 kB minified, 9 kB gzipped) is build-only and never ships. The check runs when its module has run, and again at the end of a build over the themes of every module.

Output (the `@property` rules of `space-md` and `color-fg` are not shown):

```css
@layer _.k, _.a, _.b, _.c, _.d, _.e;
@property --color-accent {
  syntax: "<color>";
  inherits: true;
  initial-value: oklch(62% 0.19 259);
}
@property --color-bg {
  syntax: "<color>";
  inherits: true;
  initial-value: #ffffff;
}
@property --color-link {
  syntax: "<color>";
  inherits: true;
  initial-value: oklch(62% 0.19 259);
}
@layer _.k {
  :root {
    --color-link: var(--color-accent);
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --color-bg: #0b0b0f;
      --color-fg: #f3f4f6;
    }
  }
  @container (width < 30rem) {
    :where(*) {
      --color-bg: #eee;
    }
  }
  .light {
    --color-bg: #fff;
  }
}
```

Derived tokens (`contrastColor()`, `derive()`), JSON input with generated types and slot variants are not part of 0.1.

### Fallbacks: `firstThatWorks` (decided 2026-10-01, cssints-bogz)

`firstThatWorks(wanted, ...fallbacks)` is a part of any property: the value you want comes first, then what to use where it fails.

```ts
import { border, color, firstThatWorks, minHeight, token } from "cssints" with { type: "cssints" };

const brand = token.color("#0057b8", "brand");

export const a = minHeight(firstThatWorks("100dvh", "100vh"));
export const b = color(firstThatWorks("oklch(55% 0.18 250)", brand));
export const c = border("1px", firstThatWorks("solid", "dashed"), "red");
export const d = minHeight(firstThatWorks("100dvh", "100vhh")); // error: the fallback is not a min-height
```

- **One class.** `a` is one class, `.x { min-height: 100vh; min-height: 100dvh }`: the declarations in CSS order, the wanted value last, so `cn()` and the sheet treat it as one rule. With three values the last is printed first.
- **Checked per value.** Every value is checked for the property, in types and at build time, as the whole declaration with that value in its place. The type error is on the `firstThatWorks(...)` part and the message names the bad value.
- **Values** are strings and Typed OM values (tokens); `var()` is fine. A number is not (`p(4)` has no fallback), nor is a style.
- **In several parts** the whole declaration is repeated with each value (`c`: `border: 1px dashed red; border: 1px solid red`). One `firstThatWorks` per declaration; two are an error.
- **Support warnings.** A target that lacks the wanted value gets no warning if it supports a fallback. The warning stays, for the targets that lack every value, and says so: `color: "color-mix()" in "color-mix(in srgb, var(--brand), blue)" is not supported by chrome 100 (css.types.color.color-mix), and no fallback of its firstThatWorks covers them` (a literal `oklch()` would not warn at all: LightningCSS lowers it).
- **Minify.** Vite's CSS minify decides which of the declarations LightningCSS may drop, from `build.cssTarget` (set it to `cssTarget` of `cssints/vite`, see the README), not from `css.lightningcss.targets`. With the targets it keeps `min-height: 100vh; min-height: 100dvh` where a target lacks `dvh` and merges them where none does; with `cssTarget: false` it always merges.
- **Limits.** It is not a Typed OM value: a typed position (`token.length(firstThatWorks(...))`) rejects it, and so does `style()` (an inline style holds one value per property). `const f = firstThatWorks(...)` is build-time only, like a condition: the client has `null`. The fallback is for values a browser drops; `@supports` is for styles that are not one declaration.

### Local at-rules: `keyframes` and `positionTry` (decided 2026-10-02, cssints-lirm)

`keyframes()` and `positionTry()` define an at-rule next to the styles that use it and return its name, a typed value that fits where the grammar wants a name.

```ts
import {
  animation,
  cn,
  hover,
  keyframes,
  margin,
  opacity,
  positionTry,
  positionTryFallbacks,
  top,
  transform,
} from "cssints" with { type: "cssints" };

export const fade = keyframes({ from: opacity(0), to: opacity(1) });
export const wiggle = keyframes({
  from: transform("rotate(0deg)"),
  "50%": cn(transform("rotate(8deg)"), opacity(0.5)),
  to: transform("rotate(0deg)"),
});
export const above = positionTry(cn(top("anchor(bottom)"), margin(2)));

export const a = animation(fade, "200ms", "ease-out");
export const b = hover(animation(wiggle, "1s", "infinite"));
export const c = positionTryFallbacks(above, "flip-inline");
export const d = keyframes({ from: opacity("lots") }); // error: opacity: unexpected "lots"
export const e = keyframes({ halfway: opacity(0) }); // error: a step is from, to or a percentage
export const f = positionTryFallbacks(fade); // error: a keyframes name is not a dashed ident
```

- **Steps are styles.** A step of `keyframes()` and the argument of `positionTry()` are made of member calls (`opacity(0)`, `cn(...)`), as `cn()` and `cv()` take them: they are checked by the grammar of each property, at the member call in the types and at the call of `keyframes()` at build time, with the support warnings of a class. A step is `from`, `to` or one percentage (`"50%"`, 0 to 100); a list (`"0%, 100%"`) is not supported. A condition, a `firstThatWorks()` or a member with a marker class (a plugin's) inside a step is a build error, since an at-rule step has none.
- **`positionTry()` takes what `@position-try` takes:** inset, margin and sizing properties, `align-self`, `justify-self`, `place-self`, `position-anchor` and `position-area` (CSS Anchor Positioning §6.4). Any other property (`positionTry(cn(padding(2)))`) is a build error at the call; the types cannot see which property a style holds. `position-try` is a property as well, so with value parts `positionTry("flip-block")` is still that shorthand; one style is the rule.
- **The name** is a hash of the rule's content: `kf-1a2b3c4d` for keyframes, `--pt-1a2b3c4d` for `@position-try`, so two blocks with the same steps are one name and one rule, from any module. It is a Typed OM value: `CSSStyleValue<"custom-ident">` for keyframes (`animation`, `animationName`), `<dashed-ident>` for `positionTry()` (`positionTryFallbacks`); it fits nowhere else. A `keyframes()` in a client module ships as its name string.
- **Where the rule goes.** The name carries its rule; a style that holds the name (`animation(fade, ...)`, inside `cn()`, a condition, a `cv()` or a plugin's kernel written as styles) puts the rule in the sheet of its module, once however many use it. A rule that nothing uses is in no sheet, so there is nothing to shake: a module that imports a helper but does not use a name has no rule. It is a kernel (see "Plugins"), keyed by the content, in layer `_.k`, with `requires` set to `css.at-rules.keyframes` or `css.at-rules.position-try`: a target that lacks it gets a support warning, never an error.
- **The layer.** A name is global and a rule of a layer wins over another of the same name by layer order (css-cascade-5, css-anchor-position-1 §6.4: the same cascade as `@keyframes`). Names are hashes of the content, so no two rules of different content share one and the order never decides; the rules go in `_.k`, below every class layer, and the layer statement stays as it is.
- **In a helper module.** `export const fade = keyframes(...)` in a module imported with the attribute (like a token) is a definition site: it ships nothing, and the components that import it and use it carry the rule.
- **Limits.** The name is not a part of `firstThatWorks()` or `style()` (an inline style has no sheet): both reject it with a message. A value of `custom-ident` kind is accepted by the grammar as a keyframes name whichever way it was made, so a typo in a hand-written `animationName("fadee")` is not caught.

```css
@layer _.k {
  @keyframes kf-0e6af964 {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  @position-try --pt-23965b44 {
    top: anchor(bottom);
    margin: 0.5rem;
  }
}
@layer _.a {
  ._44ecsn {
    animation: kf-0e6af964 200ms ease-out;
  }
}
```

### `sx()`: one style without `cn()` (decided 2026-10-25, cssints-ysyp)

`sx()` builds one style by chaining properties. Every property is a method, the methods return the chain, and the
build merges the declarations as `cn()` does. `cn()` stays the tool for merging runtime values, and for `cv()` variants.

```ts
import { sx, cn, hover } from "cssints" with { type: "cssints" };

export const card = sx().flex().flexDirection("column").gap(2).p(4).bg("white");
export const row = sx().grid().gridTemplateColumns("1fr 2fr").gap(1);
export const box = cn(sx().p(2), hover(sx().bg("blue")));
```

`card` is `"_1s47490 _1njigwa _g2iyum _lwugp7 _1ebepn0"`: one class per declaration, one string, no `cn()`.

- **Every property is a method**, by its member name: `p`, `bg`, `paddingLeft`, `gridTemplateColumns`. `.flex()` and
  `.grid()` with no argument set `display` and keep chaining; with parts they are the `flex` and `grid` property. A
  chain does not drop a prefix the way a context does: `sx().flex().flexDirection("column")` is the property,
  where `css.flex().direction("column")` drops `flex-`.
- **A chain sets each property once: a second one is a type error.** The second method is `never`
  (`This expression is not callable. Type 'never' has no call signatures.`), so the rewrite that `cn()` allows cannot
  be written by accident. `bg` and `backgroundColor` are one property, as are `p` and `padding`, so
  `sx().bg("red").backgroundColor("blue")` and `sx().p(4).padding("1rem")` fail in either order. A second
  `.flex()` or `.grid()` is `Expected 1 arguments, but got 0`, since the no-argument form is what sets `display`.
  Write a later value with `cn()`, which keeps the later one of a property, or a longhand.
- **A shorthand and a longhand of it are different properties**, and stay legal: `sx().p(4).paddingLeft("0.5rem")`
  is both declarations, which the sheet orders (a longhand after its shorthand), exactly as in `cn()`. The types do not
  compare containment, only the property: `sx().bg("red").background("blue")` is `background-color` and
  `background`, not a duplicate.
- **A chain is a site**, like any `css.*` call: it compiles to its class string, so it works in a variable, in `cn()`,
  in a condition (`hover(sx().bg("blue"))`), and as the `base` or a variant of `cv()`. A `keyframes()` or
  `positionTry()` name in a chain carries its at-rule, as in `css.*`.
- **Not in a chain:** conditions (`hover`, `media`), other builders (`cn`, `keyframes`, `cv`) and plugin members
  (`frame()`, `surface()`, a scope's members). A build error names the method (`cssints: sx() has no .hover()`).
  Wrap the chain instead: `hover(sx().bg("blue"))`, `cn(frame(), sx().p(2))`.
- **The cost.** The chain surface is a second member list in the types, so every module that imports `cssints` pays
  about 6.7 k more instantiations (`bench/unused.ts` 46 297 → 53 029, +14.5 %). A chain costs about what the `cn()`
  form of the same declarations costs: 12 chains of five properties are 273 741 instantiations against 264 798 for the
  same 60 declarations as `cn()` calls (+3.4 %, tsc 5.9); `bench/chain.ts` guards it.

### Runtime: `cn`, `cv` (decided 2026-09-29, cssints-lo9x; `cv` without `_cv` 2026-10-07, cssints-ep2l; `cx` folded into `cn` 2026-10-11, cssints-4e9f)

- **One runtime package: `cssints` itself.** You import nothing for the browser. A module with a `cn()` that has runtime arguments, or a `cv()`/`scv()`, gets `import { _cx as __cx, _cv as __cv, _scv as __scv } from "cssints"` from the plugin (the ones it needs), and those few lines are the only code that ships. `@cssints/variants` is gone.
- **`cn(...)` is the one function that merges.** Arguments known at build time merge into one class string, as above. An argument that depends on a runtime value is joined when the code runs, and the `css.*` calls inside it are still class strings made at build time: only the choice is left.

```ts
import { bg, cn, hover, p } from "cssints" with { type: "cssints" };

export const box = (props: { on: boolean; class?: string }) =>
  cn(p(2), bg("white"), props.on && p(4), hover(bg("#eee")), props.class);
export const row = (kind: "a" | "b", items: boolean[]) =>
  cn(
    p(1),
    kind === "a" ? p(2) : bg("red"),
    items.map((x) => x && p(3)),
  );
export const bad = (n: number) => cn(p(2), p(n)); // the build refuses it: css arguments must be known at build time
```

```tsx skip
import { _cx as __cx } from "cssints";

export const box = (props) =>
  __cx([["_lwugp7", "_1t8gqy5"]], "_1t8gqy5 _1ebepn0 _16f8jrr", props.on && "_lwugp7", props.class);
```

- **What is a runtime argument.** One that needs a binding the build does not have: it names a parameter, a prop, a signal or any other local of the function or block around the call (`on && p(4)`, `cond ? a : b`, `state() && p(4)`, `props.class`, `items.map(...)`), or a string or template literal, or a call of something that is not a `css.*` member (`button({ size })`, a `cv` result: a class string at build time too). Everything else is known at build time, a module `const` too, and merges. A spread (`...list`) is judged by what it spreads. Strings, `false`, `null`, `undefined` and `0` are skipped, arrays are flattened; there are no clsx-style objects (`cond && style`). A `false`, `null` or `undefined` that is known at build time (`dev && p(4)` with a module `const dev = false`) is no style and is skipped there.
- **What the build settles.** Of two parts, static or runtime, the later one replaces the earlier one for a property it sets again under the same conditions (the same property, an alias, or a shorthand over it, as in `cv`): the plugin lists, per class, the classes it drops, and the runtime leaves them out while that class is active. So `cn(p(2), on && p(4))` gives `p-4` when `on` and `p-2` otherwise, and `cn(on && p(4), p(2))` always gives `p-2`. The sheet order never decides. Under another condition (`hover`, a media query) a class replaces nothing: `cn(p(2), on && hover(p(4)))` keeps both, as in a build-time `cn`. A longhand after a shorthand needs no drop. Two properties that overlap without one containing the other, in parts that can be active together, are a build error as above (`cssints: cn() padding-inline and padding-left overlap ...`); both arms of `cond ? a : b` count as active together.
- **Opaque strings are only appended.** `props.class`, `"legacy"` or a style held in a variable inside a runtime argument (`on && blurred`) has no declarations in the argument, so nothing is dropped for it or by it; write the call there (`on && p(4)`) to have it settled.
- **A style whose own argument is a runtime value is a build error.** `cn(p(2), p(n))` with `n` a parameter stays `css arguments must be known at build time: n is not defined where the call is evaluated`; choose between styles (`n > 1 ? p(2) : p(4)`), or use a `cv` variant or a token set in `style`.
- **The call.** `__cx(drops, ...parts)`: `drops` is a list of `[class, "classes it replaces"]`, empty when nothing conflicts; the parts are class strings, runtime values and arrays. With no static argument there is no static string: `cn(props.class)` is `__cx([], props.class)`. Nothing is imported when every argument is static.
- **`cx` is gone.** `import { cx } from "cssints"` is a build error in a module the plugin handles, with or without the attribute: `cssints: <file> imports cx from "cssints", which is gone: cn(...) takes runtime values now. Write cn(base, on && p(4)) with cn from "cssints" with { type: "cssints" }`, and a type error (the name is now the SVG property `cx`, which you write `css.cx(...)`). The fix is mechanical: add `cn` to the attributed import and write `cn(` for `cx(`. Arguments that were only joined are now merged and checked at build time, so `cx(p(4), p(2))` (both classes, the sheet decides) is `cn(p(4), p(2))` (`p(2)`).
- **`cv(config)`** takes `css.*` values, so types check them, and is the function you call: one call, no wrapper. The plugin replaces the site by a call of the small runtime (and imports it for you; `_cv` is not exported any more) with a config of class strings. The props are typed from `variants`: a name or a value that is not there is a type error, in the props and in `defaultVariants` and `compoundVariants` alike.

```ts
import { cn, cv, fontSize, opacity, p } from "cssints" with { type: "cssints" };

const button = cv({
  base: cn(p(2), fontSize("1rem")),
  variants: {
    size: { sm: p(1), lg: cn(p(4), fontSize("1.25rem")) },
    disabled: { true: opacity(0.5), false: opacity(1) },
  },
  defaultVariants: { size: "sm", disabled: false },
  compoundVariants: [{ size: "lg", disabled: true, class: opacity(0.3) }],
});

export const classes = () => button({ size: "lg" }); // "_lwugp7 _z6yj9k _1t0bw2x"
export const off = () => button({ size: "lg", disabled: true });
export const bad = () => button({ size: "xl" }); // error: not a size
export const bad2 = cv({ base: "padding: 1rem" }); // error: a base is a css value, not a CSS string
```

- **What ships** for `button` is `__cv({ base: "_1t8gqy5 _6tpir7", variants: { size: { sm: "_lqk467", lg: "_lwugp7 _z6yj9k" }, ... }, defaultVariants: { size: "sm", disabled: false }, ... })` with `import { _cv as __cv } from "cssints"` added to the module: class strings only. `cv()` works in a function, at the top of a module and in a library.
- **Old code.** `import { _cv } from "cssints"` is a type error (no such export) and, in a module the plugin handles, a build error at the import: `cssints: <file> imports _cv from "cssints", which is gone: cv({ ... }) is the function now. Write const button = cv({ base, variants }) ...`. It does not keep working for a release: `_cv(cv(...))` would hand a function to the runtime, and a shim would keep two spellings of one thing. The fix is mechanical: drop `_cv(` and its closing bracket. A library built the old way fails with the same error, naming its file.
- **Boolean variants.** A variant whose keys are `true` and `false` (or only one of them) takes a boolean: `button({ disabled: true })`, and a default is a boolean too. `false` is a value, not a missing one: `button({ disabled: false })` selects the `false` key even when the default is `true`. `undefined` is the default.
- **`compoundVariants`** as in cva: each entry names values (any of the variants, a boolean for a boolean one) and the style that is added when all of them are active. The key is `class`, as in cva, since what the entry adds is a class (a `cn` or `style()` key would suggest an inline style, and cssints has `style()` for that; `css` is the namespace). Its value is a `css.*` style like the others, not a string. The values of an entry are one value each, not a list of values.
- **Values** of `base` and of each variant are one property, `cn(...)`, or a `flex()`/`grid()` chain. A CSS string is a build error that shows the new form: `cv() base must be a css.* value (cn(...), a flex() chain or one property), got "padding: 1rem". CSS strings are gone: write cn(p(4), fontSize("1rem"))`.

- **The variant wins.** The function joins the base and the variants that are active at runtime, so the build compares them. Under one condition, a variant that sets what the base sets (the same property, an alias, or a shorthand over a base longhand: `pl(2)` in the base, `p(4)` in the variant) replaces it: the base class is dropped from the string while that value is active, which the runtime does from a `drops` entry in the config (`drops: { size: { lg: "_77ujlx" } }`, only where there is one). Which rule comes later in the sheet does not decide. A variant longhand inside a base shorthand needs no drop, since the sheet puts a longhand after its shorthand: base `border(...)` with `active: { yes: borderBottomColor(...) }` is fine. Under different conditions both stay, as in `cn()`.
- **Overlap is an error, as in `cn()`.** A base property and a variant property that overlap without one containing the other are a build error at the `cv()` call: `cssints: cv() base and variant active.yes: border-bottom and border-color overlap without one containing the other, so the sheet cannot order them: set one of them, or the longhands` (both set `border-bottom-color`; write `borderBottomColor` in the variant). The same holds for two variants of different keys, which can be active together. Two such variants that set the same property are an error too, since nothing says which wins: `cssints: cv() variants a.x and b.x both set color and can be active together, so nothing says which wins: set it in one of them, or in the base`. Values of one key are never compared, since only one is active.
- **A compound wins over what it combines.** It is the most specific style, so under one condition it replaces what it sets again in the base and in the variant values it names (the same rule as a variant over the base): `compoundVariants: [{ size: "lg", tone: "loud", class: p(6) }]` drops the base's padding, `size.lg`'s padding and `tone.loud`'s padding while both are active, in the `compound` entry of the config (`{ when: { size: "lg", tone: "loud" }, class: "_x", drops: "_a _b" }`). The sheet order never decides. What a compound shares with other things that can be active together is compared as for variants: an overlap without containment is an error, and so is the same property in a compound and a variant of a key it does not name (it is active with any of its values), or in two compounds that can be active together (no key they both name with different values). Write the property in one of them, or in the base.

### `scv()`: slot variants (decided 2026-10-25, cssints-43rj)

`scv()` is one function whose result is the class string of each slot (`{ base, label, icon }`): slots, variants worth a
style per slot, defaults and compound variants, as in tailwind-variants. The rules are `cv()`'s, computed per slot.

```ts
import { bg, cn, color, fontSize, opacity, p, scv, width } from "cssints" with { type: "cssints" };

const button = scv({
  slots: { base: cn(p(2), color("white")), label: fontSize("1rem"), icon: width("1rem") },
  variants: {
    size: { sm: p(1), lg: { base: p(4), label: fontSize("1.25rem") } },
    tone: { quiet: color("gray"), loud: { base: color("black"), icon: color("red") } },
    disabled: { true: opacity(0.5), false: opacity(1) },
  },
  defaultVariants: { size: "sm", disabled: false },
  compoundVariants: [
    { size: "lg", tone: "loud", class: p(6) },
    { size: "lg", class: bg("crimson"), label: color("blue") },
  ],
});

export const slots = () => button({ size: "lg" }); // { base: "...", label: "...", icon: "..." }
export const bad = () => button({ size: "xl" }); // error: not a size
export const badSlot = scv({
  slots: { base: p(2), label: p(1) },
  variants: { size: { sm: { labl: p(1) } } }, // error: labl is not a slot
});
```

- **What ships** for `button` is `__scv({ base: { base, variants, defaultVariants, drops?, compound? }, label: {...}, icon: {...} })`,
  one `cv()` config per slot, with `import { _scv as __scv } from "cssints"` added to the module: class strings only, and
  one runtime function per slot, built once when the module loads. `scv()` works in a function, at the top of a module and
  in a library; put the config at the top of the module so the per-slot runtimes are built once.
- **A slot value is a style, or a record by slot.** A variant value that is a style styles the slot named `base`, so a
  config that gives a bare style and has no `base` slot is a build error; a record styles the slots it names, and a name
  that is not a slot is a type error and a build error at the `scv()` call. In `compoundVariants`, `class` is the `base`
  slot and a slot's own name styles that slot.
- **The rules are `cv()`'s, per slot.** A variant wins over the slot's base (its class is dropped while active), a compound
  wins over both, and two things that can be active together and overlap without containment are a build error. Each
  error names the slot, for example `cssints: scv() slot base: base and variant active.yes: border-bottom and border-color overlap without one containing the other`. A slot a value does not style is simply not in that slot's config, and the compound entries it has no style for keep their index, so the errors name the entry you wrote.
- **Props and result.** The props are `cv()`'s, typed from `variants` (`CvProps`): a typo in a name or a value is a type
  error, and a boolean variant takes a boolean. The result is `{ [K in keyof slots]: string }`, so `button().label` is a
  `string` and a slot that is not there is a type error.
- **Limits.** A `cv()` function as a slot value, and an `scv()` in `compoundVariants`, are not in this release: a slot
  value is a `css.*` style (or a `cn()`/a chain). A slot may not share its name with a variant: a compound entry would
  name both with one key, and the types make that entry impossible to write. A `scv()` site has no readable class in the
  dev overlay yet (a `cn()` or `cv()` site has one).

**A slot that reads another slot's state uses `group()` and `within()`, not its class.** A class is a mark on the element
it is put on: passing `base`'s class to a condition of `label` would style `label`'s own state, not the root's. The root
marks itself a group and the other slots read that ancestor's state, one condition each:

```ts
import {
  bg,
  cn,
  color,
  focusVisible,
  fontSize,
  group,
  hover,
  opacity,
  p,
  scv,
  within,
} from "cssints" with { type: "cssints" };

const card = scv({
  slots: {
    base: cn(group(), p(4), bg("white")),
    label: cn(fontSize("1rem"), within(hover)(color("red"))),
    icon: within(focusVisible)(opacity(1)),
  },
});
```

`group()` puts `_g` on the element the `base` class is on, and `within(hover)` becomes `:where(._g:hover) .label`, one
class of specificity, so the sheet's order still decides. `group("card")` with `within(hover, "card")` tells nested cards
apart. A slot needs no dependency on another slot's value for this, which is why `scv()` takes no slot functions.

### Errors

A bad value fails in the types, where the call is, and again at build time with the file and the place of the call, so the Vite overlay points at it. The types catch most of it.

```ts
import * as css from "cssints" with { type: "cssints" };
css.padding("1rem", "solid"); // error: not a padding value
css.width(4); // error: a bare number is a length only in spacing properties
css.flex().padding(4); // error: flex() does not chain padding
css.flex("1").gap(2); // error: flex("1") is a plain style, it does not chain
css.flex("sideways"); // error: not a flex value
css.padding(css.p(1)); // error: a style is not a value
css.items("center"); // error: there is no items
css.media("min-width > 40rem"); // error: a range needs parentheses
```

The build checks more than the types see:

```ts
import * as css from "cssints" with { type: "cssints" };

css.p(-1); // padding: unexpected "-0.25rem" in "-0.25rem", expected <length-percentage [0,∞]>
css.width("calc(1px + 2s)"); // width: unexpected "calc(1px" ... (cannot add length and time)
css.supports("(display: grdi)"); // @supports: unexpected "grdi" in "(display: grdi)", expected <supports-in-parens>
```

- **A bad argument of a CSS function is named** (not `calc` and the other math functions), as the types name it: `light-dark(): unexpected "1px" in "light-dark(white, 1px)", expected <light-dark()> (argument 2)`; a call that ends too soon says `(after argument 1)`, one argument too many `(argument 3)`. The build finds it as the types do, by prefixes with a `var()` standing for the rest, only when the call is already an error. The error is located at the site, the `css.*` call that holds the function call: a site knows its own offset, not those of the arguments inside it (a nested call is part of its site).
- A value that a browser in your browserslist does not support is a warning, not an error: `cursor: pointer` warns for iOS Safari. A token or theme value is checked the same way (see Tokens). The browserslist is the `BROWSERSLIST` variable, else the standard config looked up from Vite's `root` and upward (`"browserslist"` in `package.json`, `.browserslistrc`, with the section of `BROWSERSLIST_ENV`, `NODE_ENV` or `production`), else `defaults`. Each evaluation checks with the targets of its own build, so two servers of two roots in one process (a tool, a test) each warn for their own (2026-10-09, cssints-p3d2). `targets` and `cssTarget` of `cssints/vite` are computed when `vite.config.ts` imports them, before the root is known, so they read the config of `process.cwd()`: the same when Vite runs from the app's directory (see the README).
- **A warning is located and said once per file per build** (2026-10-09, cssints-p3d2). Vite gets it at the `css.*` call that made it (`loc`: the file, line and column, and a code frame), as an error. A build says each warning once per file of its site, property and BCD feature: two files that use `lineClamp(3)` give two warnings, each at its call; a module evaluated again (every module that imports it runs it) says nothing new. A dev server has no end, so a warning is said again when the file of its site is edited and the modules that run it are transformed again, and not on the update of an unrelated module. A tool that wants every warning of a transform calls `api.forgetWarnings(files?)` of the plugin first (the files' warnings, or all): `@cssints/mcp`'s `compile` does.
- **No warning for what LightningCSS lowers.** The build runs the sheet through LightningCSS with those targets, which gives `color: oklch(…)` a fallback (`color: #db4aa7; color: lab(…)`), prefixes `backdrop-filter` and folds a static `round()`. When a value warns, cssints asks LightningCSS: it transforms `x{prop: value}` (`:root{--x: value}` for a token value) for the targets that lack the feature, and the warning is dropped if the feature is gone from the first declaration of the output. It stays for what LightningCSS leaves: a `var()` inside the value (`oklch(from var(--x) l c h)`, `color-mix(in oklab, var(--x), …)`), a property it cannot prefix (`text-wrap`, `line-clamp`), and an inline `style()` or `token.set()` value, which never go through it. An `@property` initial value is not lowered by it either, but the engine writes the lowered form itself ("Fallbacks for older targets" under Themes). One transform per distinct value that already warns, cached per value and targets.
- Clamping text to N lines is the WebKit box, in every engine today: `display("-webkit-box")` (the `display` grammar takes `-webkit-box` and `-webkit-inline-box`), `WebkitBoxOrient("vertical")` and `WebkitLineClamp(N)`, with `overflow("hidden")`. The three are quiet: BCD files them under prefixed standard names, which the support lookup does not follow. LightningCSS passes them through and adds nothing. The standard `lineClamp(N)` (css-overflow-4) is a member too, and warns for the default targets: no engine ships it unprefixed (Chrome 154 rejects it) and LightningCSS does not prefix it.

```ts
import {
  cn,
  display,
  overflow,
  WebkitBoxOrient,
  WebkitLineClamp,
} from "cssints" with { type: "cssints" };

export const clamp2 = cn(
  display("-webkit-box"),
  WebkitBoxOrient("vertical"),
  WebkitLineClamp(2),
  overflow("hidden"),
);
```

- Validity rules written only in prose are errors too (`transition: none, opacity 1s`, an unquoted `font-family` with a generic keyword inside a name).
- Keywords and function names are written in their canonical case, on purpose: `color("RED")` and `rgb(` as `RGB(` are errors, so each value has one spelling (completions and class names stay the same). The message says the spelling: `color: unexpected "RED" in "RED" ("RED" is red in CSS; write "red"), expected <color>`. The types say it for keywords (`color("RED")`); the build says it for function names too. The CSS-wide keywords `inherit`, `initial`, `unset`, `revert` and `revert-layer` are a value of every property, whatever its grammar: `fontFamily("inherit")` is fine.

### Plugins (decided 2026-09-30, cssints-zho2; `scope()` 2026-10-05, cssints-8ogz)

A plugin is a module that exports the members of a `scope()` from `cssints/plugin`: `scope("name", table).build(impl).export()`. The table says what the plugin has (syntax names, kernels, a runtime, conflicts, token sets, other scopes, and its members); the members are typed from the table, with no second file of types. User code imports the plugin with the attribute, like `cssints` itself: `import { ring } from "./ring.ts" with { type: "cssints" }`. There is no registration in `vite.config` and no type augmentation; the engine finds the sites by the attribute, and learns kernels, runtimes and conflicts from the style each member returns. In user code a member returns a class string, so it goes into `cn()` and the conditions like any `css.*` value.

```ts
import { cn, p } from "cssints" with { type: "cssints" };
import { scope } from "cssints/plugin";

export const { ring, dot, webkitFontSmoothing } = scope("ring", {
  // a local syntax name: `<width>` in a grammar of this scope (it does not leak into mdn's names)
  width: "<length [0,∞]> | thin | thick",
  // a kernel: global CSS, once. `&` is the class the engine mints for it, `--_w` is the custom property `--ring-w`
  "#core": {
    css: "& { outline: var(--_w) solid var(--_c); outline-offset: 2px }",
    atProperty: '@property --_w { syntax: "<length>"; inherits: false; initial-value: 2px; }',
    requires: ["css.at-rules.property"],
  },
  "#noOutline": {
    props: ["outline", /^outline-/],
    message: "ring() sets the outline: use its methods",
  },
  // a chain member, like flex(): a call gives the marker and the kernel, each method emits custom properties
  ring: {
    uses: ["core", "noOutline"],
    chain: {
      width: { args: "<width>", spacing: true, emit: (v) => [["--_w", v]] },
      color: { args: "<color>", emit: (v) => [["--_c", v]] },
    },
  },
  // a property of your own, typed by its grammar (it is not in mdn-data); the key starts with `-`
  "-webkit-font-smoothing": "auto | none | antialiased | subpixel-antialiased",
  // a call member: its function is the entry of the same name in build()
  dot: { args: "small | large" },
})
  .build({ dot: (size) => ({ decls: [["--_size", size === "small" ? "4px" : "8px"]] }) })
  .export();

export const card = cn(
  p(2),
  ring().width("thin").color("red"),
  webkitFontSmoothing("antialiased"),
  dot("small"),
);
export const twice = ring().width("1px").width("2px"); // error: a method is used once
export const wrong = ring().width("red"); // error: not a width
export const bad = webkitFontSmoothing("bold"); // error: not in the grammar
export const no = dot("medium"); // error: not in the grammar
export const hidden = ring().core; // error: no such method
```

- **The table** holds entries, by their shape. A string is a syntax name (`width: "<length [0,∞]> | thin"`), or, for a key that starts with `-`, a typed property (`-webkit-font-smoothing`, exported camel-cased as `webkitFontSmoothing`; a CSS property of mdn-data is an error, use `css.<name>`). `{ css, atProperty?, requires? }` is a kernel, `{ rule, layer? }` a global rule, `{ layers: [...], before? }` a declaration of top-level layers (`before: true` prints them before the engine's), `{ polyfills, parentVars?, css? }` a runtime, `{ props, message }` conflicts, `{ tokens }` a token set, a `scope(...)` another scope, `{ chain }` a chain member, `{ args }` a call member (a function in `build()`), `{ args, value, label? }` a value member (`fn({ args, value })` when `args` is a tuple or `arg<T>()`, see "Functions"). A key that starts with `#` is private: other entries use it, it is not exported, and an embedding scope does not see it. `uses` names it without the `#`, so `#trim` beside a public `trim` is a type error and a build error (`cssints: x: #trim and trim share a name: rename one`): a name is one key, private or not.
- **Local syntax names.** `<width>` in a grammar of the table is the grammar written for `width`, in place, as a group (`[ <length [0,∞]> | thin | thick ]`); a name that is not in the table is left to mdn-data. The types and the build expand them with the same rule, so what the editor accepts is what the build accepts. A scope embedded as a module gives its public names as `<mod.name>`, a token set as `<tokens.color.accent>` (the type of that token), so a grammar can say "a colour or this token".
- **Namespaces.** Everything a scope declares is the scope's own. In the CSS of a kernel, a runtime or a global, and in what `emit` and `build` return, `--_x` is the custom property `--<scope>-x`; in a kernel or a runtime `&` is the class the engine mints for the kernel (`_<scope>-<entry>`, `_ring-core`) and `&(mod.key)` that of the kernel `key` of an embedded scope. A runtime or conflicts entry takes the class of the first kernel in the `uses` of the member. Scope names are lowercase letters, digits and `-`; `cssints` and `derived` are the engine's.
- **`uses`** lists what a member needs, by key: kernels, globals, layers, runtimes and conflicts of the scope, or `mod.key` of an embedded one (the types reject a name that is none of these, or a private one). A call member may add more in what `build` returns.
- **`group: true`** on a chain or call member makes every style of the member carry the group marker `_g-<scope>`, after the markers of its kernels: `sticky: { uses: ["core"], group: true, chain: {...} }` in scope `stuck` gives `_stuck-core _g-stuck _x`, and `within(attr("data-stuck", "top", "~="), "stuck")(...)` reads that ancestor (2026-10-08, cssints-sbs8). The group's name is the scope's, unique in the process, so two plugins never share one; a user's `group("stuck")` is the same group, so do not name your own groups after a scope you use. It is a marker like a kernel's: a condition around the member with no declaration of its own is a build error (see "Conditions and layers").
- **Kernels** are global CSS, registered once per scope entry (key `<scope>.<entry>`) on first use: the CSS goes into layer `_.k`, below every class layer, and `atProperty` (the `@property` rules) at the top of the sheet. So a kernel cannot be conditional per site: a condition around a member that has only its marker is a build error (see "Conditions and layers"); give the member a method or arguments that set custom properties, which a condition can wrap. A kernel can also be written as styles, `css: (css) => [css.outline("var(--_w)", "solid", "var(--_c)"), css.outlineOffset("2px")]`, which prints the declarations under the kernel's class: they are checked like a user's (grammar, prose rules), conditions, `nest()`, `vars()` and `keyframes()` names are allowed (see below), `firstThatWorks()` and a member's marker are not. Build errors, at the call site: two kernels of one scope that declare one of its own custom properties (`--reveal-k`), two kernels of different scopes that declare a custom property neither of them owns (`--bx-w`), two keys that print one marker, and two kernels written as styles in one member's `uses` that set properties of the element that meet (the same property, a shorthand and its longhand, a logical and a physical side, as in `cn()`): `cssints: x: kernels run and view both set animation, animation-timeline (they are one element's styles and print in no set order): write those in one kernel`. Kernels are printed in `_.k` sorted by key (`<scope>.<entry>`), whatever the order of `uses` or of the modules, so two of one member never decide between themselves; in one kernel the sheet's order holds (a shorthand before its longhands). A scope **may** declare a custom property another scope owns (`reveal()`'s kernel sets motion's `--motion-*`): that is reuse, and the two can sit on one page, while two of one scope may not share a short name of their own. A raw kernel derives no properties and is not compared (2026-10-08, cssints-life). A kernel's `requires` (BCD keys) is a build warning for a target that lacks one, never an error. A key that is also in the `polyfills` of a runtime in the member's `uses` is covered: it warns only for the targets that runtime does not reach (a `parentVars` runtime below `@property`, see below), and a fallback of CSS or a `script` covers it everywhere. The support warning of a declaration in a kernel written as styles is covered by the same rule, by its BCD key (the one in parentheses at the end of the warning): `core: { css: (css) => [css.borderRadius("var(--_r)"), css.cornerShape("squircle")] }` beside `mask: { polyfills: ["css.properties.corner-shape"], css: "..." }` in `uses` warns for nobody, so a plugin keeps derived conflicts without a raw kernel (2026-10-08, cssints-rp0e); a warning or an error of such a declaration prints its value as the sheet does, `var(--squircle-r)`, not `var(--_r)`. As in every support warning, a BCD `partial_implementation` counts as support, because most partial entries are edge cases; an entry `{ key, exact: true }` counts it as lacking, for a feature whose partial form gives other results (`surface()` asks for `{ key: "css.types.color.oklch.relative_syntax", exact: true }`), and the warning says so: `(a partial implementation counts as lacking)`.
- **Chain members** (`chain: { method: { args, spacing?, excludes?, emit } }`) give `() => chain`. `args` is the grammar of the method's parts, checked in the types (the error is on the bad argument and says `ring.width: unexpected "red" ...`) and again at build time. `spacing` makes a lone number a step of the spacing scale (0.25rem), as in `padding`. `emit` returns declarations; a custom property is allowed and its value is not checked, any other property is checked like a `css.*` one. A method is used once: the chain leaves it out. `excludes: ["darken"]` leaves other methods out after this one too, and `args: ""` makes a method that takes no value (`ink()`). A grammar must be a literal type (a `const` variable is fine; if TypeScript has widened it to `string`, the method says so: write `as const`).
- **Call members** (`{ args, uses? }` and a function in `build()`) take their arguments by `args`: a grammar (the parts, joined by a space, as a property takes them: `args: "small | large"`), `arg<T>()` (one value of a TypeScript type, which TypeScript checks and `build` gets as it is: `arg<"home" | "star">()`), or a **tuple of positional arguments**, each a grammar (one part), `"$tokens"` (a token set from `createTokens`), `"$overrides"` (values by path for the tokens of the `$tokens` before it, checked in the types against that token set), `"$selector"` (a CSS selector list, checked in the types for brackets and quotes and at build time as a whole), `arg<T>()`, or at the end one object of named leaves (`{ "size?": "<width>", on: "<color>" }`, a key ending in `?` is optional). `build` gets them as written, grammar parts as checked text. The positional form type-checks within the per-call budget; its cost is that an error lands on the call, with the position and the reason in the message, not on the argument. `build` returns `{ decls?, uses?, globals?, themes?, layers? }`.
- **`globals`** are global rules that are not classes (`{ rule, layer? }` in the table, or `{ css, layer? }[]` from `build`). A global is identified by its content, not by a name: the same rule from two styles is one, and editing a value replaces it. It is in the sheet of the modules whose styles carry it (as kernels are), and leaves it with them. `layer` sends a rule to a top-level layer of that name (`@layer app`); it must be declared by a `layers` entry (or `layers` from `build`: a list, or `{ layers: [...], before: true }` for layers below the engine's), or by `layers()` in a module imported before. No layer puts it in `_.k`. Unlike a kernel, two globals **may** declare the same custom property; that is what lets a look set the same `--color-*` in several source layers.
- **`themes`** — `themes: { tokens, overrides, selector, layer?, scope? }[]` from `build` is `createGlobalTheme(tokens, selector, overrides, { layer, scope })` made by a member, through the same path: the paths and values of `overrides` are checked against the types of `tokens` at build time, the aliases that depend on an override are declared again, and `check.contrast` reads the theme with the others. With `args: ["$tokens", "$overrides", ...]` the member takes the token set from its caller and the overrides are checked in the types as well.
- **`append(prop, value)`** (decided 2026-10-31, cssints-674d) makes a declaration a list: two declarations of that property in one `cn()` under the same conditions join their values with `,` instead of the later replacing the earlier, and a third still appends. It is how a plugin puts several programs on one element: `@cssints/reactive`'s two `on()` calls are `--reactive-on: click toggle open,keydown set tab two`. A list beside a plain value of the property is a build error (appending would be wrong, replacing would drop a program: `cssints: --x is a list "a" and a value "b": they cannot be merged`), and a list has no `firstThatWorks()` alternatives. The separator belongs to the declaration and nothing else reads it: the sheet prints the joined value, the class hash, clay, tui and the devtools see it as one declaration. A `cv()` variant is an alternative, not a list: a list declared in a variant replaces the base's as any declaration does.

```ts
import { scope } from "cssints/plugin";

// A member that sets tokens in a look: `mode(t, "dark", { color: { bg: "#000" } })` is `[data-mode="dark"] { --color-bg: #000 }` in @layer viewer
export const { mode } = scope("mode", {
  layers: { layers: ["app", "viewer"] },
  mode: { args: ["$tokens", "<custom-ident>", "$overrides"], uses: ["layers"] },
})
  .build({
    mode: (tokens, name, overrides) => ({
      themes: [{ tokens, overrides, selector: `[data-mode="${name}"]`, layer: "viewer" }],
    }),
  })
  .export();
```

- **Conditions in a kernel written as styles.** `hover` and the other pseudo-classes, `attr()`, `within()`, `media()`, `container()` and `supports()` wrap the kernel's styles as they wrap a user's: `css.hover(css.opacity(0.8))`, `css.media("(width >= 40rem)")(css.padding("1rem"))`. The rules are printed under the kernel's class, in layer `_.k`, in the order of the sheet (fewer conditions first, then queries by width and pseudo-classes by place, a shorthand before its longhands), so the order the author writes them in does not matter; the declarations of one selector share a block. At most four conditions, as everywhere.

```ts
import { cn, paddingLeft } from "cssints" with { type: "cssints" };
import { scope } from "cssints/plugin";

export const { chip } = scope("chip", {
  core: {
    css: (css) => [
      css.padding("var(--_p)"),
      css.border("1px solid"),
      css.hover(css.opacity(0.8)),
      css.media("(width >= 40rem)")(css.padding("1rem")),
    ],
  },
  chip: { uses: ["core"], chain: { padding: { args: "<length>", emit: (v) => [["--_p", v]] } } },
}).export();

// layer _.k: ._chip-core{border:1px solid;padding:var(--chip-p)} ._chip-core:hover{opacity:0.8} @media (width >= 40rem){._chip-core{padding:1rem}}
export const a = chip().padding("4px");
// build error: cssints: chip: kernel core sets padding, border, opacity (this style also sets padding-left)
export const b = cn(chip(), paddingLeft("1px"));
```

- **Children, custom properties and keyframes in a kernel written as styles** (decided 2026-10-08, cssints-b4q6). The `css` a kernel is handed has two members user code has not. `css.nest(selector)` is a condition that puts the kernel's class in a selector: one complex selector with at least one `&` (the class), anywhere: `"& > *"`, `"& > * + *"`, `"& p"`, `":root:has(&)"`, `".dark &"` (2026-10-09, cssints-l8nq: `&` was first only at the start, before a combinator). It is checked at build time as a `<complex-selector>` with `&` as a class (a list, `"& a, & b"`, is an error; the types check that there is an `&`). A condition inside it applies to the rule's subject, one around it to the kernel's element, which stands for `&`: `css.nest("& > *")(css.hover(...))` is `._k > *:hover`, `css.hover(css.nest("& > *")(...))` is `._k:hover > *`, `css.hover(css.nest(":root:has(&)")(...))` is `:root:has(._k:hover)` and `css.nest(":root:has(&)")(css.hover(...))` is `:root:has(._k):hover`. It counts as one condition and sorts after the element's own states. `css.vars({ "--_gap": "1rem" })` sets custom properties on the element (`--_x` is `--<scope>-x`, as everywhere), values not checked, as in a chain's `emit`. A `keyframes()` or `positionTry()` name is a value of any declaration of the kernel, `vars()` included: its rule is a kernel of its own that goes wherever the kernel goes, so a member names keyframes without raw CSS. Made inside the kernel's `css`, its steps name `--_x` as the kernel does, `--<scope>-x` (`css.keyframes({ from: css.vars({ "--_p": "100%" }) })` animates `--skeleton-p` in `@cssints/skeleton`), and such a rule's name ends with the scope's (`kf-1a2b3c4d-skeleton`), so two scopes with the same steps get two rules (2026-10-09, cssints-ge5k). **Derived conflicts read the element's properties only:** a custom property and what a `nest()` sets on another subject are left out, since a child's `margin` is not the element's, nor is the `animation` of `:root:has(&)`. The subject is the element when `&` is in the last compound, outside parentheses (`".dark &"`, `"&.on"`): those count, for derived conflicts and for two kernels of one member alike.

```ts
import { cn, flexGrow, keyframes, margin, opacity } from "cssints" with { type: "cssints" };
import { scope } from "cssints/plugin";

const fade = keyframes({ from: opacity(0) });

export const { row } = scope("row", {
  core: {
    css: (css) => [
      css.vars({ "--_gap": "1rem", "--_fade": fade }),
      css.display("flex"),
      css.animation("var(--_fade) 200ms"),
      css.nest("& > * + *")(css.marginInlineStart("var(--_gap)")),
    ],
  },
  row: { uses: ["core"], chain: { gap: { args: "<length>", emit: (v) => [["--_gap", v]] } } },
}).export();

// layer _.k: @keyframes kf-…{from{opacity:0}} ._row-core{animation:var(--row-fade) 200ms;--row-gap:1rem;--row-fade:kf-…;display:flex} ._row-core > * + *{margin-inline-start:var(--row-gap)}
export const a = cn(row().gap("2rem"), margin(0), flexGrow(1)); // fine: the margin is the children's
```

- **`conflicts: { props, message }`**: one `cn()` that holds the marker and one of the listed properties (a name, or a RegExp) is a build error with the plugin's message and the call site: `cssints: ring: ring() sets the outline: use its methods (this style also sets outline)`. Conditions count. The message is prefixed with the scope's name.
- **Derived conflicts.** A kernel written as styles needs no `conflicts` entry: a member that uses it conflicts with every property that meets one the kernel sets, as `cn()` decides overlap: the property itself, its longhands, a shorthand over it, and a logical or physical sibling of the same side. `core: { css: (css) => [css.outline(...), css.outlineOffset("2px")] }` stops `outline`, `outlineColor`, `outlineWidth` and `outlineOffset` in the same `cn()`, under any condition, and lets `color` through: `cssints: ring: kernel core sets outline, outline-offset (this style also sets outline-color)`. The message names the scope, the kernel and the property that was set. A `conflicts` entry among the member's `uses` **replaces** what its kernels derive (a list that allows `outline-color` while the kernel sets `outline`: `{ props: ["outline"], message }`; `props: []` allows everything), and so does a raw kernel, which has nothing to derive from (`frame()` and `surface()` are raw CSS with custom properties and `@container` rules, and `frame()` lets `border-color` through). The check reads every declaration of the style, those a member emits itself included: a member that emits a property its kernel sets lists its own `conflicts`.

- **`runtime: { polyfills, parentVars?, css?, script? }`** is the part for browsers that lack a feature. `polyfills` are BCD keys. A client module that holds a site with the member imports `virtual:cssints/runtime/<scope>.<entry>`, and the module is empty (`export {};`, nothing ships) unless a browserslist target lacks one of the keys and the runtime reaches it. A runtime with `parentVars` is a script that stands on `@property`, so it reaches only the targets that have it; `css` and `script` stand on nothing and reach every target (`@cssints/fonts`' capsize trim in Firefox 120). A runtime with `css` or `script` and **no** `polyfills` is not a fallback at all: it is the plugin's own face, so every target gets it (`@cssints/reactive`'s DOM runtime, 2026-10-31, cssints-zrt2). When it is needed, `parentVars` (`{ marker: "&", read, write, watch? }`, custom properties written `--_x`) configure `cssints/parent-vars`, one shared script and one `MutationObserver` for all plugins, `css` (the fallback rules) is added to the sheet in layer `_.k`, only then, and the module imports `script`.
- **`ship({ owner, open })`** (decided 2026-10-31, cssints-zrt2) is what a member returns when a site has more to give than a class string: `@cssints/reactive`'s `state()` returns its owner style and the sources beside it. The client module gets an object literal — each style is its class string, an array or an object keeps its shape, anything else its JSON — so the owner is a string in the browser and the data is there (`const ui = state({ open: false }); cn(ui.owner, p(4))`). At build time the object is the entries themselves, so `ui.owner` is the style and `ui.open` the source. A value a member returns at a site that is neither a style, a condition, a Typed OM value nor a `ship()` is a build error, unless the member is only ever called from a build-time module (nothing of an `icons()` definition module is in the client graph).
- **`script`** (decided 2026-10-08, cssints-kuki) is the plugin's own browser code, a module specifier: `"#io": { polyfills: ["css.properties.animation-timeline"], script: "@cssints/reveal/runtime", css: "..." }`. It is a string the engine never evaluates (the script stays out of the build-time graph) and writes into the runtime module as `import "@cssints/reveal/runtime";`, which Vite resolves as the app's own imports are, in dev and in `vite build`. Write a subpath of the plugin's package, with a `development` condition for the source and a default for `dist/` (`exports: { "./runtime": { development: "./src/runtime.ts", default: "./dist/runtime.mjs" } }`): the package's own tests resolve it by its name too. A script reaches every target, so it is not gated: it ships to every browser of a build whose targets lack a key — with no `polyfills` at all it ships to every build — and probes the feature itself (`CSS.supports`) to stay off where it is native; with `parentVars` beside it the two are decided apart. A script is a module, so the browser runs it once, however many sites, files or runtime entries import it. The plugin's subpath stays public: an app can still import it by hand, which is harmless. Derived tokens are not members; the engine registers their runtime (`cssints/derived`) on this same delivery (see "Themes").
- **Identity.** A scope name is unique in the process, and a scope is its content (the table, the source of its functions, the scopes it embeds), hashed. A module that runs again with the same content is nothing (every client module that uses a plugin runs it again). Another content under the same name replaces the old one, as an edit does in dev: the files that imported the edited module are forgotten when Vite reports it and run again. It is a build error, `scope "x" is defined twice with different content`, while a file that was not affected still uses the old one: two modules that define one name. `icons()` runs its scope once per collection, with the same table and the same code: one scope, and the collection is the closure of `build`, which the hash does not see.
- **Errors** are `MemberError` values (`Data.TaggedError`) with `pluginName` (the scope) and the file, site and offset of the call, so the Vite overlay points at it. What `build`, `value`, a chain's `emit` or a kernel's styles throw is a `MemberError` at the call. A plain function the plugin exports (one that wraps styles, say) may throw an `Error`: while a site runs, anything thrown is located at that site, with its message (2026-10-08, cssints-rf3k).
- **`lacking(...keys)`** gives the build's targets that lack one of the BCD keys, as browserslist names them, by the rules of the support warnings (`partial_implementation` lacks), and `[]` when every target has them all: a plugin emits fallback rules only when some target needs them (2026-10-08, cssints-rf3k). It runs at build time, in a member's functions or in the plugin's own:

```ts
import { attr, cn, color, container, type Style, within } from "cssints" with { type: "cssints" };
import { lacking } from "cssints/plugin";

const old = lacking("css.at-rules.container.scroll-state_queries").length > 0; // ["firefox 140"] or []
export const stuck = (...styles: Style[]) =>
  cn(
    container("scroll-state(stuck: top)")(...styles),
    ...(old ? [within(attr("data-stuck", "top", "~="), "stuck")(...styles)] : []),
  );
export const title = stuck(color("red"));
```

- **`dependsOn(path)`** tells the engine that the module being evaluated read a file (an image, an SVG, a font; `path` relative to the working directory) (2026-10-09, cssints-04u8). Call it where the file is read, in a member's functions or in the plugin's own, before or after the read. The file becomes a dependency of the client module whose evaluation ran the call, as a module it imports is: in dev, an edit of the file runs that module again and the sheet changes, the module untouched; the dev server's watcher watches the file, outside the root too. In `vite build --watch` the file is a watched file (`addWatchFile`), so an edit builds again. `@cssints/placeholder`, `@cssints/icons` (`fs`) and `@cssints/fonts` (`fs`) call it for every file they read.

```ts
import { readFileSync } from "node:fs";

import { color } from "cssints" with { type: "cssints" };
import { dependsOn } from "cssints/plugin";

export const swatch = (file: string) => {
  dependsOn(file);
  return color(readFileSync(file, "utf8").trim());
};
```

A dependency is a file, not a directory: a file added to a directory is not seen. Vite's watcher skips `node_modules`, so a file there (a collection of `@iconify-json`, `@fontsource`) is not watched. An evaluation that fails records nothing: after a build error, edit the module or reload.

- **`inGroup(group, property, value)`** says whether a declaration is in an export group (`widely-available`, `baseline-2022/with-downstream`, `css-grid-2`, ...; see "Export groups"): the group has the property, and the value holds no word it bans (a keyword of that property, a function, a unit). It is the scan that `cssints/<group>` runs on a call, from the same data (2026-10-11, cssints-l5z5). A property cssints has no member for (a custom property, `-webkit-text-size-adjust`) names no feature of the data and is in every group; `limited-availability` is everything; an unknown group is an error. A plugin that has a variant per group emits only what passes (`@cssints/reset/widely-available`). The data covers properties, keywords, functions, units and the pseudo-classes without arguments, not a selector as a whole: `:where()`, `::backdrop`, attribute selectors and combinators are not checked. Build time, like `scope()`:

```ts
import { inGroup } from "cssints/plugin";

const keep = (group: string, decls: [string, string][]) =>
  decls.filter(([p, v]) => inGroup(group, p, v));
export const heading = keep("widely-available", [
  ["text-wrap", "balance"],
  ["overflow-wrap", "break-word"],
]); // overflow-wrap only
```

- **Types.** `cssints/plugin` points at `author.ts` and `scope.ts`: the signatures and the type-level code (`Members`, `Chain`, `Expand`, the call checks) and no code that runs, because a program that imports a plugin must not need Node's types or a newer `lib`. The engine is `scope-engine.ts`; `macro.ts` registers it when the library loads.
- **Not in 0.2:** `keyword` members, completions of keywords inside plugin grammar strings (the message still names the grammar), and a plugin that is a package of members you install other than `@cssints/icons`.

### Functions: every CSS function is a call (cssints-67qf)

Every CSS function that mdn-data has a grammar for is a member of `css` and a named import, camelCased: `calc`, `min`, `clamp`, `round`, `sin`, `rgb`, `oklch`, `colorMix`, `lightDark`, `linearGradient`, `cubicBezier`, `steps`, `translateX`, `url`, `env`, `var`, ... 110 of them (`bun run extract` writes the list from `mdn-data/css/functions.json` and the `name()` grammars of mdn-data's syntaxes, `bun run members` the types). A call takes parts: a token, a number, a string, another call, or an array of those joined by a space (`[t.color.bg, "25%"]`, a colour stop). It is computed at build time, checked against the grammar of its function by the twin, and replaced by its text: nothing ships. What it returns is a Typed OM value of the function's type, a part of any property that takes one.

```ts
import * as css from "cssints" with { type: "cssints" };

const t = css.createTokens({
  color: { $type: "color", accent: { $value: "oklch(62% 0.19 259)" }, bg: { $value: "white" } },
  space: { $type: "dimension", sm: { $value: "8px" }, md: { $value: "16px" } },
  time: { $type: "duration", fast: { $value: "100ms" } },
});

export const a = css.width(css.calc(t.space.md, "*", 2)); // width: calc(var(--space-md) * 2)
export const b = css.padding(css.calc("1rem", "+", 2, "*", t.space.md)); // padding: calc(1rem + 2 * var(--space-md))
export const c = css.padding(css.clamp(t.space.md, "2vw", "2rem")); // padding: clamp(var(--space-md), 2vw, 2rem)
export const d = css.maxWidth(css.min("48rem", "100%"));
export const e = css.color(css.lightDark("white", t.color.bg)); // color: light-dark(white, var(--color-bg))
export const f = css.color(css.colorMix("in oklab", t.color.accent, "black 15%"));
export const g = css.color(css.oklch(0.7, 0.1, 200, "/", 0.5)); // color: oklch(0.7 0.1 200 / 0.5)
export const h = css.backgroundImage(
  css.linearGradient("to right", [t.color.accent, "25%"], "blue"),
);
export const i = css.transitionTimingFunction(css.cubicBezier(0.1, 0.7, 1, 0.1));
export const img = css.backgroundImage(css.url('"a.png"')); // url("a.png"): the quotes are yours
export const j = css.transform(css.translateFn(t.space.md, 0), css.rotateFn("10deg"));
export const k = css.width(css.calc(t.space.md, "+", t.time.fast)); // error: cannot add length and time
export const l = css.width(css.calc(t.space.md, "*", t.space.md)); // error: cannot multiply length by length
export const m = css.color(css.lightDark("white", t.space.md)); // error: a length is not a colour
export const n = css.width(css.rgb(255, 0, 0)); // error: a colour is not a length
```

- **Parts and operators.** The parts of a call are its arguments, joined by `", "`, or by a space when the function's grammar has no comma (`oklch`, `hwb`, `lab`, `color`, `inset`, `circle`, `dropShadow`). An operator is a string part, `"+"`, `"-"`, `"*"` or `"/"`, and joins its neighbours with a space instead: `calc(t.space.md, "*", 2)` is `calc(var(--space-md) * 2)`, `min(t.space.md, "*", 2, "4px")` is `min(var(--space-md) * 2, 4px)`, `oklch(0.7, 0.1, 200, "/", 0.5)` is `oklch(0.7 0.1 200 / 0.5)`. A number is its text. `rgb(255, 0, 0)` is the comma syntax; the space syntax is `rgb("255 0 0", "/", 0.5)` or `rgb("from", t.color.accent, "r", "g", "b")` (a relative colour, with a token).
- **Math types.** The kind of each argument is read (a token's type, a string such as `"2vw"` or `"50%"`, a number) and folded with the precedence of CSS: `*` and `/` before `+` and `-`; a length times a number is a length, a length over a length a number, a length plus a percentage a `length-percentage`. The result has the kind of its arguments (`min`, `max`, `clamp`, `calc`, `round`, `mod`, `rem`, `hypot`, `abs`), or is a number (`sign`, `sin`, `cos`, `tan`, `sqrt`, `exp`, `pow`, `log`) or an angle (`asin`, `acos`, `atan`, `atan2`). `calc(t.space.md, "+", t.time.fast)` is a type error on `t.time.fast` (`cannot add length and time`), as is a colour in a calculation. A string the types cannot read (`"var(--x)"`, `"(1px + 2px)"`, `"pi"`) is of any kind and the result is a wild typed value. `round("up", x, y)` skips its mode.
- **Other types.** The call is checked as the text it will be, against `<name()>`: `lightDark("white", t.space.md)` is an error because a length is not a `<color>`, `colorMix("in rgb", ...)` because `rgb` is not a colour space. The result is a `CSSStyleValue<"name()">`, a value where the grammar of the property reaches `<name()>` through its types (`<color>` reaches `<light-dark()>`, `<image>` the gradients). The error is on the argument where the text stops matching the grammar, with the message of the call and the position (`light-dark(): unexpected "1px" in "light-dark(white, 1px)", grammar <light-dark()> (argument 2)`); a call that ends too soon says `unexpected end ... (after argument 1)` on its last argument. The recognizer does not say where it stopped inside a call, so the types find the argument by prefixes: the first one after which `name(parts so far, var(--x))` (a `var()` stands for any run of values) is no `<name()>`. It costs nothing on a valid call. A function a property writes inline in its grammar (`fit-content()` and `minmax()` in the grid and size properties) is not reached by its type: write it as a string.
- **The build** checks every call with the twin and the usual message, at the call: `min(): unexpected "min(1rem" in "min(1rem, 2s)" (min() cannot take length and time)`. Any other function names the bad argument as the types do: `light-dark(): unexpected "1px" in "light-dark(white, 1px)", expected <light-dark()> (argument 2)` (see "Errors"). A token is checked as a literal of its type (`calc(): unexpected "calc(1px" in "calc(1px + 1s)" (cannot add length and time) ("calc(var(--space-md) + var(--time-fast))" is checked as "calc(1px + 1s)": ...)`). What the types leave to the build: the number of arguments (`clamp` takes three, `light-dark` two), numeric ranges (a share over 100%), and `sqrt` of a length.
- **Names that clash** keep the member they had, and the function gets `Fn` after its name: `attrFn` (`attr()` the value; `attr` is the attribute condition), and the functions that are also properties, `colorFn` (`color()` the colour; `color` is the property), `insetFn`, `opacityFn`, `perspectiveFn`, `rotateFn`, `scaleFn`, `translateFn`. A name that is a pseudo-class or another builder would be treated the same way; the list is computed (`FUNCTIONS` in lib.ts), not written. `var` is a reserved word: `css.var(...)` and `import { var as v } from "cssints"`.
- **`colorMix`, `min`, `max`, `clamp` are generated now.** `colorMix` takes the grammar's arguments, the interpolation method with its `in` (`colorMix("in oklab", a, b)`, was `colorMix("oklab", a, b)`). `min`, `max` and `clamp` infer their kind from their arguments (`clamp<"number">(0, x, 1)` is `clamp(0, x, 1)`).

#### `var()`

A token is its `var()` already, so `var(--name)` is not written. `css.var(token, fallback?)` is the call that adds a fallback: `css.var(t.space.sm, "4px")` is `var(--space-sm, 4px)`. The result has the token's type, and the fallback is checked as a value of it (a string or a Typed OM value, in the types and at build time). Its first argument is a token, never a name.

```ts
import * as css from "cssints" with { type: "cssints" };

const t = css.createTokens({
  color: { $type: "color", accent: { $value: "red" } },
  space: { $type: "dimension", sm: { $value: "8px" } },
});

export const a = css.padding(css.var(t.space.sm, "4px")); // padding: var(--space-sm, 4px)
export const b = css.color(css.var(t.color.accent, css.rgb(0, 0, 0)));
export const c = css.padding(css.var(t.space.sm, "red")); // error: the fallback is a length
export const d = css.color(css.var(t.space.sm)); // error: a length is not a colour
```

A string that writes `var(--space-sm)` is a build warning that names the token to pass; the `var()` of a custom property that is no token is left alone (see "Tokens"). `--_x` custom properties of a scope's kernels are not checked.

A plugin author makes a function of their own with a value member of a `scope()` (`{ args, value }`):

```ts
import { CSSColorValue } from "cssints";
import { scope } from "cssints/plugin";

// `args` is the grammar of the parts, joined by a space: `value` gets each one as text, a token as its var(--name).
export const { tint, step } = scope("units", {
  tint: {
    args: "<color> <percentage>",
    value: ([color, share]) => new CSSColorValue(`color-mix(in oklab, ${color}, white ${share})`),
  },
  step: { args: "<number>", value: ([n]) => `${Number(n) * 4}px` },
}).export();

tint("red", "20%");
tint("red", "solid"); // error: not a percentage
step(2);
```

- **Positional arguments** (2026-10-08, cssints-pnnw). `args` takes what a call member's does: a grammar, `arg<T>()`, or a tuple of positional arguments with an object of named leaves at the end, checked by the same types and at build time by the same code. A table cannot type `value` from the `args` beside it, so a member with a tuple or `arg<T>()` is written `fn({ args, value })` (from `cssints/plugin`), and `value` gets an array of the arguments as `build` would: grammar parts as checked text, `arg<T>()` as T, the object as an object (`{}` when left out). The types reject such a member written without `fn()`. A boolean option is `arg<boolean>()`.
- **`label`** names the member in its errors in place of its key: a key is a name (no dots), so a member exported as `fluid.container` is a key of its own, attached by hand, with `label: "fluid.container"`.

```ts
import { arg, fn, scope } from "cssints/plugin";

export const { shade } = scope("shades", {
  shade: fn({
    args: ["<color>", { "by?": "<percentage>", "dark?": arg<boolean>() }],
    label: "tint.shade",
    value: ([color, { by = "10%", dark }]) =>
      `color-mix(in oklab, ${color}, ${dark ? "black" : "white"} ${by})`,
  }),
}).export();

shade("red");
shade("red", { by: "20%", dark: true });
shade("red", { by: "red" }); // error: tint.shade(2).by: unexpected "red"
```

- **Typed or opaque.** What `value` returns is what the call returns. A Typed OM value (`CSSColorValue`, `CSS.rem(1)`) keeps its type: `tint(...)` is a `<color>` in the types and goes only where a colour goes. A string, a literal or a template literal too (`` `color-mix(in oklab, ${c}, white)` ``), is opaque to the types, which accept it anywhere, and it is checked at build time in the declaration it lands in, as any value is. Return a Typed OM value when you know the type.
- **The Typed OM values** of `cssints` are `CSS` (`CSS.px`, `rem`, `em`, `percent`, `number`), `CSSUnitValue`, `CSSColorValue` and `CSSImageValue` (an `<image>`: a gradient, a `url()`), each holding its CSS text, and `CSSStyleValue<T>`, the base to subclass for another type (`class Clamp extends CSSStyleValue<"length">` with a `toString()`). A module that only runs at build time, as a plugin's does, imports them from `"cssints"` without the attribute; a module that reaches the client imports them with it, and each constructor there becomes its CSS text.
- **Build time only.** `value` runs in the Module Runner, once per call, and the call is replaced by its CSS text (`"_1hjzi3b"` for a class, `"color-mix(...)"` for a call of its own); the function and its module do not reach the client.
- **Errors** are `MemberError` values with the file, site and offset of the call, and `pluginName` is the scope: `tint: unexpected "solid" in "red solid", expected <percentage>` for the parts (the label is the member's `label`, else its key; a tuple's message names the position, `tint.shade(2).by: ...`); a `value` that throws (`cssints: boom: no luck`, any `Error`) or returns something else than a string or a Typed OM value (`cssints: tint() value must return a string or a Typed OM value`). A result that does not fit the property is that property's error, at the same site (`width: unexpected "color-mix(in" in "color-mix(in oklab, red, blue)"`): the engine cannot know the property a function is used for.
- **Limits.** With a grammar as `args`, the parts are joined with a space, so it cannot tell the arguments apart (`<color> <color>` takes `"red", "blue"` and `"red blue"`; check `parts.length` in `value`, or use a tuple). A token is checked as the values of its type, so a wrong one is named by its value: `unexpected "1px" in "oklab 1px red"`. The css functions above are not value members: `lightDark(a, b)` is the text `light-dark(a, b)`, whose choice is the browser's at the element.

### `frame()`: concentric radius (`cssints/frame`, cssints-q2vh)

The first plugin, written only on `scope()` above. A frame passes its inner radius down the tree; a nested frame's radius is the parent's inner radius less its own margin, so a rounded field in a rounded card stays concentric with no wiring, however many plain wrappers sit between them.

```ts
import * as css from "cssints" with { type: "cssints" };
import { frame } from "cssints/frame" with { type: "cssints" };

const radius = css.token.length("12px", "radius-lg");

// radius 24px, padding 16px, border 1px: the field inside gets 24 - 16 - 1 = 7px
export const card = css.cn(
  frame().radius("1.5rem").padding(4).border("1px"),
  css.bg("white"),
  css.borderColor("#9ca3af"),
);
export const field = css.cn(frame().padding(2).border("1px"), css.borderColor("#9ca3af"));
// a token is a length; a condition just sets the custom property, and the whole subtree follows
export const panel = css.cn(
  frame().radius(radius).padding(2),
  css.media("(width >= 40rem)")(frame().padding(6)),
);

export const noNumber = frame().radius(4); // error: a bare number is a spacing step in padding and margin only
export const noPercent = frame().padding("5%"); // error: a length, not a percentage
export const once = frame().radius("1px").radius("2px"); // error: a method is used once
export const own = frame().color("red"); // error: a frame chains its own methods only
```

- **Methods**, each once and in any order: `radius(<length>)`, `padding(<length> | step)`, `border(<length>)` (a width; the style is `solid`), `margin(<length> | step)`. `radius` is the radius of the outermost frame; inside a frame it is ignored (the radius is computed). A lone number in `padding` and `margin` is a step of the spacing scale (0.25rem). Tokens go anywhere a length does.
- **Build errors** (at the call site): a negative radius, padding or border, a percentage, and a `cn()` that holds `frame()` and a property it sets: `padding*`, `margin*`, `border-radius` and its corners, `border`, `border-width`, `border-style` and the border sides (`cssints: frame: frame() sets padding, margin, border-radius and the border: use its methods (this style also sets padding)`). Border colours (`borderColor`, `borderTopColor`) are plain styles and do not conflict. Conflicts with an opaque runtime string in `cn()` are not seen, as for any plugin.
- **What it emits:** the class `_frame-core` and one class per method (`._x{--frame-p:0.5rem}`, in `_.a`, or `_.b` inside a condition). The kernel `frame.core` (about 1.2 kB minified with its registrations and fallback, once, in `_.k`) is two `@container style(--frame-c: ...)` rules that alternate two names, because a property cannot read itself; the `@property` rules of its custom properties (`--frame-*`) are at the top of the sheet. The names are the scope's own (`--_x` in the source is `--frame-x`, `&` is `_frame-core`), which is why they are longer than the `--fr-*` and `_f` of the helpers it was first written on. The inputs are registered lengths, so `em`, `calc()` and tokens reach the child as exact lengths (an `em` padding is the parent's `em`, not the child's). The 24-line kernel for px and rem only was not chosen: `@property` is the floor of the runtime anyway, and the registered one costs about 0.2 kB more.
- **Browsers.** The kernel needs `@container style()` on custom properties (Chrome 111, Safari 18, Firefox 151) and `@property` (Chrome 85, Safari 16.4, Firefox 128). For a target that has `@property` and lacks style queries the build ships the fallback instead: `polyfills: ["css.at-rules.container.style_queries_for_custom_properties"]` and `cssints/parent-vars` (about 1 kB gzip, shared with other plugins), which copies each frame's inner radius to its frame children, and the fallback CSS. The script probes the browser and stays off where style queries work. Below `@property` (Firefox 127, Safari 16.3) the kernel is a build warning and nothing is shipped: a frame keeps no concentric radius there.
- **Limits of the runtime.** It costs about two or three times the style-query kernel on a first pass (190 ms for 5 500 nested frames in Firefox 128); a `transition` of your own on a frame replaces the sentinel that lets `:hover`, media and container conditions reach the script (the script still follows class and style changes); shadow roots are not crossed; a first paint before the script runs shows declared radii.

### `surface()`: parent-relative colour (`cssints/surface`, cssints-vsc9)

The second plugin on `scope()` and the same runtime. A surface passes its colour down the tree; a nested surface is that colour with its OKLCH lightness moved, through any number of plain wrappers. **These are tonal steps, not a contrast guarantee**: `contrast()` and `ink()` pick a direction by lightness and never compute a ratio.

```ts
import * as css from "cssints" with { type: "cssints" };
import { surface } from "cssints/surface" with { type: "cssints" };

const canvas = css.token.color("#2b3a67", "canvas");

// a base, then a lighter card on it (a token or a colour), a field a step darker, a button pushed away from its parent
export const page = surface().color(canvas);
export const card = css.cn(surface().lighten(0.06), css.hover(surface().lighten(0.1)));
export const field = surface().darken(0.03);
export const cta = surface().color("oklch(from #e11d48 l c h)").contrast(0.15).ink();

export const both = surface().lighten(0.1).darken(0.1); // error: lighten, darken and contrast do not go together
export const wide = surface().color("wide"); // error: not a colour
export const noValue = surface().ink("black"); // error: ink() takes no value
export const own = surface().radius("4px"); // error: a surface chains its own methods only
```

- **Methods**, each once and in any order: `color(<color> | token)` is an absolute base (without it the base is the nearest surface around, or `Canvas` for the outermost); `lighten(step)`, `darken(step)` and `contrast(step)` move the lightness of the base by a `<number [0,1]>`, and only one of the three goes in a chain; `ink()` sets the text colour to black or white by the lightness of the surface (above 0.5636 black, else white). `contrast` moves _away_ from the parent: a light parent is darkened, a dark one lightened. The base may be a relative colour (`oklch(from var(--brand) l c h)`).
- **Build errors** (at the call site): a step outside 0 to 1, a bad colour, a method used twice or with another step, and a `cn()` that holds `surface()` and `background` or `background-color`, `bg()` included (`cssints: surface: surface() sets the background colour: use its methods (this style also sets background-color)`). `backgroundImage`, `color` and the border colours do not conflict. Conflicts with an opaque runtime string in `cn()` are not seen, as for any plugin.
- **What it emits:** the class `_surface-core` and one class per method (`._x{--surface-d:0.06}`, in `_.a`, or `_.b` inside a condition: a `hover()` or a media query moves every surface below). The kernel `surface.core` (about 1 kB minified with its registrations and fallback, once, in `_.k`) is two `@container style(--surface-p: ...)` rules that alternate two registered `<color>` properties, `--surface-e` and `--surface-o`, because a property cannot read itself; the step `--surface-d` is not registered, since it may contain `l`, which only means something inside `oklch(from …)`. Its names are `--surface-*`; frame's are `--frame-*`, so a frame and a surface can be one element, or nest in each other, with no collision.
- **Not a contrast guarantee.** A lightness threshold of 0.5636 gives 4.6:1 at the worst on greys, but 3.7:1 on 3 000 random chromatic colours (research, Chrome). `ink()` on a saturated surface can fall short of WCAG AA. For a ratio, declare the colours as tokens and use `css.check.contrast` (see Themes): it checks the declared pair at build time, which the kernel cannot do because it never sees the parent.
- **Browsers.** The kernel needs `@container style()` on custom properties (Chrome 111, Safari 18, Firefox 151), `@property` (Chrome 85, Safari 16.4, Firefox 128) and relative colour (Chrome 122, Safari 18, Firefox 128). Chrome 119 to 121 and Safari 16.4 to 17.6 have an early relative colour with other channel scales: the steps come out wrong (in Chrome `l` is a number from 0 to 100), so the kernel's `requires` asks for the whole feature (`exact`, see Plugins) and a target set that holds one of them gets the warning. Safari 17 has no style queries, so it gets the runtime as well, which does not change the steps; Chrome 120 has style queries and gets no runtime, only the warning. For a target that has `@property` and relative colour but lacks style queries (Firefox 128 to 150) the build ships the same fallback as `frame()`: the shared `cssints/parent-vars` script (one observer however many plugins use it) copies each surface's colour to its surface children. A surface that is also a frame needs both transition sentinels, so the fallback has a rule for `._surface-core._frame-core` (the surface scope embeds the frame scope for that class: `&(frame.core)`). Below `@property` or relative colour the kernel is a build warning: a surface keeps no tonal step there.
- **Limits of the runtime** are frame's: about two or three times the style-query kernel on a first pass, shadow roots are not crossed, a first paint before the script runs shows the `canvas`-based colours, and a `transition` of your own on a surface replaces the sentinel that lets `:hover` and media conditions reach the script.

### Icons: `@cssints/icons` (decided 2026-10-02, cssints-1x1o)

An icon is a style written on `scope()` (one scope, "icons", whatever the collection): a marker class, a mask kernel and one atomic class per icon that holds the SVG as a data URL. There is no runtime. Install `@cssints/icons` and a collection (`@iconify-json/mdi`), or point it at a folder of `.svg` files.

```ts
import { cn, color, width } from "cssints" with { type: "cssints" };
import { icons } from "@cssints/icons" with { type: "cssints" };

// icons.ts: a build-time module (it runs while the build runs, and never reaches the browser)
export const mdi = icons<typeof import("@iconify-json/mdi/icons.json")>({
  provider: "iconify-json",
  collection: "mdi",
});
export const brand = icons({ provider: "fs", dir: "src/icons" });

// a component imports them from there: import { mdi, brand } from "./icons.ts" with { type: "cssints" }
export const close = cn(mdi("close"), color("crimson"), width("1.5em"));
export const logo = brand("logo");
export const typo = mdi("clos"); // error: not an icon of mdi
```

```css
/* kernel icons.mask, layer _.k; LightningCSS adds -webkit-mask for your targets */
._icons-mask {
  display: inline-block;
  width: 1em;
  height: 1em;
  background-color: currentColor;
  mask: var(--icons-svg) no-repeat center / 100% 100%;
}
/* the only per-icon rule */
._x1 {
  --icons-svg: url("data:image/svg+xml,%3Csvg …");
}
```

- **`icons({ provider: "iconify-json", collection })`** reads `@iconify-json/<collection>/icons.json` from the `node_modules` of the working directory, while the module runs. **`icons({ provider: "fs", dir })`** reads `<dir>/<name>.svg` (`dir` is relative to the working directory; the SVG needs a `viewBox`). The result is a function of the icon name: `mdi("home")` is a style that goes into `cn()` and the conditions like any member. Call `icons()` in a module of its own, imported with the attribute, as above.
- **Names.** TypeScript cannot read a module type from a string, so the names of a collection come from the type argument: `icons<typeof import("@iconify-json/mdi/icons.json")>(…)` types `mdi(name)` as the icons and aliases of that collection, and a typo is an error in the editor. Without the type argument, and for `fs`, a name is any string. In every case a name that does not exist is a build error at the call, with the nearest name when it is close: `cssints: icons: no icon "hom" in iconify-json mdi, did you mean home?`.
- **Mask or image.** An icon that paints with `currentColor` (every one-colour icon of a collection) gets the marker `_icons-mask` and takes the text `color`. Any other (a logo with its own colours) gets `_icons-image`, a background image. This is iconify's own rule. A non-square icon is centred on a square view box, so `width` and `height` set its size (`1em` by default).
- **Cost.** The kernel is printed once. Each icon adds one class, and the same icon is the same class everywhere. The kernel has no `requires`: LightningCSS adds `-webkit-mask` for targets that have only the prefixed form.
- **Dev.** An edited SVG of `fs` updates the CSS of the modules that use it, without a touch or a restart (`dependsOn`, see "Plugins"; 2026-10-09, cssints-04u8). A new SVG in `dir` is not seen until the module runs again.
- **Not yet:** the iconify HTTP API (it would need a lockfile), names generated for `fs`, and a name transform.

### Plugin packages (cssints-dk1q)

More plugins on `scope()`, each a package of its own with its rules and limits in its README. Import them with the attribute, like `cssints`.

| Package                                                     | Members                                                                                                     | What it does                                                                                                                                                                                                                                                                                                                                                               |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`@cssints/fluid`](../packages/fluid/README.md)             | `fluid(min, max, { from?, to?, zoom? })`, `fluid.container(...)`                                            | A `clamp()` that grows between two widths, computed at build time; a range that fails WCAG 1.4.4 is a build error                                                                                                                                                                                                                                                          |
| [`@cssints/layout`](../packages/layout/README.md)           | `stack()`, `cluster()`, `sidebar()`, `switcher()`, `cover()`, `autoGrid()`                                  | Every Layout primitives as chain members                                                                                                                                                                                                                                                                                                                                   |
| [`@cssints/fonts`](../packages/fonts/README.md)             | `font(family, { provider, ... })` → `.family()`, `.trim()`                                                  | `@font-face` and a metric-matched fallback face; cap-height trimming by `text-box`, else capsize's margins                                                                                                                                                                                                                                                                 |
| [`@cssints/reset`](../packages/reset/README.md)             | `reset({ media?, prose? })`                                                                                 | A modern reset in a top-level `@layer reset` declared before the engine's, below every style; `@cssints/reset/<baseline group>` keeps only the declarations of that group                                                                                                                                                                                                  |
| [`@cssints/tokens`](../packages/tokens/README.md)           | `/open-props`, `/radix`, `/flexoki`, `/reasonable-colors`, `/madoromi`                                      | DTCG data for `createTokens`                                                                                                                                                                                                                                                                                                                                               |
| [`@cssints/gradient`](../packages/gradient/README.md)       | `gradient(kind, direction, from, to, easing?, stops?)`                                                      | Eased colour stops mixed in oklab at build time                                                                                                                                                                                                                                                                                                                            |
| [`@cssints/gradient-2d`](../packages/gradient-2d/README.md) | `meshGradient(mesh)`, `freeformGradient(points)`                                                            | `mesh-gradient()` / `freeform-gradient()` where the browser has them, else a runtime's canvas (this package's algorithms; lines and shapes not yet)                                                                                                                                                                                                                        |
| [`@cssints/color-names`](../packages/color-names/README.md) | `named(name)`, `colorNames.<sector>(name)`, `/nearest`                                                      | The Color Name List (31,939 names) as hex colours; the ten sector members keep an editor's completion short, `nearest()` is the build-time reverse lookup                                                                                                                                                                                                                  |
| [`@cssints/motion`](../packages/motion/README.md)           | `motion().preset().duration().delay().easing()`                                                             | Animation presets over `keyframes()`, with reduced motion                                                                                                                                                                                                                                                                                                                  |
| [`@cssints/squircle`](../packages/squircle/README.md)       | `squircle().radius()`                                                                                       | `corner-shape: squircle`, else a CSS `mask` of the same shape                                                                                                                                                                                                                                                                                                              |
| [`@cssints/reveal`](../packages/reveal/README.md)           | `reveal().preset().range().duration().easing()`, `appear().preset().range().duration().easing().inOut()`    | motion's entrance presets on `animation-timeline: view()` (reveal) or on `timeline-trigger` + `animation-trigger` (appear); for other targets a script plays it once on entry (delivered by the runtime)                                                                                                                                                                   |
| [`@cssints/stuck`](../packages/stuck/README.md)             | `sticky().top()`, `stuck(styles)`, `stuck("bottom")(styles)`                                                | Styles inside a sticky element while it is stuck, by `@container scroll-state()`; for other targets an `IntersectionObserver` (delivered by the runtime)                                                                                                                                                                                                                   |
| [`@cssints/balance`](../packages/balance/README.md)         | `balance()`, `pretty()`                                                                                     | `text-wrap: balance` / `pretty`; for targets without balance a script balances the lines (delivered by the runtime)                                                                                                                                                                                                                                                        |
| [`@cssints/masonry`](../packages/masonry/README.md)         | `masonry().columns().gap()`                                                                                 | `display: grid-lanes`, else CSS `columns` (top to bottom per column)                                                                                                                                                                                                                                                                                                       |
| [`@cssints/placeholder`](../packages/placeholder/README.md) | `placeholder(path, { mode? })`                                                                              | An `<image>` from a JPEG or PNG read at build time: a gradient of its colours laid out as the image, or a tiny thumbhash PNG                                                                                                                                                                                                                                               |
| [`@cssints/ramp`](../packages/ramp/README.md)               | `ramp(base, { mode, steps \| ratios, background })`, `overrides(ramp)`                                      | An OKLCH palette as DTCG data for `createTokens`; the contrast mode meets each ratio against its background                                                                                                                                                                                                                                                                |
| [`@cssints/rybitten`](../packages/rybitten/README.md)       | `color(hue, { cube })`, `wheel(steps, { cube })`, `shades(hue, lightness)`, `overrides(group)`              | RYBitten's red-yellow-blue colours (36 historical cubes) as DTCG data for `createTokens`: a hue, a wheel of hues, a hue at several lightnesses                                                                                                                                                                                                                             |
| [`@cssints/skeleton`](../packages/skeleton/README.md)       | `skeleton().radius().color().highlight()`                                                                   | Loading placeholders whose shimmer is in phase across the page (one clock on `:root`), static under reduced motion                                                                                                                                                                                                                                                         |
| [`@cssints/reactive`](../packages/reactive/README.md)       | `state()`, `toggle()`, `set()`, `value()`, `checked()`, `persist()`, `on()`, `bind()`, `when()`, `inside()` | State as custom properties, events as data on the element: writes only in events, conditions and DOM output in plain CSS, wired by a 1.2 kB runtime shipped to every target; `value()`/`checked()` take the field's value, calls of `on()`, `bind()` or `state()` in one `cn()` append, and `persist(value, key)` keeps a state across a reload (2026-10-31, cssints-674d) |

### Headless: `createField` and `createConfirm` (`@cssints/headless`)

Two primitives with no APG pattern behind them, so no Quint spec: `createField` is the ARIA contract of a form field, `createConfirm` a promise over `createDialogModal({ role: "alertdialog" })`. Like the rest of the package they return state and attribute objects, no elements, no styling; the README has the examples.

```ts skip
createField(options?: {
  id?: string | undefined;
  required?: boolean | undefined;
  invalid?: boolean | string | undefined; // a string is the flag and the message; false wins over an error
  hint?: string | undefined;
  error?: string | undefined;
  describedby?: string | readonly string[] | undefined; // host-owned ids, after the hint and the error
}): {
  invalid(): boolean;
  hint(): string | undefined;
  error(): string | undefined; // only while invalid
  describedIds(): readonly string[]; // hint, then error (the ones that are shown), then describedby
  controlProps: { id; "aria-describedby"; "aria-invalid"; "aria-required"; required };
  labelProps: { id; for };
  hintProps: { id; hidden };
  errorProps: { id; hidden; role }; // role "alert" while the error is shown, else undefined
};
```

The hint and the error are both listed in `aria-describedby` (hint first; the error does not replace it), `aria-invalid` is set only when invalid, and no attribute names an id that is hidden. `errorProps.role` is `"alert"` only while the error is shown; `hintProps` has no role. `describedby` is for one refusal that belongs to two controls: a form-level error element, with its own id and role, whose id is passed to both fields (a getter, so the id is there only while the element is shown); it follows the field's own ids in `aria-describedby` and is dropped when empty. Every option accepts `undefined`, so a getter over an optional prop typechecks under `exactOptionalPropertyTypes`.

```ts skip
createConfirm(options?: { id?: string | undefined; onOpenChange?(open: boolean): void }): {
  confirm(request: {
    title: string;
    description?: string | undefined;
    confirmLabel?: string | undefined; // "Confirm": English; a translating host passes both labels
    cancelLabel?: string | undefined; // "Cancel"
    destructive?: boolean | undefined;
  }): Promise<boolean>;
  open(): boolean;
  request(): ConfirmView | undefined; // the request with its defaults, kept after it settles
  triggerProps: { id; "aria-haspopup"; "aria-expanded"; "aria-controls" }; // dialog-modal's, without the handlers
  dialogProps: DialogContentProps; // role alertdialog, aria-labelledby the title, aria-describedby always the description
  backdropProps: DialogBackdropProps;
  titleProps: { id };
  descriptionProps: { id; hidden }; // render it always
  cancelProps: { id; type; onClick };
  confirmProps: { id; type; onClick };
};
```

`confirm()` resolves `true` on confirm and `false` on cancel, Escape and a backdrop click. A second request while one is pending rejects with `ConfirmPendingError` (it is not queued). Focus goes to the cancel button on open and back to the element that had it when `confirm()` was called. While it is open the dialog has a shell: Tab and Shift+Tab cycle inside it, `overflow: hidden` is set on `document.documentElement` (restored on close; counted, so nested confirms restore it once), and Escape is read from the document in the capture phase, so it works with the focus outside the dialog. Confirms from different `createConfirm` calls may be open together: the last opened gets Escape and Tab. The default labels stay English; a translating host passes `confirmLabel` and `cancelLabel` with each request.

### Headless: `createToast` and `createStatus` (`@cssints/headless`)

Two live regions with no APG pattern and no Quint spec: `createStatus` is one polite message whose text is replaced, `createToast` queues toasts whose countdown pauses. Their oracle is `packages/headless/test/toast.browser.test.tsx`.

```ts skip
createStatus(options?: { id?: string | undefined; from?: (() => string | undefined) | undefined }): {
  message(): string | undefined; // from() when the host controls the text, else the last show
  show(text: string): void; // replaces the text; nothing is queued
  clear(): void;
  statusProps: { id; role: "status"; "aria-live": "polite"; "aria-atomic": "true" };
};

createToast(options?: {
  timeout?: number | undefined; // ms, 5000; 0 dismisses on the next tick
  max?: number | undefined; // visible toasts, 3; a new one past it drops the oldest
  pauseOnHover?: boolean | undefined; // true; focus always pauses
  labels?: { region?: string | undefined } | undefined; // "Notifications"
  onDismiss?(id: string): void; // every departure: timeout, dismiss, dismissAll, ceiling
}): {
  toasts(): readonly ToastItem[]; // oldest first
  show(input: {
    title: string;
    description?: string | undefined;
    tone?: "info" | "success" | "error" | undefined; // "info"
  }): string; // the id
  dismiss(id: string): void;
  dismissAll(): void;
  regionProps: { role: "region"; "aria-label": string }; // the F6 target
  toastProps(id: string): {
    role: "alert" | "status"; // "alert" for tone "error", "status" otherwise
    "aria-atomic": "true";
    onMouseEnter(): void;
    onMouseLeave(): void;
    onFocusIn(): void;
    onFocusOut(): void;
  };
};
```

`createStatus` renders one `role=status` region that the host keeps mounted; `show()` replaces its text, so a burst of "Link copied" / "Saved" reads as the last state, not as a queue. A status is never for errors: an error is `createAlert` (`role=alert`), and a titled message with a timeout is a toast. Both take `from: () => text`, which makes the text the host's own signal (`createAlert({ from: () => error() })`): no effect mirrors it into `show()`, and clearing the signal unmounts the alert.

A toast is its own live region inside the `role=region` landmark: `role=alert` for `tone: "error"` (assertive) and `role=status` otherwise (polite). The host renders the `title` and `description` handed to `show` inside that element, so the toast's own text is the announcement — `aria-atomic` reads all of it, a close button's label included, so keep a toast to its title and description and give a close button no more than an icon with a label. The role sits on the toast rather than on one container per tone: the container is the `region` landmark, so it cannot also be the live region, and a role per toast needs no second region from the host. One timer per toast honours `timeout`; hover pauses it when `pauseOnHover` is true and focus always pauses, and both resume with the time that was left rather than restarting the deadline. `max` drops the oldest toast past the ceiling, and `onDismiss` fires for every toast that leaves. F6 into the region is the host's handler (hotkeys are a separate bean, cssints-h0d5): give `regionProps` an element with `tabindex="-1"` and focus it, remembering where focus was.

### Headless: `createPopover` (`@cssints/headless`)

**No APG pattern exists** for a popover (APG has Dialog, which is modal), so it has no Quint spec and no ported scenarios: `packages/headless/test/popover.browser.test.tsx` is its oracle. The behaviour is copied from Base UI's Popover (a trigger click toggles, Enter / Space / ArrowDown open, an outside `pointerdown` light-dismisses without stealing focus) and React Aria's `usePopover` (focus into the content on open and back to the trigger on close, `role="dialog"` without `aria-modal`, a placement that flips at the viewport edge).

```ts skip
createPopover(options?: {
  id?: string | undefined;
  open?: boolean | undefined; // controlled: the host owns the state
  defaultOpen?: boolean | undefined;
  placement?: "bottom-start" | "bottom" | "bottom-end" | "top-start" | "top" | "top-end" | undefined; // "bottom"
  offset?: number | undefined; // the gap to the trigger, 4
  modal?: false; // a popover is never modal: inert, the scroll lock and the Tab trap are createDialogModal's
  onOpenChange?(open: boolean): void;
}): {
  open(): boolean;
  triggerProps: {
    id;
    "aria-haspopup": "dialog";
    "aria-expanded": "true" | "false";
    "aria-controls": string;
    onClick(): void;
    onKeyDown(event: KeyboardEvent): void; // Enter / Space / ArrowDown open
  };
  contentProps: {
    id;
    role: "dialog";
    "aria-modal": undefined; // always: not modal
    tabindex: -1;
    hidden: boolean;
    onKeyDown(event: KeyboardEvent): void; // Escape closes, and focus goes back to the trigger
  };
  contentStyle(): { position: "absolute"; top: string; left: string }; // the last measure
  position(
    triggerRect: { top; left; width; height },
    contentRect: { top; left; width; height },
    viewport: { width; height },
  ): { top: number; left: number; placement: PopoverPlacement }; // pure; flips at the viewport edge
  attach(trigger: HTMLElement, content: HTMLElement): () => void; // call from a ref; returns the teardown
};
```

`attach` is the DOM contract: on open it measures and places the content (and again on resize, scroll and a `ResizeObserver`), focuses the content's first focusable element (else the content, which is `tabindex="-1"`), and on close returns the focus to the trigger unless the close came from an outside `pointerdown` — that one leaves the focus where the page put it. The page behind stays interactive: there is no `inert`, no scroll lock and no Tab cycle, and the content is not a menu (no roving focus: `createMenu` in a popover owns its items). The rects and the viewport passed to `position` must share a space; `attach` measures in client space and writes page space for `position: absolute`.

### Headless: `createDrawer` (`@cssints/headless`)

The drawer / sheet shell: an edge-anchored panel over Dialog (Modal), with the focus, Escape, scroll-lock and backdrop behaviour of `createConfirm`. **No APG pattern exists for a drawer or a bottom sheet**; [packages/headless/docs/bottom-sheet.md](../packages/headless/docs/bottom-sheet.md) settles that the library composes instead of adding a sheet primitive (the semantics are Dialog, the position and the snap points are native CSS), and this is the shell that decision left to exist. Its oracle is `packages/headless/test/drawer.browser.test.tsx`.

```ts skip
createDrawer(options?: {
  id?: string | undefined;
  open?: boolean | undefined; // controlled: the host owns the state
  defaultOpen?: boolean | undefined;
  side?: "left" | "right" | "bottom" | undefined; // "right"; presentation only
  modal?: boolean | undefined; // true; read at every attribute read (the breakpoint switch)
  breakpoint?: number | undefined; // px; documented only: the host watches it and passes side / modal
  dismissable?: boolean | undefined; // true; a backdrop click or an outside pointerdown
  labelledby?: string | undefined; // the panel needs a name
  onOpenChange?(open: boolean): void;
}): {
  open(): boolean;
  side(): "left" | "right" | "bottom";
  triggerProps: {
    id;
    "aria-haspopup": "dialog";
    "aria-expanded": "true" | "false";
    "aria-controls": string;
    onClick(): void; // toggles
    onKeyDown(event: KeyboardEvent): void; // Enter / Space open
  };
  backdropProps: { id; hidden: boolean; onClick(): void }; // always hidden when closed or not modal
  contentProps: {
    id;
    role: "dialog";
    "aria-modal": "true" | undefined; // by modal, and undefined while closed
    "aria-labelledby": string | undefined;
    tabindex: -1;
    hidden: boolean;
    onKeyDown(event: KeyboardEvent): void; // Escape closes
  };
  handleProps: { "aria-hidden": "true" }; // a bottom sheet's grab handle; decorative
};
```

`side` and `modal` are the whole presentation API: a sheet is `{ side: "bottom", modal: true }`, a side rail is `{ side: "right" }`, and a non-modal rail is `{ side: "right", modal: false }`. `modal` is read at attribute-read time, so a host that watches the breakpoint may flip it while the drawer is open and the backdrop, `aria-modal` and the lock follow; `breakpoint` itself is not read, because the primitive has no viewport and the host owns the `matchMedia`.

A modal drawer is `aria-modal="true"` with a backdrop, focus moves to the panel's first focusable on open (else the panel, `tabindex="-1"`) and back to the trigger on close, Tab and Shift+Tab cycle inside it, `overflow: hidden` is set on `document.documentElement` (counted, and shared with `createConfirm`, so a confirm over a drawer nests), and Escape is read from the document in the capture phase, so it closes wherever the focus is. A non-modal drawer keeps the page's scroll, focus and clicks: no `aria-modal`, no backdrop, no lock, no Tab trap; an outside `pointerdown` still dismisses it when `dismissable`, and Escape still closes it. `dismissable: false` pins the drawer against the backdrop and the outside pointerdown only.

**No drag-to-dismiss and no `attach`.** A drag would be a JS re-implementation of the native scroll snap the host writes (see bottom-sheet.md), so `handleProps` is decoration with no pointer handlers, and the ways out are the backdrop, Escape, a close control in the panel and the trigger. The panel is edge-anchored, so nothing is measured: focus and the Tab cycle find it through `contentProps.id`.

### Headless: `createTable` (`@cssints/headless`)

A data table on a **native `<table>`**: sortable column headers and row selection, as state and attribute objects. It has no spec of its own; it composes the two state models the package already has (`grid-sort.qnt`, `grid-selection.qnt`) without the grid's navigation, so `packages/headless/test/table.browser.test.tsx` is its oracle. The host renders `<table>`, `<caption>`, `<thead>`, `<tbody>`, `<th scope="col">` and `<td>`: the primitive adds no `role`, only what the elements cannot say themselves.

```ts skip
createTable(options: {
  columns: ReadonlyArray<{ key: string; sortable?: boolean; numeric?: boolean; abbr?: string | undefined }>; // sortable defaults true
  rows: ReadonlyArray<string> | (() => ReadonlyArray<string>); // row ids in render order; a getter is read lazily
  selection?: "none" | "single" | "multiple" | undefined; // "none"
  sortCycle?: "tri-state" | "toggle" | undefined; // "tri-state": ascending -> descending -> unsorted
  sort?: TableSort | null | undefined; // controlled; null = unsorted, undefined = uncontrolled
  defaultSort?: TableSort | undefined;
  onSortChange?(sort: TableSort | undefined): void;
  selected?: ReadonlyArray<string> | undefined; // controlled
  defaultSelected?: ReadonlyArray<string> | undefined;
  onSelectionChange?(selected: ReadonlyArray<string>): void;
  rowCount?: number | undefined; // only when the host windows its rows
  columnCount?: number | undefined; // only when it windows its columns
  labels?: { table?: string | undefined; selectAll?: string | undefined; selectRow?: ((id: string) => string) | undefined } | undefined;
  id?: string | undefined;
}): {
  selectionMode(): "none" | "single" | "multiple";
  sort(): TableSort | undefined;
  selected(): ReadonlyArray<string>;
  isSelected(id: string): boolean;
  tableProps: { "aria-label"; "aria-rowcount"; "aria-colcount" }; // the counts only while windowed
  captionProps: { id };
  headerCellProps(key: string): { scope: "col"; "aria-sort": "ascending" | "descending" | undefined; abbr };
  headerButtonProps(key: string): { type: "button"; onClick } | undefined; // undefined when not sortable
  rowProps(id: string): { "aria-selected"; onClick };
  cellProps(rowId: string, key: string): { "aria-colindex" }; // only while windowed
  selectAllProps: { role: "checkbox"; "aria-checked": "true" | "false" | "mixed"; "aria-label"; tabindex: 0; onClick; onKeyDown } | undefined;
  rowCheckboxProps(id: string): { role: "checkbox"; "aria-checked"; "aria-label"; tabindex: 0; onClick; onKeyDown } | undefined;
  toggleAll(): void;
  toggleRow(id: string): void;
};
```

`aria-sort` is carried by the sorted column only; a sortable header that is not sorted has none (ARIA's "not sorted" default), and a `sortable: false` column gets no button from `headerButtonProps` at all, so it is not a tab stop. The header button cycles `ascending` -> `descending` -> unsorted by default (so the table can be put back in its own order) and `ascending` <-> `descending` with `sortCycle: "toggle"` (what the APG grid example does); a new column always starts `ascending`, and only one is sorted. Sorting is the host's data: the primitive carries the descriptor and announces it, it never reorders a row.

`rows` may be a getter (`() => rows()`): it is read at attribute-read time, so a table whose rows arrive later keeps its sort and its selection instead of being rebuilt, and a selection made before the rows landed applies once they do. Selection is over ids, so it survives the host's re-sort. `rowProps` carries `aria-selected` and a click that selects; `toggleRow` / `toggleAll` are the programmatic path, and the row's checkbox stops its click from reaching the row so the two controls never toggle the same row twice. `selectAllProps` and `rowCheckboxProps` are `undefined` unless `selection` is `"multiple"` (one control over one selection is meaningless), and the select-all is a `role="checkbox"` rather than a native `input` because the mixed state a screen reader must hear is `aria-checked="mixed"`, not the DOM-only `indeterminate` property. It toggles the rows the table renders: a windowed table toggles its window and keeps the rest of the selection. A table that renders all of its rows and columns carries no `aria-rowcount` / `aria-colcount` (the markup already says it); pass them, and every cell gets its `aria-colindex`, only when the host windows. `numeric` is a layout hint for the host's skin: HTML has no attribute for it.

### Headless: `createTabs` (`@cssints/headless`)

The APG tablist as state and attribute objects: roving tabindex, wrapping arrows, Home/End, automatic or manual activation, disabled tabs, and a selection that is a request (`value` + `onValueChange`) or uncontrolled (`defaultSelected`). `packages/apg-specs/specs/apg/tabs.qnt` is its model; `packages/headless/test/tabs.browser.test.tsx` replays it in Chromium.

Its accessibility requirements are catalogued, gap by gap, in `packages/headless/docs/requirements/tabs.md` (the model is `packages/headless/docs/requirements/README.md`).

Close and rename are an **extension** (bean `cssints-gdv2`, the docs playground's file tabs), off by default so the plain tabs are untouched. The primitive owns no list: it asks (`onClose`, `onRename`), the host removes or renames. `packages/headless/test/tabs-close.browser.test.tsx` is their oracle.

```ts skip
createTabs(options?: {
  ...; // the plain tabs: items, value, defaultSelected, orientation, activation, disabled, focusablePanels, id, tabId, panelId, onValueChange
  closable?: boolean; // false: closeProps and the Delete key; the host removes from onClose
  renamable?: boolean; // false: a double click edits the label inline; the host renames from onRename
  label?(index: number): string | undefined; // the tab's name: the buttons' labels and the rename draft
  onClose?(index: number): void; // a request: the host removes the tab and may ignore it
  onRename?(index: number, label: string): void; // a request with a non-empty label
}): {
  ...;
  editing(): number | null; // the tab being renamed inline
  focusAfterClose(index: number): number; // the tab to focus once the removal landed
  closeProps(index): { "aria-label": string; tabindex: -1; onClick: () => void };
  renameProps(index): {
    onDblClick: () => void;
    editing(): boolean;
    begin(index: number): void;
    commit(label: string): void;
    cancel(): void;
    inputProps: { type: "text"; value; "aria-label"; onInput; onKeyDown; onBlur };
  };
};
```

- **Close.** `closeProps(index)` is the tab's close button: `aria-label="Close <label>"` and `tabindex=-1`, because a tablist's tab stops are its tabs; the keyboard path is Delete on the focused tab. Focus after a close goes to the tab that slid into the closed one's place, or to the previous tab when the last one closed: `focusAfterClose(index)` names that index in the shortened list (call it before the host removes the tab). Closing the last remaining tab is refused, as the spec refuses an empty tablist; a closed tab that was selected asks for the tab that takes the focus.
- **Rename.** A double click begins; the tab renders `inputProps` instead of its label. Enter commits, Escape reverts, blur commits, and a label that trims to nothing cancels. While editing, the input owns the keys: the tablist's roving does not move. `begin(index)` is the programmatic start, for a tab the host has just added (append it, then `focusTab(index)` and `begin(index)`).
- **Ids.** `tabId(index)` and `panelId(index)` replace the generated `${id}-tab-<index>` / `${id}-tabpanel-<index>`, and `aria-controls` / `aria-labelledby` follow them. Use them when the host's markup or a deep link already names a panel (`#logs`): the alternative is a second id on the same element, which no attribute can carry.
- **The host's list.** `items` is read from the option on every read, so the bounds, the roving tab stop and `firstEnabled` follow a host that shrinks its list. `label` is read lazily too, so a renamed tab renames its buttons with it.
- The spec models a `deletable` flavour (Delete, focus to the next tab, the last refused) but neither a rename nor the callbacks, so the browser test, not the model, holds the extension.

### Headless: `createHotkeys` (`@cssints/headless`)

One registry for the chords every app hand-rolls (`/` focuses search, Cmd/Ctrl+K opens it, Cmd/Ctrl+S saves). **A platform utility rather than a widget**: no APG pattern exists for a keyboard registry, so it has no role, no element, no styling, no Quint spec and no ported scenarios; `packages/headless/test/hotkeys.browser.test.tsx` is its oracle.

```ts skip
const hotkeys = createHotkeys({ isApple: false }); // isApple is injectable; default reads the platform
const unbind = hotkeys.bind({
  keys: "mod+k", // mod = Cmd on macOS, Ctrl elsewhere; then ctrl / alt / shift / meta, then one key
  onTrigger: (event) => search.focus(),
  when: () => dialog.open === false, // gates it: false makes the next matching binding fire
  preventDefault: true, // default; false lets the browser act too
  allowInEditable: false, // default; true fires with the focus in an input / textarea / contenteditable
  scope: panel, // only events from inside this element; it adds no listener
});
unbind(); // idempotent
hotkeys.dispose(); // unbinds all and removes the document listener; a later bind is a no-op
```

`keys` is a chord string: optional modifiers `mod`, `ctrl`, `alt`, `shift`, `meta`, then exactly one key (`k`, `/`, `?`, `escape`, `enter`, `arrowup`), joined with `+`. `mod` is resolved at `createHotkeys` time, once. A shifted character implies Shift (`"?"` fires from Shift+/, `"/"` does not), and the other modifiers must match the event exactly, so a chord without `shift` does not fire while Shift is held.

There is one `keydown` listener on the document in the capture phase, added when the first binding is bound and removed when the last is unbound or on `dispose`. The most recently bound match is the only one that fires, so a modal's `/` shadows the page's and unbinding it brings the page's back; a binding whose `when` returns false falls through to the next match instead of blocking it. By default a binding does not fire while the focus is in an `input`, a `textarea` or a `contenteditable` (an inherited one included) unless it sets `allowInEditable`. An unknown modifier or a chord with no key throws a `TypeError` at `bind`.

### Headless: `createScrollspy` (`@cssints/headless`)

A table of contents whose current entry is the last heading to reach the top of the scrollport, marked `aria-current="location"` on the link. **No APG pattern exists for a scrollspy**, so it has no Quint spec and no ported scenarios: the contract is WAI-ARIA (the `aria-current` value, `role="list"` / `role="listitem"`, a named navigation landmark) and HTML, and `packages/headless/test/scrollspy.browser.test.tsx` is its oracle.

```ts skip
createScrollspy(options: {
  entries: ReadonlyArray<{ id: string; label: string }>; // document order; the ids are the headings'
  offset?: number | undefined; // px below the scrollport's top edge where a heading counts as current; 0
  root?: (() => HTMLElement | undefined) | undefined; // the scroll container; the document by default
  onChange?(id: string | undefined): void;
}): {
  active(): string | undefined; // the last heading at or above the offset, else the first entry
  navProps: { "aria-label": string }; // "On this page"; override after the spread to translate
  listProps: { role: "list" };
  itemProps(id: string): { role: "listitem" };
  linkProps(id: string): { href: string; "aria-current": "location" | undefined }; // exactly one link is current
  attach(): () => void; // one passive scroll listener; returns the teardown
};
```

`attach()` adds **one passive `scroll` listener** to `root()`, which measures each heading's `getBoundingClientRect`, syncs once (a page opened mid-scroll starts correct), and returns the teardown. Not an `IntersectionObserver`: "the last heading at or above the offset" is a total order over all headings, while an observer reports only what crossed a band, so it has to rebuild that order from enter/leave state and misreports after a jump. Smooth scrolling is the host's (`scroll-behavior: smooth`, and any `prefers-reduced-motion` override): the links are plain `#id` targets and the primitive never moves the scrollport. The first entry is current before any scroll and while nothing has passed the line.

f812d87e (headless: a data table with sortable headers and row selection)

### Headless: `createCommandPalette` (`@cssints/headless`)

The first **composition**, not a new primitive and not a new spec: `createDialogModal` + `createTextInput` + `createStatus` wired into a palette. Its oracle is `packages/headless/test/command-palette.browser.test.tsx`. A palette is a dialog, **not a combobox**: choosing a row runs a command, so the field is `input[type=text][role=searchbox]` (no `aria-autocomplete`, no `aria-haspopup`), the container is `role=dialog` and the list is a `role=listbox`.

```ts skip
createCommandPalette(options: {
  commands: ReadonlyArray<{
    id: string;
    label: string;
    group?: string | undefined; // the heading the host renders
    keywords?: ReadonlyArray<string> | undefined; // also matched
    run(): void | Promise<void>;
  }>;
  open?: boolean | undefined; // controlled: the host owns the open state
  onOpenChange?(open: boolean): void;
  hotkey?: string | undefined; // the chord attach() binds; "mod+k"
  labels?: Partial<{
    title: string; // "Command palette"
    placeholder: string; // "Type a command"
    empty: string; // "No commands found"
    results(count: number): string; // "4 commands"
  }> | undefined;
}): {
  open(): boolean;
  openPalette(): void;
  closePalette(): void;
  query(): string;
  setQuery(text: string): void;
  active(): number; // index into results(); -1 = the field holds the highlight
  setActive(index: number): void;
  results(): ReadonlyArray<{ id: string; label: string; group: string | undefined }>;
  labels: { title: string; placeholder: string; empty: string; results(count: number): string };
  status(): string | undefined; // the count, in the polite region
  // inputProps, listProps, optionProps(id), emptyProps, statusProps,
  // dialogProps, backdropProps and titleProps: the attribute objects.
  runActive(): void | Promise<void>;
  attach(): () => void; // binds the hotkey on the document; returns the teardown
};
```

Focus stays in the field and `aria-activedescendant` names the highlighted option: ↓ on the last and ↑ on the first return the highlight to the field, and ↓/↑ from there re-enter at the first/last row. Home/End move the caret while the field has text and are list keys only while it is empty. Enter runs the highlight, Escape closes through the dialog, Tab is not intercepted. Filtering is a plain case-insensitive substring match over `label` and `keywords` — no fuzzy scoring, because a palette is short and ranking (recents, scopes) is the host's policy. `results()` keeps host order; `group` is what the host groups by; `emptyProps.hidden` and `labels.empty` are the empty state; the count is written to `statusProps` once per query, not on every arrow. The query and highlight reset on close, focus returns to the element that had it, and `runActive()` closes before `run()` so a command may open its own UI. Host's: rendering, grouping and CSS; async commands and their errors; every visible string via `labels`; any close other than Escape or a command. The filterable menu and the date picker are later compositions on the same research.

### Headless: `createPanZoom` (`@cssints/headless`)

**No APG pattern exists for pan-zoom**, so there is no Quint spec and no ported scenarios: `packages/headless/test/panzoom.browser.test.tsx`, a real Chromium viewport, is its oracle. The accessible contract is the three parts it returns: a focusable viewport (`role=group`, `tabindex=0`, `aria-roledescription="zoomable image"`, `aria-describedby` the value), keyboard operations that stand in for every gesture, and a polite live value. The pointer — drag to pan, two pointers to pinch, a double click to reset — is an addition, never the only way in. It is not `createCanvas`: that is a camera over an infinite world, this is one image fitted to a box.

```ts skip
createPanZoom(options?: {
  min?: number | undefined; // 1, and where reset returns
  max?: number | undefined; // 4
  step?: number | undefined; // the + / - increment, 0.25
  defaultScale?: number | undefined;
  scale?: number | undefined; // controlled: the host owns the scale
  onScaleChange?(scale: number): void;
  onPanChange?(offset: { x: number; y: number }): void;
  bounds?: "clamp" | "free" | undefined; // "clamp": the image never leaves a gap
  labels?: { viewport?: string | undefined } | undefined; // the viewport's name, "Image"
}): {
  scale(): number;
  offset(): { x: number; y: number };
  reset(): void; // back to min and centred
  zoomIn(): void;
  zoomOut(): void;
  setScale(scale: number, origin?: { x: number; y: number }): void; // origin in the viewport's own space, its centre by default
  viewportProps: {
    tabindex: 0;
    role: "group";
    "aria-roledescription": "zoomable image";
    "aria-label";
    "aria-describedby";
    onKeyDown; // + / = / - zoom, arrows pan by 24 px (Shift x4), 0 resets
    onWheel; // ctrl / meta only: the browser's pinch, zoomed about the cursor
    onPointerDown;
    onPointerMove;
    onPointerUp;
    onPointerCancel;
    onDblClick;
  };
  imageProps: { draggable: false; style: { transform: string } }; // translate(..) scale(..)
  valueProps: { id; role: "status"; "aria-live": "polite"; "aria-atomic": "true" };
  value(): string; // "150%"
};
```

Wheel zooms **only with `ctrl` / `meta`** held: the browser's pinch gesture arrives that way, and a bare wheel is left to the page so trackpad scrolling still works — a swallowed wheel is never acceptable. Arrows pan the image with the arrow (like a drag), and with `bounds: "clamp"` they are inert at `min`, where there is nothing to reveal. The clamp bounds the offset by half the viewport's scaled overflow, so the image is expected to fill the viewport at `min` (`width: 100%; height: 100%` / `object-fit: cover`); a letterboxed image cannot be held gap-free, and `bounds: "free"` lets it be dragged out of view instead. `valueProps` carries no `hidden` — a `hidden` live region is not announced — so the host hides it visually.

The host owns the box and the look: the viewport's size and `overflow: hidden`, `touch-action: none` if a touch drag should pan, `transform-origin: 50% 50%` (the default this maths assumes), and any transition on the transform. Controlled is `scale` + `onScaleChange`; the offset has no controlled prop, so a host that ignores a scale request also gets the offset resolved for the scale it refused. Not modelled: inertia, rotation, and pinching on platforms without `PointerEvent` (the browser's own pinch is the `ctrl+wheel` path).

### Headless: `createMenu` (`@cssints/headless`)

The APG menu family (`createMenu` for the menu button and the checkable menus, `createMenubar` for the roving bar) as state and attribute objects. Its behaviour is `specs/apg/menu-button.qnt` and `menu-checkable.qnt`, and `packages/headless/test/menu-button.browser.test.tsx` replays the generated models, ported scenarios and seeded differential walks against it.

```ts skip
createMenu(options: {
  items: ReadonlyArray<string | { label: string; kind?: "item" | "checkbox" | "radio"; checked?: boolean; disabled?: boolean }>;
  variant?: "plain" | "checkbox-items" | "radio-items" | "mixed" | undefined; // "plain"
  open?: boolean | undefined; // controlled: the host owns the open state
  defaultOpen?: boolean; // uncontrolled starting state
  onOpenChange?(open: boolean): void; // a request the host may ignore
  checked?: ReadonlyArray<number> | undefined; // controlled, readable: the checked checkbox item indices
  choice?: number | undefined; // controlled, readable: the chosen radio item, -1 for none
  value?: number | undefined; // controlled, packed view of the same state (checkboxItem0 * 5 + radioChoice, 1-based)
  defaultValue?: number; // the uncontrolled packed state at mount
  onCheckedValueChange?(value: number): void; // a packed request the host may ignore
  onCheckedValuesChange?(checked: ReadonlyArray<number>, choice: number): void; // the readable request
  triggerMode?: "outside" | "held" | undefined; // where the focus sits while the menu is closed
  disabled?: ReadonlyArray<number>; // focusable, never activated
  id?: string | undefined;
  onItemClick?(index: number): void;
}): {
  open(): boolean;
  focusLevel(): 0 | 1 | 2; // 0 outside, 1 on the trigger, 2 on an item
  focusIndex(): number;
  checked(): ReadonlyArray<number>; // the readable view of the checked state
  choice(): number; // the readable view of the radio choice
  value(): number; // the packed view of the same state
  openMenu(): void; // a request, like every intent
  closeMenu(): void;
  keyDown(key: string): void;
  // …items, triggerProps, menuProps, itemProps(index), type(), setFocusItem()
};
```

**The checked state has one store and two views.** The readable pair (`checked` + `choice`) is the store; `value` is derived from it as `menu-checkable.qnt`'s `checked(wrap, choice)` (one checkbox bit * 5 + the radio). The pack has one checkbox bit, so only the readable pair can name a checkbox beyond item 0. A host may own either view; each has its request (`onCheckedValuesChange(checked, choice)` and `onCheckedValueChange(value)`), and where both views are given the readable pair wins. `defaultChecked` / `defaultChoice` start the pair and `defaultValue` the packed side.

**The open state is a request/commit pair**, like every other controlled primitive: `open` (+ `onOpenChange`) makes the host own it, `defaultOpen` starts it. Every intent that opens or closes — the trigger's click and its keys, Escape, an item's activation, Tab, an outside click in a kit, the programmatic `openMenu` / `closeMenu` — is a request, so a host that holds `open` keeps the menu open and the focus where it was; `menu-button.qnt` reverts the whole transition of a rejected request, focus included. A write the host makes on its own is not a request: it takes the focus to the first item when it opens and to the trigger when it closes, and a write of the value it already has moves nothing (no widget can observe it).

### Headless: `createCombobox` (`@cssints/headless`)

The APG combobox as state and attribute objects: the select-only variant of `specs/apg/combobox-select-only.qnt`, with a listbox popup; `filter: true` turns typing into the autocomplete variant's prefix filter. The grid, tree and dialog popups the other combobox specs model are not this primitive (their models are walked against themselves). Its behaviour is `packages/headless/test/combobox.browser.test.tsx`: DOM focus never leaves the combobox, the popup's active option is announced through `aria-activedescendant`, and navigating never commits — Enter, Space, Tab, blur, Alt+ArrowUp, an option click or `setValue` do.

```ts skip
createCombobox(options: {
  options: ReadonlyArray<ComboboxOption | string>; // `{ value, label }`, or a string that is both
  value?: string | null | undefined; // controlled selection
  defaultSelectedValue?: string | null; // uncontrolled start (`defaultValue` is its alias)
  open?: boolean | undefined; // controlled popup
  defaultOpen?: boolean;
  autoComplete?: "none" | "list" | "both"; // "list"
  filter?: boolean; // false: single-letter typeahead; true: a prefix filter
  disabled?: boolean; // aria-disabled on the combobox and the trigger; a key, click, typed character, filter input and option click change nothing, no popup opens
  placeholder?: string;
  id?: string; // base of `<id>-input`, `-trigger`, `-listbox`, `-option-<i>`
  onOpenChange?(open: boolean): void; // a request the host may ignore
  onValueChange?(value: string | null): void; // a request the host may ignore
  onFocusRelease?(): void; // Tab: the host may blur its own DOM
}): {
  open(): boolean;
  activeIndex(): number; // index into `options()`; -1 = the visual focus on the combobox
  value(): string | null;
  focused(): boolean;
  query(): string; // the typeahead / filter text
  options(): ReadonlyArray<{ value; label; selected; id; props }>;
  setOpen(open: boolean): void; // a request
  setValue(value: string | null): void;
  comboboxProps: { id; role: "combobox"; value; "aria-autocomplete"; "aria-haspopup"; "aria-expanded"; "aria-controls"; "aria-activedescendant"; "aria-disabled"; onInput; onKeyDown; onFocus; onBlur; onClick };
  triggerProps: { id; type: "button"; tabindex: -1; "aria-haspopup"; "aria-expanded"; "aria-controls"; "aria-disabled"; onClick; onMouseDown };
  listboxProps: { id; role: "listbox"; hidden };
};
```

**`disabled` is a widget-level extension** (`combobox-select-only.qnt` lists it under its deliberate omissions and has no `disabled` var, so the DOM test is its oracle): a key, a click, a typeahead character, a filter input and an option click are dropped before they become a request, and no popup opens. It announces `aria-disabled` — not the native `disabled` — because the pattern puts the state on a `role="combobox"` element that is a button in the select-only example; the combobox keeps its tab stop (the pattern's focus contract), as `createButton` and `createSlider`'s thumb do. The trigger announces `aria-disabled` too. `setOpen` / `setValue` stay host requests, so a programmatic write still applies.

### Headless: `createCheckboxGroup` (`@cssints/headless`)

The APG Checkbox pattern's tri-state group controller: exactly three child values, a controller whose `aria-checked` is derived from them (all / none / mixed) with the optional "remember the last mixed combination" cycle, checked against `specs/apg/checkbox-group.qnt`. Its name, description and error are `createField`'s contract on the `role="group"` element, which the model leaves out on purpose (its header omits labelling), so `packages/headless/test/checkbox-group.browser.test.tsx` is their oracle.

```ts skip
createCheckboxGroup(options: {
  values: ReadonlyArray<T>; // exactly three
  value?: ReadonlyArray<T> | undefined; // controlled checked subset
  defaultValue?: ReadonlyArray<T>;
  parent?: boolean; // the "all" controller is a focus stop
  remember?: boolean; // the third activation restores the last mixed combination
  id?: string | undefined; // base of `<id>-control` (the group element), `<id>-0`..`-2` (the children) and `<id>-error`
  label?: string | undefined; // the group's name, as aria-label
  labelledby?: string | undefined; // the id of the host's own label element; wins over `label`
  describedby?: string | undefined; // host-owned description ids, after the error
  invalid?: boolean | string | undefined; // like createField: a string is the flag and the message
  error?: string | undefined; // the error shown; implies invalid, `invalid: false` silences it
  onValueChange?(checked: ReadonlyArray<T>): void;
}): {
  invalid(): boolean;
  error(): string | undefined; // only while invalid
  describedIds(): readonly string[]; // the error id while shown, then describedby
  groupProps: { id; role: "group"; "aria-label"; "aria-labelledby"; "aria-describedby"; "aria-invalid"; onKeyDown };
  errorProps: { id; hidden; role }; // role "alert" while shown; render it always
  // …children, parentChecked, checkedValues(), click(target), keySpace(), groupProps' onKeyDown
};
```

The group is not a `<label for>` target: pass `labelledby` naming the host's own label element, or `label` without one. The error id is in `aria-describedby` only while the error is shown, `aria-invalid` only while the group is invalid, and the group element's own id is there for a controller that names it with `aria-controls`. The children's ids follow the same base (`<base>-0`..`-2`), so two groups on one page do not collide (the model omits ids). The checked set is unchanged by all of this: the request/commit split and the spec stay as they were.

### Headless: `createSlider` and `createSpinbutton` (`@cssints/headless`)

The two number controls. Their behaviour is `packages/apg-specs/specs/apg/slider.qnt` and `spinbutton.qnt`, checked against the real DOM by the differential walk in `packages/headless/test/slider.browser.test.tsx` and `spinbutton.browser.test.tsx`. Options are plain and read lazily (a getter is fine); `value` + `onValueChange` make the widget controlled, `defaultValue` is the uncontrolled start.

```ts skip
createSlider(options?: {
  min?: number; // 0
  max?: number; // 10
  step?: number; // 1
  largeStep?: number; // 3: the jump of PageUp / PageDown
  value?: number | undefined; // controlled; undefined = uncontrolled
  defaultValue?: number; // 5, clamped into the range
  orientation?: "horizontal" | "vertical"; // "horizontal"
  direction?: "ltr" | "rtl"; // "ltr": under rtl the horizontal arrows flip
  disabled?: boolean; // aria-disabled on the thumb; a key or rail press changes nothing
  id?: string; // base of the thumb id
  onValueChange?(value: number): void; // a request the host may ignore
}): {
  value(): number;
  focused(): boolean;
  setValue(value: number): void;
  focus(): void;
  blur(): void;
  keyDown(key: string): boolean; // true when the key was consumed (preventDefault it)
  pointerDown(position: number): void; // a rail press or a drag move at a 0..1 fraction of the rail
  thumbProps: {
    id;
    role: "slider";
    "aria-valuenow";
    "aria-valuemin";
    "aria-valuemax";
    "aria-valuetext";
    "aria-orientation";
    "aria-disabled": "true" | undefined;
    tabindex: 0;
    onFocus;
    onBlur;
    onKeyDown;
    onPointerDown;
  };
  trackProps: { onPointerDown; onPointerMove; onPointerUp; onPointerCancel; onLostPointerCapture };
};
```

```ts skip
createSpinbutton(options?: {
  min?: number; // 1
  max?: number; // 12
  step?: number; // 1: the arrows and the buttons
  largeStep?: number; // 3: PageUp / PageDown
  value?: number | undefined; // controlled; undefined = uncontrolled
  defaultValue?: number; // 5, clamped into the range
  wrap?: boolean; // false: clamp at the bounds (true wraps)
  disabled?: boolean; // aria-disabled and the native disabled; keys, typing and both steppers change nothing
  id?: string; // base of the input and button ids
  onValueChange?(value: number): void; // a request the host may ignore
}): {
  value(): number;
  focused(): boolean;
  editing(): boolean;
  draft(): string;
  displayed(): string; // the draft while editing, else the value
  setValue(value: number): void;
  focus(): void;
  blur(): void; // commits a valid draft
  keyDown(key: string): boolean;
  typeInput(text: string): void; // replaces the draft; needs focus
  commit(): void;
  revert(): void;
  increment(): void;
  decrement(): void;
  setWrap(wrap: boolean): void;
  inputProps: {
    id;
    role: "spinbutton";
    "aria-valuenow";
    "aria-valuemin";
    "aria-valuemax";
    "aria-valuetext";
    "aria-invalid": "true" | undefined;
    "aria-disabled": "true" | undefined;
    disabled: boolean; // this is an <input>: the native attribute is a form control's disabled
    tabindex: 0;
    value;
    onFocus;
    onBlur;
    onKeyDown;
    onInput;
  };
  incrementProps: { role: "button"; tabindex: -1; "aria-label"; "aria-disabled"; onMouseDown; onClick };
  decrementProps: { role: "button"; tabindex: -1; "aria-label"; "aria-disabled"; onMouseDown; onClick };
};
```

`disabled` is **a widget-level extension of the APG patterns**, and the specs say so: `slider.qnt` lists it under its deliberate omissions, and `spinbutton.qnt` models the steppers' at-bound state only (`DisabledOnlyAtBound`). Neither machine has a `disabled` var, so the DOM tests, not the model, hold the primitive to these rules:

- a disabled slider **keeps the thumb as its tab stop** (`tabindex="0"`, the same choice `createButton` makes with `aria-disabled`) and announces `aria-disabled="true"` on the thumb; every key, rail press and drag is dropped before it becomes a request, so `onValueChange` never fires and `keyDown` returns `false` (nothing to preventDefault);
- a disabled spinbutton's field announces `aria-disabled` **and carries the native `disabled`** (the field is an `<input>`, so the platform's own form-control rule applies); the spin keys, the typed draft (Enter and blur included) and both steppers change nothing, and **both** steppers announce `aria-disabled="true"` — the at-bound rule of the spec stays, and a disabled widget adds the other side;
- both read the option on every attribute read, so a host may flip `disabled` on a mounted widget and the attributes and the guards follow in the same tick.

**Dragging** is the rail press repeated: `pointerdown` on the rail jumps the value to where it landed and starts a drag, and a press on the thumb starts the drag where the value already is (no jump, the thumb is there). While the pointer is held, every `pointermove` asks for the value of the pointer's position on the rail, rounded to `step` and clamped to `min`/`max`, in all four combinations of `orientation` and `direction`: up is more on a vertical rail, and a horizontal rail under `rtl` counts from its right edge, the same reflection the arrow keys use. `pointerup`, `pointercancel` or a lost capture ends the drag. The rail owns the gesture whichever element took the press, so the moves sit on `trackProps` and pointer capture keeps the drag alive off the rail: no document listener, and nothing to clean up on disposal. The thumb must be rendered inside the rail, because that is how its press reaches it. A drag is still a request: it fires `onValueChange` once per distinct value, and a controlled host that ignores the request keeps its value. `trackProps` carries no CSS, so a host that wants a drag instead of a text selection or a page scroll sets `touch-action: none` and `user-select: none` on the rail.

`specs/apg/slider.qnt` fixes a discrete rail press only, so the drag is a second deliberate extension and `slider.browser.test.tsx` is its oracle. The invariant the machine does not carry is **DragFollowsPointer**: while the pointer is held, `aria-valuenow` is the value of the pointer's current position (not an accumulation of moves, so returning the pointer to the press position returns the value), and no move after the release changes anything. The step grid and the clamp the drag shares with the press are the model's; the geometry is the DOM's, and the bridge hands the model a 0..1 fraction.

### Headless: `createSliderMultiThumb` (`@cssints/headless`)

The APG Slider (Multi-Thumb) pattern: two `role="slider"` thumbs on one rail, each bounded by its neighbour, so they cannot pass one another; equal values are allowed. Its behaviour is `packages/apg-specs/specs/apg/slider-multithumb.qnt`, checked against the real DOM by the differential walk in `packages/headless/test/slider-multithumb.browser.test.tsx`. The spec fixes two thumbs and one linked pair: the independent-thumbs variant, N thumbs, dragging, a nearest-thumb rail press and `disabled` are deliberate omissions (a press names its thumb). Options are plain and read lazily; `value` + `onValueChange` make the widget controlled.

```ts skip
createSliderMultiThumb(options?: {
  min?: number; // 0
  max?: number; // 10
  step?: number; // 1
  largeStep?: number; // 3: the jump of PageUp / PageDown
  value?: readonly [number, number] | undefined; // controlled; undefined = uncontrolled
  defaultValue?: readonly [number, number]; // [3, 7], clamped into the range and ordered
  orientation?: "horizontal" | "vertical"; // "horizontal"
  direction?: "ltr" | "rtl"; // "ltr": under rtl the horizontal arrows flip
  id?: string; // base of the thumb ids
  onValueChange?(values: readonly [number, number]): void; // a request the host may ignore
}): {
  values(): readonly [number, number];
  focused(): 0 | 1 | null;
  setValues(values: readonly [number, number]): void;
  pointerDown(index: 0 | 1, position: number): void; // a press at a 0..1 fraction of the track
  focusThumb(index: 0 | 1): void;
  blur(): void;
  keyDown(key: string): boolean; // true when the key was consumed (preventDefault it)
  thumbProps(index: 0 | 1): {
    id;
    role: "slider";
    "aria-valuenow"; // the thumb's value
    "aria-valuemin"; // the lower thumb: the range's minimum; the upper thumb: the lower value
    "aria-valuemax"; // the lower thumb: the upper value; the upper thumb: the range's maximum
    "aria-valuetext";
    "aria-orientation";
    tabindex: 0;
    onFocus;
    onBlur;
    onKeyDown;
  };
};
```

Both thumbs are tab stops in a fixed order (lower, then upper), whatever the values are. There is no `trackProps`: the primitive has no rail press, because a press has to name a thumb.

### Headless: `createKnob` (`@cssints/headless`)

A virtual knob after GarageBand's ([How Apple Designs a Virtual Knob](https://jherrm.github.io/knobs/)): spin around the centre, or slide vertically / horizontally, with one gesture locked per drag. **No APG pattern and no ARIA role exist for a dial**, so there is no Quint spec and no ported scenarios: `packages/headless/test/knob.browser.test.tsx` (real Chromium) is the oracle. The knob is a `role=slider` — the closest role WAI-ARIA has — with a polite live value; a numeric field must sit next to it, because a dial is never the only control. Options are plain and read lazily; `value` + `onValueChange` make the widget controlled.

```ts skip
createKnob(options?: {
  min?: number; // 0
  max?: number; // 100
  step?: number; // 1
  value?: number | undefined; // controlled; undefined = uncontrolled
  defaultValue?: number; // the middle of the range, quantised to step
  wrap?: boolean | undefined; // false: clamp at the bounds; true: continuous, past max wraps to min
  gesture?: "spin" | "slide" | "both" | undefined; // "both": locked per drag from the first movement
  labels?: { knob?: string | undefined } | undefined; // aria-label on the knob, "Knob" by default
  format?: ((value: number) => string) | undefined; // aria-valuetext, String by default
  id?: string | undefined; // base of the value region id
  onValueChange?(value: number): void; // a request the host may ignore
}): {
  value(): number;
  setValue(value: number): void; // a request
  percentOf(value: number): number; // the rotation fraction, 0..1 (× 360 for degrees)
  stepBy(delta: number): void; // a request
  knobProps: {
    role: "slider";
    tabindex: 0;
    "aria-valuemin";
    "aria-valuemax";
    "aria-valuenow";
    "aria-valuetext";
    "aria-label";
    onKeyDown;
    onPointerDown;
    onPointerMove;
    onPointerUp;
    onPointerCancel;
    onWheel;
  };
  valueProps: { id; role: "status"; "aria-live": "polite" };
};
```

**Gestures.** The first movement past 6 px picks the mode once: movement that stays on one axis (the other under 35% of it) is a slide, anything else is a turn around the centre, and `gesture: "spin"` / `"slide"` disables the other. The direction is the reference's "which side you turn": a vertical slide down turns clockwise (up in value) on the right half and counter-clockwise on the left half; a horizontal slide uses the same left/right side (the reference picks top/bottom for that one). A spin's value per degree shrinks with the pointer's distance from the centre — farther is finer. `percentOf` maps the value to the fraction of a full turn for the skin; `wrap` makes the dial continuous instead of clamped.

**Keyboard.** Arrows step, PageUp/PageDown move ten steps, Home/End jump to the bounds (no typing: the dial has no text entry). The wheel steps once per event and `preventDefault`s while the pointer is over the knob.

### Headless: `createDropZone` (`@cssints/headless`)

A file drop target. **There is no APG pattern and no Quint spec for a drop zone** — the contract is HTML's file input plus WAI-ARIA's live region — so `packages/headless/test/dropzone.browser.test.tsx` (real Chromium) is its oracle. It is the replacement for the bare `<input type="file">` fields of cms-admin's image field and kocharin's dashboard upload.

```ts skip
createDropZone(options: {
  accept?: string | undefined; // the HTML accept grammar: ".png", "image/png", "image/*"
  multiple?: boolean | undefined; // the input's multiple, and an accept of several files per drop
  maxSize?: number | undefined; // bytes; a larger file is rejected with "size"
  disabled?: boolean | undefined; // zone aria-disabled, native disabled input and button, drops ignored
  onFiles(files: File[]): void; // the accepted files of one batch; not called when none passed
  maxFiles?: number | undefined; // files taken from one batch; the rest are rejected with "count"
  onReject?({ file, reason }: { file: File; reason: "type" | "size" | "count" }): void; // once per refused file
  labels?: { zone?: string | undefined; labelledby?: string | undefined; browse?: string | undefined };
  formatMessage?(message: { total: number; accepted: number; rejected: ReadonlyArray<"type" | "size" | "count"> }): string | undefined; // the announcement in the host's language
}): {
  dragging(): boolean; // a drag is over the zone; a child's dragleave does not clear it
  message(): string | undefined; // "2 files, 1 rejected: too large"; undefined before the first batch
  inputProps: {
    id; // the id the browse button clicks
    type: "file";
    accept: string | undefined;
    multiple: true | undefined;
    disabled: true | undefined;
    hidden: true;
    onChange;
  };
  zoneProps: {
    role: "group";
    "aria-label": string | undefined;
    "aria-labelledby": string | undefined; // labels.labelledby: the host's own heading wins over aria-label
    "aria-disabled": "true" | undefined;
    onDragEnter;
    onDragOver;
    onDragLeave;
    onDrop;
  };
  browseProps: { type: "button"; disabled: true | undefined; "aria-disabled"; "aria-label"; onClick };
  statusProps: { role: "status"; "aria-live": "polite"; "aria-atomic": "true" };
};
```

Principles:

- **The zone is never drag-only.** `browseProps` spreads onto a real `<button type="button">` that clicks the hidden input, so the picker is the keyboard path (Enter and Space are the platform's) and a pointer user can click too. The drop handlers add nothing the button cannot do.
- **Validation happens once per file**, in the order type then size then count, with a reason the host can show: `onReject` gets the file and `"type" | "size" | "count"` (`maxFiles` limits what one batch takes), and `onFiles` gets the rest in one batch. A batch with nothing accepted calls `onFiles` not at all — not with an empty array.
- **A folder or an empty `DataTransfer` is a no-op** (Chromium marks a dropped directory as a `file` item whose `webkitGetAsEntry().isDirectory` is true): no callback, no rejection, and `message()` keeps the previous sentence.
- **`dragleave` counts.** A child's `dragleave` bubbles to the zone, so `dragging()` is a depth counter: it clears when the drag leaves the zone, or on a drop. It is the styling hook; the primitive writes no `data-dragging`.
- **`message()` is a default sentence for the host's status region** ("2 files, 1 rejected: too large", `undefined` before the first batch): the primitive tracks the counts of the last batch, the host decides the words. An app with a locale passes `formatMessage`, which gets the same counts (`total`, `accepted`, `rejected`) and returns the sentence to announce. Render `statusProps` once and keep it mounted, or a change of its text is not announced.
- Picking through the input is the same path as a drop and clears `input.value` afterwards, so choosing the same file twice fires `change` again.

### Headless: `createTimeline` (`@cssints/headless`)

Two modes over one axis. Without `rows` it is the package's demo tree of five fixed spans (collapsing, a zoom window, checked against `specs/apg/timeline.qnt` by the differential walk in `packages/headless/test/timeline.browser.test.tsx`). With `rows` it is a trace waterfall: real span data laid out in percentages of the rows' own extent. The rows mode has **no APG pattern** to follow, so its contract is `packages/headless/test/timeline-rows.browser.test.tsx`.

```ts skip
createTimeline(options: {
  rows: ReadonlyArray<{ id: string; label: string; start: number; end: number; depth?: number; status?: "ok" | "error" | "unset" }> | (() => ...); // in display order; a getter lets a trace arrive after mount
  axis?: { unit?: "ms" | "us" | "s" } | undefined; // "ms": the ruler's labels
  selected?: string | undefined; // controlled; undefined = uncontrolled
  onSelect?(id: string): void; // a request the host may ignore
}): {
  extent(): { start: number; end: number }; // min start, max end; { 0, 0 } when empty
  depthOf(id: string): number; // 0 for a root span
  listProps: { role: "list"; "aria-label": string };
  rowProps(id: string): { role: "listitem"; "aria-level": number; "aria-current": "true" | undefined; "data-status"; tabindex; onClick; onKeyDown };
  barProps(id: string): { "aria-hidden": "true"; style: { left; width; "--depth" } };
  labelProps(id: string): { style: { "--depth" } };
  rulerProps: { role: "presentation"; "aria-hidden": "true"; ticks: ReadonlyArray<{ value: number; left: number; label: string }> };
  select(id: string): void;
  selectedId(): string | undefined;
  focusedId(): string | undefined; // the row with the roving tab stop: the last one focused, else the first
};
```

`createTimeline()` with no `rows` keeps the tree API exactly as it was (`rows()`, `treeProps`, `rowProps`, zoom, collapse).

- **Role.** A waterfall is neither a tree (nothing collapses in rows mode) nor a grid (nothing is edited), and `aria-selected` is not allowed on a `listitem`. So the rows are `role="list"` / `role="listitem"`, the depth is `aria-level` (`depth + 1`, which `listitem` supports) and the selected row is `aria-current="true"`, which any element may carry. The demo tree keeps `role="tree"` / `"treeitem"` because it does collapse.
- **Geometry.** `extent()` is across every row, so a child span is a percentage of the whole trace: `barProps(id).style.left` / `.width` are percentages of it, and a zero-length span (`start === end`) still paints because every bar has a **0.5% width floor** — 2 px on a 400 px track, the floor the o11y dashboard used when it hand-rolled these rows. An empty extent (`{ 0, 0 }`) puts every bar at `left: 0%` with that floor rather than dividing by zero.
- **Depth is `--depth`** on `barProps` and `labelProps`, not nested DOM: the host indents with `padding-inline-start: calc(var(--depth) * 0.75rem)`, and the bar keeps its track when the panel is narrow.
- **Ruler.** `ticks` steps the extent by 1, 2 or 5 times a power of ten (about five ticks), each with `value` on the axis, `left` in percent and a `label` in the axis unit. The ruler element is decorative; the host renders ticks as its children.
- **Selection.** A click selects and moves the tab stop; ArrowUp / ArrowDown / Home / End move a roving tab stop; Enter or Space selects the focused row. The host moves real DOM focus after an arrow key, as the demo fixture does; `selected` + `onSelect` make it controlled, `select(id)` is the programmatic request.
- **`status` is `data-status`** on the row, a styling hook for the host's colour. The primitive never invents the label: the host's data holds it.

### Publishing a library (decided 2026-10-02, cssints-0l3f)

A package written on cssints ships JavaScript that still has the attribute, and its `.d.ts`. The app that installs it evaluates the package with its own engine: one sheet, the app's browserslist and themes, and a token, a kernel or an `@property` of the package is made once however many modules use it. Nothing is declared: the engine recognises a file by `with { type: "cssints" }`, the same marker as in app code.

```ts skip
// src/index.ts of the library
import { bg, cn, cv, hover, p } from "cssints" with { type: "cssints" };

import { t } from "./tokens.ts" with { type: "cssints" };

export { t };
export const card = cn(p(4), bg(t.color.brand));
export const button = cv({ base: cn(p(2), hover(bg("#1d4ed8"))) });
```

```ts skip
// in the app: the style is a class string, the token is imported with the attribute to be used or themed
import { createGlobalTheme } from "cssints" with { type: "cssints" };
import { button, card } from "my-ui";
import { t } from "my-ui" with { type: "cssints" };

createGlobalTheme(t, ".dark", { color: { brand: "#ef4444" } });
```

- **Build with tsdown** (`vp pack`), with `cssints` external and `dts: true`. tsdown keeps the import attributes, so there is no option to set. The built `.d.ts` types `button` as `(props?: …) => string`, with the props of its variants. Do not minify, bundle or transform the JS further with a tool that drops import attributes, and do not bundle `cssints` into it.
- **Keep in the package:** `cssints` in `peerDependencies` (the app needs it to build; a library that imports it must list it), the JS with the attributes, the `.d.ts` (it types `cssints` members as class strings and tokens as tokens, so the app is checked across the boundary), and no `.css` file: the library has no sheet of its own.
- **The app needs cssints and its plugin.** The package has no classes until the app's `cssints()` plugin has evaluated it, so an app without cssints cannot use it. Pre-compiled output (class strings plus a sheet fragment for apps without cssints) is not supported yet; it waits for a first user.
- **The package must be a direct dependency of the app.** `cssints/vite` reads the `package.json` of the app and of each of its dependencies, and for a dependency that lists `cssints` it adds the package to `optimizeDeps.exclude` (the dev optimizer would pre-bundle it with esbuild and drop the attributes) and to `ssr.noExternal` (the engine's runner would otherwise load it as native Node, which does not know the attribute). This is a few file reads at startup, one per dependency, and nothing else. A package that is only a dependency of another package is not found; add it to the app's own dependencies (or to those two options).
- **Dev and HMR.** The package's files go through the engine like app files, one evaluation per module, and are served as `/node_modules/…/index.js` with the classes replaced. They are never watched, so a package does not change during `vite dev`: restart the server after reinstalling it.
- A file of a package that does not carry the attribute is never parsed by the engine.

### Leaving files alone: `exclude` (decided 2026-10-10, cssints-ci7n)

A file outside `node_modules` is a site module when its code mentions `cssints` (a name, a comment, `cssints/plugin`), with or without the attribute: that is how a forgotten attribute is found and told as an error. So the source of a plugin package, or of the engine, that a project bundles as code is also read as a site module, and fails (`import { CSSStyleValue } from "cssints"` is "without the attribute"). `exclude` names such files; the plugin does not transform, evaluate or drop them, in a build, on the dev server and in the private server of a build.

```ts skip
cssints({ exclude: ["**/packages/*/src/**", /\/vendor\//] });
```

- **Vite's filter style.** `string | RegExp | ReadonlyArray<string | RegExp>`, read as `createFilter` reads `exclude`: a picomatch glob (a relative one from the working directory) or a RegExp, matched on the module's file. There is no `include`: the rule of the attribute and of the mention already says which files are sites, and a list of the files to keep would only repeat it.
- **Nothing changes without it.** The default is no file excluded, so an app, a plugin package's own tests and the packages in `node_modules` behave as before, and a build pays one empty check per module. The attribute is not made the only marker: that would turn the forgotten-attribute error into a `css` that is `undefined` in the browser.
- **An excluded file stays plain code.** If it also carries `with { type: "cssints" }` imports, it is not evaluated either; exclude only files that are not sites.

### Debugging: from a class to its call (dev source map, cssints-0a3p)

In dev the sheet has a source map: each rule with a class points at the first `css.*` call that made the class, so Chrome's Styles pane names that file and line beside `._tlfnko` and opens it in Sources. Vite drops CSS maps in dev unless you turn them on:

```ts skip
export default defineConfig({ plugins: [cssints()], css: { devSourcemap: true } });
```

A class is a hash of its declaration, so a class that many calls share points at its first call in the module that comes first by path. The place is the whole site (`cn(...)`, a member call), not the argument inside it. Token, theme and `@property` rules carry no class and map nowhere.

A build maps the sheet too, when the app asks for maps (`build: { sourcemap: true }`, `"hidden"` or `"inline"`, as for its JS): the CSS asset that holds the sheet gets `<file>.css.map` and a `sourceMappingURL` comment (`"hidden"`: the file only; `"inline"`: a data URL). Vite writes no CSS map in a build, so cssints maps the asset as written, after LightningCSS and the minify: each rule with a class points at its call, the rest maps nowhere. Bundle analysers read it to split the sheet's bytes by module (docs/research/devtools.md: Sonda). Without `build.sourcemap` nothing is recorded and the output is unchanged. Devtools that read the CSSOM (atomic-css-devtools) see the sheet as any other; what they miss is in docs/research/devtools.md.

### Debugging: the devtools overlay (`@cssints/devtools`, decided 2026-10-09, cssints-cncb)

An inspector in the page, built on what the dev server knows of every class. In dev only, unless the app asks for it in a build too (below). Install `@cssints/devtools` as a dev dependency of the app and turn it on:

```ts skip
export default defineConfig({ plugins: [cssints({ devtools: true })] });
```

Alt+Shift+C, or the `cssints` button in the bottom right corner, opens it. Hovering an element previews it, a click picks it; ↑ is the parent, ↓ the first child, ← and → the siblings; Esc stops picking, then closes. For the demo's action button, hovered in a 1300 px window, the panel shows:

```text skip
button                                                   pick  ↑  ×
CLASSES BY CALL
src/components/Showcase.tsx:72 ↗
._1t8gqy5  padding: 0.5rem                                       _.a
._1r802m6  background-color: color-mix(…, black 15%)  :hover     _.b
._pb21ov   background-color: color-mix(…, black 30%)  @media (width >= 60rem) :hover   _.c
._tw1yer   outline: 2px solid var(--color-accent)  :focus-visible (not now)            _.b
PROPERTIES
background-color  color-mix(in oklab, var(--color-accent), black 30%)   ✓
  ._pb21ov:hover _.c  @media (width >= 60rem) :hover
  background-color: var(--color-accent) ._ijw0jd _.a                    (struck through)
  background-color: color-mix(…, black 15%) ._1r802m6:hover _.b         (struck through)
outline  nothing applies now
  outline: 2px solid var(--color-accent) ._tw1yer:focus-visible _.b  :focus-visible
TOKENS
--color-accent  rgb(29, 78, 216)  color.accent
  the initial value of its @property
```

- **Classes by call.** The element's classes, grouped by the `css.*` call that made them (`cn(...)`, a member), the call that covers most of them first; the link opens the file at that line through Vite's `/__open-in-editor`, and the call's source is shown under it. Each class shows its declarations, its conditions (green: holds now) and its layer; a marker shows its kernel (`marker of kernel frame.core`), a member's class its scope (`(frame)`); a class that is not cssints' is listed as such.
- **Readable classes (dev only, decided 2026-10-12, cssints-12tp).** With `devtools` on in the dev server, the plugin adds one class to the string of each `cn(...)` and `cv({...})` site, to find an element in the DOM inspector and in the panel: `cs-<owner>[-<label>]`. The owner is the nearest enclosing function or class with a PascalCase name (`Landing`, `Button`), else the file's name (`page` for `landing/page.ts`; `index.ts` takes its folder's). The label is what the call is assigned to: a variable, an object property, a class field or method, a helper function that returns it, or a JSX attribute other than `class` and `className` (`<Tone tone={cn(...)}>` gives `cs-Button-tone`); no label if there is none. So `const logo = cn(...)` at the top of `landing/page.ts` gives `cs-page-logo`, inside `function Landing()` `cs-Landing-logo`, and `<div class={cn(...)}>` in `Button` `cs-Button`. Only `[A-Za-z0-9_-]`, an owner and a label cut at 24 and 20 characters. The name comes from where the call stands, so editing code elsewhere does not change it; two calls in one place can share a name. A call whose shape has no name to read still gets its file's name; a `css.p(4)` or other member on its own, and a `cn` inside the runtime arguments of another `cn`, get none. The `cs-` prefix keeps it off the app's own classes. It is text in the module the browser gets and nothing else: not in the hashes, the dedupe, the `drops` of a `cn` with runtime arguments or of a `cv` (it stays a static class, never dropped), the sheet or the table. The panel shows it first in its bar and in the hover tag, and the prompt's `Classes:` line lists it with the others. A build, a dev server without `devtools`, and the `ssr` environment (where the plugin evaluates; its modules hold calls, not class strings) are byte-identical to before.
- **Properties.** Per property, the winning declaration, what it beat (struck through) and what does not apply now, with the condition that fails. The winner is the highest by **layer, then specificity, then the sheet's order**, among the rules that apply: a rule applies when its selector matches the element now and each of its at-rules holds for it, which the browser decides (a probe sheet around the element, so `@container`, `@container style()`, `@supports` and `@scope` are evaluated where the element is). A shorthand counts for each of its longhands: `padding` beside a `padding-left` of a higher layer says `except padding-left`. Kernels and global rules in `_.k`, themes and looks in their layers are rules like the others.
- **Checked against the browser.** Each winner is set inline on a childless clone of the element, in its place, and the clone's computed value must equal the element's: ✓. When it does not (✗), the panel says why: the element's `style` attribute, a rule of another sheet (a rule outside every layer beats every layer, cssints' too: `.mine { color: … } in src/inspect.css beats it`), or a running animation. A value that depends on the element's content (`width: auto`, grid tracks) is `?`, not checked. A custom property is checked with its declaration as the page's sheet has it, since LightningCSS reprints it (`0.04` as `.04`) and an unregistered one computes to its tokens as written (cssints-g3u1).
- **Tokens.** Each custom property the element's rules read: its value on the element, its path (`color.surface`), and the rule that sets it on the element or the nearest ancestor (a theme, a look in `@scope`, a member's class).
- **How it gets the data.** Over Vite's HMR channel, no endpoint: the overlay asks for the table (`cssints:devtools:get`) and the server builds it from its own records: the sheet as it serves it, each class's rule, plugin and tokens, and the place of every call. After each transform the server says the table is stale, and an open overlay asks again.
- **Nothing in a build, unless asked.** `devtools: true` adds a plugin with `apply: "serve"`; `vite build` has no entry, no script and no event of it (packages/devtools/test/build.mjs builds the demo with the option on and searches the output).
- **In a build: `devtools: "build"`.** The same overlay on the built site, for a project whose code is public or whose readers want to see how a page is styled (this site has it on). The build writes the table once every module is transformed, as a JSON asset (`assets/cssints-devtools-<hash>.json`: the sheet, the classes, the tokens, the sites), puts the overlay in a chunk of its own, and adds a loader to the entry: a `cssints` button and Alt+Shift+C, under 1 kB. Nothing else loads until the first open; then the overlay and the table do, and the panel opens. The table is static, so there is no stale state and no update. A site is its file relative to the project, the line and the call's source, shown as text: there is no link to an editor, and none to a repository. This site's table is 70 kB (12 kB gzip), the overlay 190 kB (64 kB gzip), the entry grows by 0.85 kB (0.4 kB gzip). The option needs `@cssints/devtools` installed like the dev one; without it the page logs a warning in the console on the first open.
- **Ask OpenCode: `opencode` (dev only, off by default, cssints-ro4k, 2026-10-10).** With a picked element the panel can have a prompt box: type a change, Enter sends. It is a second option, because it starts a coding agent in your repository and must be asked for by name:

  ```ts skip
  cssints({ devtools: true, opencode: true });
  // or: opencode: { agent: "build", skills: ["cssints"] }
  ```

  The dev server, never the page, talks to the OpenCode V2 service that is running on the machine (the one `opencode serve --service` and the desktop app register; found with `Service.discover` of `@opencode/client`, so the page holds no address and no credentials). It sends the prompt to the session that the OpenCode command `/cssints-devtools` attached to this dev server (the plugin is `@cssints/devtools/opencode`, loaded from `.opencode/plugins/`; the files they share are in `<repository>/node_modules/.cache/cssints-devtools/`), or, with none attached, creates a session in the workspace root (the nearest folder up from the Vite root with a `.git`) and sends it there, waits for the session to end, and tells the overlay the status over the same HMR channel (`cssints:devtools:ask` from the page, `cssints:devtools:asked` back: no route that another origin could post to). The box shows `sending`, then `running · ses_…`, then `completed`, `failed` or `interrupted`; with no service running it says so and keeps your text. `@opencode/client` is an optional peer dependency: install it in the app (the message names it when it is missing). The prompt is made of cssints' own data, not source markers added to the markup, and is bounded (8 call sites, 24 properties, 3 beaten declarations each, 12 tokens, a call cut at 400 characters; the server cuts the whole at 16000):

  ```text skip
  Change the UI of the running app as the instruction says.
  The styles are written with cssints: each `css.*` call below produced the classes of the element,
  so edit those calls (or the markup that uses them), not the generated class names.

  Instruction: make it bigger

  Element: <p#p>
  DOM path: html > body > p#p
  Text: hello
  Classes: _aasmd7 _1t8gqy5

  Styled by (file:line, the call as written):
  - main.ts:5
    color("rebeccapurple")
  - main.ts:5
    p(2)

  Properties now (the winner, then what it beat):
  - color: rebeccapurple from ._aasmd7 (_.a)
  - padding: 0.5rem from ._1t8gqy5 (_.a)
  ```

  A build has none of it: the server side is in the `apply: "serve"` plugin, and `devtools: "build"` with `opencode` on still gives a loader without a way to ask (the dormant box is part of the overlay chunk, about 1 kB). The idea and the V2 client calls follow brendonovich/vite-plugin-opencode (MIT).

- **Its own styles do not touch yours.** The overlay is a custom element with a shadow root and its own cssints sheet, built with the package: the page's rules do not reach it, and its classes are not in your sheet or in the table.
- **Limits.** The proximity of `@scope` is not ranked (no two looks set one property on one element), and a logical and a physical property (`margin-inline-start`, `margin-left`) are two properties, as `cn()` treats them; an element inside another shadow root is picked as its host; a page that Vite does not serve as HTML (server rendering) gets no entry.

### Debugging: traces of the engine (`CSSINTS_TRACE`, cssints-r2qq)

Opt-in. Set `CSSINTS_TRACE=otlp` (or `otlp:http://host:port`; the default is `http://localhost:4318`) before `vite dev` or `vite build`, and the plugin sends one trace per Vite hook to an OpenTelemetry backend over OTLP/HTTP (JSON). Unset, nothing is loaded and nothing runs: the hooks use Effect's own `runSync` and `runPromiseExit`, no tracer, no exporter, no HTTP client. The variable is read once, when the plugin loads.

```bash
docker run -d --rm --name cssints-jaeger -p 16686:16686 -p 4318:4318 jaegertracing/all-in-one:latest
CSSINTS_TRACE=otlp bun run build        # or: CSSINTS_TRACE=otlp bun run dev, then edit a file
open http://localhost:16686             # service "cssints"; docker stop cssints-jaeger when done
```

Jaeger takes traces only, which is all there is: a warning or an error is an event on the span of its hook, not a log. Another OTLP backend (Grafana Tempo, `grafana/otel-lgtm`, any collector) works the same way through `CSSINTS_TRACE=otlp:<its OTLP/HTTP base URL>`.

- **One root span per hook**, with the file as the `file` attribute (and `environment` for `vite.transform`): `vite.transform` (a module; the `ssr` ones are the Module Runner loading helpers and the library), `vite.hotUpdate`, `vite.load` (the sheet in dev), `vite.renderChunk`, `vite.buildStart`, `vite.buildEnd`, `vite.closeBundle`.
- **Under it**, the engine's own spans: `cssints.instrument` (the parse), `cssints.clientTransform`, `cssints.evaluate` (waiting for the evaluation lock, then the run) with `cssints.runner.import` (the module running in the Vite Module Runner: its time is the app's code and the engine's work per site), `cssints.renderSheet`, `cssints.lightningcss` and `cssints.cssPost` (Vite's CSS pipeline on the sheet: LightningCSS, then minify), `cssints.locate`.
- **Events:** `cssints.warning` (message, file of the transform; Vite gets the warning's own site) and `cssints.error` (message, file, offset). An error that reaches Vite has `traceId` and `spanId`, and ends its message with `(trace <id>)`: search for that id in the backend.
- **Not traced:** the work per site and per declaration (`__at`, `__site`, the twin, the hash): at a few µs each, a span per call would be the cost it is meant to find. Read the `cssints.runner.import` span for their total.

The process must end the exporter or Node stays alive: `vite build` and `server.close()` do it (the `closeBundle` hook flushes and stops it); a script that exits by itself calls `closeTrace()` from `cssints/src/trace.ts` first. A backend that is not there costs a retry of up to three seconds at the end and loses the trace, nothing else.

`packages/cssints/test/trace.mjs` (in `bun run test`) checks the spans, the file attribute and the error's trace id against an in-process collector. `node packages/cssints/test/trace-live.mjs` builds apps/csssky and runs its HMR test traced, then reads both traces back through Jaeger's API (`GET /api/traces?service=cssints`) and prints span counts and the slowest hooks; it skips when no backend answers. Effect's DevTools (the VS Code extension, `effect/devtools`) is not wired: it needs the editor's extension listening, so neither a script nor an agent can read it.

### Debugging: the limit of an evaluation (`CSSINTS_EVAL_TIMEOUT`, cssints-joex)

A module is evaluated with all it imports in at most 30 seconds, else the build fails with `cssints: evaluating <file> took more than 30 seconds`. The engine cannot stop the code, so it closes the Module Runner: the evaluation ends at the next module it would load, and the next evaluation starts on a new runner. `CSSINTS_EVAL_TIMEOUT=<milliseconds>` changes the limit (read once, when the plugin loads); it is for tests that run on a busy machine, and the default is the one for your code.

### Checks for tools: `cssints/check` (2026-10-09, cssints-p3d2)

The engine's own checks, as functions, for a tool that answers as a build would (`@cssints/mcp`). Node only (culori, LightningCSS): nothing here reaches a browser, and user code has no reason to import it. Each returns an Effect.

```ts
import { contrast } from "cssints/check";
import { Effect } from "effect";

const { ratio, text } = await Effect.runPromise(contrast("#777", "white"));
// ratio 4.478…, text "4.47": cut, not rounded, as the message of css.check.contrast prints it
```

- **`contrast(foreground, background)`** is the WCAG 2.x ratio of `css.check.contrast` (see Themes): culori reads the colour, one outside sRGB is clipped to it. A colour it cannot read (`currentColor`, a `var()`) or a translucent one fails with a `ContrastError` (`colour`, `message`).
- **`loweredOf(property, value, warning)`** answers what a build asks before it says a support warning ("No warning for what LightningCSS lowers", under Errors): the value of the first declaration LightningCSS writes for the targets of the warning, or `undefined` when it leaves the feature in place (`text-wrap`, a `var()` inside the value). `warning` is one of `support()` of `@cssints/css-grammar/support`; a custom property is `--name`. For `color: oklch(70% 0.2 330)` and chrome 100 it is a hex colour, so a build does not warn.

### TUI: `cssints/tui` (decided 2026-10-10, cssints-3ff7; deprecated 2026-10-21)

> **Deprecated.** The members below still compile, and `@cssints/tui` still applies them, but importing it now prints
> one warning, and the package will not get new members. A terminal app builds on
> [`native/`](../native/README.md) in this repository instead: `native/terminal` takes `cssints/clay` styles
> (`generator/clay-header.ts` → a C header), lays them out with [Clay](https://github.com/nicbarker/clay) and draws them
> into character cells on [termbox2](https://github.com/termbox/termbox2), with the keyboard focus layer in C
> (`terminal/focus.c`). What carries over and what does not, and the commands that run it, are in
> [packages/tui/README.md](../packages/tui/README.md); `native/docs/map.md` step 6 is the full account.

A terminal app writes its styles with `cssints/tui`, and the same Vite plugin compiles them to **prop objects** for terminal renderables, not to classes: there is no sheet and no cascade. `@cssints/tui` applies them (states, the mouse pointer, the caret, themes); its adapters are [OpenTUI](https://opentui.com) and [@bomb.sh/tty](https://bomb.sh/docs/tty/api/). The design, the full property table and what is out of scope are in [research/tui.md](research/tui.md).

```ts
import * as css from "cssints/tui" with { type: "cssints" };

const t = css.createTokens({
  color: { $type: "color", bg: { $value: "#1e1e2e" }, accent: { $value: "#89b4fa" } },
});
css.createGlobalTheme(t, "light", { color: { bg: "#eff1f5", accent: "#1e66f5" } });

export const button = css.cn(
  css.border("rounded", "#585b70"),
  css.p(0, 1),
  css.width(12),
  css.bg(t.color.bg),
  css.cursor("pointer"),
  css.hover(css.borderColor(t.color.accent)),
  css.active(css.borderStyle("double")),
);
css.width("10rem"); // error: a terminal counts cells
css.boxShadow("0 0 1px red"); // error: no such member in a terminal
css.color("blu"); // error: not a colour
```

```ts skip
export const button = {
  border: true,
  borderStyle: "rounded",
  borderColor: "#585b70",
  paddingTop: 0,
  paddingRight: 1,
  paddingBottom: 0,
  paddingLeft: 1,
  width: 12,
  backgroundColor: "#1e1e2e",
  cursor: "pointer",
  ":hover": { borderColor: "#89b4fa" },
  ":active": { border: true, borderStyle: "double" },
  themes: { light: { backgroundColor: "#eff1f5", ":hover": { borderColor: "#1e66f5" } } },
  vars: { backgroundColor: "color-bg", ":hover": { borderColor: "color-accent" } },
};
```

```tsx skip
import { attach, setTheme, use } from "@cssints/tui/opentui";

<box {...use(button)}>
  <text>Save</text>
</box>; // Solid or React: the spread is a ref that calls attach
<text {...use(() => (active() ? tabActive : tab))}>Home</text>; // a style that changes: an accessor
attach(new BoxRenderable(renderer, {}), button); // core
setTheme("light");
```

- **Opt-in** is the import: an attributed import of `cssints/tui` gives the terminal members; a site that holds one of their values becomes an object literal. A web module is untouched (its sites never reach the terminal case), and one file may hold both. A Bun app is an SSR build (`vite build --ssr`), or a build of an environment of its own: the plugin replaces the sites in the `ssr` environment of a build too, since it evaluates them on a server of its own. That server resolves as the dev server's `ssr` environment does: with the app's `resolve.alias` and the conditions of its `ssr` environment, so a style module may import what an alias names (2026-10-10, cssints-qnif).
- **Members** are the properties a terminal has: `color`, `backgroundColor`/`bg`, `borderColor`, `border(style, color?)`, `borderStyle` (`solid`, `double`, `rounded`, `heavy`, `none`), `fontWeight` (`bold`, `normal`, `lighter` for dim), `fontStyle`, `textDecoration`, `textAlign`, padding and margin (with `p`, `m` and the side names), `gap`, sizes, flex (Yoga), `position` and its edges, `overflow`, `display` (`flex`, `none`), `opacity`, `zIndex`, `cursor`, `caretShape`, `caretColor`, `caretAnimation`, and `cn`, `hover`, `focus`, `active`, `createTokens`, `createGlobalTheme`. Any other property is not a member, so a type error.
- **Cells.** A number is a cell (columns across, rows down); `N%` is of the parent; `auto` where Yoga takes it. A CSS length is a type error and a build error (`cssints: width: a terminal counts cells: write a number, not "10rem"`): no unit is converted.
- **Colours** are checked by the web's `color` grammar in the types, read at build time and written as `#rrggbb` (`#rrggbbaa` when translucent). `currentColor`, system colours and `light-dark()` are build errors.
- **`cn()`** merges in argument order (a later prop wins). States wrap styles and do not nest; the runtime lays `:hover`, then `:focus`, then `:active` over the props.
- **Themes.** A theme is named by its selector argument (`"light"`). Every colour token is resolved at build time, per theme, aliases and derived tokens included; the site holds the default values and, under `themes`, what each theme changes. `setTheme(name)` swaps them on every attached renderable; `""` is the default. A theme under `media()` is not read.
- **Terminal tokens are not the sheet's** (cssints-0s1z, 2026-10-11). The `createTokens` and `createGlobalTheme` of `cssints/tui` keep their tokens and themes in tables of their own: no `@property` rule, no `:root` rule and no theme reaches a stylesheet, and a web token of the same name in the same build (`--color-bg` of the site and of a terminal app) is another token, with no clash. A terminal style reads terminal tokens and themes only; a web style reads web ones only. Two terminal modules that give one token name two values are an error, as on the web (`--color-bg is already declared with another @property`). A set of one `createTokens` given to the other's `createGlobalTheme` is a build error at the call that names the right import (`these are web tokens of "cssints": theme them with the createGlobalTheme of "cssints"`, and the other way round; 2026-10-11, cssints-v872). A token set still ships as `var(--name)` strings, which the system theme reads.
- **The adapter.** `attach(renderable, style)` sets the props (`color` is OpenTUI's `fg`, the text attributes are the bits of `attributes`, the caret is an editable's `cursorStyle` and `cursorColor`), follows `over`/`out`, `down`/`up` and `focused`/`blurred`, and sets the mouse pointer of `cursor` on over and `default` on out. A prop the renderable lacks is not set. A focused renderable draws colours of its own (a box `focusedBorderColor`, also while a descendant has the focus; an editable or a select `focusedBackgroundColor` and `focusedTextColor`): each follows the style's `borderColor`, `backgroundColor` and `color` in the current state, theme included, so a focused box draws its `:focus` border, not OpenTUI's `#00AAFF` (2026-10-10, cssints-pkpg). On an editable or a select, `color` is `textColor`. A text node (`<span>`, `<a>`, `<b>` of `@opentui/solid`: a `TextNodeRenderable`) takes the props (`fg`, `bg`, `attributes`) and the theme, not the states: it has no mouse events and no focus, so `:hover` belongs on the `<text>` around it; its theme listener stops when it is destroyed, as `@opentui/solid` does with what it removes (2026-10-10, cssints-5vnf). To change the style of a renderable, attach it again: `attach(r, next)` on a renderable it has attached swaps the style and keeps the states, the theme and the hooks; a prop only the old style set goes back to the renderable's own value (OpenTUI's default, or the element's own prop), the `focused*` colours follow, and under the mouse the pointer turns to the new `cursor` (or `default`). `use()` takes a style or an accessor, `use(() => (active() ? a : b))`: Solid calls a ref in a render effect, so the signals the accessor reads run it again and each run swaps the style; React calls the new ref of each render, which swaps it too and no longer stacks the hooks. The adapter imports no framework (2026-10-10, cssints-332g). `resolve(style, state, theme)` of `@cssints/tui` is the renderer-neutral part, for other adapters.
- **The bomb.sh adapter** (cssints-kotl, 2026-10-10). `@cssints/tui/bomb` is for [@bomb.sh/tty](https://bomb.sh/docs/tty/api/), where a frame is a list of ops: `createTracker()` gives `ui.open(id, style, extra?)` and `ui.text(content, style, id?, extra?)`, the ops with the options of the style in the state of that element id, and `ui.render(term, build, { pointer })`, which reads the frame's `pointerenter`/`pointerleave` events and a press of `pointer.down`, draws the frame again when a state changed, and adds the OSC 22 pointer of `cursor` and the caret (DECSCUSR, OSC 12) of the element of `ui.focus(id)`; `ui.reset()` gives them back on exit. Sizes are `fixed`, `percent`, `fit`, and `grow` for `flexGrow`; `rounded` is a corner radius; `double` and `heavy` are drawn single; margins, `flexShrink`, `flexBasis`, `flexWrap`, `alignSelf`, `opacity` and `space-*` are not drawn (the table is in research/tui.md). `openProps(props)` and `textProps(props)` are the plain mapping of `resolve()`.

```ts skip
import { close, createTerm } from "@bomb.sh/tty";
import { createTracker } from "@cssints/tui/bomb";

const term = await createTerm({ width: 80, height: 24 });
const ui = createTracker();
const build = () => [ui.open("save", button), ui.text("Save", label, "save"), close()];
process.stdout.write(ui.render(term, build, { pointer: { x, y, down } }).output);
```

- **The system theme** (cssints-q1j3, 2026-10-10). A theme computed at run time from the terminal's own colours, after [Pi's](https://earendil.com/posts/system-theme/). `createSystemTheme(tokens, roles, options?)` of `@cssints/tui/system` makes each colour token a **role**: a hue source (`hue`: an ANSI name, `black` … `brightWhite`, or the terminal's `fg`/`bg`) and contrast rules (`on`: the tokens it sits on, `contrast`: the WCAG 2 ratio). A text role keeps its source colour when it meets every rule, else takes the lightness of the strictest one (the reversed WCAG ratio, bisected in OKHSL at the source's hue and saturation, the saturation falling off toward black and white, the OKLCH chroma capped at the source's); a `surface` is placed at exactly `contrast` from its first `on`, toward the foreground, or is the terminal's background without one. `followSystemTheme` of each adapter asks the terminal (OSC 10, 11 and 4 for the 16 colours, the colour-scheme report), sets the theme with the fallback at once, resolves after the replies or 100 ms, applies a late reply when it comes, and rebuilds on an appearance change (mode 2031). Light or dark: the reported background, else the scheme report (`CSI ? 997 n`; OpenTUI's `themeMode`), else `COLORFGBG`, else dark. A terminal that reports its background only gets the app's hues (`options.hues`) placed for it; one that reports nothing gets ANSI indices and its default colours on OpenTUI (`ansi:N`, `default`, drawn by the terminal; a role's `ansi` picks the index), and the static theme of its appearance on bomb.sh, which has no indexed colour. A token without a role keeps the value of the static theme `options.themes[appearance]`.

```ts skip
// theme.ts: run time, not a cssints module
import { createSystemTheme } from "@cssints/tui/system";
import { t } from "./styles.ts";

export const system = createSystemTheme(
  t,
  {
    color: {
      bg: { surface: true },
      card: { surface: true, on: [t.color.bg], contrast: 1.1 },
      text: { hue: "fg", on: [t.color.bg, t.color.card], contrast: 7 },
      accent: { hue: "blue", on: [t.color.bg, t.color.card], contrast: 3 },
    },
  },
  { themes: { light: "light" } },
);

// OpenTUI: renderer.getPalette() and its theme_mode event
await followSystemTheme(await createCliRenderer(), system);
// @bomb.sh/tty: the queries are written, the replies taken out of stdin before input.scan()
const follow = followSystemTheme(system, { write: (s) => process.stdout.write(s) });
process.stdin.on("data", (bytes) => dispatch(input.scan(follow.feed(bytes)).events));
```

- **The theme table** (cssints-q1j3). A site holds, besides its values and static `themes`, `vars`: the token of each colour prop set to a lone token (`vars: { backgroundColor: "color-bg" }`, the name without `--`). `defineTheme(name, values, base)` of `@cssints/tui` registers a run-time theme: a colour per token name, laid over the static theme `base` for every prop with a token; `setTheme(name)` selects it, and `defineTheme` of the theme in use resolves every attached renderable again. The system theme is one; static themes stay inline, since they need no registration and no import order. A colour that is not a lone token (`color-mix()` over one) keeps its static value.
- **Live in the browser** (cssints-ey13, 2026-10-11). [The TUI page](https://cssints.dev/tui) of this site runs apps/csssky-tui's styles on `@cssints/tui/bomb` in a real terminal: Ghostty's emulator compiled to WebAssembly (ghostty-web) draws csssky's feed and thread from its recorded fixtures, with keys and the mouse. The page is the terminal: it answers the system theme's queries (OSC 10, 11, 4, `CSI ? 996 n`) from the site's display settings and reports a change of them (mode 2031), so the theme is solved again as the palette or the mode changes. OpenTUI is not shown: its renderer is native Zig over `bun:ffi`. On a change notification, `followSystemTheme` of `@cssints/tui/bomb` asks the colours again (`COLOURS` of `@cssints/tui/system`), not the scheme report: its reply is the same sequence as a notification, and asking it looped with a terminal that answers it.
- **Cost.** A colour member costs what the same web member costs in the types (the `color` grammar); `bench/tui.ts` is 184k instantiations (tsc) for 16 calls and a token set. No terminal HMR in this version. The system theme brings culori's rgb, oklab, oklch and okhsl modes to the app (45 kB unminified in csssky-tui's bundle).

### Clay: `cssints/clay` (2026-10-19, cssints-iwey)

A native UI laid out by [Clay](https://github.com/nicbarker/clay), with no browser and no JS where it runs (an ESP32's firmware), writes its styles with `cssints/clay`. The same Vite plugin compiles each site to an object literal shaped as Clay's own structs, and `header()` prints a module of them as C initializers:

```ts
import * as css from "cssints/clay" with { type: "cssints" };

export const pill = css.cn(
  css.width(200),
  css.height(38),
  css.justifyContent("center"),
  css.alignItems("center"),
  css.bg("rgb(36 40 52)"),
  css.borderRadius(19),
  css.border(1, "#969baa"),
);
export const label = css.cn(css.color("#ebebf0"), css.fontSize(14));
css.width("10rem"); // error: Clay counts pixels
css.boxShadow("0 0 1px red"); // error: no such member in Clay (a shadow is css.shadow, below)
```

```c
static const Clay_ElementDeclaration pill = { .layout = { .sizing = { .width = { .size = { .minMax = { 200, 200 } }, .type = CLAY__SIZING_TYPE_FIXED }, ... }, .backgroundColor = { .r = 36, .g = 40, .b = 52, .a = 255 }, ... };
static const Clay_TextElementConfig label_text = { .textColor = { .r = 235, .g = 235, .b = 240, .a = 255 }, .fontSize = 14 };
```

```c
CLAY(CLAY_ID("Units"), pill) { CLAY_TEXT(CLAY_STRING("switch to g"), label_text); }
```

- **Members**: `width`, `height` (pixels, `N%`, `auto` for Clay's FIT, `stretch` for GROW), `padding`/`p` and the sides, `gap` (`childGap`), `flexDirection` (`row`, `column`), `justifyContent` and `alignItems` (start, center, end: Clay's `childAlignment`, the axis from `flexDirection`), `backgroundColor`/`bg`, `borderRadius`, `border(width, colour)`, `borderWidth`, `borderColor`, `overflow("hidden")` (`clip`), `float()` (`floating`, below), `image(src, { width, height, fit })` (`image`, below), `backgroundImage("linear-gradient(...)")` (a renderer effect, not a Clay field: `backgroundImage`, below), `shadow({ x, y, blur, color })` and `backdrop({ blur })` (renderer effects, not Clay fields: `shadow` and `backdrop`, below), and for text `color`, `fontSize`, `letterSpacing`, `lineHeight`, `textAlign`, `whiteSpace` (`wrapMode`); `cn` merges, a later prop wins. Any other property is not a member.
- **Pixels.** A number or `"Npx"`; padding, gap and border widths are whole numbers (`uint16_t` in Clay). Another unit is a type error and a build error.
- **Colours** are checked by the web's `color` grammar, or are colour tokens of cssints/clay's `createTokens`, and are written as 0-255 `r g b a`.
- **`header(exports)`** prints a `Clay_ElementDeclaration` per export and, for one with text props, a `Clay_TextElementConfig` named `<name>_text`. A field it does not set is zero, which is Clay's default.
- **States**: `hover`, `focus`, `active` wrap styles. Clay has no states, so the literal has an overlay per state (`":active": { backgroundColor }`, the fields the state sets, at their values over the base), and `header()` prints the whole declaration again, `<name>_active` (`<name>_hover_text` for text): the page asks Clay and picks one, nothing is merged in C. States do not nest.
- **Tokens and themes**: `createTokens` and `createGlobalTheme(tokens, name, overrides)` of cssints/clay, on tables of their own (a web or terminal token is not a Clay one, and a theme of one is a build error). Resolved at build time: a site has its colours at the tokens' values and, under `themes`, what each theme changes. `header()` prints every style of a module with a theme again, the theme's name last (`units_light`, `units_active_light`, `title_text_light`), so a page switches at run time by a suffix. A style sees the themes evaluated before it: declare them first, or in a module it imports.
- **Fonts**: `fonts("Roboto", "Mono")` is the order of the app's font array; `.Mono` is a style that sets Clay's `fontId` to 1, and `header()` prints the order as an enum, `font_Roboto = 0, font_Mono = 1` (the export's name, then the font's).

```ts
import * as css from "cssints/clay" with { type: "cssints" };

export const t = css.createTokens({
  color: { $type: "color", surface: { $value: "rgb(36 40 52)" }, pressed: { $value: "#ffc878" } },
});
css.createGlobalTheme(t, "light", { color: { surface: "white" } });
export const font = css.fonts("Roboto", "Mono");

export const units = css.cn(
  css.width(200),
  css.bg(t.color.surface),
  css.active(css.bg(t.color.pressed)),
);
export const label = css.cn(font.Mono, css.fontSize(14));
css.cn(font.Serif); // error: not one of the fonts
```

```c
#define T(name) (light ? name##_light : name)
CLAY(CLAY_ID("Units"), pressed ? T(units_active) : T(units)) { CLAY_TEXT(CLAY_STRING("switch to g"), label_text); }
```

- **Floating elements**: `float({ ... })` fills Clay's `floating`, the foundation of menus, popovers and dialogs. Every option is optional, and what it leaves out is Clay's own default, so `header()` prints only what is set (`float()` alone is `{ .attachTo = CLAY_ATTACH_TO_PARENT }`). The name is `float` as in CSS: it is a valid binding, and no other Clay member shares it.

  | Option                        | Clay field                                                                                                                                                 | Default                                                   |
  | ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
  | `attach: { element, parent }` | `attachPoints`: which point of the float sits on which point of its parent, each `"left top"`, `"center center"`, `"right bottom"`, ... (x, then y)        | `left top` on `left top`                                  |
  | `parent: "Units"`             | `parentId` and `attachTo = ELEMENT_WITH_ID`: the string of the parent's `CLAY_ID("Units")` (ASCII; a `CLAY_IDI` or local id is not one)                    | the element the float is a child of (`attachTo = PARENT`) |
  | `root: true`                  | `attachTo = ROOT`: absolute positioning, a dialog on the screen (not with `parent`)                                                                        | off                                                       |
  | `offset: { x, y }`            | `offset`: pixels from where `attach` puts it; a negative number goes left or up                                                                            | 0, 0                                                      |
  | `expand: { width, height }`   | `expand`: pixels the float's own box grows by, its children's not; not negative                                                                            | 0, 0                                                      |
  | `zIndex`                      | `zIndex`: a whole number, `int16_t`; floats draw in ascending order, with their children                                                                   | 0                                                         |
  | `capture: false`              | `pointerCaptureMode = PASSTHROUGH`: the pointer reaches what lies under the float (`true` is `CAPTURE`)                                                    | `true`                                                    |
  | `clip: "parent"`              | `clipTo = ATTACHED_PARENT`: clipped to the box its parent is clipped to (`"none"` is `CLIP_TO_NONE`; with `root` it has nothing to clip to, a build error) | `"none"`                                                  |

  `parentId` is printed as a number, the hash of the id (`Clay__HashString(id, 0)` computed at build time), because `CLAY_ID()` is a call and a `static const` initializer takes constants. A misspelt id is Clay's own `FLOATING_CONTAINER_PARENT_NOT_FOUND` error at run time. A bad value, an option that does not exist, a negative `expand`, a non-ASCII id are build errors (the types catch what a type can: a point such as `"top left"`, an unknown option). Two floats merge in a `cn()` as the other members do: the later one's options win and the rest stay; a state (`hover(float(...))`) is a declaration of its own.

```ts
import * as css from "cssints/clay" with { type: "cssints" };

export const menu = css.cn(
  css.width(160),
  css.bg("#242834"),
  css.float({ parent: "Units", attach: { parent: "left bottom" }, offset: { y: 4 }, zIndex: 10 }),
);
export const dialog = css.float({
  root: true,
  attach: { element: "center center", parent: "center center" },
});
css.float({ attach: { element: "top left" } }); // error: a point is x, then y
```

```c
static const Clay_ElementDeclaration menu = { .layout = { ... }, .backgroundColor = { ... }, .floating = { .offset = { .x = 0, .y = 4 }, .parentId = 3516868942u, .zIndex = 10, .attachPoints = { .element = CLAY_ATTACH_POINT_LEFT_TOP, .parent = CLAY_ATTACH_POINT_LEFT_BOTTOM }, .attachTo = CLAY_ATTACH_TO_ELEMENT_WITH_ID } };
```

- **Images**: `image(src, { width, height, fit })` fills Clay's `image`: the element that draws a picture, its children none. Clay 1.0's `Clay_ImageElementConfig` is one field, `void *imageData`, which Clay passes to the renderer untouched, so the path of the image travels in it (the desktop renderer loads it with ThorVG; the firmware's own renderer is still the app's to write). Older Clay also kept the image's `sourceDimensions` there; 1.0 has no such field, so the image's own size becomes the element's box, and `fit` is Clay's `aspectRatio`:

  | Option                     | Clay field                                                                                                      | Default  |
  | -------------------------- | --------------------------------------------------------------------------------------------------------------- | -------- |
  | `"glyph.png"` (argument 1) | `image.imageData`: the path, printed as a C string, `(void *)"glyph.png"`                                       | —        |
  | `width`, `height`          | `layout.sizing`: the image's size, `CLAY_SIZING_FIXED`, whole pixels (a later `width` of a `cn()` wins)         | —        |
  | `fit: "contain"`           | `aspectRatio`: width / height, which Clay uses where it has one side to derive the other's (`"fill"` stretches) | `"fill"` |

  A path that is not a non-empty string, a size that is not a positive whole number, an option that does not exist are build errors. `fit` is how the picture meets a box another style gives it: `fill` (CSS's `object-fit` default) stretches it, `contain` keeps the image's proportions.

```ts
import * as css from "cssints/clay" with { type: "cssints" };

export const glyph = css.image("examples/sensors/glyph.png", { width: 32, height: 32 });
export const logo = css.cn(
  css.image("assets/logo.png", { width: 64, height: 32, fit: "contain" }),
  css.width("stretch"),
);
css.image("logo.png", { width: 64, height: 32, fit: "cover" }); // error: fill or contain
```

```c
static const Clay_ElementDeclaration glyph = { .layout = { .sizing = { .width = { .size = { .minMax = { 32, 32 } }, .type = CLAY__SIZING_TYPE_FIXED }, .height = { .size = { .minMax = { 32, 32 } }, .type = CLAY__SIZING_TYPE_FIXED } } }, .image = { .imageData = (void *)"examples/sensors/glyph.png" } };
```

- **Shadows** (2026-10-23): `shadow({ x, y, blur, color })` is a renderer effect, not a Clay field — `Clay_ElementDeclaration` has none in Clay 1.0. The declaration keeps its layout, the literal carries the shadow as a sibling key (as an image's path does), and `header()` prints nothing for it, so the C targets are unchanged and ignore it until a page's own renderer draws it. The shadow is the element's own box, moved by `x`/`y` and filled with `color`, its edge softened by `blur` (CSS's `box-shadow` reading, in pixels: the gaussian's sigma is half of it), drawn before the element's own command so the element covers the middle of it. The desktop renderer (`native/solid`) is the one that draws it today.

  | Option        | What the renderer draws                                                   | Default            |
  | ------------- | ------------------------------------------------------------------------- | ------------------ |
  | `x`, `y`      | the element's box moved that many pixels (a negative one goes left or up) | 0, 2               |
  | `blur`        | the width of the soft edge, not negative (sigma is half of it)            | 12                 |
  | `color`       | the shadow's colour, any colour a Clay page can draw                      | `rgb(0 0 0 / 0.4)` |
  | spread, inset | not drawn: the box is the element's own, and the shadow lies outside it   | —                  |

  The literal is whole — `shadow: { x, y, blur, color: { r, g, b, a } }`, unset fields at their defaults — and a state's overlay merges field by field, so `css.hover(css.shadow({ blur: 20 }))` keeps the base's `x`, `y` and colour. **The element needs an `id`**: the renderer keys the shadow by Clay's element id (a table a frame, cleared with it), one draw an element, and an anonymous element's shadow is dropped. A blur is not free: the Dialog page's 280x152 panel (blur 24) costs 0.8 ms a frame on the desktop and takes its 360x480 frame from 1.07 to 1.93 ms (Apple M2, one thread, `--bench 300`; quality 50 and 30 are 1.47 and 1.31 ms, for 5/255 and 15/255 at the shadow's edge). A colour's alpha is what the shadow is worth: over a dimmed page a black one can darken only a little (3/255 under the panel in the dark theme, 41/255 in the light one).

```ts
import * as css from "cssints/clay" with { type: "cssints" };

export const panel = css.cn(
  css.width(280),
  css.bg("#242834"),
  css.borderRadius(12),
  css.shadow({ y: 12, blur: 24, color: "rgb(0 0 0 / 0.45)" }),
);
css.shadow({ spread: 2 }); // error: the box is the element's own
css.shadow({ blur: "1rem" }); // error: a blur is pixels
```

```c
// no shadow here: a renderer effect, not a Clay field
static const Clay_ElementDeclaration panel = { .layout = { .sizing = { .width = { .size = { .minMax = { 280, 280 } }, .type = CLAY__SIZING_TYPE_FIXED } } }, .backgroundColor = { .r = 36, .g = 40, .b = 52, .a = 255 }, .cornerRadius = { .topLeft = 12, .topRight = 12, .bottomRight = 12, .bottomLeft = 12 } };
```

- **Backdrops** (2026-10-23): `backdrop({ blur })` is glass over our **own** content — a menu or a panel over the page we draw, its fill translucent, the pixels under it blurred. The window behind the window is out of reach: nothing outside the frame's buffer can be sampled, so this is what CSS's `backdrop-filter` shows when the backdrop is the same page, not the desktop. As `shadow` is, it is a renderer effect, not a Clay field: `Clay_ElementDeclaration` has none in Clay 1.0, the literal carries a sibling `backdrop: { blur }` key, `header()` prints nothing for it, and the C targets are unchanged. The renderer draws everything before the element's first command, blurs the element's box in its own buffer, then draws the element's own commands over the blurred pixels — its text and border stay crisp. **The element needs an `id`**, one backdrop an element. `blur` is a radius in pixels, read as CSS reads one (the gaussian's sigma is half of it).

  | Option | What the renderer does                                            | Default |
  | ------ | ----------------------------------------------------------------- | ------- |
  | `blur` | blurs the element's box under it, not negative                    | 12      |
  | —      | no spread, no saturation or tint: only `blur`, and one an element | —       |

  The desktop renderer (`native/solid`) is the only one that draws a backdrop today; the box is the element's first rectangle command, clipped to the canvas, and nothing is blurred outside it. The blur is three box passes each way on the CPU, on the region alone; on the Dialog page's 150x133 menu (blur 10) the frame's draw goes from 2.2 to 3.0 ms (Apple M2, one thread, back-to-back 300-frame runs), and the radius barely moves it — the frame's split into two draws is the cost. A panel may keep its own shadow: it is drawn before the blur, so it lies on the unblurred page, under the glass. The browser (a dual Kawase pass), the board and the terminal have none.

```ts
import * as css from "cssints/clay" with { type: "cssints" };

// a menu: the page shows through its fill, blurred; its own text is drawn after the blur
export const menu = css.cn(
  css.width(150),
  css.bg("rgb(23 27 32 / 0.72)"),
  css.borderRadius(10),
  css.backdrop({ blur: 10 }),
);
css.backdrop({ spread: 2 }); // error: the box is the element's own
css.backdrop({ blur: "1rem" }); // error: a blur is pixels
```

```c
// no backdrop here either: the declaration keeps its layout and its translucent fill
static const Clay_ElementDeclaration menu = { .layout = { .sizing = { .width = { .size = { .minMax = { 150, 150 } }, .type = CLAY__SIZING_TYPE_FIXED } } }, .backgroundColor = { .r = 23, .g = 27, .b = 32, .a = 184 }, .cornerRadius = { .topLeft = 10, .topRight = 10, .bottomRight = 10, .bottomLeft = 10 } };
```

- **Gradients** (2026-10-23): `backgroundImage("linear-gradient(...)")` fills the element's box with a linear gradient, written as CSS writes it — one string, the function, an optional direction, the stops. Clay 1.0 has no gradient field, so as `shadow` and `backdrop` are, it is a renderer effect: the declaration keeps its layout and its solid fill, the literal carries a sibling `backgroundImage: { kind: "linear", angle, stops: [{ offset, color: { r, g, b, a } }] }` key, `header()` prints nothing for it, the C targets draw the solid fill, and the desktop renderer (`native/solid`) fills the box with the gradient instead of `backgroundColor`. **The element needs an `id`**, and a solid `backgroundColor` too: Clay emits a rectangle command for a box whose fill is not transparent, and that command is where the gradient goes (the solid is not drawn then).

  | Part                     | What it is                                                                                                                                                         | Default               |
  | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------- |
  | `linear-gradient(` … `)` | the only function: `radial-gradient`, `conic-gradient`, a repeating one, `url()` and `image-set()` are build errors                                                | —                     |
  | the direction            | `<number>deg` (0 up, 90 right, 180 down, 270 left), or `to top`/`to right`/`to bottom`/`to left`, which are 0, 90, 180, 270                                        | `180deg`, `to bottom` |
  | two or more stops        | a colour through `bg`'s parser (tokens too), and an optional `<number>%` from 0 to 100, in order; fewer than two, or a percentage that goes back, is a build error | —                     |
  | a stop without a `%`     | spread evenly between the stops that have one, as CSS does: an unpositioned first stop is 0%, an unpositioned last one 100%                                        | —                     |

  The literal's offsets are 0 to 1. A stop's colour is resolved at build time per theme, as a `bg` token is, so a gradient of tokens lights up in the light theme by itself. A state may set `backgroundImage` whole, `css.hover(css.backgroundImage(...))`, which is how the Sky page's cards lighten under the pointer; it cannot unset one — override it or leave it out. Up to 8 stops are drawn; a ninth is dropped and counted as a renderer error, not a crash. Only a fill is drawn: there is no gradient on text, a border or an image, and the browser, the board and the terminal have none (the C targets keep the solid fill).

```ts
import * as css from "cssints/clay" with { type: "cssints" };

// a card's fill: the panel token at the top, a step deeper at the bottom; `to right` would be 90deg
export const card = css.cn(
  css.width("100%"),
  css.bg("rgb(27 32 38)"),
  css.backgroundImage("linear-gradient(180deg, rgb(27 32 38), rgb(21 25 30))"),
);
// a state overrides the whole gradient: the card lightens under the pointer
export const hovered = css.cn(
  card,
  css.hover(css.backgroundImage("linear-gradient(180deg, #2a303a, #1f242b)")),
);
css.backgroundImage({ angle: 180 }); // error: one string
css.backgroundImage(); // error: the gradient is required
```

```c
// no gradient here either: the declaration keeps its layout and its solid fill
static const Clay_ElementDeclaration card = { .layout = { .sizing = { .width = { .size = { .percent = 1 }, .type = CLAY__SIZING_TYPE_PERCENT } } }, .backgroundColor = { .r = 27, .g = 32, .b = 38, .a = 255 } };
```

- **Not yet**: min and max sizes, derived colour tokens (`color-mix()` of tokens: a colour Clay is given must parse as one), a theme under a condition (a theme is a name; `media()` has no meaning on a board).

### Export groups: `cssints/widely-available`, `cssints/css-grid-2`, … (decided 2026-10-11, cssints-n7z3)

A group is a subpath of `cssints` that exports the members of `cssints` which a set of CSS features has, and refuses a value that holds a feature outside the set. It is the same import (`with { type: "cssints" }`), the same members, the same classes:

```ts
import { color, display, media } from "cssints/widely-available" with { type: "cssints" };

export const card = [
  display("grid"),
  color("rebeccapurple"),
  media("(width >= 40rem)")(color("black")),
];

display("grid-lanes"); // error: display: "grid-lanes" is not in cssints/widely-available
color("light-dark(white, black)"); // error: color: "light-dark()" is not in cssints/widely-available
media("(prefers-reduced-data: reduce)"); // error: @media: "prefers-reduced-data" is not in cssints/widely-available
```

```ts
import { inlineSize } from "cssints/widely-available/with-downstream" with { type: "cssints" };
import { color } from "cssints/baseline-2022" with { type: "cssints" };

inlineSize("10rem");
inlineSize("fit-content"); // error: inline-size: "fit-content" is not in cssints/widely-available/with-downstream
color("rebeccapurple");
color("color-mix(in oklab, red, blue)"); // error: color: "color-mix()" is not in cssints/baseline-2022
```

- **Baseline groups** (web-features 3.42, the status of each BCD key): `widely-available` is Baseline high, `newly-available` is high and low, `limited-availability` is everything (it is `cssints` itself, under its Baseline name) and `not-discouraged` is everything web-features does not mark `discouraged` (`clip`, the `page-break-*` aliases, `ime-mode`, `word-break: break-word`, `text-decoration-line: blink`, device media features). A feature web-features does not know is limited availability.
- **Downstream groups** (cssints-n12x, 2026-10-11): `widely-available/with-downstream` and `newly-available/with-downstream` are the Baseline group also checked against Opera, Opera Mobile, Samsung Internet, Android WebView, UC and QQ, as `browserslist-config-baseline/with-downstream` is. A feature is in one when the Baseline group has it and every one of those browsers has it, by BCD, at the minimum version that [baseline-browser-mapping](https://npmx.dev/package/baseline-browser-mapping) 2.11.28 gives for the target (the rule of the support warnings: no prefix, no flag; UC and QQ are Blink, checked as Chrome at the Blink version of that build). `widely-available/with-downstream` has 520 of the 521 members (not `maskImage`: Opera has `-webkit-mask-image` only) and refuses `inline-size: fit-content` (Samsung Internet), `shape-outside: xywh()` and `prefers-contrast`; `newly-available/with-downstream` has 533 of 567 (UC and QQ are on Blink 123 and 121).
- **Baseline years:** `baseline-2015` to `baseline-2026` (the first year web-features has to the current one) and `baseline-YYYY/with-downstream`, as `browserslist-config-baseline/YYYY` has them. `baseline-YYYY` is **cumulative**: what was Baseline (newly available, `baseline_low_date`) by the end of YYYY, so `baseline-2022` refuses `color-mix()` (2023) and `baseline-2023` refuses `light-dark()` (2024). 220 members in `baseline-2015`, 387 in `baseline-2020`, 537 in `baseline-2024`. `baseline-2026` is `newly-available` today.
- **Spec groups** are named by the W3C shortname that @webref/css uses: `cssints/css-grid-2`, `cssints/css-color-4`, `cssints/mediaqueries-4`, `cssints/selectors-4`, … (92 of them). A group holds what the spec defines, and **a level includes the levels of its series before it**: `css-color-5` has what Color 3, 4 and 5 define, `css-color-4` has Color 3 and 4. A level is a delta (Color 5 over Color 4) or a rewrite (Media Queries 4 over 3), and "I write for Color 5" means both. What only a later level defines is refused: `css-color-4` has no `colorMix` and refuses `color-mix()`, `mediaqueries-4` refuses `prefers-color-scheme`. A group has the properties, functions, pseudo-class wrappers and conditions its spec defines, so `display` is in `css-display-4` and `gridTemplateColumns` in `css-grid-2`: import from several groups in one file.
- **What is a member:** the properties (and their short names), the functions, the pseudo-class wrappers, `media`, `container`, `supports`, `keyframes` and `positionTry`. Everything else (`cn`, `cv`, `firstThatWorks`, `token`, `createTokens`, `createGlobalTheme`, `check`, `style`, `global`, `layers`, `attr`, `within`, `group`, the Typed OM values) is in every group. A group has no `css` object: write `import * as css from "cssints/widely-available"`.
- **What is refused**, in the types (an error on the argument) and in the build (an error at the call), with the same words: a keyword of the property, a function (as a call of a member, or as text, in a `firstThatWorks` too), a unit (`10rch`), a media feature, a `scroll-state()` or `style()` container query and a `selector()` support query, and a property, function or condition the group does not have (`flex().gap()` is checked as `gap`). A value that is not valid CSS is still the usual error.
- **What is not:** the types a spec only references (`<color>` in `accent-color` is any colour of any group), a feature of a module that is not in the series of the group (`css-ui-4`'s `accentColor` takes `color-mix()` as text), and what nothing attributes to a feature: the grammar of a value that no BCD key names is not narrowed. A function with no BCD key counts as limited availability. A keyword of `cursor` has the status of `cursor` (web-features counts it limited for iOS Safari, which has no pointer).
- **Cost:** a program that does not import a group pays nothing. In one that does, a call costs about 250 instantiations more (a 105-call bench: +2.9%). The 122 subpaths add 1 MB of declarations to `dist/` (the tarball: 303 kB for the first 96 groups, 384 kB with the Baseline years and the downstream groups; a downstream group re-exports the members it shares with its Baseline group, and a group the same as another is that group, so the editor's message may name the other).

`bun run groups` (in `packages/cssints`) regenerates `src/groups/<id>.ts` and `src/groups-data.ts` from web-features, @webref/css 6 (one file per level; 8 keeps the latest level of a series only) and BCD. Research and numbers: [research/groups.md](research/groups.md).

### Browser support and what 0.1 does not have

- **Types and checks for every property** are generated from [mdn-data](https://github.com/mdn/data) and @webref/css by `packages/css-grammar` (`bun run extract`), not written by hand, so a new property or function needs no change here. 536 members: 525 properties (every standard and experimental one, except the three shorthands above) and the 11 short names.
- **Browser support** comes from [`@mdn/browser-compat-data`](https://github.com/mdn/browser-compat-data) against browserslist, as build warnings (see above). There is no per-property table in the types.
- **Not in 0.1:** pseudo-elements, `:has()`, derived tokens, slot variants, a typed runtime token setter, icons (the plugin API they are written on is above; `frame()` is in `cssints/frame`, `surface()` in `cssints/surface`), polyfills of its own for missing browser features. The map and the reasons are in [wayfinder.md](wayfinder.md).
