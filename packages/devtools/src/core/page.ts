// What the cascade asks of the page an element is in. The DOM implementation is dom.ts; the unit tests give one of their own.
import { type Effect, Context } from "effect";

/** A rule of another sheet that matches the element and sets the property (dom.ts walks the CSSOM for it). */
export interface Foreign {
  selector: string;
  /** the sheet: its href, Vite's dev id, or `<style>` */
  source: string;
  /** "" outside every layer */
  layer: string;
  value: string;
  important: boolean;
}

/** What the browser says of one longhand, for a winner's declaration. */
export interface Observed {
  prop: string;
  /** getComputedStyle of the element */
  computed: string;
  /** getComputedStyle of a childless clone in its place with the winner's declaration inline and `!important` */
  expected: string;
  /** the element's own `style` for it */
  inline: string;
  foreign: Foreign[];
  animated: boolean;
}

export interface Probe {
  wrap: readonly string[];
  /** the selector inside the at-rules; none: the at-rules alone, for the element */
  selector?: string;
}

export class Page extends Context.Service<
  Page,
  {
    readonly classes: (el: Element) => Effect.Effect<string[]>;
    readonly label: (el: Element) => Effect.Effect<string>;
    readonly parent: (el: Element) => Effect.Effect<Element | undefined>;
    /** `Element.matches` */
    readonly matches: (el: Element, selector: string) => Effect.Effect<boolean>;
    /** whether each rule applies to the element now, at-rules and selector, as the browser decides */
    readonly probe: (el: Element, probes: readonly Probe[]) => Effect.Effect<boolean[]>;
    /** computed values of custom properties */
    readonly custom: (el: Element, names: readonly string[]) => Effect.Effect<string[]>;
    /** the winner's declaration `prop: value` of the rule `selector` */
    readonly verify: (
      el: Element,
      prop: string,
      selector: string,
      value: string,
      longhands: readonly string[],
    ) => Effect.Effect<Observed[]>;
  }
>()("@cssints/devtools/core/page") {}
