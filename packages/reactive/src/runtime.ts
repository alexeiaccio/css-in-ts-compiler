/// <reference lib="dom" />
// The DOM half of @cssints/reactive, shipped to every target (its runtime has no polyfills). It reads the build's protocol
// off the elements themselves, through custom properties registered with `@property { syntax: "*"; inherits: false }`:
//
//   owner    ._reactive-owner      --reactive-owner: open,tab       --reactive-<name>: <value>   (these inherit)
//   events   ._reactive-events     --reactive-on: click toggle open,input set tab two
//   output   ._reactive-binding    --reactive-binding: aria-expanded open,data-current tab
//
// On load it initialises each owner (data-reactive-<name> from the declared value) and writes its bindings; on an event it
// applies every program of the target and its ancestors (DOM bubbling) to the nearest owner, then updates the bindings of
// each owner it touched once — one flush, one frame. Added nodes are initialised as well. No imports, no Effect; tolerant of
// pages that use none of it.
const OWNER = "_reactive-owner";
const EVENTS = "_reactive-events";
const OUTPUT = "_reactive-binding";
const STATES = "--reactive-owner";
const PROGRAM = "--reactive-on";
const BINDING = "--reactive-binding";
const STATE = "--reactive-";
const ATTR = "data-reactive-";
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

// One state: the attribute (what conditions read) and the custom property (what CSS reads, calc() and var() included).
const write = (owner: Element, name: string, state: string): void => {
  owner.setAttribute(ATTR + name, state);
  if (owner instanceof HTMLElement || owner instanceof SVGElement)
    owner.style.setProperty(STATE + name, state);
};

const read = (owner: Element, name: string): string => owner.getAttribute(ATTR + name) ?? "false";

// One program: `click toggle open` and `input set tab two`, the segments of another event skipped.
const apply = (owner: Element, program: string, event: string): boolean => {
  let touched = false;
  for (const segment of list(program)) {
    const [type, action, name, state] = segment.split(" ");
    if (type !== event || !name) continue;
    if (action === "toggle") write(owner, name, read(owner, name) === "true" ? "false" : "true");
    else if (action === "set") write(owner, name, state ?? "");
    else continue;
    touched = true;
  }
  return touched;
};

// The attributes of one element, from the owner nearest it.
const output = (el: Element, owner: Element): void => {
  if (!el.classList.contains(OUTPUT)) return;
  for (const pair of list(prop(el, BINDING))) {
    const space = pair.indexOf(" ");
    if (space < 0) continue;
    el.setAttribute(pair.slice(0, space), read(owner, pair.slice(space + 1)));
  }
};

// Every binding of an owner's own subtree (a nested owner's elements bind to the nested one).
const flush = (owner: Element): void => {
  output(owner, owner);
  for (const el of owner.querySelectorAll(`.${OUTPUT}`))
    if (ownerOf(el) === owner) output(el, owner);
};

// The initial value of each state, then the bindings; an owner already initialised keeps what it holds (a moved node).
const setup = (owner: Element): void => {
  for (const name of list(prop(owner, STATES)))
    if (!owner.hasAttribute(ATTR + name)) write(owner, name, prop(owner, STATE + name) || "false");
  flush(owner);
};

// One event: every program from the target up, every action, then one flush per owner it wrote.
const run = (event: Event): void => {
  const target = event.target instanceof Element ? event.target : null;
  const owners = new Set<Element>();
  for (let el = target; el; el = el.parentElement) {
    if (!el.classList.contains(EVENTS)) continue;
    const owner = ownerOf(el);
    if (owner && apply(owner, prop(el, PROGRAM), event.type)) owners.add(owner);
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

export {};
