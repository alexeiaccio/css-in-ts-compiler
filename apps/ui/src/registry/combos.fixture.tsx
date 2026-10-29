// The views of the combinations test. They live here, not in the test, because a module with cssints sites is evaluated at
// build time by the plugin (its JSX is inert), and a test file that imported `cssints` would be evaluated too — with no
// `describe`, no browser.
import { group } from "cssints" with { type: "cssints" };
import type { JSX } from "@solidjs/web";
import { createSignal } from "solid-js";

import { Button } from "./button/button.tsx";
import { Card, CardBody, CardHeader } from "./card/card.tsx";
import { Field, FieldControl, FieldLabel, FieldMessage } from "./field/field.tsx";
import { Input } from "./input/input.tsx";
import { Toolbar } from "./toolbar/toolbar.tsx";

export const Nesting = (): JSX.Element => (
  <Card>
    <CardBody>
      <Card>nested</Card>
    </CardBody>
  </Card>
);

export const Mode = (): JSX.Element => (
  <>
    <Card>light</Card>
    <div data-mode="dark">
      <Card>dark</Card>
    </div>
  </>
);

export const Sizes = (): JSX.Element => (
  <>
    <Button>Default</Button>
    {/* a container is group(): within() reads the state of an ancestor that has the marker class */}
    <div data-size="sm" class={group()}>
      <Button>Compact</Button>
    </div>
    <Button tone="accent" size="sm">
      Accent
    </Button>
  </>
);

export const Renders = (): JSX.Element => {
  const [pressed, setPressed] = createSignal(true);
  return (
    <>
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
    </>
  );
};

export const Toolbars = (): JSX.Element => (
  <>
    <Toolbar label="Loose">
      <Button>One</Button>
    </Toolbar>
    <Toolbar label="Compact" size="sm">
      <Button>Two</Button>
    </Toolbar>
  </>
);

export const Fields = (): JSX.Element => (
  <>
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
  </>
);
