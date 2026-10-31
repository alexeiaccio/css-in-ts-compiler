# @cssints/reactive

CSS-first interactions for [cssints](../../README.md): state is a set of custom properties on an owner element, a write
happens only in an event, and a condition or a piece of DOM output is plain CSS. One small script delegates the events and
writes the attributes; nothing else runs in the browser.

The model is [Reactive CSS](https://reactivecss.com/): state as custom properties, events and conditions in the styles. Its
strictness comes from [Solid 2.0's RULES-FUNDAMENTALS](https://github.com/solidjs/solid/blob/next/packages/signals/docs/RULES-FUNDAMENTALS.md)
and [ReactiveScript](https://github.com/ryansolid/reactivescript): sources are the only writable things, writes happen in
imperative scope (an event), state belongs to an owner element, and one flush paints one whole frame.

Reactive CSS writes `:on(click)` in the selector. That is not valid CSS, and cssints ships compiled class strings, so an
event program travels as data in non-inheriting custom properties that a delegated listener reads.

```ts
import { cn, display, p } from "cssints" with { type: "cssints" };
import {
  bind,
  inside,
  on,
  set,
  state,
  toggle,
  when,
} from "@cssints/reactive" with { type: "cssints" };

const ui = state({ open: false, tab: "one" }); // { owner, open, tab }
const card = cn(ui.owner, p(4)); // the owner element
const button = cn(
  on({ click: toggle(ui.open) }), // a write, only in an event
  bind({ "aria-expanded": ui.open }), // DOM output
);
const panel = inside(ui.open)(display("block")); // a descendant of the owner
const tabPanel = inside(ui.tab, "two")(display("block"));
const own = when(ui.open)(display("block")); // the element itself
```

## The model

- **A source is the only writable thing.** `state()` is the only source; a derivation is CSS itself
  (`calc(var(--reactive-count) * 2)`, a condition). There is no JavaScript derivation to write to, so the mistake is
  unrepresentable.
- **Writes happen only in an event.** `toggle()` and `set()` return an opaque `Action`; only `on()` takes one, so a write at
  module level cannot be written (a type error).
- **State belongs to an owner element.** `state()` gives an owner's style and one source per state. An event writes the
  nearest owner of the element its program is on (`closest`), like Solid's owner tree.
- **One event, one flush.** The runtime applies every action of the event, then rewrites every binding of each owner it
  touched. CSS paints once; no intermediate state is visible.
- **No async in v1.** No fetching, so no loading or error boundaries; the async fundamentals of Solid 2 are the reference
  for a later version.

## API

| Member                              | What it does                                                                                                    |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `state(states)`                     | The owner: `{ owner, ...sources }`. Names are idents; two calls in one `cn()` are one owner.                    |
| `toggle(source)`                    | An action that flips a boolean source. Only `on()` takes it.                                                    |
| `set(source, value)`                | An action that sets a source to a value, or to the field's (`value()`, `checked()`). Only `on()` takes it.      |
| `value()`                           | The value of the field the event fired on (`target.value`, a string). Only `set()` takes it.                    |
| `checked()`                         | Whether the field is checked (`target.checked`). Only `set()` takes it.                                         |
| `on({ event: action \| action[] })` | The element's program: click, input, change, submit, keydown, keyup, pointerdown, pointerup, focusin, focusout. |
| `bind({ attribute: source })`       | Writes each attribute on the element it is on, from its nearest owner.                                          |
| `when(source, value?)`              | A condition on the element itself (`data-reactive-<name>`), `"true"` when the value is left out.                |
| `inside(source, value?)`            | A condition on a descendant of the owner (`within()` over its `data-reactive-<name>`).                          |

Two calls of `on()`, `bind()` or `state()` in one `cn()` append instead of replacing: the element's program is
`click toggle open,keydown set tab two`, its attributes `aria-expanded open,data-current tab`, and its owner's states
`open,tab`. A `<select>` drives a string state with `set(ui.tab, value())`, a checkbox a boolean one with
`set(ui.open, checked())`.

The CSS of the example above (the class names are hashes):

```css
@layer _.k, _.a, _.b, _.c, _.d, _.e;
@property --reactive-owner {
  syntax: "*";
  inherits: false;
}
@property --reactive-on {
  syntax: "*";
  inherits: false;
}
@property --reactive-binding {
  syntax: "*";
  inherits: false;
}
@layer _.k {
  ._reactive-events {
  }
  ._reactive-binding {
  }
  ._reactive-owner {
  }
}
@layer _.a {
  ._1un0p5l {
    --reactive-owner: open, tab;
  }
  ._1gy1wuu {
    --reactive-open: false;
  }
  ._3z64sy {
    --reactive-tab: one;
  }
  ._1u5v0k0 {
    --reactive-on: click toggle open;
  }
  ._2qzz6u {
    --reactive-binding: aria-expanded open;
  }
  ._lwugp7 {
    padding: 1rem;
  }
}
@layer _.b {
  :where(._g-reactive[data-reactive-tab="two"]) ._1x9gkmf {
    display: block;
  }
  :where(._g-reactive[data-reactive-open="true"]) ._edztjc {
    display: block;
  }
  ._23ymfi[data-reactive-open="true"] {
    display: block;
  }
}
```

`--reactive-open` and `--reactive-tab` inherit, so any descendant can read them in CSS
(`color: var(--reactive-tab)`); the three lists do not inherit, so an element sees only its own program and bindings.

## Protocol

What the build emits, and what `./runtime` reads (for debugging):

| Custom property      | On                   | Value                                     |
| -------------------- | -------------------- | ----------------------------------------- |
| `--reactive-owner`   | `._reactive-owner`   | the states, `open,tab`                    |
| `--reactive-<name>`  | the owner            | the state's value (`false`, `one`, `2`)   |
| `--reactive-on`      | `._reactive-events`  | `click toggle open,change set tab @value` |
| `--reactive-binding` | `._reactive-binding` | `aria-expanded open,data-current tab`     |

The runtime writes `data-reactive-<name>="<value>"` on the owner — what `when()` and `inside()` read — and the same value
as an inline `--reactive-<name>`, what CSS derivations read. On load it initialises each owner (`data-reactive-<name>` from
the declared value) and writes its bindings; on an event it walks from the target up, applies every program it finds to
that element's nearest owner, and then updates the bindings of each owner once. Nodes added later are initialised too
(a `MutationObserver`). A set segment's value is a literal, or `@value`/`@checked`: the runtime reads `target.value` (a
string) or `target.checked` (`"true"`, `"false"`) off the element the event fired on. An identical segment written twice
is applied once, so a program twice is still one toggle.

## Limits

- Several calls on one element append: two `state()`s are one owner's states, two `on()`s one program, two `bind()`s one
  attribute list. An identical segment twice is applied once (the runtime dedupes it), so a repeated program does not
  toggle twice.
- A string value has no commas, no spaces and no `@` (the protocol is a comma-separated list, and `@value`/`@checked` are
  payloads); names are idents (lowercase letters, digits and `-`). All are build errors at the call site.
- The event set is fixed: click, input, change, submit, keydown, keyup, pointerdown, pointerup, focusin, focusout.
- A write must be reachable from the element's program: the event bubbles to `<document>`, so a program on an ancestor runs
  for its descendants' events, but a button outside the owner has no owner to write.
- A bound attribute and a condition read the nearest owner of the element they are on, so they must sit inside the owner's
  subtree.
- The initial state is written by the script: before it runs, `data-reactive-*` are absent, so a condition on an initial
  value may paint a frame late, and the runtime writes them once the document is parsed.
- A state is build-time data: the client gets the owner's class string and the sources' names, never a readable value. A
  component cannot read `ui.open` in JavaScript — that is the point, the state is CSS; a value JavaScript needs is the
  framework's own state.
- No persistence, counters, gestures, async or `event()` callbacks in v1: a state is a string, a number or a boolean,
  written by a click, a key or a form event. `calc()` over a state value is CSS, not a source: nothing increments it from
  JavaScript.

## Browsers

Every browser: the runtime is a script with no polyfills, so it ships to every target of a build (1.8 kB minified, 0.9 kB
gzipped), and it reads custom properties registered with `@property` (`syntax: "*"; inherits: false`; Chrome 85, Safari
16.4, Firefox 128). Where `@property` is missing the lists inherit, but the marker classes still keep an element to its own
program.

## Tests

```bash
cd packages/reactive && bun run test            # the engine: class strings, the protocol, the @property rules, errors
cd packages/reactive && bun run test:browsers   # Chrome, Firefox, WebKit: two disclosures, an initial true state,
                                                # tabs, a nested owner, the flush of one click, a <select> from value(),
                                                # a checkbox from checked(), two programs on one element, a repeated one
                                                # (BROWSERS=chrome)
```
