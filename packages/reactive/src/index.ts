// @cssints/reactive: CSS-first interactions. State is a set of custom properties on an owner element, a write happens only
// in an event (an opaque Action that only on() takes), and a condition or a piece of DOM output is plain CSS: `within()`
// over the owner's `data-reactive-*` attribute, `attr()` on the element itself. The model is Reactive CSS
// (https://reactivecss.com: state as custom properties, events and conditions in the styles), with Solid 2's rules
// (RULES-FUNDAMENTALS, ReactiveScript): sources are the only writable things, writes are imperative (an event), state
// belongs to an owner element, one flush paints one whole frame, and there is no async in v1.
//
// Reactive CSS writes `:on(click)` in the selector; that is not valid CSS and we ship compiled class strings, so an event
// program travels as data in non-inheriting custom properties (`--reactive-on`) that ./runtime.ts reads from a delegated
// listener. See README.md for the protocol.
import { attr, type Style, type Wrap, within } from "cssints" with { type: "cssints" };
import { arg, scope, ship } from "cssints/plugin";

/** A value a state holds: a boolean (a `toggle()`), a string (a tab) or a number. */
export type StateValue = boolean | string | number;

/** The events `on()` listens to: the ones of a form, a button and a pointer that bubble. */
export type EventName =
  | "click"
  | "input"
  | "change"
  | "submit"
  | "keydown"
  | "keyup"
  | "pointerdown"
  | "pointerup"
  | "focusin"
  | "focusout";

const EVENTS: readonly EventName[] = [
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
];

const isEvent = (name: string): name is EventName => (EVENTS as readonly string[]).includes(name);

// The states of a state() call, by name.
type States = Readonly<Record<string, StateValue>>;

// What a source is at build time: the name of its state. Never part of the public type.
interface SourceData {
  readonly "~source": string;
}

// What an action is at build time: toggle <state>, or set <state> <value>.
interface ActionData {
  readonly "~action": "toggle" | "set";
  readonly "~source": string;
  readonly "~value"?: string;
}

// A program of on(): one or more actions by event.
type ProgramData = Readonly<Record<string, ActionData | readonly ActionData[]>>;

// DOM output of bind(): an attribute by source.
type BindData = Readonly<Record<string, SourceData>>;

const NAME = /^[a-z][a-z0-9-]*$/;
const SPACE = /[,\s]/;
const ATTRIBUTE = /^[a-zA-Z_:][a-zA-Z0-9_:.-]*$/;

const fail = (message: string) => new Error(`cssints: reactive: ${message}`);

// A value as the protocol writes it, or the error of one that would break it (commas and spaces split a property list).
const valueOf = (where: string, value: StateValue | undefined): string => {
  if (value === undefined) throw fail(`${where} is missing`);
  if (typeof value === "number" && !Number.isFinite(value))
    throw fail(`${where} is ${String(value)}: a state is a finite number`);
  const text = String(value);
  if (SPACE.test(text))
    throw fail(`${where} is ${JSON.stringify(text)}: a value has no commas and no spaces`);
  return text;
};

const nameOf = (where: string, source: unknown): string => {
  const name = (source as SourceData | undefined)?.["~source"];
  if (typeof name !== "string" || !NAME.test(name))
    throw fail(`${where} is not a state of state(): the names are lowercase letters, digits and -`);
  return name;
};

