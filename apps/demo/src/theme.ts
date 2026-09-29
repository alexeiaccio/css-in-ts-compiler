import { check, createGlobalTheme, createTokens, media } from "cssints" with { type: "cssints" };

// The colours of the page and its cards. Dark follows the system setting.
export const t = createTokens({
  color: {
    $type: "color",
    page: { $value: "#f3f4f6" },
    surface: { $value: "#ffffff" },
    text: { $value: "#111827" },
    muted: { $value: "#6b7280" },
  },
});

createGlobalTheme(t, media("(prefers-color-scheme: dark)"), {
  color: { page: "#0b0b0f", surface: "#171923", text: "#f3f4f6", muted: "#9ca3af" },
});

// Fails the build when the text is hard to read on the page, in the light or the dark theme.
check.contrast(t.color.text, t.color.page, { min: 7 });
