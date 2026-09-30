import { makeIcons } from "./seam-kit" with { type: "cssints" };

// A definition site: a plugin value (a function a configuration built) held by a build-time module.
export const mdi = makeIcons({ home: "2px", star: "4px" });