const reactive = scope("reactive", {
  // The owner marker: --reactive-owner and one --reactive-<name> per state (these inherit, so CSS reads them).
  "#owner": {
    css: "&{}",
    atProperty: '@property --reactive-owner{syntax:"*";inherits:false}',
  },
  // The program of on(), on the element it is written on (non-inheriting: an element sees its own program only).
  "#events": {
    css: "&{}",
    atProperty: '@property --reactive-on{syntax:"*";inherits:false}',
  },
  // The attributes of bind(), on the element it is written on.
  "#binding": {
    css: "&{}",
    atProperty: '@property --reactive-binding{syntax:"*";inherits:false}',
  },
  // The DOM runtime: no feature to polyfill, so every target gets it (delivery.ts).
  "#run": { polyfills: [], script: "@cssints/reactive/runtime" },
  // The owner element: --reactive-owner lists the states, one --reactive-<name> holds each value. group: true adds
  // _g-reactive, which inside() reads through within().
  state: { args: [arg<States>()], uses: ["owner", "run"], group: true },
  // One program per element: --reactive-on is `click toggle open,input set tab two`.
  on: { args: [arg<ProgramData>()], uses: ["events", "run"] },
  // One list per element: --reactive-binding is `aria-expanded open,data-current tab`.
  bind: { args: [arg<BindData>()], uses: ["binding", "run"] },
}).build({
  state: (states) => {
    const names = Object.keys(states);
    if (!names.length) throw fail("state() takes at least one state: state({ open: false })");
    const decls: [string, string][] = [];
    for (const name of names) {
      if (!NAME.test(name))
        throw fail(
          `the state name ${JSON.stringify(name)} is not an ident: lowercase letters, digits and -, starting with a letter`,
        );
      decls.push([`--reactive-${name}`, valueOf(`the state "${name}"`, states[name])]);
    }
    return { decls: [["--reactive-owner", names.join(",")], ...decls] };
  },
  on: (program) => {
    const segments: string[] = [];
    for (const [event, actions] of Object.entries(program)) {
      if (!isEvent(event))
        throw fail(
          `${JSON.stringify(event)} is not an event reactive() listens to: ${EVENTS.join(", ")}`,
        );
      const list: readonly ActionData[] = "~action" in actions ? [actions] : actions;
      if (!list.length) throw fail(`the event "${event}" has no action`);
      for (const action of list) {
        const source = nameOf(`the source of the event "${event}"`, action);
        if (action["~action"] === "toggle") segments.push(`${event} toggle ${source}`);
        else if (action["~action"] === "set")
          segments.push(
            `${event} set ${source} ${valueOf(`the value of "${source}"`, action["~value"])}`,
          );
        else throw fail(`the event "${event}" takes a toggle() or a set()`);
      }
    }
    if (!segments.length) throw fail("on() takes at least one event");
    return { decls: [["--reactive-on", segments.join(",")]] };
  },
  bind: (bindings) => {
    const pairs: string[] = [];
    for (const [attribute, source] of Object.entries(bindings)) {
      if (!ATTRIBUTE.test(attribute))
        throw fail(`${JSON.stringify(attribute)} is not an attribute name`);
      pairs.push(`${attribute} ${nameOf(`the source of "${attribute}"`, source)}`);
    }
    if (!pairs.length) throw fail("bind() takes at least one attribute");
    return { decls: [["--reactive-binding", pairs.join(",")]] };
  },
});

type Members = ReturnType<typeof reactive.export>;
const members: Members = reactive.export();

type Widen<T> = T extends boolean
  ? boolean
  : T extends number
    ? number
    : T extends string
      ? string
      : never;

/** The sources a `state()` call gives, one per state, by name. */
export type Sources<S extends States> = { readonly [K in keyof S & string]: Source<Widen<S[K]>> };

/** What `state()` gives: the owner element's style and one source per state. */
export type State<S extends States> = { readonly owner: Style } & Sources<S>;

/** A program of `on()`: one event's actions. */
export type Program = { readonly [E in EventName]?: Action | readonly Action[] };

/** The attributes of `bind()`: a source per attribute name. */
export type Bindings = { readonly [attribute: string]: Source<StateValue> };

declare const sourceType: unique symbol;
/**
 * A state, read where a condition or a piece of DOM output goes (`when(ui.open)`, `bind({ ... })`). `state()` gives its
 * only ones: a source cannot be built, and only `toggle()` and `set()` take it, so a derivation is CSS itself
 * (`calc(var(--reactive-count) * 2)`, a condition), never JavaScript.
 */
export interface Source<T extends StateValue = StateValue> {
  readonly [sourceType]: T;
}

