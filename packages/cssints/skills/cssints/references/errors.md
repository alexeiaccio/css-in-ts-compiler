# cssints build errors and warnings

A value error is given twice: as a type error on the bad part in the editor, and as a build error with the file and
the place of the call (the Vite overlay points at it). Some errors only the build sees: runtime arguments, conflicts,
contrast, ranges in some positions, `supports()` property names. The messages below are the real text, shortened with
`…`.

## Imports and build-time values

| Message                                                                                                                  | Meaning and fix                                                                                                                                                                                                      |
| ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<file> imports build-time p from "cssints" without the attribute. Import it as: … with { type: "cssints" }`             | Every member runs at build time. Add `with { type: "cssints" }` to that import.                                                                                                                                      |
| `css arguments must be known at build time: n is not defined where the call is evaluated (a parameter, a prop or state)` | The call reads a runtime value. Make the styles at build time and choose at runtime: `cn(base, on && p(4))`, a `cv()` variant, or a token set in `style={...}`. Also when a local shadows a global (`open`, `name`). |
| `imports cx from "cssints", which is gone: cn(...) takes runtime values now`                                             | Old code: `cx(a, on && b)` is `cn(a, on && b)` now (cn from `"cssints" with { type: "cssints" }`). `cx(p(4), p(2))` kept both; `cn` keeps `p(2)`.                                                                    |
| `imports _cv from "cssints", which is gone`                                                                              | Old code: `cv({ ... })` is the function now. Drop `_cv(` and its closing bracket.                                                                                                                                    |

## Grammar errors

The shape is `<property>: unexpected "<token>" in "<value>", expected <grammar>`.

| Example                                                                                                | Fix                                                                                                 |
| ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| `padding: unexpected "-0.25rem" in "-0.25rem", expected <length-percentage [0,∞]>` (`p(-1)`)           | Out of the range. A negative spacing is not a padding; use `margin` for negative values.            |
| `color: unexpected "RED" in "RED" ("RED" is red in CSS; write "red"), expected <color>`                | Keywords and function names have one spelling, the canonical lowercase one.                         |
| `color: unexpected "1px" … ("var(--gap)" is checked as "1px": a token stands for a value of its type)` | A token of the wrong type: a length token in a colour property. Use a token of the property's type. |
| `width: unexpected "calc(1px" … (cannot add length and time)`                                          | Math on mixed kinds. Check the units and the tokens in the `calc()`.                                |
| `@media: unexpected "min-width" in "screen and min-width > 40rem", expected <media-query>`             | A range needs parentheses: `media("(width >= 40rem)")`.                                             |
| `@supports: unexpected "grdi" in "(display: grdi)", expected <supports-in-parens>`                     | A typo in the declaration of `supports()`.                                                          |
| `selector: unexpected end in "a >", expected <complex-selector-list>`                                  | A selector of `global()` or of a theme is incomplete.                                               |
| `cv() base must be a css.* value (cn(...), a flex() chain or one property), got "padding: 1rem"`       | CSS strings are gone everywhere: write `cn(p(4), fontSize("1rem"))`.                                |

A type error with no build error usually means the value is valid CSS that the types read too strictly (or the
reverse); trust the build's message and, with the MCP server, `check_declaration`.

## Chains

| Message                                                                    | Fix                                                                                          |
| -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `flex() has no .padding(); it chains direction, wrap, flow, alignItems, …` | A chain has only its container properties. Merge the rest: `cn(flex().gap(2), p(4))`.        |
| `plain styles do not chain (.gap); merge them with cn(...)`                | `flex("1")` (with an argument) is the shorthand property, a plain style.                     |
| `sticky().top() is used twice` (and other members: a method is used once)  | Each method of a chain once. Under a condition, a second chain is fine: `hover(x().y(...))`. |

## Conflicts

| Message                                                                                                             | Fix                                                                                                                                         |
| ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `border-top and border-color overlap without one containing the other, so the sheet cannot order them …`            | In one `cn()`. Set one of them, or the longhands (`borderTopColor`). Same for a physical and a logical side (`marginLeft`, `marginInline`). |
| `cv() base and variant active.yes: border-bottom and border-color overlap …`                                        | The same rule between base, variants and compounds that can be active together.                                                             |
| `cv() variants a.x and b.x both set color and can be active together, so nothing says which wins`                   | Set the property in one variant, or in the base.                                                                                            |
| `layout: kernel stack-core sets display, flex-direction, gap (this style also sets display)`                        | A plugin member and a property its kernel sets, in one `cn()`. Use the member's method (`stack().gap(4)`), or drop the property.            |
| `frame: frame() sets padding, margin, border-radius and the border: use its methods (this style also sets padding)` | The same, with the plugin's own message.                                                                                                    |

A runtime argument of `cn()` is joined at runtime; a style in it replaces what it overrides, and `props.class` is only appended, so a conflict with it is not reported.

## Conditions

| Message                                                                                                        | Fix                                                                                                                                                                                     |
| -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `:hover wraps _balance-prettyCore, the marker of kernel balance.prettyCore, with no declaration of its own: …` | A kernel is global CSS keyed to a class: it cannot be conditional. Put the member outside the condition; wrap one of its methods or a plain property (`hover(css.textWrap("pretty"))`). |
| `a style takes at most 4 conditions (layers _.a to _.e); this one has 5: …`                                    | Fewer nested wrappers. Bind a combined query (`media("(width >= 40rem) and (hover: hover)")`) instead of two.                                                                           |
| `global() takes media(), container() and supports() conditions, not :hover: write the state in the selector`   | `global("a:hover", color("red"))`.                                                                                                                                                      |
| `within(media(...))` is an error                                                                               | `within()` takes a pseudo-class wrapper or `attr(...)`, not a query.                                                                                                                    |

## Tokens, themes, layers

| Message                                                                               | Fix                                                                                                             |
| ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `contrast 2.84 is below 4.5: c.fg #999 on c.bg #fff, in the default values`           | `check.contrast` failed (it names the theme when a theme fails). Change the colour, or the theme that names it. |
| warning: `padding: "var(--space-sm)" is the token space.sm: pass the token itself, …` | Pass `t.space.sm`; for a fallback, `css.var(t.space.sm, "4px")`.                                                |
| warning: `… stays at its static default in chrome 109 …`                              | A derived colour the old-browser runtime cannot compute; it keeps its default there. Usually acceptable.        |
| two tokens with one name, `2xs` and `_2xs` in one group, a cycle of references        | Rename; a digit key `2xs` is `t.space._2xs` in code.                                                            |
| `$type "fontFamily"` (or `string`, a composite type) has no token type                | Leave it out of the token file; set fonts with `fontFamily(...)` or `@cssints/fonts`.                           |
| an undeclared layer in `{ layer: "app" }`, the same layers in another order           | Call `layers("app", ...)` first, in this module or one it imports; keep one order everywhere.                   |

## Support warnings

`cursor: "pointer" … is not supported by ios_saf … (css.properties.cursor)`: the value is valid, a browserslist target
lacks it. It is a warning, not an error. Options: accept it, add a fallback (`firstThatWorks(wanted, fallback)`), or
narrow the browserslist. The BCD key is in parentheses; `check_support` of the MCP server answers the same question.
Vite shows the warning at the `css.*` call that made it (file, line, column, a code frame). A build says it once per
file; a dev server again when that file is edited, not on every update. The targets are the browserslist of Vite's
`root`.

## When an error has `(trace <id>)`

The build ran with `CSSINTS_TRACE=otlp`; search for the id in the trace backend (Jaeger) to see the hook and the file.
