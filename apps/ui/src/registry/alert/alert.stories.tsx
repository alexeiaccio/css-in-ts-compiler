// The alert's stories: a message is a surface one step off the page with a rule of its tone on the left, and the region is
// live only while the primitive says it is. `message` is what a screen reader hears; the children are the reading look.
import { Show, createSignal } from "solid-js";
import type { Meta, Story } from "@cssints/stories";

import { Button } from "../button/button.tsx";
import { Alert, AlertBody, AlertTitle } from "./alert.tsx";

const meta = { title: "Alert" } satisfies Meta;
export default meta;

export const Default: Story = {
  render: () => (
    <Alert message="Your draft is saved.">
      <AlertTitle>Draft saved</AlertTitle>
      <AlertBody>Every change is kept until you publish.</AlertBody>
    </Alert>
  ),
};

export const Invalid: Story = {
  render: () => (
    <Alert tone="invalid" message="The address is not valid.">
      <AlertTitle>Could not save</AlertTitle>
      <AlertBody>Enter an address in the form of name@example.com.</AlertBody>
    </Alert>
  ),
};

// A dismissible alert: the button is the host's, and the primitive only announces the button.
export const Dismissible: Story = {
  render: () => {
    const [shown, setShown] = createSignal(true);
    return (
      <div class="demo-column">
        <Show when={shown()}>
          <Alert message="The file was deleted." onDismiss={() => setShown(false)}>
            <AlertTitle>File deleted</AlertTitle>
            <AlertBody>The undo window is five seconds.</AlertBody>
          </Alert>
        </Show>
        <Show when={!shown()}>
          <Button tone="quiet" size="sm" onClick={() => setShown(true)}>
            show it again
          </Button>
        </Show>
      </div>
    );
  },
};
