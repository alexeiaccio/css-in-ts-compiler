import {
  type ScenarioConfig,
  ScenarioMismatch,
  differentialWalk,
  parseScenarioFile,
  replayScenario,
  specDriver,
} from "@cssints/apg-specs/scenario";
import {
  breadcrumbBridge,
  breadcrumbConfig,
  breadcrumbProbe,
  breadcrumbSteps,
} from "@cssints/apg-specs/apg/breadcrumb.bridge";
import { decodeDefinition, makeReferenceModel } from "@quint-machine/core";
import { render } from "@solidjs/web";
import type { JSX } from "@solidjs/web";
import { describe, expect, it } from "vite-plus/test";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList } from "./breadcrumb.tsx";
import definitionJson from "@cssints/apg-specs/apg/breadcrumb.model.json";
import { domDriver } from "./breadcrumb-driver.ts";
import { mountBreadcrumb } from "./breadcrumb.fixture";
import reactAria from "@cssints/apg-specs/scenarios/apg/breadcrumb.react-aria.json";

// The copy's own conformance: the same scenarios the primitive is checked against, driven through
// this styled trail rather than through the bare controller. The bridge calls the list
// `breadcrumb` and a step `item:N`; the skin names them `breadcrumb-list` and `breadcrumb-item`,
// so the target is translated on the way in and the parts the walk lists as visible are
// translated back.
const model = makeReferenceModel(decodeDefinition(definitionJson));

type Driver = ReturnType<typeof domDriver>;

const RENAME: Readonly<Record<string, string>> = {
  breadcrumb: "breadcrumb-list",
  item: "breadcrumb-item",
};
const BACK: Readonly<Record<string, string>> = {
  "breadcrumb-list": "breadcrumb",
  "breadcrumb-item": "item",
};

const move = (target: string, table: Readonly<Record<string, string>>): string => {
  const [name = "", index] = target.split(":");
  const mapped = table[name] ?? name;
  return index === undefined ? mapped : `${mapped}:${index}`;
};

const translated = (driver: Driver): Driver => ({
  ...driver,
  perform: (step) => {
    const target = step.target === undefined ? undefined : move(step.target, RENAME);
    return driver.perform(target === undefined ? step : { ...step, target });
  },
  observer: {
    ...driver.observer,
    attr: (target, name) => driver.observer.attr(move(target, RENAME), name),
    visible: () => driver.observer.visible().map((part) => move(part, BACK)),
  },
});

const dom = (config: ScenarioConfig) =>
  translated(
    domDriver(mountBreadcrumb(breadcrumbConfig(config)), {
      hideableParts: ["breadcrumb-list", "breadcrumb-item"],
    }),
  );

// Scenarios whose expectations the primitive deliberately does not meet. Each
// entry must still fail (so fixing the gap forces removing it) and says why.
const DIVERGENCES: Readonly<Record<string, string>> = {
  "breadcrumb.react-aria.label-on-list-and-items":
    "the upstream stamps a generic aria-label on every item; the primitive exposes item labels as text, not aria-label",
  "breadcrumb.react-aria.descendant-href-item-keeps-no-role":
    "the primitive always renders role=listitem items around their links; this suite expects the wrapper to carry no role",
  "breadcrumb.react-aria.adobe-current-item-marked":
    "this suite focuses the first ancestor item at mount; the primitive does not move focus",
};

