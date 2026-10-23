import {
  type ActionStep,
  type Probe,
  type ScenarioConfig,
  ScenarioMismatch,
  type SpecBridge,
  differentialWalk,
  parseScenarioFile,
  replayScenario,
  specDriver,
} from "@cssints/apg-specs/scenario";
import {
  COMBOBOX_AUTOCOMPLETE_ITEMS,
  comboboxAutocompleteBridge,
  comboboxAutocompleteConfig,
  comboboxAutocompleteProbe,
  comboboxAutocompleteSteps,
} from "@cssints/apg-specs/apg/combobox-autocomplete.bridge";
import {
  COMBOBOX_SELECT_ONLY_ITEMS,
  comboboxSelectOnlyBridge,
  comboboxSelectOnlyConfig,
  comboboxSelectOnlyProbe,
  comboboxSelectOnlySteps,
} from "@cssints/apg-specs/apg/combobox-select-only.bridge";
import {
  type QuintReferenceModel,
  decodeDefinition,
  makeReferenceModel,
} from "@quint-machine/core";
import {
  comboboxDialogBridge,
  comboboxDialogProbe,
  comboboxDialogSteps,
} from "@cssints/apg-specs/apg/combobox-dialog.bridge";
import {
  comboboxGridBridge,
  comboboxGridProbe,
  comboboxGridSteps,
} from "@cssints/apg-specs/apg/combobox-grid.bridge";
import {
  comboboxTreeBridge,
  comboboxTreeProbe,
  comboboxTreeSteps,
} from "@cssints/apg-specs/apg/combobox-tree.bridge";
import { describe, expect, it } from "vite-plus/test";
import type { Mounted } from "./dom-driver";
import ariakit from "@cssints/apg-specs/scenarios/apg/combobox.ariakit.json";
import autocompleteDefinition from "@cssints/apg-specs/apg/combobox-autocomplete.model.json";
import baseUi from "@cssints/apg-specs/scenarios/apg/combobox.base-ui.json";
import dialogDefinition from "@cssints/apg-specs/apg/combobox-dialog.model.json";
import { domDriver } from "./dom-driver";
import gridDefinition from "@cssints/apg-specs/apg/combobox-grid.model.json";
import { mountCombobox } from "./combobox.fixture";
import reactAria from "@cssints/apg-specs/scenarios/apg/combobox.react-aria.json";
import selectOnlyDefinition from "@cssints/apg-specs/apg/combobox-select-only.model.json";
import treeDefinition from "@cssints/apg-specs/apg/combobox-tree.model.json";

interface Pattern {
  readonly name: string;
  readonly bridge: SpecBridge;
  readonly model: QuintReferenceModel;
  readonly steps: ReadonlyArray<ActionStep>;
  readonly probe: Probe;
  readonly hideableParts: ReadonlyArray<string>;
  readonly mount?: (config: ScenarioConfig) => Mounted;
}

const selectOnly: Pattern = {
  name: "select-only",
  bridge: comboboxSelectOnlyBridge,
  model: makeReferenceModel(decodeDefinition(selectOnlyDefinition)),
  steps: comboboxSelectOnlySteps,
  probe: comboboxSelectOnlyProbe,
  hideableParts: ["popup", "option"],
  mount: (config) => mountCombobox(comboboxSelectOnlyConfig(config)),
};

const autocomplete: Pattern = {
  name: "autocomplete",
  bridge: comboboxAutocompleteBridge,
  model: makeReferenceModel(decodeDefinition(autocompleteDefinition)),
  steps: comboboxAutocompleteSteps,
  probe: comboboxAutocompleteProbe,
  hideableParts: ["popup"],
  mount: (config) => mountCombobox(comboboxAutocompleteConfig(config)),
};

const grid: Pattern = {
  name: "grid",
  bridge: comboboxGridBridge,
  model: makeReferenceModel(decodeDefinition(gridDefinition)),
  steps: comboboxGridSteps,
  probe: comboboxGridProbe,
  hideableParts: ["popup"],
};

const tree: Pattern = {
  name: "tree",
  bridge: comboboxTreeBridge,
  model: makeReferenceModel(decodeDefinition(treeDefinition)),
  steps: comboboxTreeSteps,
  probe: comboboxTreeProbe,
  hideableParts: ["popup"],
};

const dialog: Pattern = {
  name: "dialog",
  bridge: comboboxDialogBridge,
  model: makeReferenceModel(decodeDefinition(dialogDefinition)),
  steps: comboboxDialogSteps,
  probe: comboboxDialogProbe,
  hideableParts: ["popup", "dialog"],
};

// Every scenario runs against the bridge for its variant. Config a bridge does
// not model throws `Unsupported`, which skips the scenario on this target.
const route = (config: ScenarioConfig): Pattern => {
  if (config["variant"] === "select-only") {
    return selectOnly;
  }
  if (config["grid"] === true) {
    return grid;
  }
  return autocomplete;
};

