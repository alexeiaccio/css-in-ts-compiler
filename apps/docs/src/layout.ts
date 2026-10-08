import { media } from "cssints" with { type: "cssints" };

// Below 900 px the sidebar is a drawer behind the menu button; from 900 it sits beside the page; from 1200 the outline of the page
// takes a third column.
export const [gtSidebar, gtOutline] = media("(width >= 900px)", "(width >= 1200px)");

// Motion that has to stop for people who asked for less.
export const { reduced } = media({ reduced: "(prefers-reduced-motion: reduce)" });
