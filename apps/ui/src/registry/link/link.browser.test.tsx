import {
  type ScenarioConfig,
  ScenarioMismatch,
  differentialWalk,
  parseScenarioFile,
  replayScenario,
  specDriver,
} from "@cssints/apg-specs/scenario";
import { decodeDefinition, makeReferenceModel } from "@quint-machine/core";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { userEvent } from "vite-plus/test/browser";
import { linkBridge, linkConfig, linkProbe, linkSteps } from "@cssints/apg-specs/apg/link.bridge";
import ariakit from "@cssints/apg-specs/scenarios/apg/link.ariakit.json";
import baseUi from "@cssints/apg-specs/scenarios/apg/link.base-ui.json";
import definitionJson from "@cssints/apg-specs/apg/link.model.json";
import { type Mounted, domDriver } from "./link-driver.ts";
import { mountLink, mountStyledLink } from "./link.fixture";
import reactAria from "@cssints/apg-specs/scenarios/apg/link.react-aria.json";

const model = makeReferenceModel(decodeDefinition(definitionJson));

const dom = (config: ScenarioConfig) =>
  domDriver(mountLink(linkConfig(config)), { hideableParts: [] });

// Scenarios whose expectations the primitive deliberately does not meet. Each
// entry must still fail (so fixing the gap forces removing it) and says why.
const DIVERGENCES: Readonly<Record<string, string>> = {
  "link.react-aria.accessible-props-passed-through":
    "the scenario passes aria-current through a consumer prop; the primitive only returns the pattern attributes",
};

describe("Link x ported scenarios (real DOM)", () => {
  for (const source of [ariakit, baseUi, reactAria]) {
    const file = parseScenarioFile(source);
    describe(file.source, () => {
      for (const scenario of file.scenarios) {
        it(scenario.id, async (context) => {
          const run = replayScenario(scenario, linkBridge, dom);
          const divergence = DIVERGENCES[scenario.id];
          if (divergence !== undefined) {
            await expect(run).rejects.toBeInstanceOf(ScenarioMismatch);
            return;
          }
          const result = await run;
          if (result.status === "unsupported") {
            context.skip(result.reason);
          }
        });
      }
    });
  }
});

describe("Link x spec (differential walk)", () => {
  const configs: ReadonlyArray<ScenarioConfig> = [
    { native: true, href: "#link" },
    { native: false },
  ];
  for (const config of configs) {
    it(`matches the generated model for ${JSON.stringify(config)}`, async () => {
      await differentialWalk({
        alphabet: linkSteps,
        probe: linkProbe,
        makePair: () => Promise.resolve([specDriver(model, linkBridge, config), dom(config)]),
        runs: 15,
        steps: 25,
        seed: 7,
      });
    });
  }
});

// The walk above is the primitive's contract through the skin's markup. What the skin adds is the theme's colour and
// underline, the current page's weight+colour, the disabled grey, `render`, and the tone. The element stays whatever the
// primitive says: a native `<a href>`, or a custom `role=link` with one tab stop.
const style = (element: Element): CSSStyleDeclaration => getComputedStyle(element);

const colorToken = (name: string): string => {
  const probe = document.createElement("div");
  probe.style.color = `var(${name})`;
  document.body.append(probe);
  const value = style(probe).color;
  probe.remove();
  return value;
};

/** Solid 2 delivers delegated events on a later turn. */
const tick = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 20));

const live: Mounted[] = [];

const mounted = (options: Parameters<typeof mountStyledLink>[0]): Mounted => {
  const instance = mountStyledLink(options);
  live.push(instance);
  return instance;
};

afterEach(() => {
  for (const instance of live.splice(0)) {
    instance.dispose();
  }
});

const part = (root: ParentNode): HTMLElement => {
  const element = root.querySelector<HTMLElement>('[data-part="link"]');
  if (element === null) {
    throw new Error("link: no link part");
  }
  return element;
};

