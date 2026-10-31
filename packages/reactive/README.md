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
  either,
  equals,
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
const tab = cn(
  bind({
    "aria-selected": equals(ui.tab, "one"), // a comparison: "true" or "false"
    "aria-controls": "panel-one", // a literal, written as is
    tabindex: either(equals(ui.tab, "one"), "0", "-1"), // one of two literals
  }),
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

A Quint model of the protocol lives in
[`packages/apg-specs/specs/patterns/reactive.qnt`](../apg-specs/specs/patterns/reactive.qnt) (bean cssints-tm9j): two
owners, one nested, each with the four kinds of binding, the nearest-owner read and the one flush as invariants. `test/scenarios.mjs`
replays its scenarios and two seeded differential walks on `test/fixtures/model.js` in Chrome, Firefox and WebKit, and checks
the page against the model after every step — including that one event paints once (the page is read before and after a frame
and must not change).

## API

| Member                              | What it does                                                                                                    |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `state(states)`                     | The owner: `{ owner, ...sources }`. Names are idents; two calls in one `cn()` are one owner.                    |
| `toggle(source)`                    | An action that flips a boolean source. Only `on()` takes it.                                                    |
| `set(source, value)`                | An action that sets a source to a value, or to the field's (`value()`, `checked()`). Only `on()` takes it.      |
| `value()`                           | The value of the field the event fired on (`target.value`, a string). Only `set()` takes it.                    |
| `checked()`                         | Whether the field is checked (`target.checked`). Only `set()` takes it.                                         |
| `persist(value, key)`               | A state value that survives a reload, stored under `"reactive:" + key`. Only `state()` takes it.                |
| `equals(source, value)`             | A comparison: `"true"` in a `bind()` attribute while the state has that value, `"false"` otherwise.             |
| `either(comparison, a, b)`          | A choice of two literals, picked by a comparison. Only `bind()` takes it.                                       |
| `on({ event: action \| action[] })` | The element's program: click, input, change, submit, keydown, keyup, pointerdown, pointerup, focusin, focusout. |
| `bind({ attribute: binding })`      | Writes each attribute on the element it is on: a source, a comparison, a choice, or a literal.                  |
| `when(source, value?)`              | A condition on the element itself (`data-reactive-<name>`), `"true"` when the value is left out.                |
| `inside(source, value?)`            | A condition on a descendant of the owner (`within()` over its `data-reactive-<name>`).                          |

Two calls of `on()`, `bind()` or `state()` in one `cn()` append instead of replacing: the element's program is
`click toggle open,keydown set tab two`, its attributes `aria-expanded open,data-current tab`, and its owner's states
`open,tab`. A `<select>` drives a string state with `set(ui.tab, value())`, a checkbox a boolean one with
`set(ui.open, checked())`.

A binding is one of four things: a source's value (`bind({ "aria-expanded": ui.open })`), a comparison
(`equals(ui.tab, "one")`, `"true"` or `"false"`), a choice of two literals (`either(equals(ui.tab, "one"), "0", "-1")`,
the roving `tabindex`), or a literal written as is (`"aria-controls": "panel-one"`). A comparison is the one expression
the runtime evaluates, and the only place it may: sources are still the only writable things, and a `Comparison` or a
`Choice` cannot be `set()`, `toggle()`ed, used in `when()`/`inside()` or stored by `persist()`. It is an equation, not a
state — it holds no value of its own, so the runtime reads it off the binding and the state's value off the nearest owner
on the same flush. The element itself is why: `attr()` is a condition and reads an attribute, it does not compute one, and
`aria-selected` and `tabindex` sit on the element, where CSS cannot write. `aria-selected="one"` from a string state would
be invalid HTML, so a comparison is what makes one string state enough for a tab strip. The literal is checked at build
time (no comma, no space, and no leading `=`, `?` or `!`, the protocol's markers), with the attribute and the value in the
error at the call site.

A value may be `persist(value, key)`: `state({ open: persist(false, "demo-open") })` keeps that state in `localStorage`
under `"reactive:" + key`, and a reload restores it when the runtime initialises the owner — the module runs after the
document is parsed and before the first paint the page can show, with the same caveat the initial value has (a condition on
it may paint a frame late where the browser paints before the script runs). A stored value wins over the one the build
declares. Every write of the state stores it, so a click needs no extra call. Two states may share a key on purpose: one
storage slot, kept in sync by their writes. Prefix an app's keys with its name (`demo-open`, not `open`), so two
applications on one origin do not meet.

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
  ._4h1t7s {
    --reactive-binding: aria-selected ?tab one,aria-controls =panel-one,tabindex ?tab one 0 -1;
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
(`color: var(--reactive-tab)`); the protocol lists (`--reactive-owner`, `--reactive-on`, `--reactive-binding`,
`--reactive-persist`) do not inherit, so an element sees only its own program, bindings and storage.

## Protocol

What the build emits, and what `./runtime` reads (for debugging):

| Custom property      | On                   | Value                                                                |
| -------------------- | -------------------- | -------------------------------------------------------------------- |
| `--reactive-owner`   | `._reactive-owner`   | the states, `open,tab`                                               |
| `--reactive-<name>`  | the owner            | the state's value (`false`, `one`, `2`)                              |
| `--reactive-on`      | `._reactive-events`  | `click toggle open,change set tab @value`                            |
| `--reactive-binding` | `._reactive-binding` | `aria-expanded open,aria-controls =panel-one,tabindex ?tab one 0 -1` |
| `--reactive-persist` | `._reactive-persist` | the stored states, `open:demo-open,tab:demo-tab`                     |

The runtime writes `data-reactive-<name>="<value>"` on the owner — what `when()` and `inside()` read — and the same value
as an inline `--reactive-<name>`, what CSS derivations read. On load it initialises each owner (`data-reactive-<name>` from
the declared value, or from `localStorage` for a persisted state) and writes its bindings; on an event it walks from the
target up, applies every program it finds to that element's nearest owner, and then updates the bindings of each owner
once. Nodes added later are initialised too (a `MutationObserver`). A binding pair is one of four kinds: a source
(`aria-expanded open`), a literal (`aria-controls =panel-one`), a comparison (`aria-selected ?tab one`, `"true"` when the
owner's state has `one`) and a choice of two literals (`tabindex ?tab one 0 -1`, `0` while it does, `-1` while it does not;
a comparison has three tokens of its list, a choice five). No marker prefixes a choice's literals: a custom property value
with a `!` does not parse (it reads as a broken `!important`), so the two trailing tokens carry it. A set segment's value
is a literal, or `@value`/`@checked`: the runtime reads `target.value` (a string) or `target.checked` (`"true"`, `"false"`)
off the element the event fired on. An identical segment written twice is applied once, so a program twice is still one
toggle. A persisted state is stored on every write, and its stored value replaces the declared one at initialisation.
Values reach the page only through `setAttribute` and `style.setProperty`, never as a string of HTML or CSS, so a stored
value cannot inject anything.

## Limits

- Several calls on one element append: two `state()`s are one owner's states, two `on()`s one program, two `bind()`s one
  attribute list. An identical segment twice is applied once (the runtime dedupes it), so a repeated program does not
  toggle twice.
- A string value has no commas, no spaces and no `@` (the protocol is a comma-separated list, and `@value`/`@checked` are
  payloads); names are idents (lowercase letters, digits and `-`). All are build errors at the call site. A persistence key
  is letters, digits, `-`, `_`, `.` and `:` (a comma or a space would split the protocol list), at least one character, and
  a build error at the call site too; `persist()` without a value is one at the type level and at build time.
- The event set is fixed: click, input, change, submit, keydown, keyup, pointerdown, pointerup, focusin, focusout.
- A write must be reachable from the element's program: the event bubbles to `<document>`, so a program on an ancestor runs
  for its descendants' events, but a button outside the owner has no owner to write.
- A bound attribute and a condition read the nearest owner of the element they are on, so they must sit inside the owner's
  subtree. A condition is CSS, though: `inside()` is `:where(._g-reactive[data-reactive-<name>=<value>]) .el`, an ancestor
  match, so a nested owner that declares the same state as an outer owner shows its descendants' conditions while the outer
  owner matches too. The runtime writes the attribute on the nearest owner, but CSS cannot express "nearest"; give the owners
  different state names (the model in `specs/patterns/reactive.qnt` states this and the replay checks it).
- A comparison names a state, not an owner: `equals(outer.tab, "one")` on an element inside an inner owner compares the
  inner owner's `tab`, because the runtime reads the nearest owner like a source. A comparison is equality only: no
  ordering and no arithmetic. `equals(ui.count, 2)` is a comparison, but `count > 2` needs a derived expression the runtime
  does not have and stays deferred.
- The initial state is written by the script: before it runs, `data-reactive-*` are absent, so a condition on an initial
  value may paint a frame late, and the runtime writes them once the document is parsed. A restored persisted value has the
  same timing.
- A state is build-time data: the client gets the owner's class string and the sources' names, never a readable value. A
  component cannot read `ui.open` in JavaScript — that is the point, the state is CSS; a value JavaScript needs is the
  framework's own state.
- No counters, gestures, async or `event()` callbacks in v1: a state is a string, a number or a boolean, written by a
  click, a key or a form event. `calc()` over a state value is CSS, not a source: nothing increments it from JavaScript.
- Persistence is `localStorage` only: no cross-tab sync (a second tab keeps its own copy until it reloads), no versioning
  or expiry (a stored value is a string the current build may no longer expect), and a storage failure — private mode, a
  quota, a page without storage — is silent: the state stays interactive, it just does not survive the reload.

## Browsers

Every browser: the runtime is a script with no polyfills, so it ships to every target of a build (2.7 kB minified, 1.3 kB
gzipped), and it reads custom properties registered with `@property` (`syntax: "*"; inherits: false`; Chrome 85, Safari
16.4, Firefox 128). Where `@property` is missing the lists inherit, but the marker classes still keep an element to its own
program and storage. Persistence needs `localStorage`; where it is missing or refuses a write, the state works and does not
survive the reload.

## Tests

```bash
cd packages/reactive && bun run test            # the engine: class strings, the protocol, the @property rules, errors
cd packages/reactive && bun run test:browsers   # Chrome, Firefox, WebKit: two disclosures, an initial true state,
                                                # tabs, a computed tab strip (aria-selected, a literal aria-controls,
                                                # roving tabindex, aria-pressed), a nested owner, the flush of one click,
                                                # a <select> from value(), a checkbox from checked(), two programs on one
                                                # element, a repeated one, a persisted disclosure across a reload, a stored
                                                # value winning, a state that is not persisted (BROWSERS=chrome)
# the model's traces (needs the packages built: node reads their dist/):
bun run build:packages && cd packages/reactive && bun run test:scenarios
                                                # specs/patterns/reactive.qnt replayed on test/fixtures/model.js in
                                                # Chrome, Firefox and WebKit: the two scenario sets and two seeded
                                                # differential walks, every probed attribute and computed display
                                                # compared with the model after every step
```