describe("Breadcrumb x ported scenarios (real DOM)", () => {
  const file = parseScenarioFile(reactAria);
  describe(file.source, () => {
    for (const scenario of file.scenarios) {
      it(scenario.id, async (context) => {
        const run = replayScenario(scenario, breadcrumbBridge, dom);
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
});

describe("Breadcrumb x spec (differential walk)", () => {
  for (const config of [{ items: 4 }, { items: 2 }]) {
    it(`matches the generated model for ${JSON.stringify(config)}`, async () => {
      await differentialWalk({
        alphabet: breadcrumbSteps,
        probe: breadcrumbProbe,
        makePair: () => Promise.resolve([specDriver(model, breadcrumbBridge, config), dom(config)]),
        runs: 15,
        steps: 25,
        seed: 7,
      });
    });
  }
});

// The skin's own contract: the list is an ordered list in a named landmark, the current page is
// marked on both the item and its link and painted from that mark, and a separator is decoration.
const mount = (view: () => JSX.Element): HTMLElement => {
  const root = document.createElement("div");
  document.body.append(root);
  render(view, root);
  return root;
};

const part = (root: HTMLElement, name: string): HTMLElement =>
  root.querySelector<HTMLElement>(`[data-part="${name}"]`)!;

const itemsOf = (root: HTMLElement): HTMLElement[] => [
  ...root.querySelectorAll<HTMLElement>('[data-part="breadcrumb-item"]'),
];

const trail = (count: number, currentIndex?: number): JSX.Element => {
  const items = Array.from({ length: count }, (_, index) => ({
    label: `Item ${index + 1}`,
    href: "#",
  }));
  return (
    <Breadcrumb items={items} currentIndex={currentIndex}>
      <BreadcrumbList>
        {items.map((item, index) => (
          <BreadcrumbItem index={index}>
            <BreadcrumbLink index={index}>{item.label}</BreadcrumbLink>
          </BreadcrumbItem>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
};

describe("Breadcrumb skin", () => {
  it("marks the current page on the item and its link, and paints it", () => {
    const root = mount(() => trail(3, 3));
    const nav = part(root, "breadcrumb");
    const list = part(root, "breadcrumb-list");
    expect(nav.tagName).toBe("NAV");
    expect(nav.getAttribute("aria-label")).toBe("Breadcrumbs");
    expect(list.tagName).toBe("OL");
    expect(list.getAttribute("role")).toBe("list");
    const items = itemsOf(root);
    expect(items.length).toBe(3);
    expect(items.map((item) => item.getAttribute("aria-current"))).toEqual([null, null, "page"]);
    const current = items[2]!.querySelector<HTMLElement>('[data-part="breadcrumb-link"]')!;
    expect(current.getAttribute("aria-current")).toBe("page");
    // painted from the attribute: the current page is bolder and in the text colour
    expect(getComputedStyle(current).fontWeight).toBe("500");
    const ancestor = items[0]!.querySelector<HTMLElement>('[data-part="breadcrumb-link"]')!;
    expect(getComputedStyle(ancestor).fontWeight).not.toBe("500");
    expect(getComputedStyle(current).color).not.toBe(getComputedStyle(ancestor).color);
  });

  it("draws a slash before every step but the first, as decoration", () => {
    const root = mount(() => trail(3, 3));
    const separators = [
      ...root.querySelectorAll<HTMLElement>('[data-part="breadcrumb-separator"]'),
    ];
    expect(separators.length).toBe(2);
    for (const separator of separators) {
      expect(separator.getAttribute("aria-hidden")).toBe("true");
      expect(separator.textContent).toBe("/");
    }
  });

  it("a disabled trail greys the links and drops the press", () => {
    let presses = 0;
    const root = document.createElement("div");
    document.body.append(root);
    const items = [
      { label: "Home", href: "#" },
      { label: "Docs", href: "#" },
    ];
    render(
      () => (
        <Breadcrumb items={items} disabled onPress={() => (presses += 1)}>
          <BreadcrumbList>
            {items.map((item, index) => (
              <BreadcrumbItem index={index}>
                <BreadcrumbLink index={index}>{item.label}</BreadcrumbLink>
              </BreadcrumbItem>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      ),
      root,
    );
    const links = [...root.querySelectorAll<HTMLElement>('[data-part="breadcrumb-link"]')];
    for (const link of links) {
      expect(link.getAttribute("aria-disabled")).toBe("true");
      expect(getComputedStyle(link).cursor).toBe("not-allowed");
    }
    links[0]!.click();
    expect(presses).toBe(0);
  });
});
