# CSS in TS

The 0.1 API. Setup (the Vite plugin, the stylesheet import) is in the [README](../README.md). Decisions and findings are in [wayfinder.md](wayfinder.md).

Every `ts` block here is type-checked against the workspace `cssints` types by `packages/cssints/test/docs.mjs` (`bun run test`). A line that ends in `// error` must fail to type-check. Blocks fenced `ts skip` (output) are not checked. A few blocks show a build-time error that the types cannot see; their comments give the message.

### Authoring surface (decided 2026-09-29, cssints-5dbi)

- **Import.** `with { type: "cssints" }` marks code that runs at build time: cssints itself, plugins such as icons, and your own helper modules. The plugin finds call sites by this attribute. The one runtime helper, `cx`, is imported without it. Using a build-time member without the attribute is a build error.
- **Names.** Every mdn property as camelCase (`paddingLeft`, `alignItems`, `justifyContent`), plus a short set: `p pt pr pb pl`, `m mt mr mb ml`, `bg`. Everything is available both as named exports and through the namespace (`css.p`). There is no `items` or `justify`: they were ambiguous (`align-items` or `align-content`, `justify-content` or `justify-items`).
- **Numbers.** A bare number is a spacing step of 0.25rem in `padding*`, `margin*`, `gap*` and `inset*` (`p(4)` is `1rem`). In any other property it is a CSS `<number>`: `opacity(0.5)`, `zIndex(3)`.
- **Values.** A property takes one or more parts joined by a space. Each part is a string or a Typed OM value: `border("1px solid", accent)`, `padding(CSS.rem(1), CSS.rem(2))`, `padding("1rem 2rem")`. Parts are checked against the mdn grammar in types and again at build time. `CSS.px`, `rem`, `em`, `percent`, `number`, `CSSUnitValue` and `CSSColorValue` come from `cssints`, imported with the attribute.
- **Editor.** A bad part is marked on that part: `padding("2px", "red")` puts the error on `"red"`, with the message of the whole value. While a string is not a value yet, the editor offers the keywords of the property that the word under the cursor begins (`display("fl…")` gives `flex`, `flow`, `flow-root`; `border("1px", "so…")` gives `solid`), and all of them in an empty part (`border("1px", "")`; an empty part is an error). The offer is the keywords of the whole grammar, not only those that fit at that point, it stops once the string is valid, and functions such as `rgb(` are not offered.
- **Math.** `calc()`, `min()`, `max()`, `clamp()` and the other CSS Values 4 math functions are accepted wherever their type is, as strings (`width("calc(100% - 2rem)")`, checked by the build: `calc(1px + 2s)` is an error) and as calls that take tokens (`calc(t.space.md, "*", 2)`, see "Functions").
- **Layout contexts.** `flex()` and `grid()` without arguments set `display` and chain only their container properties. Names drop only the context prefix: `flex().direction("column").wrap("wrap").alignItems("center").justifyContent("space-between")`, `grid().templateColumns("1fr 2fr").gap(4)`. Plain styles do not chain; merge them with `cn(...)` or `cx(...)`. Item properties (`flexGrow`, `alignSelf`, `gridColumn`, `order`) are plain functions.
- **`flex(...parts)` and `grid(...parts)` are the shorthand properties.** With at least one argument the call is the `flex` (or `grid`) property, checked by its grammar like any member: `flex("1")`, `flex(1)` and `flex("1 1 0")` are `flex: 1`, `flex: 1` and `flex: 1 1 0`, `grid("auto / 1fr 1fr")` is `grid: auto / 1fr 1fr`. A bare number is a `<number>` here, not a spacing step. The result is a plain style: it sets no `display` and does not chain. The types tell the two forms apart by overload.
- **`container` is the condition.** `container("sidebar (width < 30rem)")` is a query; the `container` shorthand property is written with its longhands `containerName` and `containerType`.
- **Arguments are build-time values.** The plugin runs your module at build time and replaces each call with a class string. A literal, a `const`, a token or a value from another attributed module works. A value that exists only at runtime (a prop, state) does not: `p(n)` with `n` a parameter is a build error (`css arguments must be known at build time: n is not defined where the call is evaluated`) that points at the call, also when the local is named like a global (`open`, `name`) or like a module binding. The types do not catch it: a helper module may take parameters (below), so a `string` or `number` is a fine argument there. Choose between styles with `cx(on && p(4))`, a `cv` variant, or a token set in a `style` prop. A helper module imported with the attribute may take parameters, because each call of it is a site with its own arguments: `stack(4)` below is a build-time call in the file that makes it.
- **Top-level code runs at build time.** A call the run does not reach (`false && p(4)`, a branch not taken, a ternary arm) still gets its class string: it is evaluated after the module has loaded, like a call inside a function, so its arguments may use the bindings of the module but not the locals of the branch. A `cv(...)` at the top of a module works too: during the build it is the same function the browser gets, so `button({ size: "lg" })` at the top of a module gives its classes.

```ts
// stack.ts
import * as css from "cssints" with { type: "cssints" };

export const stack = (gap: number) => css.flex().direction("column").gap(gap);

// elsewhere: import { stack } from "./stack.ts" with { type: "cssints" }; ... className={stack(4)}
```

### Basic usage

```tsx
import { cx } from "cssints";
import { alignItems, justifyContent, p } from "cssints" with { type: "cssints" };
import * as css from "cssints" with { type: "cssints" };

export const A = () => (
	<div className={cx(css.display("flex"), alignItems("center"), justifyContent("center"), prop && p(4))}>Hello, world!</div>
);
// or with a layout context
export const B = () => (
	<div className={cx(css.flex().alignItems("center").justifyContent("center"), prop && css.p(4))}>Hello, world!</div>
);
```

Output for `A`:

```tsx skip
import { cx } from "cssints";

export const A = () => <div className={cx("_1s47490", "_1ob5z5m", "_cn8dee", prop && "_lwugp7")}>Hello, world!</div>;
```

```css
@layer _.k, _.a, _.b, _.c, _.d, _.e;
@layer _.a {
	._lwugp7 { padding: 1rem; }
	._1ob5z5m { align-items: center; }
	._1s47490 { display: flex; }
	._cn8dee { justify-content: center; }
}
```

