import {
  type ScenarioConfig,
  ScenarioMismatch,
  differentialWalk,
  parseScenarioFile,
  replayScenario,
  specDriver,
} from "@cssints/apg-specs/scenario";
import { decodeDefinition, makeReferenceModel } from "@quint-machine/core";
import { describe, expect, it } from "vite-plus/test";
import {
  dialogModalBridge,
  dialogModalConfig,
  dialogModalProbe,
  dialogModalSteps,
} from "@cssints/apg-specs/apg/dialog-modal.bridge";
import ariakit from "@cssints/apg-specs/scenarios/apg/dialog-modal.ariakit.json";
import baseUi from "@cssints/apg-specs/scenarios/apg/dialog-modal.base-ui.json";
import definitionJson from "@cssints/apg-specs/apg/dialog-modal.model.json";
import { domDriver } from "./dom-driver";
import { mountDialogModal } from "./dialog-modal.fixture";
import { partsDriver } from "./parts-driver";
import reactAria from "@cssints/apg-specs/scenarios/apg/dialog-modal.react-aria.json";

const model = makeReferenceModel(decodeDefinition(definitionJson));

const dom = (config: ScenarioConfig) =>
  domDriver(mountDialogModal(dialogModalConfig(config)), {
    hideableParts: ["dialog"],
  });

// The walk drives only clicks / keys and compares visible + attributes + events,
// so it dispatches raw events: a hidden dismiss is still a valid click target.
const walkDom = (config: ScenarioConfig) =>
  partsDriver(mountDialogModal(dialogModalConfig(config)), {
    hideableParts: ["dialog"],
  });

// Scenarios whose expectations the primitive deliberately does not meet. Each
// entry must still fail (so closing the gap forces removing it) and says why.
const RICH_REASON =
  "the scenario asserts a { open, reason } (or internalOnOpenChange) payload; the primitive fires the neutral boolean onOpenChange";
const SINGLE_DIALOG =
  "the spec models a fixed four-dialog example with an example-specific initial focus (the dialog container itself or a particular field); the primitive focuses the dialog first focusable";
const BACKDROP_VISIBLE =
  "the scenario lists the modal backdrop in `visible`; the fixture renders the backdrop (for clicks) but does not treat it as a hideable part";
const STANDALONE =
  "react-aria renders a standalone Dialog that is always visible and focused; the primitive mounts closed and names itself from a header element";
const ROLE_ALERT =
  "react-aria defaults this overlay to role=alertdialog; the primitive defaults to role=dialog and only takes alertdialog from config";
const CONTROLLED_FOCUS =
  "the scenario drives Escape / an outside click at the non-focusable dialog container, which the shared DOM driver focuses first; the primitive keeps its own control focused, so the asserted focus target differs (the dialog correctly stays open)";
const DIVERGENCES: Readonly<Record<string, string>> = {
  "dialog-modal.ariakit.nested-cart-show-and-focus-dismiss": SINGLE_DIALOG,
  "dialog-modal.ariakit.controlled-escape-keeps-dialog-open": CONTROLLED_FOCUS,
  "dialog-modal.ariakit.controlled-outside-click-keeps-dialog-open": CONTROLLED_FOCUS,
  "dialog-modal.base-ui.final-focus-per-close-type": SINGLE_DIALOG,
  "dialog-modal.base-ui.onopenchange-reason-trigger-and-close": RICH_REASON,
  "dialog-modal.base-ui.escape-close-reason": RICH_REASON,
  "dialog-modal.base-ui.backdrop-click-reason": RICH_REASON,
  "dialog-modal.base-ui.escape-single-internal-openchange": RICH_REASON,
  "dialog-modal.base-ui.close-after-closed-does-not-request-again": RICH_REASON,
  "dialog-modal.base-ui.modal-inerts-page": BACKDROP_VISIBLE,
  "dialog-modal.base-ui.internal-backdrop-when-modal": BACKDROP_VISIBLE,
  "dialog-modal.react-aria.base-role-dialog": STANDALONE,
  "dialog-modal.react-aria.dialog-does-not-autofocus-inner-content": STANDALONE,
  "dialog-modal.react-aria.dialog-autofocuses-itself-without-focusable-child": SINGLE_DIALOG,
  "dialog-modal.react-aria.use-dialog-focuses-overlay-on-mount": SINGLE_DIALOG,
  "dialog-modal.react-aria.modal-role-and-labelledby": ROLE_ALERT,
  "dialog-modal.react-aria.restore-focus-to-trigger-on-close": SINGLE_DIALOG,
  "dialog-modal.react-aria.escape-disabled-keeps-dialog-open": SINGLE_DIALOG,
};

const SOURCES = [ariakit, baseUi, reactAria];

describe("createDialogModal x ported scenarios (real DOM)", () => {
  for (const source of SOURCES) {
    const file = parseScenarioFile(source);
    describe(file.source, () => {
      for (const scenario of file.scenarios) {
        it(scenario.id, async (context) => {
          const run = replayScenario(scenario, dialogModalBridge, dom);
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

describe("createDialogModal x spec (differential walk)", () => {
  for (const config of [
    {},
    { open: true },
    { controlled: true },
    { controlled: true, accepts: false },
    { controlled: true, open: true, accepts: false },
  ]) {
    it(`matches the generated model for ${JSON.stringify(config)}`, async () => {
      await differentialWalk({
        alphabet: dialogModalSteps,
        probe: dialogModalProbe,
        makePair: () =>
          Promise.resolve([specDriver(model, dialogModalBridge, config), walkDom(config)]),
        runs: 15,
        steps: 25,
        seed: 19,
      });
    });
  }
});
