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
import { append, arg, scope, ship } from "cssints/plugin";

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

// The states of a state() call, by name: a value, or one that persists (state({ open: persist(false, "demo-open") })).
type States = Readonly<Record<string, StateValue | Persisted<StateValue>>>;

// What a source is at build time: the name of its state. Never part of the public type.
interface SourceData {
  readonly "~source": string;
}

// What an action is at build time: toggle <state>, or set <state> <value>, the value a literal or a payload token.
interface ActionData {
  readonly "~action": "toggle" | "set";
  readonly "~source": string;
  readonly "~value"?: string;
}

// A program of on(): one or more actions by event.
type ProgramData = Readonly<Record<string, ActionData | readonly ActionData[]>>;

// What a comparison is at build time: the state's name and the value it is compared with.
interface CompareData {
  readonly "~compare": string;
  readonly "~value": string;
}

// What a choice is at build time: a comparison and the two literals it picks between.
interface ChoiceData extends CompareData {
  readonly "~choice": readonly [string, string];
}

// DOM output of bind(): an attribute by source, comparison, choice or literal.
type BindData = Readonly<Record<string, SourceData | CompareData | ChoiceData | string>>;

const NAME = /^[a-z][a-z0-9-]*$/;
const SPACE = /[,\s]/;
// The markers of the binding protocol: a literal that starts with one would be read as another kind.
const MARK = /^[=?!]/;
const ATTRIBUTE = /^[a-zA-Z_:][a-zA-Z0-9_:.-]*$/;
// A storage key: the protocol is a comma-separated list of `name:key`, so a comma or a space would split it.
const KEY = /^[a-zA-Z0-9_.:-]+$/;

// What persist() is at build time: the storage key, and the value the state declares.
interface PersistData {
  readonly "~persist": string;
  readonly "~value": StateValue;
}

const fail = (message: string) => new Error(`cssints: reactive: ${message}`);

const isStateValue = (value: unknown): value is StateValue =>
  typeof value === "string" || typeof value === "number" || typeof value === "boolean";

// The value a state declares: the inner value of a persist(), or the value itself.
const stateOf = (value: StateValue | Persisted<StateValue> | undefined): StateValue | undefined => {
  const data = persistedOf(value);
  if (data) return data["~value"];
  return isStateValue(value) ? value : undefined;
};

// A value as the protocol writes it, or the error of one that would break it (commas and spaces split a property list, and
// a value starting with @ would be read as a payload token).
const valueOf = (where: string, value: StateValue | Persisted<StateValue> | undefined): string => {
  const state = stateOf(value);
  if (state === undefined) throw fail(`${where} is missing`);
  if (typeof state === "number" && !Number.isFinite(state))
    throw fail(`${where} is ${String(state)}: a state is a finite number`);
  const text = String(state);
  if (SPACE.test(text))
    throw fail(`${where} is ${JSON.stringify(text)}: a value has no commas and no spaces`);
  if (text.includes("@"))
    throw fail(
      `${where} is ${JSON.stringify(text)}: a value has no @ (the runtime reads @value and @checked from the field)`,
    );
  return text;
};

// The payload a set() value carries, if it is one: the token the runtime resolves against the event's target.
const payloadOf = (value: unknown): "@value" | "@checked" | undefined => {
  const token = (value as { "~payload"?: unknown } | undefined)?.["~payload"];
  return token === "@value" || token === "@checked" ? token : undefined;
};

// What either() built, if the value is a choice.
const choiceOf = (value: unknown): ChoiceData | undefined => {
  const data = value as ChoiceData | undefined;
  return Array.isArray(data?.["~choice"]) ? data : undefined;
};

// What equals() built, if the value is a comparison (a choice carries a comparison too, and is told apart first).
const comparisonOf = (value: unknown): CompareData | undefined => {
  const data = value as CompareData | undefined;
  return typeof data?.["~compare"] === "string" && !choiceOf(data) ? data : undefined;
};

// A literal of bind() or either(): the protocol puts it right after a marker, so a comma, a space or a leading marker
// would split the pair or turn it into another kind. The error names the attribute (or the argument) and the value.
const literalOf = (where: string, value: string): string => {
  if (SPACE.test(value))
    throw fail(`${where} is ${JSON.stringify(value)}: a literal has no commas and no spaces`);
  if (MARK.test(value))
    throw fail(
      `${where} is ${JSON.stringify(value)}: a literal does not start with =, ? or ! (the protocol's markers)`,
    );
  return value;
};