- **The class names** are a hash of the declaration (and its conditions), so the same declaration gives the same class in every file.
- **One sheet.** All rules are in `virtual:cssints.css`, each once, sorted by layer, then condition, then shorthand before longhand (`border` before `border-top`, counted from Chrome's own expansion of each shorthand), then class name. So a longhand wins over a shorthand that contains it, whatever the order of the arguments: `cn(pl(2), p(4))` keeps `padding-left: 0.5rem`.
- **`cn()` keeps the later of the same property.** `cn(p(4), p(2))` is `p(2)`: the earlier declaration is dropped at build time (also for an alias: `wordWrap` is `overflowWrap`). Under different conditions both stay, because they are in different layers: `cn(md(p(6)), p(2))`. Two properties that overlap without one containing the other are a build error, because the sheet cannot order them by the arguments: `cn(borderTop("1px solid red"), borderColor("blue"))` both set `border-top-color`; so do a physical and a logical side (`marginLeft` and `marginInline`, `width` and `inlineSize`), since which physical side a logical one is depends on the writing mode. A logical property inside a physical shorthand that sets every side is contained, not overlapping: `cn(border(...), borderInline(...))` is fine, and `borderInline` wins. Styles that only meet in `cx()` in the browser are not seen at build time.
- **A layout context** gives one string: `flex().alignItems("center")` is `"_1s47490 _1ob5z5m"`.
- **Also exported:** `css` (the namespace as a value) and `cn`, `cv`, `firstThatWorks`, `media`, `container`, `supports`, `attr`, `within`, `group`, `global`, `token`, `style`, `createTokens`, `createGlobalTheme`, `check`. `cx` is the only runtime export.

### Without runtime

```tsx
import * as css from "cssints" with { type: "cssints" };

export const C = () => <div className={css.cn(css.flex().alignItems("center").justifyContent("center"), css.p(4))}>Hello, world!</div>;
```

Output:

```tsx skip
export const C = () => <div className="_1s47490 _1ob5z5m _cn8dee _lwugp7">Hello, world!</div>;
```

- **`cn(...)`** merges styles at build time into one class string. Its arguments are fixed, so nothing is left at runtime and no `cx` is imported.

### Conditions and layers (decided 2026-09-29, cssints-kpq1)

Conditions are wrapper functions. A wrapper takes styles and returns them under its condition. Wrappers nest.

```ts
import { cx } from "cssints";
import * as css from "cssints" with { type: "cssints" };

const md = css.media("(width >= 40rem)");
const [tablet, wide] = css.media("(width >= 40rem)", "(width >= 60rem)");
const { sm, lg } = css.media({ sm: "(width >= 30rem)", lg: "(width >= 60rem)" });
const dark = css.media("(prefers-color-scheme: dark)");
const narrow = css.container("sidebar (width < 30rem)");
const grid = css.supports("(display: grid)");

export const styles = cx(
	css.p(2),
	md(css.pl("8ch"), css.pt(4)),
	css.hover(css.bg("#eee")),
	md(css.hover(css.bg("#ddd"))),
	prop && lg(css.p(8)),
);
export const forms = cx(dark(css.bg("#111")), narrow(css.m(0)), grid(css.display("grid")), tablet(css.m(1)), wide(css.m(2)), sm(css.m(3)));
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
	._1t8gqy5 { padding: 0.5rem; }
}
@layer _.b {
	._16f8jrr:hover { background-color: #eee; }
	@media (width >= 40rem) {
		._1q848uz { padding-top: 1rem; }
		._t70zhd { padding-left: 8ch; }
	}
	@media (width >= 60rem) {
		._1khcbr2 { padding: 2rem; }
	}
}
@layer _.c {
	@media (width >= 40rem) {
		._ronnd2:hover { background-color: #ddd; }
	}
}
```

### Global rules, attributes and parent states (decided 2026-10-03, cssints-635k, cssints-eaob)

```ts
import { cx } from "cssints";
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
export const link = cx(
	css.color("gray"),
	css.attr("aria-current", "page")(css.color("blue")),
	css.within(css.hover)(css.textDecoration("underline")),
);
export const icon = css.attr("href", ".pdf", "$=")(css.opacity(0.8));
export const nested = css.cn(css.group("card"), css.within(css.focusVisible, "card")(css.outline("2px solid")));
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
	*, *::before, *::after{box-sizing:border-box}
	body{margin:8px}
	:root{color-scheme:light}@media (prefers-color-scheme: dark){:root{color-scheme:dark}}
	a[href^='http'] > b{color:red}
}
@layer _.b {
	:where(._g:hover) ._72037{text-decoration:underline}
	._fc1pxh[aria-current="page"]{color:blue}
	._pl3vkk[href$=".pdf"]{opacity:0.8}
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

export const A = () => <div className={css.cn(css.bg(t.color.bg), css.color(t.color.fg), css.p(t.space.md))} />;
css.createGlobalTheme(t, dark, { color: { nope: "red" } }); // error: no token at this path
css.createGlobalTheme(t, css.hover, { color: { bg: "red" } }); // error: a pseudo-class is not a theme condition
```

- **Types:** `$type` is inherited through groups, and a token needs one (it is not guessed from the value). It maps to a token type: `color` to `color`, `dimension` to `length`, `number` to `number`, `duration` to `time`, `fontWeight` to `number` (keywords such as `bold` become 700), `cubicBezier` to `easingFunction`, `shadow` to `shadow`. `fontFamily`, `strokeStyle` and the other composite types (`border`, `transition`, `gradient`, `typography`) are an error. A value is a CSS string of the type's grammar, or the DTCG form: `{ colorSpace, components, alpha? }`, `{ value, unit }` (`px` or `rem`, `ms` or `s`), a number, `[x1, y1, x2, y2]` (`cubic-bezier(x1, y1, x2, y2)`), `{ color, offsetX, offsetY, blur, spread, inset? }` or an array of them (the parts are DTCG values or CSS strings, without references). The initial value follows the rule of "Tokens": `{ value: 1, unit: "rem" }` is `initial-value:16px` and `:root{--space-md:1rem}`.
- **Names:** the variable name is the kebab-case path (`--color-bg`). A second argument to `createTokens` maps a path (an array of names) to a name, or to `{ var, inherit }`.
- **Support warnings** (cssints-tuyw): a token value goes through the same support check as a property value, since it reaches the same browsers: the initial value of `token.<type>()` and of a `createTokens()` leaf, an override of `createGlobalTheme()` (its references replaced by their literals) and a `token.set()` value. It is checked as a value of a property that takes its type (`color` for a colour, `width` for a length, `transform` for a transform list; `custom-ident` and `resolution` have none), so `oklch()` warns for a target without it, like `color: oklch(...)`. A warning is given once per token (or theme value) and BCD feature per build, and a dev server gives it again after each edit, as for properties. It names the token path and, for a theme, the theme: `createTokens(): color.accent value: "oklch()" in "oklch(0.62 0.19 259)" is not supported by chrome 109 (css.types.color.oklch)`, `createGlobalTheme(): color.accent value in .light: "oklch()" in ...`, `token.color() initial value of --name: ...`, `token.set() value of --name: ...`. An alias has the same warning for its own token, since its `@property` rule holds the same literal. A value that goes into the sheet gets no warning when a fallback below handles it for the targets (the bullet "No warning for what LightningCSS lowers" below says what LightningCSS lowers); an inline `token.set()` value never goes through LightningCSS and keeps the warning, as does a value LightningCSS cannot lower (`color-mix()` over a token in a class).
- **Fallbacks for older targets** (cssints-33pa): a browser that cannot parse the initial value of an `@property` rule (`oklch()` in Chrome 109) drops the rule, and the token has no value at all. When some target lacks a value, the engine writes it for that target (transforming `--x:value` through LightningCSS with the lacking targets and taking the first declaration, `#db4aa7` for `oklch(0.637 0.203 345)`) and nothing changes for a target set that has it, byte for byte:
  - **A plain token** (`token.color("oklch(0.637 0.203 345)", "accent")`, a `createTokens()` leaf): `@property --accent{…initial-value:#db4aa7}` and `:root{--accent:oklch(0.637 0.203 345)}`, which LightningCSS lowers like any custom property (`--accent:#db4aa7`, then the wide-gamut `lab()` under `@supports (color: lab(0% 0 0))`). A browser that parses the value gets the wide one, so a modern browser reads the same colour as before, written as `lab()` (`:where(*)` stands for `:root` when the token does not inherit).
  - **A derived token or a theme value that holds `var()`** (`oklch(0.637 0.203 {hue.accent})`, `color-mix()` over a token, `{path}` references): LightningCSS cannot lower a value with `var()`. Its default is the lowered literal (the references replaced by the values the tokens start with) and the live value comes after it under `@supports` of the literal itself, the feature the value needs and no table of features: `:root{--accent:#db4aa7}` then `@supports (color:oklch(0.637 0.203 345)){:root{--accent:oklch(0.637 0.203 var(--hue-accent))}}`. A browser that parses the literal reads the live value, so the hue slider works; one that does not keeps the default, unless the runtime of the next bullet computes the value. A theme does the same inside its own rule, `@supports (…){@media (…){:root{…}}}` or `@supports (…){.dark{…}}`, after the default of that theme. An alias (`{color.accent}` as the whole value) stays live, since it needs no feature of its own, and reads the default of its target. A theme that sets a token a derived token depends on declares that derived token again (live, as above), and an older browser keeps the default of the derived token there.
  - The support warning for those values is gone: the fallback handles it. A token value that LightningCSS leaves alone keeps its warning and its single declaration, as today.
  - Checked in Chromium 109 (`apps/sky/test/old-browser.mjs`: Mu pink in real colours, light and dark, before the runtime of the next bullet moves anything) and Chrome 154 (the colours stay `oklch()` and follow the slider). The cost on sky is one more `:root` declaration per token and one `@supports` rule per derived value: 27.97 kB to 29.58 kB of CSS with the default targets.
- **Derived tokens in older browsers: a runtime** (cssints-i9xo). Where a target cannot parse a derived colour (`oklch(0.637 0.203 var(--hue-accent))`, `lab(from color(from var(--color-accent) srgb-linear …) …)`), the slider would do nothing. The engine then ships a small browser module, `cssints/derived`, that computes the live values in JavaScript. Tokens are not members, so this is not a plugin you import: the engine registers the runtime itself when a derived colour needs it, and delivers it the way it delivers a plugin's runtime (`virtual:cssints/runtime/derived`, empty, `export {};`, unless a browserslist target lacks a feature the literals need and has `@property`; the same `needed()` decision). The client modules that use such a token import it. With targets that parse every value nothing is written or shipped: sky built for `chrome 154` is byte-identical to a build without the runtime.
  - **The data** is one custom property on `:root` in layer `_.k` (`--_derived`, JSON in a string) with only what the sheet uses: `p`, the literals a browser must parse for the runtime to stay idle (the same literals as the `@supports` tests); `b`, the template of each derived colour of the default theme (`oklch(0.637 0.203 var(--hue-accent))`); `t`, per theme in sheet order, its condition (a selector, or `@media (…)`) and the templates it sets, `0` for a token it sets to a literal. A token that a theme overrides with a plain `{path}` alias stays live and is released by the runtime.
  - **The runtime** does nothing without a `document`, and nothing when the browser parses every `p` (Chrome 154 gets the same CSS as an old one and writes nothing on `<html>`). Otherwise it picks the themes that apply to `<html>` (`matches()` of the selector, `matchMedia()` of the condition), evaluates the templates over the computed values of the inputs (`--hue-accent` and any other token a template reads; the runtime's own results are used as they are, not read back), and writes the results as inline custom properties on `<html>`, as `rgb()`. It runs again on any attribute change of `<html>` (class, style: the slider, the theme classes) and when a theme's media query changes (`prefers-color-scheme`), and once the stylesheet has loaded if it was not there at the start. It reads every input before the first write, so one input costs one style recalculation. A token it cannot compute at the moment (an input is missing) keeps its static default.
  - **The subset** is hex, `rgb()`/`rgba()`, `oklch()`, `oklab()`, `lab()`, `color(srgb | srgb-linear …)`, `color-mix()` in `srgb`, `srgb-linear`, `oklab` or `lab` (shares that add up to 100%), the names `black`, `white` and `transparent`; relative colour (`from`) with the channel keywords, numbers, percentages, `deg`, `+ - * /`, parentheses, `calc()`, `clamp()`, `min()`, `max()` and `var()`. A colour outside sRGB is clipped to it (an old browser has no wider gamut). Anything else (`light-dark()`, `hsl()`, a polar `color-mix()`, a wide-gamut `color()`, another unit), a derived token that is not a colour, one that does not inherit, and a value in a `container()` theme stays at its static default, and the build warns, naming the token and the target: `tf.color.mixed: "color-mix(in oklch, …)" stays at its static default in chrome 109: the runtime for derived tokens does not evaluate "oklch"`. The themes it reads are those of `<html>` (`:root`, a selector that matches it, a media query), not of an element inside the page. A template should read plain tokens and derived tokens, not an alias of a derived token (it would be read one update late).
  - **Cost.** `cssints/derived` is 7.2 kB minified, 3.1 kB gzipped; sky's CSS grows by the data (29.6 kB to 31.4 kB with the default targets, about 0.6 kB gzipped). The colours of the default theme take 10 µs of JavaScript per input; in Chromium 109 a slider input costs 1.2 ms against 0.6 ms for the style recalculation alone, which the browser pays on any change of the hue. Checked in `apps/sky/test/old-browser.mjs`: in Chromium 109 the four accent steps, the label's onAccent and the page background at hues 0, ±90 and ±180 are within 1/255 of the pixels Chrome 154 paints, in light, dim, dark and system under a light and a dark scheme, and the system scheme changing recomputes them; `packages/cssints/test/derived-runtime.mjs` holds the evaluator to culori (the maths of `check.contrast`) on the sky templates and random inputs.
- **Themes:** `createGlobalTheme(tokens, condition | selector, overrides, { layer?, scope? }?)` re-declares the overridden tokens under a `media()` condition on `:root`, or under a selector. Under `container()` it declares them on `:where(*)`, since `:root` has no container above it and would never match. `layer` names a top-level layer for the rule (`{ layer: "app" }` puts an app look in `@layer app`, above the engine's `:root` fallbacks) that `layers()` has declared, in this module or one it imports: an undeclared layer is a build error at the call. Without `layer` the rule is in `_.k`. `scope` (with a selector) confines the rule to a subtree, `@scope (article.post) { [data-mode="hero"] { ... } }`, so a foreign look cannot repaint the rest of the page; it is a selector, checked by the build like the one of `global()` and balanced in the types, and it is an error with a condition (`:root` is not inside a scope). Overrides are checked against the token types, and an unknown path is a type error; they take the same values as tokens, and `tokens` may be a group (`t.color`). `supports()` and pseudo-classes are not themes: `createGlobalTheme(t, hover, …)` is a type error, and a build error when the types are bypassed. A module that uses a token gets the theme rules that set it, with the `@property` rules of the tokens it uses and of those their values refer to, not of every token the theme sets.
- **`layers(...names)`** declares top-level layers in order. The sheet prints `@layer app, author, viewer;` once, right after the engine's `@layer _.k, _.a, …;`, however many modules declare it (a module's sheet has the statements of its own `layers()` calls and of the layers it uses). The same names again are fine; names in another order (`layers("viewer", "app")` after the one above), or sharing layers without one statement holding the other (`layers("viewer", "base")`), are a build error at the second call, since the sheet could not say which comes first. A statement that holds another is printed first; statements that share nothing are printed longest first. A name is letters, digits, `_` and `-`.
- **`layers(...names, { before: true })`** declares them before the engine's: the sheet prints `@layer reset;` above `@layer _.k, _.a, …;`, so `_.k`, the classes and every layer declared after rank above what is in them (a reset that any style beats). The rules above hold among the statements before, in the same order; a layer declared both before and after (`layers("reset")` once `layers("reset", { before: true })` has run, or the other way) is a build error at the second call. A stylesheet's own layer goes between a reset and cssints with `layers("reset", "base", { before: true })`.

```ts
import * as css from "cssints" with { type: "cssints" };

css.layers("app", "author", "viewer");
const t = css.createTokens({ color: { $type: "color", bg: { $value: "#fff" } } });
css.createGlobalTheme(t, '[data-mode="dark"]', { color: { bg: "#000" } }, { layer: "viewer" });
css.createGlobalTheme(t, '[data-mode="hero"]', { color: { bg: "#123" } }, { layer: "author", scope: "article.post" });
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
css.createGlobalTheme(t, ".dim", { hue: { accent: 12 }, color: { accent: "oklch(0.7 0.1 {hue.accent})" } });
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
	platforms: { cssints: { transformGroup: "tokens-studio", files: [{ destination: "tokens.json", format: "cssints/dtcg" }] } },
}).buildAllPlatforms();
```

  - **Build errors** for what would be misread: `value`/`type` without `$` (`global.Main.0 has value and type without $, the legacy format of Tokens Studio …`), `$themes` or `$metadata` in the tree, a Tokens Studio type (the error names the DTCG type: `"spacing" is a Tokens Studio type: its DTCG type is "dimension"`), math outside `calc()` (`write "calc({spacing.base} * 2)"`), a Tokens Studio colour modifier (`$extensions["studio.tokens"].modify`), a Figma boolean (`com.figma.type: "boolean"` on a number), and more than one mode in `$extensions` (`mode`, or `modes` of `com.figma`). `string`, `boolean`, `fontFamily` and the composite types are errors as before (no token type), so leave them out of the file (Figma: a collection without them; TokensBrücke: no styles). Samples of each tool are in `packages/cssints/test/fixtures/importers`.
- **The sheet:** token sets and themes are rules of layer `_.k`, after the global rules of `css.global()` and before the class layers. They set custom properties only, and no class does, so the layer order never decides between them; `_.k` is the lowest layer, so your own unlayered `--color-bg` rule wins over a theme. The `:root` rules of aliases come first, then themes under a condition, then themes under a selector, each in source order, so a selector theme beats a condition theme on the same element. A module has the rules of the tokens it uses, from wherever they were made, and of the tokens those are made of (the references of a derived token or of a theme value, through chains: a `hue.accent` that no class uses still gets its `@property` rule), and its own; import a theme module (`import "./theme.ts"`) to have all of it.
- **`css.check.contrast(fg, bg, { min })`** computes the WCAG 2.x contrast ratio (`min` from 1 to 21) for the default values and for every theme that sets either token or one they are aliases of. It reads themes one at a time, except those of one selector: themes with the same selector (and scope) meet on one element, so they are read together, laid over each other in the order of the cascade (no layer first, then the declared layers in order, then source order). A viewer look that sets only the text colour is checked on the background of the app look under the same selector. Themes of different selectors, or a selector and a condition, are still read one at a time, not in their combinations. A value that is set at run time (a slider that sets `--hue-accent` on `<html>`) belongs to no theme and is checked at its default only; a theme per value would put each rule in the sheet and hold it to the thresholds of the other themes, since a check applies to every theme that touches its tokens, so measure a range outside the build (apps/sky `test/contrast.mjs`). A ratio below `min` is a build error that names the theme and both resolved values (the ratio is cut, not rounded: 4.499 is 4.49). A value the check cannot evaluate (`color-mix()`, a relative colour, `light-dark()`, `currentColor`, a system colour) or a translucent one is a warning that names the token; a build says it once, and a dev server says it again after each edit. A derived token (or a theme value with `{path}` references) is read in each theme by putting that theme's values, or the defaults, in place of its references, through a chain of derived tokens: a ratio when the result is a colour (`oklch(0.6 0.2 {hue.accent})`), a warning that names the theme when it is not (`color-mix()` over another token), and a theme that sets any token a checked colour depends on, directly, through an alias or through references, is checked. The colour library (culori, `culori/fn`: 27 kB minified, 9 kB gzipped) is build-only and never ships. The check runs when its module has run, and again at the end of a build over the themes of every module.

Output (the `@property` rules of `space-md` and `color-fg` are not shown):

```css
@layer _.k, _.a, _.b, _.c, _.d, _.e;
@property --color-accent { syntax: "<color>"; inherits: true; initial-value: oklch(62% 0.19 259); }
@property --color-bg { syntax: "<color>"; inherits: true; initial-value: #ffffff; }
@property --color-link { syntax: "<color>"; inherits: true; initial-value: oklch(62% 0.19 259); }
@layer _.k {
	:root { --color-link: var(--color-accent); }
	@media (prefers-color-scheme: dark) {
		:root { --color-bg: #0b0b0f; --color-fg: #f3f4f6; }
	}
	@container (width < 30rem) {
		:where(*) { --color-bg: #eee; }
	}
	.light { --color-bg: #fff; }
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
import { animation, cn, hover, keyframes, margin, opacity, positionTry, positionTryFallbacks, top, transform } from "cssints" with { type: "cssints" };

export const fade = keyframes({ from: opacity(0), to: opacity(1) });
export const wiggle = keyframes({ from: transform("rotate(0deg)"), "50%": cn(transform("rotate(8deg)"), opacity(0.5)), to: transform("rotate(0deg)") });
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
	@keyframes kf-0e6af964{from{opacity:0}to{opacity:1}}
	@position-try --pt-23965b44{top:anchor(bottom);margin:0.5rem}
}
@layer _.a {
	._44ecsn{animation:kf-0e6af964 200ms ease-out}
}
```

### Runtime: `cx`, `cn`, `cv` (decided 2026-09-29, cssints-lo9x; `cv` without `_cv` 2026-10-07, cssints-ep2l)

- **One runtime package: `cssints` itself.** `import { cx } from "cssints"` has no attribute and is the only code that ships to the browser, together with the few lines the plugin puts in place of each `cv()`. `@cssints/variants` is gone.
- **`cx(...)`** joins strings, skips falsy values and flattens nested arrays: `cx(base, on && p(4), [a, b])`. It takes no clsx-style objects; write `cond && style` instead.
- **`cn(...)`** runs at build time only. Under the attribute, `cn(p(4), bg("red"))` becomes one class string, and nothing is left at runtime.
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
- **`compoundVariants`** as in cva: each entry names values (any of the variants, a boolean for a boolean one) and the style that is added when all of them are active. The key is `class`, as in cva, since what the entry adds is a class (a `cx` or `style()` key would suggest an inline style, and cssints has `style()` for that; `css` is the namespace). Its value is a `css.*` style like the others, not a string. The values of an entry are one value each, not a list of values.
- **Values** of `base` and of each variant are one property, `cn(...)`, or a `flex()`/`grid()` chain. A CSS string is a build error that shows the new form: `cv() base must be a css.* value (cn(...), a flex() chain or one property), got "padding: 1rem". CSS strings are gone: write cn(p(4), fontSize("1rem"))`.

- **The variant wins.** The function joins the base and the variants that are active at runtime, so the build compares them. Under one condition, a variant that sets what the base sets (the same property, an alias, or a shorthand over a base longhand: `pl(2)` in the base, `p(4)` in the variant) replaces it: the base class is dropped from the string while that value is active, which the runtime does from a `drops` entry in the config (`drops: { size: { lg: "_77ujlx" } }`, only where there is one). Which rule comes later in the sheet does not decide. A variant longhand inside a base shorthand needs no drop, since the sheet puts a longhand after its shorthand: base `border(...)` with `active: { yes: borderBottomColor(...) }` is fine. Under different conditions both stay, as in `cn()`.
- **Overlap is an error, as in `cn()`.** A base property and a variant property that overlap without one containing the other are a build error at the `cv()` call: `cssints: cv() base and variant active.yes: border-bottom and border-color overlap without one containing the other, so the sheet cannot order them: set one of them, or the longhands` (both set `border-bottom-color`; write `borderBottomColor` in the variant). The same holds for two variants of different keys, which can be active together. Two such variants that set the same property are an error too, since nothing says which wins: `cssints: cv() variants a.x and b.x both set color and can be active together, so nothing says which wins: set it in one of them, or in the base`. Values of one key are never compared, since only one is active.
- **A compound wins over what it combines.** It is the most specific style, so under one condition it replaces what it sets again in the base and in the variant values it names (the same rule as a variant over the base): `compoundVariants: [{ size: "lg", tone: "loud", class: p(6) }]` drops the base's padding, `size.lg`'s padding and `tone.loud`'s padding while both are active, in the `compound` entry of the config (`{ when: { size: "lg", tone: "loud" }, class: "_x", drops: "_a _b" }`). The sheet order never decides. What a compound shares with other things that can be active together is compared as for variants: an overlap without containment is an error, and so is the same property in a compound and a variant of a key it does not name (it is active with any of its values), or in two compounds that can be active together (no key they both name with different values). Write the property in one of them, or in the base.

Slot variants (`scv`) are not part of 0.1.

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
- A value that a browser in your browserslist does not support is a warning, not an error: `cursor: pointer` warns for iOS Safari. A token or theme value is checked the same way (see Tokens). The browserslist is the `BROWSERSLIST` variable, else the standard config looked up from `process.cwd()` (`"browserslist"` in `package.json`, `.browserslistrc`, with the section of `BROWSERSLIST_ENV`, `NODE_ENV` or `production`), else `defaults`; `targets` and `cssTarget` of `cssints/vite` read the same one (see the README).
- **No warning for what LightningCSS lowers.** The build runs the sheet through LightningCSS with those targets, which gives `color: oklch(…)` a fallback (`color: #db4aa7; color: lab(…)`), prefixes `backdrop-filter` and folds a static `round()`. When a value warns, cssints asks LightningCSS: it transforms `x{prop: value}` (`:root{--x: value}` for a token value) for the targets that lack the feature, and the warning is dropped if the feature is gone from the first declaration of the output. It stays for what LightningCSS leaves: a `var()` inside the value (`oklch(from var(--x) l c h)`, `color-mix(in oklab, var(--x), …)`), a property it cannot prefix (`text-wrap`, `line-clamp`), and an inline `style()` or `token.set()` value, which never go through it. An `@property` initial value is not lowered by it either, but the engine writes the lowered form itself ("Fallbacks for older targets" under Themes). One transform per distinct value that already warns, cached per value and targets.
- Clamping text to N lines is the WebKit box, in every engine today: `display("-webkit-box")` (the `display` grammar takes `-webkit-box` and `-webkit-inline-box`), `WebkitBoxOrient("vertical")` and `WebkitLineClamp(N)`, with `overflow("hidden")`. The three are quiet: BCD files them under prefixed standard names, which the support lookup does not follow. LightningCSS passes them through and adds nothing. The standard `lineClamp(N)` (css-overflow-4) is a member too, and warns for the default targets: no engine ships it unprefixed (Chrome 154 rejects it) and LightningCSS does not prefix it.

```ts
import { cn, display, overflow, WebkitBoxOrient, WebkitLineClamp } from "cssints" with { type: "cssints" };

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

A plugin is a module that exports the members of a `scope()` from `cssints/plugin`: `scope("name", table).build(impl).export()`. The table says what the plugin has (syntax names, kernels, a runtime, conflicts, token sets, other scopes, and its members); the members are typed from the table, with no second file of types. User code imports the plugin with the attribute, like `cssints` itself: `import { ring } from "./ring.ts" with { type: "cssints" }`. There is no registration in `vite.config` and no type augmentation; the engine finds the sites by the attribute, and learns kernels, runtimes and conflicts from the style each member returns. In user code a member returns a class string, so it goes into `cn()`, `cx()` and the conditions like any `css.*` value.

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
	"#noOutline": { props: ["outline", /^outline-/], message: "ring() sets the outline: use its methods" },
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

export const card = cn(p(2), ring().width("thin").color("red"), webkitFontSmoothing("antialiased"), dot("small"));
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
- **Kernels** are global CSS, registered once per scope entry (key `<scope>.<entry>`) on first use: the CSS goes into layer `_.k`, below every class layer, and `atProperty` (the `@property` rules) at the top of the sheet. So a kernel cannot be conditional per site: a condition around a member that has only its marker is a build error (see "Conditions and layers"); give the member a method or arguments that set custom properties, which a condition can wrap. A kernel can also be written as styles, `css: (css) => [css.outline("var(--_w)", "solid", "var(--_c)"), css.outlineOffset("2px")]`, which prints the declarations under the kernel's class: they are checked like a user's (grammar, prose rules), conditions, `nest()`, `vars()` and `keyframes()` names are allowed (see below), `firstThatWorks()` and a member's marker are not. Build errors, at the call site: two keys that declare one custom property, two keys that print one marker, and two kernels written as styles in one member's `uses` that set properties of the element that meet (the same property, a shorthand and its longhand, a logical and a physical side, as in `cn()`): `cssints: x: kernels run and view both set animation, animation-timeline (they are one element's styles and print in no set order): write those in one kernel`. Kernels are printed in `_.k` sorted by key (`<scope>.<entry>`), whatever the order of `uses` or of the modules, so two of one member never decide between themselves; in one kernel the sheet's order holds (a shorthand before its longhands). A raw kernel derives no properties and is not compared (2026-10-08, cssints-life). A kernel's `requires` (BCD keys) is a build warning for a target that lacks one, never an error. A key that is also in the `polyfills` of a runtime in the member's `uses` is covered: it warns only for the targets that runtime does not reach (a `parentVars` runtime below `@property`, see below), and a fallback of CSS or a `script` covers it everywhere. The support warning of a declaration in a kernel written as styles is covered by the same rule, by its BCD key (the one in parentheses at the end of the warning): `core: { css: (css) => [css.borderRadius("var(--_r)"), css.cornerShape("squircle")] }` beside `mask: { polyfills: ["css.properties.corner-shape"], css: "..." }` in `uses` warns for nobody, so a plugin keeps derived conflicts without a raw kernel (2026-10-08, cssints-rp0e); a warning or an error of such a declaration prints its value as the sheet does, `var(--squircle-r)`, not `var(--_r)`. As in every support warning, a BCD `partial_implementation` counts as support, because most partial entries are edge cases; an entry `{ key, exact: true }` counts it as lacking, for a feature whose partial form gives other results (`surface()` asks for `{ key: "css.types.color.oklch.relative_syntax", exact: true }`), and the warning says so: `(a partial implementation counts as lacking)`.
- **Chain members** (`chain: { method: { args, spacing?, excludes?, emit } }`) give `() => chain`. `args` is the grammar of the method's parts, checked in the types (the error is on the bad argument and says `ring.width: unexpected "red" ...`) and again at build time. `spacing` makes a lone number a step of the spacing scale (0.25rem), as in `padding`. `emit` returns declarations; a custom property is allowed and its value is not checked, any other property is checked like a `css.*` one. A method is used once: the chain leaves it out. `excludes: ["darken"]` leaves other methods out after this one too, and `args: ""` makes a method that takes no value (`ink()`). A grammar must be a literal type (a `const` variable is fine; if TypeScript has widened it to `string`, the method says so: write `as const`).
- **Call members** (`{ args, uses? }` and a function in `build()`) take their arguments by `args`: a grammar (the parts, joined by a space, as a property takes them: `args: "small | large"`), `arg<T>()` (one value of a TypeScript type, which TypeScript checks and `build` gets as it is: `arg<"home" | "star">()`), or a **tuple of positional arguments**, each a grammar (one part), `"$tokens"` (a token set from `createTokens`), `"$overrides"` (values by path for the tokens of the `$tokens` before it, checked in the types against that token set), `"$selector"` (a CSS selector list, checked in the types for brackets and quotes and at build time as a whole), `arg<T>()`, or at the end one object of named leaves (`{ "size?": "<width>", on: "<color>" }`, a key ending in `?` is optional). `build` gets them as written, grammar parts as checked text. The positional form type-checks within the per-call budget; its cost is that an error lands on the call, with the position and the reason in the message, not on the argument. `build` returns `{ decls?, uses?, globals?, themes?, layers? }`.
- **`globals`** are global rules that are not classes (`{ rule, layer? }` in the table, or `{ css, layer? }[]` from `build`). A global is identified by its content, not by a name: the same rule from two styles is one, and editing a value replaces it. It is in the sheet of the modules whose styles carry it (as kernels are), and leaves it with them. `layer` sends a rule to a top-level layer of that name (`@layer app`); it must be declared by a `layers` entry (or `layers` from `build`: a list, or `{ layers: [...], before: true }` for layers below the engine's), or by `layers()` in a module imported before. No layer puts it in `_.k`. Unlike a kernel, two globals **may** declare the same custom property; that is what lets a look set the same `--color-*` in several source layers.
- **`themes`** — `themes: { tokens, overrides, selector, layer?, scope? }[]` from `build` is `createGlobalTheme(tokens, selector, overrides, { layer, scope })` made by a member, through the same path: the paths and values of `overrides` are checked against the types of `tokens` at build time, the aliases that depend on an override are declared again, and `check.contrast` reads the theme with the others. With `args: ["$tokens", "$overrides", ...]` the member takes the token set from its caller and the overrides are checked in the types as well.

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

- **`runtime: { polyfills, parentVars?, css?, script? }`** is the part for browsers that lack a feature. `polyfills` are BCD keys. A client module that holds a site with the member imports `virtual:cssints/runtime/<scope>.<entry>`, and the module is empty (`export {};`, nothing ships) unless a browserslist target lacks one of the keys and the runtime reaches it. A runtime with `parentVars` is a script that stands on `@property`, so it reaches only the targets that have it; `css` and `script` stand on nothing and reach every target (`@cssints/fonts`' capsize trim in Firefox 120). When it is needed, `parentVars` (`{ marker: "&", read, write, watch? }`, custom properties written `--_x`) configure `cssints/parent-vars`, one shared script and one `MutationObserver` for all plugins, `css` (the fallback rules) is added to the sheet in layer `_.k`, only then, and the module imports `script`.
- **`script`** (decided 2026-10-08, cssints-kuki) is the plugin's own browser code, a module specifier: `"#io": { polyfills: ["css.properties.animation-timeline"], script: "@cssints/reveal/runtime", css: "..." }`. It is a string the engine never evaluates (the script stays out of the build-time graph) and writes into the runtime module as `import "@cssints/reveal/runtime";`, which Vite resolves as the app's own imports are, in dev and in `vite build`. Write a subpath of the plugin's package, with a `development` condition for the source and a default for `dist/` (`exports: { "./runtime": { development: "./src/runtime.ts", default: "./dist/runtime.mjs" } }`): the package's own tests resolve it by its name too. A script reaches every target, so it is not gated: it ships to every browser of a build whose targets lack a key, and probes the feature itself (`CSS.supports`) to stay off where it is native; with `parentVars` beside it the two are decided apart. A script is a module, so the browser runs it once, however many sites, files or runtime entries import it. The plugin's subpath stays public: an app can still import it by hand, which is harmless. Derived tokens are not members; the engine registers their runtime (`cssints/derived`) on this same delivery (see "Themes").
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
export const h = css.backgroundImage(css.linearGradient("to right", [t.color.accent, "25%"], "blue"));
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
		value: ([color, { by = "10%", dark }]) => `color-mix(in oklab, ${color}, ${dark ? "black" : "white"} ${by})`,
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
export const card = css.cn(frame().radius("1.5rem").padding(4).border("1px"), css.bg("white"), css.borderColor("#9ca3af"));
export const field = css.cn(frame().padding(2).border("1px"), css.borderColor("#9ca3af"));
// a token is a length; a condition just sets the custom property, and the whole subtree follows
export const panel = css.cn(frame().radius(radius).padding(2), css.media("(width >= 40rem)")(frame().padding(6)));

export const noNumber = frame().radius(4); // error: a bare number is a spacing step in padding and margin only
export const noPercent = frame().padding("5%"); // error: a length, not a percentage
export const once = frame().radius("1px").radius("2px"); // error: a method is used once
export const own = frame().color("red"); // error: a frame chains its own methods only
```

- **Methods**, each once and in any order: `radius(<length>)`, `padding(<length> | step)`, `border(<length>)` (a width; the style is `solid`), `margin(<length> | step)`. `radius` is the radius of the outermost frame; inside a frame it is ignored (the radius is computed). A lone number in `padding` and `margin` is a step of the spacing scale (0.25rem). Tokens go anywhere a length does.
- **Build errors** (at the call site): a negative radius, padding or border, a percentage, and a `cn()` that holds `frame()` and a property it sets: `padding*`, `margin*`, `border-radius` and its corners, `border`, `border-width`, `border-style` and the border sides (`cssints: frame: frame() sets padding, margin, border-radius and the border: use its methods (this style also sets padding)`). Border colours (`borderColor`, `borderTopColor`) are plain styles and do not conflict. Conflicts across `cx()` are not seen, as for any plugin.
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

- **Methods**, each once and in any order: `color(<color> | token)` is an absolute base (without it the base is the nearest surface around, or `Canvas` for the outermost); `lighten(step)`, `darken(step)` and `contrast(step)` move the lightness of the base by a `<number [0,1]>`, and only one of the three goes in a chain; `ink()` sets the text colour to black or white by the lightness of the surface (above 0.5636 black, else white). `contrast` moves *away* from the parent: a light parent is darkened, a dark one lightened. The base may be a relative colour (`oklch(from var(--brand) l c h)`).
- **Build errors** (at the call site): a step outside 0 to 1, a bad colour, a method used twice or with another step, and a `cn()` that holds `surface()` and `background` or `background-color`, `bg()` included (`cssints: surface: surface() sets the background colour: use its methods (this style also sets background-color)`). `backgroundImage`, `color` and the border colours do not conflict. Conflicts across `cx()` are not seen, as for any plugin.
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
._icons-mask { display: inline-block; width: 1em; height: 1em; background-color: currentColor; mask: var(--icons-svg) no-repeat center / 100% 100%; }
/* the only per-icon rule */
._x1 { --icons-svg: url("data:image/svg+xml,%3Csvg …"); }
```

- **`icons({ provider: "iconify-json", collection })`** reads `@iconify-json/<collection>/icons.json` from the `node_modules` of the working directory, while the module runs. **`icons({ provider: "fs", dir })`** reads `<dir>/<name>.svg` (`dir` is relative to the working directory; the SVG needs a `viewBox`). The result is a function of the icon name: `mdi("home")` is a style that goes into `cn()`, `cx()` and the conditions like any member. Call `icons()` in a module of its own, imported with the attribute, as above.
- **Names.** TypeScript cannot read a module type from a string, so the names of a collection come from the type argument: `icons<typeof import("@iconify-json/mdi/icons.json")>(…)` types `mdi(name)` as the icons and aliases of that collection, and a typo is an error in the editor. Without the type argument, and for `fs`, a name is any string. In every case a name that does not exist is a build error at the call, with the nearest name when it is close: `cssints: icons: no icon "hom" in iconify-json mdi, did you mean home?`.
- **Mask or image.** An icon that paints with `currentColor` (every one-colour icon of a collection) gets the marker `_icons-mask` and takes the text `color`. Any other (a logo with its own colours) gets `_icons-image`, a background image. This is iconify's own rule. A non-square icon is centred on a square view box, so `width` and `height` set its size (`1em` by default).
- **Cost.** The kernel is printed once. Each icon adds one class, and the same icon is the same class everywhere. The kernel has no `requires`: LightningCSS adds `-webkit-mask` for targets that have only the prefixed form.
- **Dev.** An edited SVG of `fs` updates the CSS of the modules that use it, without a touch or a restart (`dependsOn`, see "Plugins"; 2026-10-09, cssints-04u8). A new SVG in `dir` is not seen until the module runs again.
- **Not yet:** the iconify HTTP API (it would need a lockfile), names generated for `fs`, and a name transform.

### Plugin packages (cssints-dk1q)

More plugins on `scope()`, each a package of its own with its rules and limits in its README. Import them with the attribute, like `cssints`.

| Package | Members | What it does |
|---|---|---|
| [`@cssints/fluid`](../packages/fluid/README.md) | `fluid(min, max, { from?, to?, zoom? })`, `fluid.container(...)` | A `clamp()` that grows between two widths, computed at build time; a range that fails WCAG 1.4.4 is a build error |
| [`@cssints/layout`](../packages/layout/README.md) | `stack()`, `cluster()`, `sidebar()`, `switcher()`, `cover()`, `autoGrid()` | Every Layout primitives as chain members |
| [`@cssints/fonts`](../packages/fonts/README.md) | `font(family, { provider, ... })` → `.family()`, `.trim()` | `@font-face` and a metric-matched fallback face; cap-height trimming by `text-box`, else capsize's margins |
| [`@cssints/reset`](../packages/reset/README.md) | `reset({ media?, prose? })` | A modern reset in a top-level `@layer reset` declared before the engine's, below every style |
| [`@cssints/tokens`](../packages/tokens/README.md) | `/open-props`, `/radix`, `/flexoki`, `/reasonable-colors` | DTCG data for `createTokens` |
| [`@cssints/gradient`](../packages/gradient/README.md) | `gradient(kind, direction, from, to, easing?, stops?)` | Eased colour stops mixed in oklab at build time |
| [`@cssints/motion`](../packages/motion/README.md) | `motion().preset().duration().delay().easing()` | Animation presets over `keyframes()`, with reduced motion |
| [`@cssints/squircle`](../packages/squircle/README.md) | `squircle().radius()` | `corner-shape: squircle`, else a CSS `mask` of the same shape |
| [`@cssints/reveal`](../packages/reveal/README.md) | `reveal().preset().range().duration().easing()` | motion's entrance presets on `animation-timeline: view()`; for other targets a script plays it once on entry (delivered by the runtime) |
| [`@cssints/stuck`](../packages/stuck/README.md) | `sticky().top()`, `stuck(styles)`, `stuck("bottom")(styles)` | Styles inside a sticky element while it is stuck, by `@container scroll-state()`; for other targets an `IntersectionObserver` (delivered by the runtime) |
| [`@cssints/balance`](../packages/balance/README.md) | `balance()`, `pretty()` | `text-wrap: balance` / `pretty`; for targets without balance a script balances the lines (delivered by the runtime) |
| [`@cssints/masonry`](../packages/masonry/README.md) | `masonry().columns().gap()` | `display: grid-lanes`, else CSS `columns` (top to bottom per column) |
| [`@cssints/placeholder`](../packages/placeholder/README.md) | `placeholder(path, { mode? })` | An `<image>` from a JPEG or PNG read at build time: a gradient of its colours laid out as the image, or a tiny thumbhash PNG |
| [`@cssints/ramp`](../packages/ramp/README.md) | `ramp(base, { mode, steps \| ratios, background })`, `overrides(ramp)` | An OKLCH palette as DTCG data for `createTokens`; the contrast mode meets each ratio against its background |
| [`@cssints/skeleton`](../packages/skeleton/README.md) | `skeleton().radius().color().highlight()` | Loading placeholders whose shimmer is in phase across the page (one clock on `:root`), static under reduced motion |

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

- **Build with tsdown** (`vp pack`), with `cssints` external and `dts: true`. tsdown keeps the import attributes, so there is no option to set. It also merges `import { cx } from "cssints"` into the attributed import of the same module; the engine reads `cx` as runtime wherever it is written, so that is fine. The built `.d.ts` types `button` as `(props?: …) => string`, with the props of its variants. Do not minify, bundle or transform the JS further with a tool that drops import attributes, and do not bundle `cssints` into it.
- **Keep in the package:** `cssints` in `peerDependencies` (the app needs it to build; a library that imports it must list it), the JS with the attributes, the `.d.ts` (it types `cssints` members as class strings and tokens as tokens, so the app is checked across the boundary), and no `.css` file: the library has no sheet of its own.
- **The app needs cssints and its plugin.** The package has no classes until the app's `cssints()` plugin has evaluated it, so an app without cssints cannot use it. Pre-compiled output (class strings plus a sheet fragment for apps without cssints) is not supported yet; it waits for a first user.
- **The package must be a direct dependency of the app.** `cssints/vite` reads the `package.json` of the app and of each of its dependencies, and for a dependency that lists `cssints` it adds the package to `optimizeDeps.exclude` (the dev optimizer would pre-bundle it with esbuild and drop the attributes) and to `ssr.noExternal` (the engine's runner would otherwise load it as native Node, which does not know the attribute). This is a few file reads at startup, one per dependency, and nothing else. A package that is only a dependency of another package is not found; add it to the app's own dependencies (or to those two options).
- **Dev and HMR.** The package's files go through the engine like app files, one evaluation per module, and are served as `/node_modules/…/index.js` with the classes replaced. They are never watched, so a package does not change during `vite dev`: restart the server after reinstalling it.
- A file of a package that does not carry the attribute is never parsed by the engine.

### Debugging: from a class to its call (dev source map, cssints-0a3p)

In dev the sheet has a source map: each rule with a class points at the first `css.*` call that made the class, so Chrome's Styles pane names that file and line beside `._tlfnko` and opens it in Sources. Vite drops CSS maps in dev unless you turn them on:

```ts skip
export default defineConfig({ plugins: [cssints()], css: { devSourcemap: true } });
```

A class is a hash of its declaration, so a class that many calls share points at its first call in the module that comes first by path. The place is the whole site (`cn(...)`, `cx(...)`), not the argument inside it. Token, theme and `@property` rules carry no class and map nowhere.

A build maps the sheet too, when the app asks for maps (`build: { sourcemap: true }`, `"hidden"` or `"inline"`, as for its JS): the CSS asset that holds the sheet gets `<file>.css.map` and a `sourceMappingURL` comment (`"hidden"`: the file only; `"inline"`: a data URL). Vite writes no CSS map in a build, so cssints maps the asset as written, after LightningCSS and the minify: each rule with a class points at its call, the rest maps nowhere. Bundle analysers read it to split the sheet's bytes by module (docs/research/devtools.md: Sonda). Without `build.sourcemap` nothing is recorded and the output is unchanged. Devtools that read the CSSOM (atomic-css-devtools) see the sheet as any other; what they miss is in docs/research/devtools.md.

### Debugging: the devtools overlay (`@cssints/devtools`, decided 2026-10-09, cssints-cncb)

An inspector in the page, in dev only, built on what the dev server knows of every class. Install `@cssints/devtools` as a dev dependency of the app and turn it on:

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

- **Classes by call.** The element's classes, grouped by the `css.*` call that made them (`cn(...)`, `cx(...)`, a member), the call that covers most of them first; the link opens the file at that line through Vite's `/__open-in-editor`. Each class shows its declarations, its conditions (green: holds now) and its layer; a marker shows its kernel (`marker of kernel frame.core`), a member's class its scope (`(frame)`); a class that is not cssints' is listed as such.
- **Properties.** Per property, the winning declaration, what it beat (struck through) and what does not apply now, with the condition that fails. The winner is the highest by **layer, then specificity, then the sheet's order**, among the rules that apply: a rule applies when its selector matches the element now and each of its at-rules holds for it, which the browser decides (a probe sheet around the element, so `@container`, `@container style()`, `@supports` and `@scope` are evaluated where the element is). A shorthand counts for each of its longhands: `padding` beside a `padding-left` of a higher layer says `except padding-left`. Kernels and global rules in `_.k`, themes and looks in their layers are rules like the others.
- **Checked against the browser.** Each winner is set inline on a childless clone of the element, in its place, and the clone's computed value must equal the element's: ✓. When it does not (✗), the panel says why: the element's `style` attribute, a rule of another sheet (a rule outside every layer beats every layer, cssints' too: `.mine { color: … } in src/inspect.css beats it`), or a running animation. A value that depends on the element's content (`width: auto`, grid tracks) is `?`, not checked.
- **Tokens.** Each custom property the element's rules read: its value on the element, its path (`color.surface`), and the rule that sets it on the element or the nearest ancestor (a theme, a look in `@scope`, a member's class).
- **How it gets the data.** Over Vite's HMR channel, no endpoint: the overlay asks for the table (`cssints:devtools:get`) and the server builds it from its own records: the sheet as it serves it, each class's rule, plugin and tokens, and the place of every call. After each transform the server says the table is stale, and an open overlay asks again.
- **Nothing in a build.** The option adds a plugin with `apply: "serve"`; `vite build` has no entry, no script and no event of it (packages/devtools/test/build.mjs builds the demo with the option on and searches the output).
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
- **Events:** `cssints.warning` (message, file; a support warning has no offset) and `cssints.error` (message, file, offset). An error that reaches Vite has `traceId` and `spanId`, and ends its message with `(trace <id>)`: search for that id in the backend.
- **Not traced:** the work per site and per declaration (`__at`, `__site`, the twin, the hash): at a few µs each, a span per call would be the cost it is meant to find. Read the `cssints.runner.import` span for their total.

The process must end the exporter or Node stays alive: `vite build` and `server.close()` do it (the `closeBundle` hook flushes and stops it); a script that exits by itself calls `closeTrace()` from `cssints/src/trace.ts` first. A backend that is not there costs a retry of up to three seconds at the end and loses the trace, nothing else.

`packages/cssints/test/trace.mjs` (in `bun run test`) checks the spans, the file attribute and the error's trace id against an in-process collector. `node packages/cssints/test/trace-live.mjs` builds apps/sky and runs its HMR test traced, then reads both traces back through Jaeger's API (`GET /api/traces?service=cssints`) and prints span counts and the slowest hooks; it skips when no backend answers. Effect's DevTools (the VS Code extension, `effect/devtools`) is not wired: it needs the editor's extension listening, so neither a script nor an agent can read it.

### Browser support and what 0.1 does not have

- **Types and checks for every property** are generated from [mdn-data](https://github.com/mdn/data) and @webref/css by `packages/css-grammar` (`bun run extract`), not written by hand, so a new property or function needs no change here. 536 members: 525 properties (every standard and experimental one, except the three shorthands above) and the 11 short names.
- **Browser support** comes from [`@mdn/browser-compat-data`](https://github.com/mdn/browser-compat-data) against browserslist, as build warnings (see above). There is no per-property table in the types.
- **Not in 0.1:** pseudo-elements, `:has()`, derived tokens, slot variants, a typed runtime token setter, icons (the plugin API they are written on is above; `frame()` is in `cssints/frame`, `surface()` in `cssints/surface`), polyfills of its own for missing browser features. The map and the reasons are in [wayfinder.md](wayfinder.md).
