import { Button } from "../button/button.tsx";
import { Toolbar } from "./toolbar.tsx";
import { render } from "@solidjs/web";

/** What a mounted toolbar hands the test: where it lives, and a teardown. */
export interface MountedToolbar {
  readonly root: HTMLElement;
  readonly dispose: () => void;
}

/**
 * Mounts the styled toolbar with two of the kit's buttons inside it and one outside it. The
 * outside button is the control for the size the toolbar hands down: `Toolbar` is a container
 * only, so there is no controller to walk and nothing else to drive.
 */
export const mountToolbar = (
  options: { size?: "sm" | "md"; orientation?: "horizontal" | "vertical"; label?: string } = {},
): MountedToolbar => {
  const root = document.createElement("div");
  document.body.append(root);
  const dispose = render(
    () => (
      <>
        <Toolbar
          label={options.label ?? "Formatting"}
          size={options.size}
          orientation={options.orientation}
        >
          <Button>Bold</Button>
          <Button>Italic</Button>
        </Toolbar>
        <Button>Outside</Button>
      </>
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
