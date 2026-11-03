// The toast's stories: a queue and the stack that shows it. `createToast` is the primitive, `Toaster` the skin; the page
// pushes messages, and the stack announces the newest politely without stealing the focus.
import type { JSX } from "@solidjs/web";
import { createToast } from "@cssints/headless";
import type { Meta, Story } from "@cssints/stories";

import { Button } from "../button/button.tsx";
import { Toaster } from "./toast.tsx";

const meta = { title: "Toast" } satisfies Meta;
export default meta;

export const Stack: Story = {
  render: () => {
    const toast = createToast();
    return (
      <div class="demo-column">
        <div class="demo-row">
          <Button onClick={() => toast.show({ title: "Draft saved" })}>Saved</Button>
          <Button tone="accent" onClick={() => toast.show({ title: "Published", description: "The post is live." })}>
            Published
          </Button>
          <Button tone="quiet" onClick={() => toast.show({ title: "Could not save", tone: "error" })}>
            Failed
          </Button>
        </div>
        <p class="demo-text">Each press queues one toast; the stack keeps at most three and each leaves on its own.</p>
        <Toaster toast={toast} />
      </div>
    );
  },
};
