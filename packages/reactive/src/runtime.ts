/// <reference lib="dom" />
// The DOM half of @cssints/reactive, shipped to every target (its runtime has no polyfills). It reads the build's protocol
// off the elements themselves, through custom properties registered with `@property { syntax: "*"; inherits: false }`:
//
//   owner    ._reactive-owner      --reactive-owner: open,tab       --reactive-<name>: <value>   (these inherit)
//   events   ._reactive-events     --reactive-on: click toggle open,input set tab @value,submit emit save
//   output   ._reactive-binding    --reactive-binding: aria-expanded open,aria-controls =panel,aria-selected ?tab one
//                                   (a source, `=` a literal, `?` a comparison, two trailing literals a choice)
//   storage  ._reactive-persist    --reactive-persist: open:demo-open,tab:demo-tab
//
// On load it initialises each owner (data-reactive-<name> from the declared value, or from localStorage for a persisted
// one) and writes its bindings; on an event it applies every program of the target and its ancestors (DOM bubbling) to the
// nearest owner, then updates the bindings of each owner it touched once — one flush, one frame. A set value of `@value` or
// `@checked` is read off the event's target (a select, an input). Added nodes are initialised as well. `emit` dispatches
// `reactive:<name>` from the target, the one hand-off to JavaScript, which `listen()` below attaches. No imports, no
// Effect; tolerant of pages that use none of it, and of storage that throws or is missing (private mode, quota, a page
// without storage): a state that cannot be stored still works, it just does not survive the reload.
const OWNER = "_reactive-owner";
const EVENTS = "_reactive-events";
const OUTPUT = "_reactive-binding";
const STATES = "--reactive-owner";
const PROGRAM = "--reactive-on";
const BINDING = "--reactive-binding";
const PERSIST = "--reactive-persist";
const STATE = "--reactive-";
const ATTR = "data-reactive-";
const SLOT = "reactive:";
const LISTENED = [
  "click",
  "input",
  "change",
  "submit",
  "keydown",
  "keyup",
  "pointerdown",
  "pointerup",
  "focusin",
  "focusout",
] as const;

// A custom property of the element itself (registered with inherits: false, and the marker class gates it anyway).
const prop = (el: Element, property: string): string =>
  getComputedStyle(el).getPropertyValue(property).trim();

const list = (text: string): string[] => (text ? text.split(",").map((s) => s.trim()) : []);

const ownerOf = (el: Element | null): Element | null => (el ? el.closest(`.${OWNER}`) : null);

// One state: the attribute (what conditions read) and the custom property (what CSS reads, calc() and var() included). A
// persisted state is stored on every write. A value only ever reaches the page through setAttribute and
// style.setProperty, never as a string of HTML or CSS, so a stored value cannot inject anything.
const write = (owner: Element, name: string, state: string): void => {
  owner.setAttribute(ATTR + name, state);
  if (owner instanceof HTMLElement || owner instanceof SVGElement)
    owner.style.setProperty(STATE + name, state);
  const key = keysOf(owner).get(name);
  if (key !== undefined) save(key, state);
};

const read = (owner: Element, name: string): string => owner.getAttribute(ATTR + name) ?? "false";

// The storage key of each state of an owner that persists, by name. Cached: the protocol is static, and a write would
// otherwise read the computed style on every event.
const storage = new WeakMap<Element, ReadonlyMap<string, string>>();
const keysOf = (owner: Element): ReadonlyMap<string, string> => {
  let keys = storage.get(owner);
  if (!keys) {
    const found = new Map<string, string>();
    for (const pair of list(prop(owner, PERSIST))) {
      const colon = pair.indexOf(":");
      if (colon > 0) found.set(pair.slice(0, colon), pair.slice(colon + 1));
    }
    keys = found;
    storage.set(owner, keys);
  }
  return keys;
};

// A failure of storage is silent: private mode, a quota or a page without storage leaves the state interactive, it just
// does not survive the reload.
const load = (key: string): string | null => {
  try {
    return globalThis.localStorage.getItem(SLOT + key);
  } catch {
    return null;
  }
};

const save = (key: string, value: string): void => {
  try {
    globalThis.localStorage.setItem(SLOT + key, value);
  } catch {
    // silent on purpose: the state still works
  }
};

// The stored value of each persisted state, read once when the owner is initialised.
const restored = (owner: Element): ReadonlyMap<string, string> => {
  const saved = new Map<string, string>();
  for (const [name, key] of keysOf(owner)) {
    const value = load(key);
    if (value !== null) saved.set(name, value);
  }
  return saved;
};

// A value of a set segment: `@value` and `@checked` come from the element the event fired on (a select, an input), anything
// else is the literal the build wrote.
const field = (target: Element | null, token: string): string => {
  if (token === "@value") {
    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLSelectElement ||
      target instanceof HTMLTextAreaElement
    )
      return String(target.value ?? "");
    return "";
  }
  if (token === "@checked") return (target as HTMLInputElement | null)?.checked ? "true" : "false";
  return token;
};

// emit(): the one hand-off to JavaScript. The event leaves the DOM from the element the native event fired on, so a
// listen() on any ancestor — the form, the page — catches it; the detail carries that element's nearest owner (the
// program's element may be an ancestor, which is why the owner is not the one apply() writes) and the native event.
const emitFrom = (target: Element, name: string, event: Event): void => {
  target.dispatchEvent(
    new CustomEvent(SLOT + name, { bubbles: true, detail: { event, owner: ownerOf(target) } }),
  );
};

