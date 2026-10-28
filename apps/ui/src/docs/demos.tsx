// One live example per starter. Each is the component in its ordinary use, driven by a signal the
// way a page would drive it: what a reader copies is what they see here.
import { Accordion } from "../registry/accordion/accordion.tsx";
import { Button } from "../registry/button/button.tsx";
import { Checkbox } from "../registry/checkbox/checkbox.tsx";
import { Disclosure } from "../registry/disclosure/disclosure.tsx";
import { RadioGroup } from "../registry/radio/radio.tsx";
import { Switch } from "../registry/switch/switch.tsx";
import { Tabs } from "../registry/tabs/tabs.tsx";
import { createSignal } from "solid-js";
import type { JSX } from "@solidjs/web";

const SwitchDemo = (): JSX.Element => {
  const [checked, setChecked] = createSignal(true);
  return (
    <Switch value={checked()} onValueChange={setChecked}>
      {checked() ? "On" : "Off"}
    </Switch>
  );
};

const DisclosureDemo = (): JSX.Element => (
  <Disclosure summary="Shipping, returns and refunds">
    A disclosure is one button and the panel it shows. The chevron turns with `aria-expanded`.
  </Disclosure>
);

const ButtonDemo = (): JSX.Element => {
  const [pressed, setPressed] = createSignal(true);
  return (
    <div class="demo-row">
      <Button onClick={() => undefined}>Save</Button>
      <Button isToggle value={pressed()} onValueChange={setPressed}>
        {pressed() ? "Pinned" : "Pin"}
      </Button>
      <Button disabled>Disabled</Button>
    </div>
  );
};

const CheckboxDemo = (): JSX.Element => {
  const [checked, setChecked] = createSignal<"true" | "false" | "mixed">("mixed");
  return (
    <div class="demo-column">
      <Checkbox allowMixed value={checked()} onValueChange={setChecked}>
        {checked() === "mixed" ? "Some items" : "All items"}
      </Checkbox>
      <Checkbox>Send me the changelog</Checkbox>
    </div>
  );
};

const RadioDemo = (): JSX.Element => {
  const [value, setValue] = createSignal("standard");
  return (
    <RadioGroup
      values={["standard", "express", "pickup"]}
      value={value()}
      onValueChange={setValue}
      orientation="vertical"
    >
      {(option) => option}
    </RadioGroup>
  );
};

const TabsDemo = (): JSX.Element => {
  const [value, setValue] = createSignal(0);
  return (
    <Tabs
      items={3}
      value={value()}
      onValueChange={setValue}
      tab={(index) => ["Overview", "Activity", "Settings"][index] ?? ""}
      panel={(index) => <p class="demo-text">The panel of tab {index + 1}.</p>}
    />
  );
};

const AccordionDemo = (): JSX.Element => (
  <Accordion
    items={3}
    defaultValue={[0]}
    trigger={(index) => ["What is copied?", "What is a dependency?", "Why a test?"][index] ?? ""}
    panel={(index) =>
      [
        "The component, its sheet, its fixture and its conformance test. Behaviour stays in npm.",
        "@cssints/headless: the APG state machine, so a fix arrives with npm update.",
        "The same scenarios the release passed, run against your markup.",
      ][index] ?? ""
    }
  />
);

/** The demo for an item; a new starter adds one line here. */
export const demos: Readonly<Record<string, () => JSX.Element>> = {
  switch: SwitchDemo,
  disclosure: DisclosureDemo,
  button: ButtonDemo,
  checkbox: CheckboxDemo,
  radio: RadioDemo,
  tabs: TabsDemo,
  accordion: AccordionDemo,
};
