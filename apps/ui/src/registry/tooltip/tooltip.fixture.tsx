import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip.tsx";
import { render } from "@solidjs/web";

/** What a mounted demo hands the test: where it lives and a teardown. */
export interface MountedTooltip {
  readonly root: HTMLElement;
  readonly dispose: () => void;
}

/**
 * Mounts the styled tooltip, a trigger and the text bubble it describes. The group owns the visible state and
 * the `aria-describedby`; the kit adds the immediate open on hover and focus and the hide delay that keeps the
 * bubble hoverable (the primitive's own pointer handler hides at once).
 */
export const mountTooltip = (config: { readonly disabled?: boolean } = {}): MountedTooltip => {
  const root = document.createElement("div");
  document.body.append(root);
  const dispose = render(
    () => (
      <Tooltip disabled={config.disabled}>
        <TooltipTrigger>Delete</TooltipTrigger>
        <TooltipContent>Deletes the file</TooltipContent>
      </Tooltip>
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