const domFor = (pattern: Pattern, config: ScenarioConfig) => {
  if (pattern.mount === undefined) {
    throw new Error(`pattern ${pattern.name} has no DOM fixture`);
  }
  return domDriver(pattern.mount(config), {
    hideableParts: pattern.hideableParts,
    eventName: (name) =>
      name === "onChange" || name === "onSelectionChange" ? "onValueChange" : name,
  });
};

// Scenarios whose expectations the primitive deliberately does not meet. Each
// entry must still fail (so fixing the gap forces removing it) and says why.
const SELECTION_INDEX =
  "react-aria's initial active option after Enter differs from the APG select-only spec (which opens on the selected option's index)";
const TRIGGER_HASPOPUP =
  "react-aria reports aria-haspopup as a boolean-ish 'true' on the trigger; the primitive exposes the APG 'listbox' value";
const OPTION_PARTS =
  "the source library exposes options (or only the active option) as visible parts; the fixture follows the README convention where the popup is the hideable content part";
const DIALOG_POPUP =
  "the source library renders the popup as a dialog (role=dialog / presentation); the primitive models the APG listbox popup";
const REF_ID =
  "the DOM driver rewrites an id reference to `<part>:<index>`; the source library asserts the bare id";
const HIGHLIGHT_NOT_SELECTED =
  "the source library highlights the active item with a data attribute and leaves aria-selected=false; the primitive marks the active option aria-selected";
const OPEN_REASON =
  "the source library reports an open/close reason through the callback; the primitive reports a boolean";
const NEXT_STOP = "the scenario tabs to a `next-button` part the primitive does not render";
const NAV_INDEX =
  "the source library's open/navigation indexes differ from the APG select-only spec";
const INPUT_CLICK_KEEPS_OPEN =
  "the source library keeps the popup open on a second input click; the primitive toggles";
const TRIGGER_FOCUSES_INPUT =
  "the source library focuses the input when the trigger is clicked; the primitive keeps DOM focus where it was";
const SELECTION_KEY =
  "react-aria reports the selected item's key through onSelectionChange; the primitive reports the option value (the label)";
const DIVERGENCES: Readonly<Record<string, string>> = {
  "combobox.ariakit.show-on-click": OPTION_PARTS,
  "combobox.ariakit.select-only.popup-role-dialog": DIALOG_POPUP,
  "combobox.base-ui.keyboard-arrow-down-first-up-last": OPTION_PARTS,
  "combobox.base-ui.keyboard-open-navigate-enter": OPTION_PARTS,
  "combobox.base-ui.keyboard-tab-closes-popup": NEXT_STOP,
  "combobox.base-ui.aria-input-open": REF_ID,
  "combobox.base-ui.aria-item-highlighted-attributes": HIGHLIGHT_NOT_SELECTED,
  "combobox.base-ui.aria-popup-role-presentation": DIALOG_POPUP,
  "combobox.base-ui.pointer-open-change-reason-item-press": OPEN_REASON,
  "combobox.base-ui.keyboard-enter-open-change-reason": OPEN_REASON,
  "combobox.base-ui.aria-show-all-items-empty-query": OPTION_PARTS,
  "combobox.base-ui.aria-query-matches-selection-shows-all": OPTION_PARTS,
  "combobox.base-ui.keyboard-item-enter-selects-highlighted": NAV_INDEX,
  "combobox.base-ui.pointer-open-on-input-click-default": INPUT_CLICK_KEEPS_OPEN,
  "combobox.react-aria.click-input-keeps-popup-open": TRIGGER_FOCUSES_INPUT,
  "combobox.react-aria.click-trigger-toggles-popup": TRIGGER_FOCUSES_INPUT,
  "combobox.react-aria.select-only.keyboard-select": SELECTION_INDEX,
  "combobox.react-aria.input-role-and-autocomplete": TRIGGER_HASPOPUP,
  "combobox.react-aria.tab-commits-without-extra-change": SELECTION_KEY,
};

