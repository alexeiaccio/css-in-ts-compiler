// The page of the cascade in a browser: the element's own document. At-rules are decided by the browser through a probe
// sheet, winners are checked on a childless clone, and the other sheets are walked for what beats cssints.
import { Effect, Layer, Result } from "effect";

import { type Foreign, type Observed, Page, type Probe } from "./page.ts";

const PROBE = "data-cssints-probe";
const isCssints = (sheet: CSSStyleSheet) =>
  sheet.ownerNode instanceof Element &&
  (sheet.ownerNode.getAttribute("data-vite-dev-id") ?? "").endsWith("virtual:cssints.css");

const matches = (el: Element, selector: string) =>
  Result.getOrElse(
    Result.try(() => el.matches(selector)),
    () => false,
  );

const label = (el: Element) => {
  const data = [...el.attributes].find((a) => a.name.startsWith("data-") && a.name !== PROBE);
  return `${el.localName}${el.id ? `#${el.id}` : ""}${data ? `[${data.name}${data.value ? `="${data.value}"` : ""}]` : ""}`;
};

const probe = (el: Element, probes: readonly Probe[]) => {
  if (!probes.length) return [];
  const style = el.ownerDocument.createElement("style");
  style.textContent = probes
    .map(({ wrap, selector }, i) => {
      const target = selector ? `:is(${selector}):where([${PROBE}])` : `[${PROBE}]`;
      return `${wrap.map((w) => `${w} {`).join(" ")} ${target} { --cssints-probe-${i}: 1 } ${"}".repeat(wrap.length)}`;
    })
    .join("\n");
  el.ownerDocument.head.append(style);
  el.setAttribute(PROBE, "");
  const cs = getComputedStyle(el);
  const out = probes.map((_, i) => cs.getPropertyValue(`--cssints-probe-${i}`).trim() === "1");
  el.removeAttribute(PROBE);
  style.remove();
  return out;
};

// The rules of the other sheets that match the element and set `prop`; @media and @supports are evaluated, the rest kept.
const foreign = (el: Element, prop: string): Foreign[] => {
  const out: Foreign[] = [];
  const view = el.ownerDocument.defaultView;
  const walk = (rules: CSSRuleList, source: string, layer: string) => {
    for (const r of rules) {
      if (r instanceof CSSStyleRule) {
        const value = r.style.getPropertyValue(prop);
        if (value && matches(el, r.selectorText))
          out.push({
            selector: r.selectorText,
            source,
            layer,
            value,
            important: r.style.getPropertyPriority(prop) === "important",
          });
        walk(r.cssRules, source, layer);
      } else if (r instanceof CSSLayerBlockRule)
        walk(r.cssRules, source, layer ? `${layer}.${r.name}` : r.name);
      else if (r instanceof CSSMediaRule) {
        if (view?.matchMedia(r.conditionText).matches) walk(r.cssRules, source, layer);
      } else if (r instanceof CSSSupportsRule) {
        if (CSS.supports(r.conditionText)) walk(r.cssRules, source, layer);
      } else if (r instanceof CSSGroupingRule) walk(r.cssRules, source, layer);
    }
  };
  for (const sheet of el.ownerDocument.styleSheets) {
    if (isCssints(sheet)) continue;
    const owner = sheet.ownerNode instanceof Element ? sheet.ownerNode : undefined;
    const source =
      sheet.href ?? owner?.getAttribute("data-vite-dev-id") ?? `<${owner?.localName ?? "style"}>`;
    const rules = Result.getOrUndefined(Result.try(() => sheet.cssRules));
    if (rules) walk(rules, source, "");
  }
  return out;
};

const selectorText = (selector: string) =>
  Result.getOrUndefined(
    Result.try(() => {
      const sheet = new CSSStyleSheet();
      sheet.insertRule(`${selector} {}`);
      const rule = sheet.cssRules[0];
      return rule instanceof CSSStyleRule ? rule.selectorText : undefined;
    }),
  );

// The winner's declaration of a custom property as the page has it. A transformer between the server and the page (Vite's
// LightningCSS) reprints values, and an unregistered custom property computes to its tokens as written: `.04` is not
// `0.04`. Among the page's rules with the winner's selector, the last whose at-rules hold for the element.
const live = (el: Element, selector: string, prop: string) => {
  const target = selectorText(selector);
  if (target === undefined) return undefined;
  const found: { wrap: string[]; value: string }[] = [];
  const walk = (rules: CSSRuleList, wrap: string[]) => {
    for (const r of rules) {
      if (r instanceof CSSStyleRule) {
        const value = r.style.getPropertyValue(prop);
        if (value && r.selectorText === target) found.push({ wrap, value });
      } else if (r instanceof CSSMediaRule)
        walk(r.cssRules, [...wrap, `@media ${r.conditionText}`]);
      else if (r instanceof CSSSupportsRule)
        walk(r.cssRules, [...wrap, `@supports ${r.conditionText}`]);
      else if (r instanceof CSSContainerRule)
        walk(r.cssRules, [...wrap, `@container ${r.conditionText}`]);
      // Firefox before 146 has no CSSScopeRule
      else if (globalThis.CSSScopeRule && r instanceof CSSScopeRule)
        walk(r.cssRules, [
          ...wrap,
          `@scope${r.start ? ` (${r.start})` : ""}${r.end ? ` to (${r.end})` : ""}`,
        ]);
      else if (r instanceof CSSGroupingRule) walk(r.cssRules, wrap);
    }
  };
  const sheets = [...el.ownerDocument.styleSheets];
  const own = sheets.filter(isCssints);
  for (const sheet of own.length ? own : sheets) {
    const rules = Result.getOrUndefined(Result.try(() => sheet.cssRules));
    if (rules) walk(rules, []);
  }
  if (found.length < 2) return found[0]?.value;
  const held = probe(
    el,
    found.map(({ wrap }) => ({ wrap })),
  );
  return found.findLast((_, i) => held[i])?.value ?? found.at(-1)!.value;
};

const VAR = /var\(\s*(--[\w-]+)/g;

const verify = (
  el: Element,
  prop: string,
  selector: string,
  declared: string,
  longhands: readonly string[],
): Observed[] => {
  const clone = el.cloneNode(false);
  if (!(clone instanceof Element) || !(clone instanceof HTMLElement || clone instanceof SVGElement))
    return [];
  const value = (prop.startsWith("--") && live(el, selector, prop)) || declared;
  const cs = getComputedStyle(el);
  // the clone is not hovered or focused: the custom properties the value reads are copied from the element
  for (const [, name] of value.matchAll(VAR))
    clone.style.setProperty(name!, cs.getPropertyValue(name!));
  clone.style.setProperty(prop, value, "important");
  el.after(clone);
  const ccs = getComputedStyle(clone);
  const inline = el instanceof HTMLElement || el instanceof SVGElement ? el.style : undefined;
  const animated = el.getAnimations().length > 0;
  const out = longhands.map((l) => {
    const computed = cs.getPropertyValue(l).trim();
    const expected = ccs.getPropertyValue(l).trim();
    return {
      prop: l,
      computed,
      expected,
      inline: inline?.getPropertyValue(l) ?? "",
      foreign: computed === expected ? [] : foreign(el, l),
      animated,
    } satisfies Observed;
  });
  clone.remove();
  return out;
};

/** The page of an element in a browser. */
export const domPage = Layer.succeed(
  Page,
  Page.of({
    classes: (el) => Effect.sync(() => [...el.classList]),
    label: (el) => Effect.sync(() => label(el)),
    parent: (el) => Effect.sync(() => el.parentElement ?? undefined),
    matches: (el, selector) => Effect.sync(() => matches(el, selector)),
    probe: (el, probes) => Effect.sync(() => probe(el, probes)),
    custom: (el, names) =>
      Effect.sync(() => {
        const cs = getComputedStyle(el);
        return names.map((n) => cs.getPropertyValue(n).trim());
      }),
    verify: (el, prop, selector, value, longhands) =>
      Effect.sync(() => verify(el, prop, selector, value, longhands)),
  }),
);
