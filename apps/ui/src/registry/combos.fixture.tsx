// The views of the combinations test. They live here, not in the test, because a module with cssints sites is evaluated at
// build time by the plugin (its JSX is inert), and a test file that imported `cssints` would be evaluated too — with no
// `describe`, no browser.
import { group } from "cssints" with { type: "cssints" };
import type { JSX } from "@solidjs/web";
import { createSignal } from "solid-js";

import { Button } from "./button/button.tsx";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "./dialog/dialog.tsx";
import { Alert, AlertBody, AlertTitle } from "./alert/alert.tsx";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from "./breadcrumb/breadcrumb.tsx";
import { Meter } from "./meter/meter.tsx";
import { ButtonGroup } from "./button-group/button-group.tsx";
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

export const Groups = (): JSX.Element => (
  <>
    <ButtonGroup label="Text alignment">
      <Button>Left</Button>
      <Button isToggle defaultValue>
        Center
      </Button>
      <Button>Right</Button>
    </ButtonGroup>
    {/* the group is a context too: a compact one sizes what it holds, as a toolbar does */}
    <ButtonGroup label="Stacked" orientation="vertical" size="sm">
      <Button>Up</Button>
      <Button>Down</Button>
    </ButtonGroup>
  </>
);

export const Dialogs = (): JSX.Element => {
  const [open, setOpen] = createSignal(false);
  return (
    <Dialog
      label="Rename file"
      description="The new name shows up in the list."
      open={open()}
      onOpenChange={setOpen}
    >
      <DialogTrigger>Rename</DialogTrigger>
      <DialogContent>
        <DialogTitle>Rename</DialogTitle>
        <Input value="Report" />
        <DialogClose>Cancel</DialogClose>
      </DialogContent>
    </Dialog>
  );
};

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

export const Alerts = (): JSX.Element => (
  <>
    <Alert message="Your draft is saved.">
      <AlertTitle>Draft saved</AlertTitle>
      <AlertBody>Every change is kept until you publish.</AlertBody>
    </Alert>
    <Alert tone="invalid" message="The address is not valid.">
      <AlertTitle>Could not save</AlertTitle>
      <AlertBody>Enter an address in the form of name@example.com.</AlertBody>
    </Alert>
  </>
);

export const Meters = (): JSX.Element => {
  const [value, setValue] = createSignal(25);
  return (
    <>
      <Meter label="Storage" value={value()} />
      <button data-part="advance" onClick={() => setValue(75)}>
        More
      </button>
    </>
  );
};

const CRUMB_ITEMS = [
  { label: "Home", href: "#home" },
  { label: "Projects", href: "#projects" },
  { label: "Q3 report", href: "#report" },
];

export const Crumbs = (): JSX.Element => (
  <div data-tint="indigo">
    <Breadcrumb items={CRUMB_ITEMS} currentIndex={3}>
      <BreadcrumbList>
        {CRUMB_ITEMS.map((item, index) => (
          <BreadcrumbItem index={index}>
            <BreadcrumbLink index={index}>{item.label}</BreadcrumbLink>
          </BreadcrumbItem>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  </div>
);