// One program: `click toggle open`, `input set tab two` and `submit emit save`, the segments of another event skipped. A
// segment written twice is applied once: the same program twice would toggle twice. A hand-off touches no state, so it
// neither marks the owner nor sends it to the flush.
const apply = (owner: Element, program: string, event: Event, target: Element | null): boolean => {
  let touched = false;
  for (const segment of new Set(list(program))) {
    const [type, action, name, value] = segment.split(" ");
    if (type !== event.type || !name) continue;
    if (action === "toggle") write(owner, name, read(owner, name) === "true" ? "false" : "true");
    else if (action === "set") write(owner, name, field(target, value ?? ""));
    else if (action === "emit" && target) emitFrom(target, name, event);
    else continue;
    if (action !== "emit") touched = true;
  }
  return touched;
};

// The attributes of one element, from the owner nearest it. A pair is one of four kinds: a source (`aria-expanded open`),
// a literal (`aria-controls =panel-one`), a comparison (`aria-selected ?tab one`, "true" or "false" by the owner's value)
// and a choice (`tabindex ?tab one 0 -1`, the first literal while the comparison holds, the second while it does not; the
// two extra tokens are what tell a choice from a comparison). A comparison is the one expression the runtime evaluates: an
// attribute on the element itself cannot be computed in CSS. No `!` marker: a custom property value with one does not parse
// (lightningcss reads it as a broken `!important`).
const pairs = new WeakMap<Element, readonly string[][]>();
const pairsOf = (el: Element): readonly string[][] => {
  let found = pairs.get(el);
  if (!found) {
    found = list(prop(el, BINDING)).map((pair) => pair.split(" "));
    pairs.set(el, found);
  }
  return found;
};

const output = (el: Element, owner: Element): void => {
  if (!el.classList.contains(OUTPUT)) return;
  for (const [attribute, kind, value, on, off] of pairsOf(el)) {
    if (!attribute || !kind) continue;
    const mark = kind[0];
    if (mark === "=") el.setAttribute(attribute, kind.slice(1));
    else if (mark !== "?") el.setAttribute(attribute, read(owner, kind));
    else {
      const hit = read(owner, kind.slice(1)) === value;
      if (off === undefined) el.setAttribute(attribute, String(hit));
      else el.setAttribute(attribute, hit ? (on ?? "") : off);
    }
  }
};

// Every binding of an owner's own subtree (a nested owner's elements bind to the nested one).
const flush = (owner: Element): void => {
  output(owner, owner);
  for (const el of owner.querySelectorAll(`.${OUTPUT}`))
    if (ownerOf(el) === owner) output(el, owner);
};

// The initial value of each state (a stored value for a persisted one, which wins over the declared value), then the
// bindings; an owner already initialised keeps what it holds (a moved node).
const setup = (owner: Element): void => {
  const saved = restored(owner);
  for (const name of list(prop(owner, STATES)))
    if (!owner.hasAttribute(ATTR + name))
      write(owner, name, saved.get(name) ?? (prop(owner, STATE + name) || "false"));
  flush(owner);
};

// One event: every program from the target up, every action, then one flush per owner it wrote.
const run = (event: Event): void => {
  const target = event.target instanceof Element ? event.target : null;
  const owners = new Set<Element>();
  for (let el = target; el; el = el.parentElement) {
    if (!el.classList.contains(EVENTS)) continue;
    const owner = ownerOf(el);
    if (owner && apply(owner, prop(el, PROGRAM), event, target)) owners.add(owner);
  }
  for (const owner of owners) flush(owner);
};

const scan = (root: Element): void => {
  if (root.classList.contains(OWNER)) setup(root);
  for (const owner of root.querySelectorAll(`.${OWNER}`)) setup(owner);
};

const start = (): void => {
  const root = document.documentElement;
  scan(root);
  new MutationObserver((records) => {
    for (const record of records)
      for (const node of record.addedNodes) {
        if (!(node instanceof Element)) continue;
        scan(node);
        // a binding added into an owner that already stands: written by the nearest owner
        const owner = ownerOf(node);
        if (owner) output(node, owner);
        for (const el of node.querySelectorAll(`.${OUTPUT}`)) {
          const nearest = ownerOf(el);
          if (nearest) output(el, nearest);
        }
      }
  }).observe(root, { childList: true, subtree: true });
};

if (typeof document !== "undefined") {
  for (const type of LISTENED) document.addEventListener(type, run);
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
}

/** What `emit()` puts in the event's `detail`: the native event, and the nearest owner of the element it fired on. */
export interface EmitDetail {
  readonly event: Event;
  readonly owner: Element | null;
}

/** A `reactive:<name>` event, as `listen()` hands it to its handler. */
export type EmitEvent = CustomEvent<EmitDetail>;

/**
 * `listen(form, "save", ({ detail }) => save(detail.owner))`: hears the `reactive:<name>` event that
 * `on({ submit: emit("save") })` dispatches — `name` is the same string `emit()` was given. The listener sits on `target`,
 * and the event bubbles from the element the native event fired on, so a form or the page hears a program on any
 * descendant or ancestor. `detail.event` is the native event (call `preventDefault()` for a submit), `detail.owner` the
 * nearest reactive owner of that element, or `null`. Dispatched in the event's own turn, so the handler runs before the
 * browser's default action.
 *
 * @param {EventTarget} target the element to listen on (`form`, `document`, ...)
 * @param {string} name the name `emit()` was given
 * @param {(event: EmitEvent) => void} handler called with the `CustomEvent`; its `detail` is `{ event, owner }`
 * @returns {() => void} the disposer, which removes the listener
 */
export function listen(
  target: EventTarget,
  name: string,
  handler: (event: EmitEvent) => void,
): () => void {
  const type = SLOT + name;
  const listener = (event: Event) => handler(event as EmitEvent);
  target.addEventListener(type, listener);
  return () => target.removeEventListener(type, listener);
}