declare const actionType: unique symbol;
/**
 * A write, from `toggle()` or `set()`. Opaque, and only `on()` takes it: a write outside an event cannot be written.
 */
export interface Action {
  readonly [actionType]: "write";
}

const action = (data: ActionData): Action => data as unknown as Action;

// the owner's class string, from the member with the concrete shape (the sources are added beside it)
const ownerOf = (states: States): Style => members.state(states);

/**
 * `state({ open: false, tab: "one" })`: the only source of `@cssints/reactive`, one `state()` per owner element. It gives
 * the owner's style (`cn(ui.owner, p(4))`) and one source per state. The initial values are CSS custom properties on the
 * owner, and `./runtime` writes `data-reactive-<name>` on it on load and after an event: a condition on an initial value
 * may paint one frame late. Names are idents (lowercase letters, digits and -), and a string value has no commas or
 * spaces.
 *
 * @param {S} states the state names and their initial values
 * @returns {State} the owner's style and the sources
 */
export function state<const S extends States>(states: S): State<S> {
  const owner = ownerOf(states);
  const sources: Record<string, unknown> = { owner };
  for (const name of Object.keys(states)) sources[name] = { "~source": name } satisfies SourceData;
  // the site ships an object: the owner as its class string, the sources as their names (ship(), macro.ts)
  return ship(sources) as unknown as State<S>;
}

/**
 * `toggle(ui.open)`: flip a boolean state when the event it is put on runs. Only `on()` takes it.
 *
 * @param {Source<boolean>} source the boolean state
 * @returns {Action} the write
 */
export function toggle(source: Source<boolean>): Action {
  return action({ "~action": "toggle", "~source": nameOf("toggle()", source) });
}

/**
 * `set(ui.tab, "two")`: set a state to a value when the event it is put on runs. Only `on()` takes it.
 *
 * @param {Source<T>} source the state
 * @param {T} value the value, of the state's type
 * @returns {Action} the write
 */
export function set<T extends StateValue>(source: Source<T>, value: T): Action {
  return action({
    "~action": "set",
    "~source": nameOf("set()", source),
    "~value": String(value),
  });
}

/**
 * `on({ click: toggle(ui.open) })`: the events of the element it is on, one action or a list each. A delegated listener
 * applies every program of the target and its ancestors, then updates the bindings of each owner once. One `on()` per
 * element: the object form makes an accidental merge visible.
 *
 * @param {Program} program one or more actions by event
 * @returns {Style} the element's style, with its program
 */
export function on(program: Program): Style {
  return members.on(program as unknown as ProgramData);
}

/**
 * `bind({ "aria-expanded": ui.open })`: writes each attribute on the element it is on, from the value its nearest owner
 * holds. The runtime updates it on load and after every event of that owner.
 *
 * @param {Bindings} bindings a source per attribute name
 * @returns {Style} the element's style, with its bindings
 */
export function bind(bindings: Bindings): Style {
  return members.bind(bindings as unknown as BindData);
}

const attributeOf = (source: Source<StateValue>): string =>
  `data-reactive-${nameOf("a condition", source)}`;

/**
 * `when(ui.open)(display("block"))`: while the element itself holds that state — `value` is `"true"` when it is left
 * out, and a string state compares by value (`when(ui.tab, "two")`).
 *
 * @param {Source<StateValue>} source the state
 * @param {StateValue} value the value to match, `"true"` when left out
 * @returns {Wrap} the condition
 */
export function when(source: Source<StateValue>, value?: StateValue): Wrap {
  return attr(attributeOf(source), String(value ?? "true"));
}

/**
 * `inside(ui.open)(display("block"))`: while a descendant of the owner holds that state — `value` is `"true"` when it is
 * left out, and a string state compares by value (`inside(ui.tab, "two")`).
 *
 * @param {Source<StateValue>} source the state
 * @param {StateValue} value the value to match, `"true"` when left out
 * @returns {Wrap} the condition
 */
export function inside(source: Source<StateValue>, value?: StateValue): Wrap {
  return within(attr(attributeOf(source), String(value ?? "true")), "reactive");
}
