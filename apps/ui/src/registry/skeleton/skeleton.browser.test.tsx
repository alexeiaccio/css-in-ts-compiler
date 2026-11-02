import { render } from "@solidjs/web";
import type { JSX } from "@solidjs/web";
import { flush } from "solid-js";
import { afterEach, describe, expect, it } from "vite-plus/test";

import { Skeleton } from "./skeleton.tsx";

// A skeleton has no primitive and no APG pattern: the skin is the contract. Two things a reader can observe are the box and
// the pulse, and one a screen reader can observe is that the box is not content. The pulse is the only motion in the kit, so
// it is also the only place that reads the reader's motion preference, and this file reads that rule back.

interface Mounted {
  readonly root: HTMLElement;
  readonly dispose: () => void;
}

const live: Mounted[] = [];

const mount = (view: () => JSX.Element): Mounted => {
  const root = document.createElement("div");
  root.style.width = "320px";
  document.body.append(root);
  const dispose = render(view, root);
  flush();
  const mounted = {
    root,
    dispose: () => {
      dispose();
      root.remove();
    },
  };
  live.push(mounted);
  return mounted;
};

afterEach(() => {
  for (const mounted of live.splice(0)) {
    mounted.dispose();
  }
});

const part = (root: ParentNode): HTMLElement => {
  const element = root.querySelector<HTMLElement>('[data-part="skeleton"]');
  if (element === null) {
    throw new Error('skeleton: no [data-part="skeleton"]');
  }
  return element;
};

const style = (element: Element): CSSStyleDeclaration => getComputedStyle(element);

/**
 * Every `@media` rule in the document whose condition is about reduced motion, at any nesting depth (the engine's sheet is
 * wrapped in `@layer`, and the skin's rule sits inside it). The test needs the rule itself: the pulse is declared only under
 * `(prefers-reduced-motion: no-preference)`.
 */
const motionMediaRules = (): CSSMediaRule[] => {
  const found: CSSMediaRule[] = [];
  const walk = (rules: CSSRuleList): void => {
    for (const rule of rules) {
      if (rule instanceof CSSMediaRule && rule.media.mediaText.includes("prefers-reduced-motion")) {
        found.push(rule);
      }
      if (rule instanceof CSSGroupingRule) {
        walk(rule.cssRules);
      }
    }
  };
  for (const sheet of document.styleSheets) {
    walk(sheet.cssRules);
  }
  return found;
};

/** Whether an animation of this name is declared inside one of those rules. */
const declaredIn = (rules: ReadonlyArray<CSSMediaRule>, name: string): boolean => {
  let declared = false;
  const walk = (list: CSSRuleList): void => {
    for (const rule of list) {
      if (rule instanceof CSSStyleRule && rule.style.animationName === name) {
        declared = true;
      }
      if (rule instanceof CSSGroupingRule) {
        walk(rule.cssRules);
      }
    }
  };
  for (const rule of rules) {
    walk(rule.cssRules);
  }
  return declared;
};

describe("Skeleton skin", () => {
  it("is a block placeholder that fills its container by default", () => {
    const { root } = mount(() => <Skeleton />);
    const box = part(root);

    expect(box.tagName).toBe("DIV");
    expect(style(box).display).toBe("block");
    expect(style(box).width).toBe("320px");
    expect(style(box).height).toBe("16px");
    expect(style(box).borderTopLeftRadius).toBe("8px");
    expect(style(box).backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
    expect(box.textContent).toBe("");
  });

  it("takes the width and height a caller passes as inline values, not as classes", () => {
    const { root } = mount(() => <Skeleton width="12rem" height="1.5rem" />);
    const box = part(root);

    expect(style(box).width).toBe("192px");
    expect(style(box).height).toBe("24px");
    // the box is still the skin's: the size is the only thing the props change
    expect(style(box).display).toBe("block");
    expect(box.getAttribute("data-part")).toBe("skeleton");
  });

  it("is out of the accessibility tree: a placeholder is not content", () => {
    const { root } = mount(() => <Skeleton />);
    const box = part(root);

    expect(box.getAttribute("aria-hidden")).toBe("true");
    // nothing to read anyway, and no role to announce it with
    expect(box.textContent).toBe("");
    expect(box.getAttribute("role")).toBeNull();
    expect(box.getAttribute("aria-label")).toBeNull();
  });

  it("pulses by default, inside the no-preference branch of the motion media query", () => {
    const { root } = mount(() => <Skeleton />);
    const box = part(root);
    const computed = style(box);

    // the page the test runs in is a no-preference page, which is the branch the skin animates in
    expect(window.matchMedia("(prefers-reduced-motion: no-preference)").matches).toBe(true);
    expect(computed.animationName).not.toBe("none");
    expect(computed.animationDuration).toBe("1.6s");
    expect(computed.animationTimingFunction).toBe("ease-in-out");
    expect(computed.animationIterationCount).toBe("infinite");
    expect(computed.animationDirection).toBe("alternate");
    expect(computed.animationPlayState).toBe("running");
    // and the animation is gated: the rule that declares it is the no-preference branch of the motion query
    const rules = motionMediaRules();
    const noPreference = rules.filter((rule) =>
      rule.media.mediaText.includes("prefers-reduced-motion: no-preference"),
    );
    expect(noPreference.length).toBeGreaterThan(0);
    expect(declaredIn(noPreference, computed.animationName)).toBe(true);
  });

  it("stops pulsing when the reader asks for less motion", () => {
    const { root } = mount(() => <Skeleton />);
    const box = part(root);
    const rules = motionMediaRules();
    const original = rules.map((rule) => rule.media.mediaText);
    // a copied test cannot call Playwright's `emulateMedia` (the shipped browser config defines no command for it), and the
    // media query is the browser's, not JavaScript's: the state `prefers-reduced-motion: reduce` puts this rule in is that
    // `(prefers-reduced-motion: no-preference)` no longer matches, so the rule is switched off for the read and then restored.
    for (const rule of rules) {
      rule.media.mediaText = "not all";
    }
    try {
      const computed = style(box);
      expect(computed.animationName).toBe("none");
      expect(computed.animationDuration).toBe("0s");
      // the box is still a box: only the motion is gone
      expect(computed.display).toBe("block");
      expect(computed.height).toBe("16px");
    } finally {
      rules.forEach((rule, index) => {
        rule.media.mediaText = original[index] ?? rule.media.mediaText;
      });
    }
    // restored, so the next reader of the sheet sees the pulse again
    expect(style(box).animationName).not.toBe("none");
  });
});
