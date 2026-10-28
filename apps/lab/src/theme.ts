import { createGlobalTheme, createTokens } from "cssints" with { type: "cssints" };

// A handful of tokens: enough for the devtools panel to show which one a property reads, and for the switch in the rail to
// have something to flip. A lab story may use plain values where a token has no meaning.
export const t = createTokens({
  color: {
    $type: "color",
    bg: "#ffffff",
    surface: "#f4f5f7",
    border: "#dbdfe5",
    text: "#14161a",
    muted: "#5c6270",
    accent: "oklch(58% 0.19 264)",
    onAccent: "#ffffff",
    accentSoft: "#e6ebfd",
  },
  space: { $type: "dimension", sm: "8px", md: "16px", lg: "24px" },
  radius: { $type: "dimension", sm: "6px", md: "10px", full: "999px" },
  fontSize: { $type: "dimension", sm: "13px", md: "15px", lg: "20px" },
});

// One override theme: the class `dark` on <html>, which the rail's switch writes. No media query, so what is on screen is
// what the switch says.
createGlobalTheme(t, ".dark", {
  color: {
    bg: "#0f1115",
    surface: "#171a20",
    border: "#2a2f38",
    text: "#eef1f6",
    muted: "#9aa2ae",
    accent: "oklch(72% 0.15 264)",
    onAccent: "#0f1115",
    accentSoft: "#232a45",
  },
});
