import { t as make } from "./make-ZkV_V-vR.mjs";
//#region src/index.ts
/**
* `reset({ media?, prose? })`: the reset, in a layer below every other style of the sheet. The base sets `border-box`,
* removes the margins, gives `html` a line height of 1.5 and stops mobile text inflation, makes form controls inherit the
* font and colour, takes the border off buttons, wraps long words in text and balances headings, and removes the markers of a list with
* `role="list"`. `media: true` makes images, videos, canvases and SVGs blocks that do not overflow their container;
* `prose: true` puts 1em between flow elements (headings, paragraphs, lists, ...) that have no class, as in rendered
* Markdown. Call it at a module's top level; it prints no class. `@cssints/reset/<group>` is the same, with the
* declarations of a Baseline group only.
*/
const reset = make();
//#endregion
export { reset };
