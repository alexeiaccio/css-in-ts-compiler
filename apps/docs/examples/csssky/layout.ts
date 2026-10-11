import { container, media } from "cssints" with { type: "cssints" };

// Mu's breakpoints (apps/csssky/src/layout.ts).
export const [gtPhone, gtMobile, gtRail, gtTablet] = media(
  "(width >= 500px)",
  "(width >= 800px)",
  "(width >= 1100px)",
  "(width >= 1300px)",
);

// The centre column is a container named "column": its parts react to its width, not the window's.
export const narrow = container("column (width < 500px)");

// The cell around each card is the container "post": the card's layout (avatar beside or above the text) follows the card's own
// width. 28rem is 448 px: a phone-width card is narrow, a column-width card is wide.
export const wide = container("post (width >= 28rem)");