// What persist() wrapped, if the value is one: the state declares its inner value, and the key goes in the protocol.
const persistedOf = (value: unknown): PersistData | undefined => {
  const data = value as PersistData | undefined;
  return typeof data?.["~persist"] === "string" ? data : undefined;
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
  // The storage of persisted states, on the owner: `open:demo-open,tab:demo-tab` (non-inheriting, like the other lists).
  "#persist": {
    css: "&{}",
    atProperty: '@property --reactive-persist{syntax:"*";inherits:false}',
  },
  // The DOM runtime: no feature to polyfill, so every target gets it (delivery.ts).
  "#run": { polyfills: [], script: "@cssints/reactive/runtime" },
  // The owner element: --reactive-owner lists the states, one --reactive-<name> holds each value. group: true adds
  // _g-reactive, which inside() reads through within().
  state: { args: [arg<States>()], uses: ["owner", "run"], group: true },
  // The programs of an element: --reactive-on is `click toggle open,input set tab two`, and two on() calls in one cn()
  // append their segments (append()).
  on: { args: [arg<ProgramData>()], uses: ["events", "run"] },
  // The attributes of an element: --reactive-binding is `aria-expanded open,aria-controls =panel-one`, appended as the
  // programs are.
  bind: { args: [arg<BindData>()], uses: ["binding", "run"] },
}).build({
  state: (states) => {
    const names = Object.keys(states);
    if (!names.length) throw fail("state() takes at least one state: state({ open: false })");
    const decls: [string, string][] = [];
    const stored: string[] = [];
    for (const name of names) {
      if (!NAME.test(name))
        throw fail(
          `the state name ${JSON.stringify(name)} is not an ident: lowercase letters, digits and -, starting with a letter`,
        );
      decls.push([`--reactive-${name}`, valueOf(`the state "${name}"`, states[name])]);
      const data = persistedOf(states[name]);
      if (data) stored.push(`${name}:${data["~persist"]}`);
    }
    return {
      decls: [
        append("--reactive-owner", names.join(",")),
        ...decls,
        ...(stored.length ? [append("--reactive-persist", stored.join(","))] : []),
      ],
      ...(stored.length ? { uses: ["persist"] } : {}),
    };
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
        else if (action["~action"] === "set") {
          const payload = action["~value"];
          const value =
            payload === "@value" || payload === "@checked"
              ? payload
              : valueOf(`the value of "${source}"`, action["~value"]);
          segments.push(`${event} set ${source} ${value}`);
        } else throw fail(`the event "${event}" takes a toggle() or a set()`);
      }
    }
    if (!segments.length) throw fail("on() takes at least one event");
    return { decls: [append("--reactive-on", segments.join(","))] };
  },
  bind: (bindings) => {
    const pairs: string[] = [];
    for (const [attribute, value] of Object.entries(bindings)) {
      if (!ATTRIBUTE.test(attribute))
        throw fail(`${JSON.stringify(attribute)} is not an attribute name`);
      const choice = choiceOf(value);
      if (choice)
        pairs.push(
          `${attribute} ?${choice["~compare"]} ${choice["~value"]} ${choice["~choice"][0]} ${choice["~choice"][1]}`,
        );
      else {
        const comparison = comparisonOf(value);
        if (comparison)
          pairs.push(`${attribute} ?${comparison["~compare"]} ${comparison["~value"]}`);
        else if (typeof value === "string")
          pairs.push(`${attribute} =${literalOf(`the literal of "${attribute}"`, value)}`);
        else pairs.push(`${attribute} ${nameOf(`the source of "${attribute}"`, value)}`);
      }
    }
    if (!pairs.length) throw fail("bind() takes at least one attribute");
    return { decls: [append("--reactive-binding", pairs.join(","))] };
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

// The value a state declares: a persisted state's inner value.
type ValueOf<T> = T extends Persisted<infer V> ? V : T;

/** The sources a `state()` call gives, one per state, by name. */
export type Sources<S extends States> = {
  readonly [K in keyof S & string]: Source<Widen<ValueOf<S[K]>>>;
};

/** What `state()` gives: the owner element's style and one source per state. */
export type State<S extends States> = { readonly owner: Style } & Sources<S>;

/** A program of `on()`: one event's actions. */
export type Program = { readonly [E in EventName]?: Action | readonly Action[] };

/** What one attribute of `bind()` takes: a source, a comparison, a choice, or a literal to write as is. */
export type Binding = Source<StateValue> | Comparison<StateValue> | Choice | string;

/** The attributes of `bind()`: one binding per attribute name. */
export type Bindings = { readonly [attribute: string]: Binding };

declare const sourceType: unique symbol;
/**
 * A state, read where a condition or a piece of DOM output goes (`when(ui.open)`, `bind({ ... })`). `state()` gives its
 * only ones: a source cannot be built, and only `toggle()` and `set()` take it, so a derivation is CSS itself
 * (`calc(var(--reactive-count) * 2)`, a condition), never JavaScript.
 */
export interface Source<T extends StateValue = StateValue> {
  readonly [sourceType]: T;
}

declare const comparisonType: unique symbol;
/**
 * `equals(ui.tab, "one")`: an equation between a state and a value, `"true"` or `"false"` in the attribute `bind()` writes
 * it to. Only `equals()` makes one and only `bind()` takes it, directly or through `either()`. It is not a `Source`: it
 * cannot be written, stored or used as a condition, because it holds no value of its own.
 */
export interface Comparison<T extends StateValue = StateValue> {
  readonly [comparisonType]: T;
}

declare const choiceType: unique symbol;
/**
 * `either(equals(ui.tab, "one"), "0", "-1")`: one of two literals, picked by a comparison (`"0"` while the equation holds,
 * `"-1"` otherwise). Only `either()` makes one and only `bind()` takes it.
 */
export interface Choice {
  readonly [choiceType]: readonly [string, string];
}

declare const actionType: unique symbol;
/**
 * A write, from `toggle()` or `set()`. Opaque, and only `on()` takes it: a write outside an event cannot be written.
 */
export interface Action {
  readonly [actionType]: "write";
}

declare const payloadType: unique symbol;
/**
 * The value of the field the event fired on, from `value()` or `checked()`: `set(ui.tab, value())` writes
 * `target.value`, `set(ui.open, checked())` writes `target.checked ? "true" : "false"`. Only `set()` takes one: it is not
 * a state value, a source, an action or a style.
 */
export interface Payload<T extends StateValue> {
  readonly [payloadType]: T;
}

declare const persistedType: unique symbol;
/**
 * A state value that survives a reload, from `persist(value, key)`. Only `state()` takes one (`state({ open: persist(false,
 * "demo-open") })`): it is not a `Source`, an `Action` or a `Style`, and a write still goes through the source.
 */
export interface Persisted<T extends StateValue> {
  readonly [persistedType]: T;
}

const payload = <T extends StateValue>(token: "@value" | "@checked"): Payload<T> =>
  ({ "~payload": token }) as unknown as Payload<T>;

const action = (data: ActionData): Action => data as unknown as Action;

// the owner's class string, from the member with the concrete shape (the sources are added beside it)
const ownerOf = (states: States): Style => members.state(states);

/**
 * `state({ open: false, tab: "one" })`: the only source of `@cssints/reactive`, the states of one owner element (two calls
 * in one `cn()` are one owner). It gives the owner's style (`cn(ui.owner, p(4))`) and one source per state. The initial
 * values are CSS custom properties on the owner, and `./runtime` writes `data-reactive-<name>` on it on load and after an
 * event: a condition on an initial value may paint one frame late. Names are idents (lowercase letters, digits and -), and
 * a string value has no commas, spaces or `@`. A value may be `persist(value, key)`, which the runtime restores from
 * `localStorage` at that same initialisation.
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
 * `state({ open: persist(false, "demo-open") })`: a state value that survives a reload. The runtime stores it under
 * `"reactive:" + key` on every write and restores it when the owner is initialised, before the first paint the page can
 * show, so a stored value wins over the declared one. A key is letters, digits, `-`, `_`, `.` and `:` (a comma or a space
 * would split the protocol list), and an app prefixes its keys with its name (`demo-open`, not `open`). Two states may
 * share a key on purpose: one storage slot, kept in sync. Only `state()` takes a `Persisted`: it is not a source, an
 * action or a style, and a write goes through the source.
 *
 * @param {T} value the value when nothing is stored
 * @param {string} key the storage key, after `"reactive:"`
 * @returns {Persisted<T>} the state value
 */
export function persist<T extends StateValue>(value: T, key: string): Persisted<T> {
  if (value === undefined) throw fail('persist() is missing a value: persist(false, "demo-open")');
  if (typeof key !== "string" || !KEY.test(key))
    throw fail(
      `the persistence key ${JSON.stringify(key)} is not a key: letters, digits, - _ . and :, and no comma or space`,
    );
  return { "~persist": key, "~value": value } as unknown as Persisted<T>;
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
 * `set(ui.tab, "two")` / `set(ui.tab, value())`: set a state to a value when the event it is put on runs, a literal or the
 * value of the field the event fired on (`value()`, `checked()`). Only `on()` takes it.
 *
 * @param {Source<T>} source the state
 * @param {T | Payload<T>} value the value, of the state's type, or a payload of it
 * @returns {Action} the write
 */
export function set<T extends StateValue>(source: Source<T>, value: T | Payload<T>): Action {
  const name = nameOf("set()", source);
  return action({
    "~action": "set",
    "~source": name,
    "~value": payloadOf(value) ?? valueOf(`the value of "${name}"`, value as StateValue),
  });
}

/**
 * `equals(ui.tab, "one")`: a comparison, `"true"` in a `bind()` attribute while the nearest owner's state holds that value
 * and `"false"` while it does not. The value must be of the source's type (`equals(ui.open, "yes")` is a type error), and
 * a comparison is not a source: `set()`, `toggle()`, `when()` and `inside()` refuse it, `persist()` does not store it, and
 * only `bind()` evaluates it. It is an equation, not a state: the runtime reads the comparison off the binding and the
 * value off the nearest owner.
 *
 * @param {Source<T>} source the state
 * @param {T} value the value to compare with
 * @returns {Comparison<T>} the comparison
 */
export function equals<T extends StateValue>(source: Source<T>, value: T): Comparison<T> {
  return {
    "~compare": nameOf("equals()", source),
    "~value": valueOf("the value of equals()", value),
  } as unknown as Comparison<T>;
}

/**
 * `either(equals(ui.tab, "one"), "0", "-1")`: a choice of two literals, `whenTrue` in a `bind()` attribute while the
 * comparison holds and `whenFalse` while it does not. The first argument must be a `Comparison` (`either(ui.tab, ...)` is a
 * type error), and a literal has no commas, no spaces and no leading `=`, `?` or `!` (build errors at the call site). Only
 * `bind()` takes a choice.
 *
 * @param {Comparison<StateValue>} comparison the comparison that picks the literal
 * @param {string} whenTrue the literal while it holds
 * @param {string} whenFalse the literal while it does not
 * @returns {Choice} the choice
 */
export function either(
  comparison: Comparison<StateValue>,
  whenTrue: string,
  whenFalse: string,
): Choice {
  const data = comparisonOf(comparison);
  if (!data) throw fail('either() takes a comparison: either(equals(ui.tab, "one"), "0", "-1")');
  return {
    "~compare": data["~compare"],
    "~value": data["~value"],
    "~choice": [
      literalOf("the first value of either()", whenTrue),
      literalOf("the second value of either()", whenFalse),
    ],
  } as unknown as Choice;
}

/**
 * `set(ui.tab, value())`: the value of the field the event fired on (`target.value`, a string). Only `set()` takes it, and
 * only a string state: a `value()` is not a `checked()`.
 *
 * @returns {Payload<string>} the payload
 */
export function value(): Payload<string> {
  return payload("@value");
}

/**
 * `set(ui.open, checked())`: whether the field the event fired on is checked (`target.checked`, `"true"` or `"false"`).
 * Only `set()` takes it, and only a boolean state: a `checked()` is not a `value()`.
 *
 * @returns {Payload<boolean>} the payload
 */
export function checked(): Payload<boolean> {
  return payload("@checked");
}

/**
 * `on({ click: toggle(ui.open) })`: the events of the element it is on, one action or a list each. A delegated listener
 * applies every program of the target and its ancestors, then updates the bindings of each owner once. Two `on()` calls in
 * one `cn()` append their segments, and an identical segment twice is applied once.
 *
 * @param {Program} program one or more actions by event
 * @returns {Style} the element's style, with its program
 */
export function on(program: Program): Style {
  return members.on(program as unknown as ProgramData);
}

/**
 * `bind({ "aria-expanded": ui.open })`: writes each attribute on the element it is on, from its nearest owner. A value is a
 * source (the state's value, as above), a comparison (`equals(ui.tab, "one")`: `"true"` or `"false"`), a choice
 * (`either(equals(ui.tab, "one"), "0", "-1")`: one of two literals), or a literal string written as is
 * (`"aria-controls": "panel-one"`). The runtime writes them on load and on every flush of that owner; a comparison is the
 * only expression it evaluates, because an attribute on the element itself cannot be computed in CSS. Two `bind()` calls
 * in one `cn()` append their attributes.
 *
 * @param {Bindings} bindings a binding per attribute name
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
