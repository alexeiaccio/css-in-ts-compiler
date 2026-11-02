// The dialog's stories. The dialog is modal: the primitive traps the focus, `Escape` closes it and the page behind is inert.
// A story that shows it open owns the state, the way a page does.
import { createSignal } from "solid-js";
import type { Meta, Story } from "@cssints/stories";

import { Button } from "../button/button.tsx";
import { Input } from "../input/input.tsx";
import { Dialog, DialogClose, DialogContent, DialogTitle, DialogTrigger } from "./dialog.tsx";

const meta = { title: "Dialog" } satisfies Meta;
export default meta;

export const Rename: Story = {
  render: () => {
    const [open, setOpen] = createSignal(false);
    return (
      <Dialog
        label="Rename file"
        description="The new name shows up in the list and in every link to it."
        open={open()}
        onOpenChange={setOpen}
      >
        <DialogTrigger>Rename</DialogTrigger>
        <DialogContent>
          <DialogTitle>Rename</DialogTitle>
          <Input value="Report Q3" />
          <div class="demo-row">
            <DialogClose>Cancel</DialogClose>
            <Button tone="accent" onClick={() => setOpen(false)}>
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  },
};
