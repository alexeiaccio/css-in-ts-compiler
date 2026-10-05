//#region src/parent-vars.d.ts
interface Family {
  /** The class every element of the family carries (`_f`). */
  marker: string;
  /** The custom property read from the nearest marked ancestor, and written on the element. */
  read: string;
  write: string;
  /** A property that changes when a CSS condition (`:hover`, a media query) changes `read`: its transition re-runs us. */
  watch?: string;
}
declare const _default: (add: Family[]) => void;
//#endregion
export { _default as default };