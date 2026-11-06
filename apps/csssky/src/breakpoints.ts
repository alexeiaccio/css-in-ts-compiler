// The breakpoints as strings, for the media queries of layout.ts at build time and for the one thing a media query cannot
// do: the Shell decides in JavaScript what to mount (the feed beside a thread must not exist below the rail's width, where
// nothing of it is on screen). The widths are tokens.json's `breakpoint` group; a custom property cannot sit inside @media.
export const railQuery = "(width >= 1100px)";
