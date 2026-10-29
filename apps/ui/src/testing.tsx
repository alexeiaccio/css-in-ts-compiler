// The combinations page: every contract of the kit that two components make, rendered once and asserted from
// test/combos.mjs in Chromium. The docs site shows each component alone; a combination is a fact about the pair, and a fact
// is checked.
import "virtual:cssints.css";

import { render } from "@solidjs/web";
import type { JSX } from "@solidjs/web";
import { createSignal } from "solid-js";

import { group } from "cssints" with { type: "cssints" };

import { Button } from "./registry/button/button.tsx";
import { Card, CardBody, CardHeader } from "./registry/card/card.tsx";
import { Field, FieldControl, FieldLabel, FieldMessage } from "./registry/field/field.tsx";
import { Input } from "./registry/input/input.tsx";

const Nesting = () => (
  <div data-case="nesting">
    <Card>
      <CardBody>
        <Card>nested</Card>
      </CardBody>
    </Card>
  </div>
);

const Mode = () => (
  <div data-case="mode">
    <Card>light</Card>
    <div data-mode="dark">
      <Card>dark</Card>
    </div>
  </div>
);

const Sizes = () => (
  <div data-case="sizes">
    <Button>Default</Button>
    {/* a container is a group(): within() reads the state of an ancestor that has the marker class */}
    <div data-size="sm" class={group()}>
      <Button>Compact</Button>
    </div>
    <Button tone="accent" size="sm">
      Accent
    </Button>
  </div>
);

const Renders = (): JSX.Element => {
  const [pressed, setPressed] = createSignal(true);
  return (
    <div data-case="renders">
      <Button isToggle defaultValue render={(props) => <a {...props} href="#link" />}>
        Link
      </Button>
      <Button
        isToggle
        value={pressed()}
        onValueChange={setPressed}
        render={(props, state) => (
          <button {...props} data-live={state.pressed() ? "pressed" : "idle"} />
        )}
      />
      <Card>
        <CardHeader render={(props) => <header {...props} />}>Title</CardHeader>
      </Card>
    </div>
  );
};

const Fields = () => (
  <div data-case="fields">
    <Field id="email" hint="We never share it" error="Enter an address">
      <FieldLabel>Email</FieldLabel>
      <FieldControl render={(props) => <Input {...props} type="email" />} />
      <FieldMessage />
    </Field>
    <Field id="plain">
      <FieldLabel>Plain</FieldLabel>
      <FieldControl />
    </Field>
    <Field id="pick" invalid>
      <FieldLabel>Pick</FieldLabel>
      <FieldControl render={(props) => <textarea {...props} data-part="textarea" />} />
    </Field>
  </div>
);

const Cases = (): JSX.Element => (
  <>
    <Nesting />
    <Mode />
    <Sizes />
    <Renders />
    <Fields />
  </>
);

// The build runs this module to collect its classes, and there it is the server build of Solid, which has no render.
if (!import.meta.env.SSR) {
  render(() => <Cases />, document.getElementById("root")!);
}
