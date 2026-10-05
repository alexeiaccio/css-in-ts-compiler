import { createGlobalTheme, createTokens } from "cssints";

const tokens = createTokens({
  color: {
    bg: { $value: "#ffffff", $type: "color" },
    ink: { $value: "#000000", $type: "color" },
    accent: { $value: "#0af", $type: "color" },
  },
  typography: { size: { $value: "1rem", $type: "dimension" }, lead: { $value: "1.5rem", $type: "dimension" } },
});
createGlobalTheme(tokens, '[data-mode="dark"]', { color: { bg: "#0b0b0f", ink: "#eee" } });
createGlobalTheme(tokens, '[data-mode="dark"]', { color: { bg: "#101018" } });
createGlobalTheme(tokens, '[data-mode="a"]', { color: { bg: "#0a0a12", accent: "oklch(0.7 0.1 250)" } });
createGlobalTheme(tokens, '[data-mode="hero"]', { color: { bg: "#123456" } });
createGlobalTheme(tokens, '[data-mode="dark"]', { typography: { size: "1.5rem", lead: "2rem" } });
createGlobalTheme(tokens, '[data-mode="light"]', { color: { bg: "#fff", ink: "#111", accent: "#06c" }, typography: { size: "1rem" } });
createGlobalTheme(tokens, '[data-mode="dim"]', { color: { bg: "#223" } });
createGlobalTheme(tokens, '[data-mode="dim"]', { color: { ink: "#ddd" } });
createGlobalTheme(tokens, '[data-mode="paper"]', { color: { bg: "#f6f1e7", ink: "#222" } });
createGlobalTheme(tokens, '[data-mode="paper"]', { typography: { size: "1.125rem" } });
