// One live example per starter. Each is the component in its ordinary use, driven by a signal the
// way a page would drive it: what a reader copies is what they see here.
import { Accordion } from "../registry/accordion/accordion.tsx";
import { Card, CardBody, CardFooter, CardHeader } from "../registry/card/card.tsx";
import { Button } from "../registry/button/button.tsx";
import { Field, FieldControl, FieldLabel, FieldMessage } from "../registry/field/field.tsx";
import { Input } from "../registry/input/input.tsx";
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
    <div class="demo-column">
      <div class="demo-row">
        <Button onClick={() => undefined}>Save</Button>
        <Button tone="accent">Publish</Button>
        <Button tone="quiet">Cancel</Button>
        <Button disabled>Disabled</Button>
      </div>
      <div class="demo-row">
        <Button size="sm">Small</Button>
        <Button isToggle value={pressed()} onValueChange={setPressed}>
          {pressed() ? "Pinned" : "Pin"}
        </Button>
        {/* render replaces the element: a link that acts as a button keeps the button's props */}
        <Button tone="quiet" render={(props) => <a {...props} href="#a-link" />}>
          A link
        </Button>
      </div>
    </div>
  );
};

const CardDemo = (): JSX.Element => (
  <div class="demo-column">
    <Card>
      <CardHeader>
        <strong>Monthly report</strong>
        <Button size="sm" tone="quiet">
          Open
        </Button>
      </CardHeader>
      <CardBody>
        A card is a surface one step off the page and a frame that hands its inner radius down: put
        a card in a card and the inner corners stay concentric.
      </CardBody>
      <CardFooter>
        <Button size="sm" tone="quiet">
          Share
        </Button>
        <Button size="sm" tone="accent">
          Download
        </Button>
      </CardFooter>
    </Card>
    <div data-mode="dark">
      <Card>
        <CardBody>
          The same card in <code>data-mode="dark"</code>: the mode is the context, not a prop.
        </CardBody>
      </Card>
    </div>
  </div>
);

const InputDemo = (): JSX.Element => (
  <div class="demo-column">
    <Input placeholder="A plain input" />
    <Input disabled value="Disabled" />
  </div>
);

const FieldDemo = (): JSX.Element => (
  <div class="demo-column">
    <Field id="demo-email" hint="We never share it">
      <FieldLabel>Email</FieldLabel>
      <FieldControl
        render={(props) => <Input {...props} type="email" placeholder="you@example.com" />}
      />
    </Field>
    <Field id="demo-name" error="A name is required" required>
      <FieldLabel>Name</FieldLabel>
      <FieldControl />
      <FieldMessage />
    </Field>
  </div>
);

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
  card: CardDemo,
  field: FieldDemo,
  input: InputDemo,
  disclosure: DisclosureDemo,
  button: ButtonDemo,
  checkbox: CheckboxDemo,
  radio: RadioDemo,
  tabs: TabsDemo,
  accordion: AccordionDemo,
};
