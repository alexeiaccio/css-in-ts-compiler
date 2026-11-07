# @cssints/balance

`text-wrap: balance` and `text-wrap: pretty` for [cssints](../../README.md), as members of `cssints/plugin` `scope()`.
`css.textWrap("balance")` already gives the native feature; what this package adds is the fallback: for browserslist
targets that lack `text-wrap: balance` (BCD `css.properties.text-wrap.balance`: Chrome 114, Firefox 121, Safari 17.5),
a 0.55 kB script balances the lines the way [nytimes/text-balancer](https://github.com/nytimes/text-balancer) and
[react-wrap-balancer](https://github.com/shuding/react-wrap-balancer) do.

```ts
import { cn, fontSize } from "cssints" with { type: "cssints" };
import { balance, pretty } from "@cssints/balance" with { type: "cssints" };

export const title = cn(balance(), fontSize("2rem"));
export const lead = pretty();
```

```css
@layer _.k {
  ._balance-core {
    text-wrap: balance;
  }
  ._balance-prettyCore {
    text-wrap: pretty;
  }
  /* only when a target lacks text-wrap: balance */
  @supports not (text-wrap: balance) {
    ._balance-core {
      --balance-js: 1;
    }
  }
}
```

## Browsers

- **Native**: `text-wrap: balance` in Chrome 114, Firefox 121, Safari 17.5; `text-wrap: pretty` in Chrome 117 and
  Safari 26, not in Firefox.
- **The runtime** covers every browser with `ResizeObserver` (Chrome 64, Firefox 69, Safari 13.1). `bun run
test:browsers` checks it in Chrome, Firefox and WebKit, natively and with the native feature switched off: the script
  gives the same lines as the browser.

## Rules

- **`balance()`** is a kernel written as styles, `css.textWrap("balance")`, and a runtime entry for
  `css.properties.text-wrap` and `css.properties.text-wrap.balance`, which covers the kernel's support warnings. When a
  target lacks it, the sheet gets the fallback rule above: `--balance-js: 1` inside `@supports not (text-wrap: balance)`,
  so it is on only in a browser without the feature, and the module that uses `balance()` imports the script through
  `virtual:cssints/runtime/balance.script` (the runtime entry names it, `script`). When every target has it, neither the
  rule nor the script ships: the runtime module is empty. No support warning either way, and nothing to import by hand.
- **The runtime** (`@cssints/balance/runtime`, no imports, 552 bytes minified and gzipped) acts on an element of class
  `_balance-core` whose computed `--balance-js` is set: it binary-searches the narrowest `max-width` (between half the
  width and all of it) that keeps the element's height, so the line count stays and the lines even out. It runs again
  when the element's parent resizes (`ResizeObserver`), when its text changes, when a marked element is added
  (`MutationObserver`), and when the fonts are ready.
- **`pretty()`** is `text-wrap: pretty` and nothing more. There is no small polyfill: pretty weighs the whole paragraph
  to avoid orphans and ragged edges, and a browser without it wraps as usual, which is what pretty improves on. So it
  requires nothing, warns about nothing and ships nothing (a `css.textWrap("pretty")` warns for Firefox, this does not):
  its kernel is raw CSS, `&{text-wrap:pretty}`, since nothing would cover the warnings of one written as styles.
- **Conflicts.** Both set `text-wrap`: a `cn()` that holds one of them and `text-wrap*` or `white-space` is a build
  error. `balance()`'s are derived from its kernel, `cssints: balance: kernel core sets text-wrap (this style also sets
text-wrap)`; `pretty()`'s raw kernel derives none, so an entry lists them: `cssints: balance: it sets text-wrap (this
style also sets text-wrap-style)`.

## Limits

- **No conditions.** A member is a kernel's class, global CSS that cannot be conditional: `hover(pretty())` or
  `media(...)(balance())` is a build error at the call (`:hover wraps _balance-prettyCore, the marker of kernel
balance.prettyCore, with no declaration of its own`). Under a condition, use `css.textWrap(...)` (native only).
- **The fallback sets `max-width`** on the element: the box narrows, where `text-wrap: balance` keeps it. Centred text
  needs `margin-inline: auto` on the element to stay centred. An inline `max-width` of your own is overwritten.
- Horizontal writing modes only; the parent must not size itself from the element (a shrink-to-fit parent can loop
  with the `ResizeObserver`).

```bash
cd packages/balance && bun run test            # fixtures through the engine (kernel, fallback CSS by target, conflict)
cd packages/balance && bun run typecheck       # and the type test
cd packages/balance && bun run test:browsers   # Chrome, Firefox and WebKit through playwright-core
```

## Credits

The idea is [nytimes/text-balancer](https://github.com/nytimes/text-balancer) (Apache-2.0, The New York Times
Company) and [react-wrap-balancer](https://github.com/shuding/react-wrap-balancer) (MIT, Shu Ding): find the narrowest
width that keeps the line count by a binary search, and again when the parent resizes. The script is written here; no
code is copied.