describe("Link (the kit's look)", () => {
  it("gives a native link its href and its tab stop, and a click runs it", async () => {
    const instance = mounted({ href: "#link" });
    const element = part(instance.root);

    expect(element.tagName).toBe("A");
    expect(element.getAttribute("href")).toBe("#link");
    // no role and no tabindex of the skin's: a native anchor is a link and a tab stop already
    expect(element.getAttribute("role")).toBeNull();
    expect(element.getAttribute("tabindex")).toBeNull();
    element.focus();
    expect(document.activeElement).toBe(element);

    await userEvent.click(element);
    await tick();

    expect(instance.events.get("onClick")).toEqual(["A"]);
    expect(instance.events.get("onPress")).toEqual(["link"]);
    expect(instance.events.get("onNavigate")).toEqual(["#link"]);
  });

  it("gives a custom link role=link, one tab stop and Enter, as the primitive says", async () => {
    const instance = mounted({ native: false });
    const element = part(instance.root);

    expect(element.getAttribute("role")).toBe("link");
    expect(element.getAttribute("tabindex")).toBe("0");
    expect(element.getAttribute("href")).toBeNull();

    element.focus();
    expect(document.activeElement).toBe(element);
    await userEvent.keyboard("{Enter}");
    await tick();

    expect(instance.events.get("onClick")).toEqual(["A"]);
  });

  it("drops the tab stop and blocks the activation while disabled", async () => {
    const instance = mounted({ native: false, disabled: true });
    const element = part(instance.root);

    expect(element.getAttribute("aria-disabled")).toBe("true");
    expect(element.getAttribute("tabindex")).toBe("-1");
    // greyed, and the pointer says the row is not something to press
    expect(style(element).color).toBe(colorToken("--color-text-disabled"));
    expect(style(element).cursor).toBe("default");

    element.focus();
    await userEvent.keyboard("{Enter}");
    // a native click: user-event refuses an aria-disabled element, and this is exactly the press the skin must drop
    element.click();
    await tick();

    expect(instance.events.size).toBe(0);
  });

  it("marks the current page with aria-current and paints weight and colour from it", () => {
    const current = part(mounted({ href: "#a", current: true }).root);
    const other = part(mounted({ href: "#b" }).root);

    expect(current.getAttribute("aria-current")).toBe("page");
    expect(other.getAttribute("aria-current")).toBeNull();
    // not colour alone: the weight changes too
    expect(style(current).fontWeight).toBe("600");
    expect(style(other).fontWeight).not.toBe("600");
    expect(style(current).color).toBe(colorToken("--color-text"));
    expect(style(other).color).toBe(colorToken("--color-link"));
  });

  it("keeps the props and the state live through render", async () => {
    const instance = mounted({
      native: false,
      href: "#render",
      render: (props, state) => (
        <a
          {...props}
          data-native={state.native() ? "native" : "custom"}
          data-current={state.current() ? "page" : "none"}
        />
      ),
    });
    const element = part(instance.root);

    expect(element.getAttribute("data-part")).toBe("link");
    expect(element.getAttribute("role")).toBe("link");
    expect(element.getAttribute("tabindex")).toBe("0");
    expect(element.getAttribute("href")).toBeNull();
    expect(element.dataset["native"]).toBe("custom");
    expect(element.dataset["current"]).toBe("none");

    instance.setProp("setNative", true);
    instance.setProp("current", true);
    await tick();

    // the primitive's attributes follow the element the caller chose, and the state accessors are live
    expect(element.getAttribute("role")).toBeNull();
    expect(element.getAttribute("tabindex")).toBeNull();
    expect(element.getAttribute("href")).toBe("#render");
    expect(element.getAttribute("aria-current")).toBe("page");
    expect(element.dataset["native"]).toBe("native");
    expect(element.dataset["current"]).toBe("page");
  });

  it("paints the muted tone apart from the default one", () => {
    const normal = part(mounted({ href: "#a" }).root);
    const muted = part(mounted({ href: "#a", tone: "muted" }).root);

    expect(style(normal).color).toBe(colorToken("--color-link"));
    expect(style(muted).color).toBe(colorToken("--color-muted"));
    expect(style(muted).color).not.toBe(style(normal).color);
  });
});
