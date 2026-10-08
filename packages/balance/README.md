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

```ts
// the app's entry, once: needed only when a target lacks text-wrap: balance (see "Rules")
import "@cssints/balance/runtime";
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

- **`balance()`** is a kernel, `text-wrap: balance`, and a runtime entry for `css.properties.text-wrap.balance`. When a
  target lacks it, the sheet gets the fallback rule above: `--balance-js: 1` inside `@supports not (text-wrap: balance)`,
  so it is on only in a browser without the feature. When every target has it, the rule is not in the sheet and the
  runtime does nothing (drop the import). No support warning either way.
- **The runtime** (`@cssints/balance/runtime`, no imports, 552 bytes minified and gzipped) acts on an element of class
  `_balance-core` whose computed `--balance-js` is set: it binary-searches the narrowest `max-width` (between half the
  width and all of it) that keeps the element's height, so the line count stays and the lines even out. It runs again
  when the element's parent resizes (`ResizeObserver`), when its text changes, when a marked element is added
  (`MutationObserver`), and when the fonts are ready. Import it from the app's entry, not from a module with styles:
  the engine evaluates those in Node.
- **`pretty()`** is `text-wrap: pretty` and nothing more. There is no small polyfill: pretty weighs the whole paragraph
  to avoid orphans and ragged edges, and a browser without it wraps as usual, which is what pretty improves on. So it
  requires nothing, warns about nothing and ships nothing (a `css.textWrap("pretty")` warns for Firefox, this does not).
- **Conflicts.** Both set `text-wrap`: a `cn()` that holds one of them and `text-wrap*` or `white-space` is a build
  error: `cssints: balance: it sets text-wrap (this style also sets text-wrap)`.

## Limits

- **No conditions.** A member is a kernel's class, global CSS that cannot be conditional: `hover(pretty())` or
  `media(...)(balance())` is a build error at the call (`:hover wraps _balance-prettyCore, the marker of kernel
  balance.prettyCore, with no declaration of its own`). Under a condition, use `css.textWrap(...)` (native only).
- **The fallback sets `max-width`** on the element: the box narrows, where `text-wrap: balance` keeps it. Centred text
  needs `margin-inline: auto` on the element to stay centred. An inline `max-width` of your own is overwritten.
- Horizontal writing modes only; the parent must not size itself from the element (a shrink-to-fit parent can loop
  with the `ResizeObserver`).
- The runtime is the app's import: the engine delivers a plugin's script only for `parentVars` runtimes, so
  `virtual:cssints/runtime/balance.script` stays empty and nothing warns when the import is missing.

```bash
cd packages/balance && bun run test            # fixtures through the engine (kernel, fallback CSS by target, conflict)
cd packages/balance && bun run typecheck       # and the type test
cd packages/balance && bun run test:browsers   # Chrome, Firefox and WebKit through playwright-core
```
