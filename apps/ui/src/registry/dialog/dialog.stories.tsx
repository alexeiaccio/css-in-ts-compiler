// The dialog's stories. The dialog is modal: the primitive traps the focus, `Escape` closes it and the page behind is inert.
// A story that shows it open owns the state, the way a page does.
import { createSignal } from "solid-js";
import type { Meta, Story } from "@cssints/stories";
import * as css from "cssints" with { type: "cssints" };

import { Button } from "../button/button.tsx";
import { t } from "../theme.ts" with { type: "cssints" };
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

const nativePanel = css.cn(
  css.border("1px solid", t.color.border),
  css.borderRadius(t.radius.md),
  css.padding(t.space._4),
  css.bg(t.color.surface),
  css.color(t.color.text),
  css.width("min(28rem, 90vw)"),
  css.boxShadow("0 20px 60px rgb(0 0 0 / 0.25)"),
);
const nativeBackdrop = css.backdrop(css.bg("rgb(0 0 0 / 0.4)"));
const nativeTitle = css.cn(css.margin(0), css.fontSize(t.font.sizeLg));
const nativeBody = css.cn(css.marginBlock(t.space._2), css.color(t.color.muted));

const NativeDialog = () => {
  let dialog!: HTMLDialogElement;
  return (
    <>
      <Button tone="accent" onClick={() => dialog.showModal()}>
        Open a native dialog
      </Button>
      <dialog ref={dialog} class={css.cn(nativePanel, nativeBackdrop)} closedby="any">
        <h2 class={nativeTitle}>A native dialog</h2>
        <p class={nativeBody}>
          The platform owns the top layer, the backdrop, focus in and out, Escape and the scroll
          lock. <code>closedby="any"</code> adds click-outside in Chrome and Firefox.
        </p>
        <form method="dialog">
          <Button>Close</Button>
        </form>
      </dialog>
    </>
  );
};

// The recipe (docs/hosts.md): `<dialog>` + `showModal()`. The trigger can also be declarative
// (`commandfor="confirm" command="show-modal"`, Invoker commands); `closedby` is the enhancement Safari lacks.
export const Native: Story = { render: () => <NativeDialog /> };
