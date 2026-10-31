import { render } from "@solidjs/web";

import { Popover, PopoverContent, PopoverTrigger } from "./popover.tsx";

/**
 * Mounts the styled popover in ordinary use, inside an ancestor that would clip an inline layer (`overflow: hidden`) and
 * whose `transform` would become the containing block of an absolute one: the panel is portalled out of both.
 */
export const mountPopover = (): { readonly root: HTMLElement; readonly dispose: () => void } => {
  const root = document.createElement("div");
  root.style.overflow = "hidden";
  root.style.transform = "translateZ(0)";
  document.body.append(root);

  const dispose = render(
    () => (
      <Popover label="Rename file" placement="bottom-start">
        <PopoverTrigger>Rename</PopoverTrigger>
        <PopoverContent>
          <input data-part="popover-field" value="Report Q3" aria-label="Name" />
          <button data-part="popover-save" type="button">
            Save
          </button>
        </PopoverContent>
      </Popover>
    ),
    root,
  );

  return {
    root,
    dispose: () => {
      dispose();
      root.remove();
    },
  };
};
