import { container } from "cssints" with { type: "cssints" };

// The cell around each card is the container "post": the card's layout (avatar beside or above the text, grid columns)
// follows the card's own width, not the window's. 28rem is 448 px: a phone-width card is narrow, a column-width card is wide.
export const wide = container("post (width >= 28rem)");
