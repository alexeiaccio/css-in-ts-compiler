import { check, createGlobalTheme, createTokens, media } from "cssints" with { type: "cssints" };

// Tokens are typed values that print as var(--name); a theme sets them again under a condition.
export const t = createTokens({
  color: {
    $type: "color",
    bg: { $value: "#ffffff" },
    card: { $value: "#f4f6fb" },
    text: { $value: "#16181d" },
    muted: { $value: "#5b6272" },
    accent: { $value: "#2563eb" },
    onAccent: { $value: "#ffffff" },
  },
  space: { $type: "dimension", sm: { $value: "8px" }, md: { $value: "16px" } },
  radius: { $type: "dimension", md: { $value: "12px" } },
});

createGlobalTheme(t, media("(prefers-color-scheme: dark)"), {
  color: { bg: "#0f1115", card: "#1a1d24", text: "#eceef3", muted: "#a1a8b8", accent: "#7aa2ff" },
});

// the build fails when a theme makes text unreadable
check.contrast(t.color.text, t.color.card, { min: 7 });
check.contrast(t.color.muted, t.color.card, { min: 4.5 });
