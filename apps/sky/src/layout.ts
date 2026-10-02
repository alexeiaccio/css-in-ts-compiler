import { container, media } from "cssints" with { type: "cssints" };

// Mu's breakpoints (tokens.json has them as data: a custom property cannot sit inside @media).
export const [gtPhone, gtMobile, gtRail, gtTablet] = media(
  "(width >= 500px)",
  "(width >= 800px)",
  "(width >= 1100px)",
  "(width >= 1300px)",
);

// The centre column is a container named "column": its parts react to its width, not the window's.
export const narrow = container("column (width < 500px)");
