import { check, createGlobalTheme, createTokens, media } from "cssints" with { type: "cssints" };
import { look } from "@cssints/mise-en-mode" with { type: "cssints" };

// The colours of the page and its cards, and one space step. Dark follows the system setting; `.compact` is a theme
// for a selector. `link` is an alias of `accent`, so a theme that changes the accent changes the link with it.
export const t = createTokens({
  color: {
    $type: "color",
    page: { $value: "#f3f4f6" },
    surface: { $value: "#ffffff" },
    text: { $value: "#111827" },
    muted: { $value: "#6b7280" },
    accent: { $value: "#1d4ed8" },
    link: { $value: "{color.accent}" },
  },
  space: { $type: "dimension", md: { $value: "16px" } },
});

createGlobalTheme(t, media("(prefers-color-scheme: dark)"), {
  color: {
    page: "#0b0b0f",
    surface: "#171923",
    text: "#f3f4f6",
    muted: "#9ca3af",
    accent: "#93c5fd",
  },
});
createGlobalTheme(t, ".compact", { space: { md: "8px" } });

// A look a viewer can switch on (`data-mode="contrast"`, or `contrast/color` for the colours alone), in the viewer layer.
look(t, "contrast", "viewer", {
  color: { page: "#000000", surface: "#000000", text: "#ffffff", accent: "#93c5fd" },
});

// Fails the build when the text is hard to read on the page, in the light or the dark theme.
check.contrast(t.color.text(), t.color.page(), { min: 7 });
check.contrast(t.color.link(), t.color.surface(), { min: 4.5 });