describe("createCombobox x ported scenarios (real DOM)", () => {
  for (const source of [ariakit, baseUi, reactAria]) {
    const file = parseScenarioFile(source);
    describe(file.source, () => {
      for (const scenario of file.scenarios) {
        it(scenario.id, async (context) => {
          const pattern = route(scenario.config ?? {});
          const run = replayScenario(scenario, pattern.bridge, (config) => domFor(pattern, config));
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

describe("createCombobox x spec (differential walk)", () => {
  for (const raw of [
    { variant: "select-only", items: COMBOBOX_SELECT_ONLY_ITEMS },
    {
      variant: "select-only",
      items: COMBOBOX_SELECT_ONLY_ITEMS,
      defaultSelectedValue: "Cherry",
    },
    // controlled: a host that accepts every request, and one that pins the
    // value (rejects), so no user event commits
    {
      variant: "select-only",
      items: COMBOBOX_SELECT_ONLY_ITEMS,
      controlled: true,
    },
    {
      variant: "select-only",
      items: COMBOBOX_SELECT_ONLY_ITEMS,
      controlled: true,
      defaultSelectedValue: "Cherry",
    },
    {
      variant: "select-only",
      items: COMBOBOX_SELECT_ONLY_ITEMS,
      controlled: true,
      value: "Cherry",
    },
  ]) {
    it(`select-only matches the generated model for ${JSON.stringify(raw.defaultSelectedValue ?? raw.value ?? null)}`, async () => {
      await differentialWalk({
        alphabet: comboboxSelectOnlySteps,
        probe: comboboxSelectOnlyProbe,
        makePair: () =>
          Promise.resolve([
            specDriver(selectOnly.model, comboboxSelectOnlyBridge, raw),
            domFor(selectOnly, raw),
          ]),
        runs: 15,
        steps: 25,
        seed: 7,
      });
    });
  }

  // The grid / tree / dialog popups (and the editable autocomplete) have specs
  // but no listbox DOM in this primitive; their bridges are smoke-tested by
  // walking the model against itself with the bridge alphabet, uncontrolled and
  // controlled (accepting host, then a pinned value that rejects every request).
  const controlledConfigs: Record<string, ReadonlyArray<ScenarioConfig>> = {
    autocomplete: [{}, { controlled: true }, { controlled: true, value: "Alabama" }],
    grid: [{}, { controlled: true }, { controlled: true, value: 1 }],
    tree: [{}, { controlled: true }, { controlled: true, value: 1 }],
    dialog: [{}, { controlled: true }, { controlled: true, value: 59 }],
  };
  for (const pattern of [autocomplete, grid, tree, dialog]) {
    for (const config of controlledConfigs[pattern.name] ?? [{}]) {
      it(`${pattern.name} bridge drives the model through its own alphabet ${JSON.stringify(config)}`, async () => {
        await differentialWalk({
          alphabet: pattern.steps,
          probe: pattern.probe,
          makePair: () =>
            Promise.resolve([
              specDriver(pattern.model, pattern.bridge, config),
              specDriver(pattern.model, pattern.bridge, config),
            ]),
          runs: 5,
          steps: 15,
          seed: 11,
        });
      });
    }
  }
});

describe("createCombobox (keyboard extras)", () => {
  it("Alt+ArrowDown opens without moving; Alt+ArrowUp commits", async () => {
    const driver = domDriver(
      mountCombobox({
        items: [...COMBOBOX_SELECT_ONLY_ITEMS],
        selected: 3,
        open: false,
        autoFocus: false,
        controlled: false,
        accepts: false,
        pinned: null,
      }),
      { hideableParts: ["popup", "option"] },
    );
    await driver.perform({ event: "focus", target: "input" });
    await driver.perform({
      event: "key",
      key: "{Alt>}{ArrowDown}{/Alt}",
      target: "input",
    });
    expect(driver.observer.attr("input", "aria-expanded")).toBe("true");
    expect(driver.observer.attr("input", "aria-activedescendant")).toBe("option:3");
    // Alt+ArrowUp commits the active option and closes
    await driver.perform({
      event: "key",
      key: "{Alt>}{ArrowUp}{/Alt}",
      target: "input",
    });
    expect(driver.observer.attr("input", "aria-expanded")).toBe("false");
    expect(driver.observer.value?.()).toBe("Cherry");
    driver.dispose?.();
  });
});

describe("createCombobox (filtering)", () => {
  it("prefix filter narrows the list and Enter commits the match", async () => {
    const driver = domDriver(
      mountCombobox({
        items: [...COMBOBOX_AUTOCOMPLETE_ITEMS.slice(0, 3), "Delaware"],
        selected: null,
        open: false,
        autoFocus: false,
        autoComplete: "list",
        filter: true,
        controlled: false,
        accepts: false,
        pinned: null,
      }),
      { hideableParts: ["popup", "option"] },
    );
    await driver.perform({ event: "focus", target: "input" });
    await driver.perform({ event: "click", target: "input" });
    await driver.perform({ event: "key", key: "d", target: "input" });
    const visible = () => driver.observer.visible().map((part) => part.replace(/:0$/, ""));
    expect(visible()).toEqual(["popup", "option"]);
    expect(driver.observer.attr("input", "aria-activedescendant")).toBe("option:0");
    await driver.perform({ event: "key", key: "Enter", target: "input" });
    expect(driver.observer.value?.()).toBe("Delaware");
    expect(visible()).toEqual([]);
    driver.dispose?.();
  });
});
