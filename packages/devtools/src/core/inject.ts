// The core in a page without the overlay: a host that drives a browser (@cssints/mcp through Playwright) bundles this file,
// adds it to the page, hands it the table it got from the dev server, and runs the overlay's cascade on an element.
import { Effect, Exit, Result } from "effect";

import { inspect, type Inspection } from "./cascade.ts";
import { domPage } from "./dom.ts";
import { toModel, type Model } from "./table.ts";

let model: Model | undefined;

const api = {
  // decodes the table (`cssints:devtools`): an error message, or undefined
  load: (table: unknown): string | undefined => {
    const exit = Effect.runSyncExit(toModel(table));
    if (Exit.isFailure(exit)) return String(exit.cause);
    model = exit.value;
    return undefined;
  },
  // the inspection of the first element that matches, how many match, its computed `prop`; or an error message
  inspect: (
    selector: string,
    prop?: string,
  ): { inspection: Inspection; matches: number; computed: string } | string => {
    if (!model) return "no table: call load first";
    const all = Result.try(() => document.querySelectorAll(selector));
    if (Result.isFailure(all)) return `not a CSS selector: ${selector}`;
    const el = all.success[0];
    if (!el) return `no element matches ${selector}`;
    // @effect-diagnostics-next-line strictEffectProvide:off -- the host's edge: the one place the core meets the page
    const exit = Effect.runSyncExit(inspect(model, el).pipe(Effect.provide(domPage)));
    if (Exit.isFailure(exit)) return String(exit.cause);
    return {
      inspection: exit.value,
      matches: all.success.length,
      computed: prop ? getComputedStyle(el).getPropertyValue(prop).trim() : "",
    };
  },
  // takes the focus from whatever has it
  blur: (): void => {
    const a = document.activeElement;
    if (a instanceof HTMLElement || a instanceof SVGElement) a.blur();
  },
};

Object.assign(globalThis, { __cssintsDevtools: api });
