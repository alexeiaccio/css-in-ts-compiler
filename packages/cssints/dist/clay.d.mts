//#region src/clay.d.ts
export declare const createTokens: (...args: unknown[]) => unknown;
export declare const createGlobalTheme: (...args: unknown[]) => Readonly<{
  __done: true;
}>;
type Value = string | number;
type State = "" | ":hover" | ":focus" | ":active";
type Entry = [key: string, value: Value, state: State];
interface ClayNode {
  __clay: Entry[];
}
/**
 * Merges styles in argument order: a later prop wins.
 *
 * @returns {ClayNode} the merged style
 */
export declare const cn: (...styles: unknown[]) => ClayNode;
export declare const hover: (...styles: unknown[]) => ClayNode;
export declare const focus: (...styles: unknown[]) => ClayNode;
export declare const active: (...styles: unknown[]) => ClayNode;
/**
 * The fonts of the app, in the order of its font array: `fonts("Roboto", "Mono").Mono` is a style that sets Clay's
 * `fontId` to 1, and header() prints the order as an enum, `<name>_Mono`.
 *
 * @returns {Record<string, unknown>} a style per font, by name, and the list
 */
export declare const fonts: (...names: unknown[]) => Record<string, unknown>;
export declare const backgroundColor: ((...parts: unknown[]) => ClayNode) | undefined, bg: ((...parts: unknown[]) => ClayNode) | undefined, color: ((...parts: unknown[]) => ClayNode) | undefined, borderColor: ((...parts: unknown[]) => ClayNode) | undefined, width: ((...parts: unknown[]) => ClayNode) | undefined, height: ((...parts: unknown[]) => ClayNode) | undefined, padding: ((...parts: unknown[]) => ClayNode) | undefined, p: ((...parts: unknown[]) => ClayNode) | undefined, paddingInline: ((...parts: unknown[]) => ClayNode) | undefined, paddingBlock: ((...parts: unknown[]) => ClayNode) | undefined, paddingTop: ((...parts: unknown[]) => ClayNode) | undefined, paddingRight: ((...parts: unknown[]) => ClayNode) | undefined, paddingBottom: ((...parts: unknown[]) => ClayNode) | undefined, paddingLeft: ((...parts: unknown[]) => ClayNode) | undefined, pt: ((...parts: unknown[]) => ClayNode) | undefined, pr: ((...parts: unknown[]) => ClayNode) | undefined, pb: ((...parts: unknown[]) => ClayNode) | undefined, pl: ((...parts: unknown[]) => ClayNode) | undefined, gap: ((...parts: unknown[]) => ClayNode) | undefined, flexDirection: ((...parts: unknown[]) => ClayNode) | undefined, justifyContent: ((...parts: unknown[]) => ClayNode) | undefined, alignItems: ((...parts: unknown[]) => ClayNode) | undefined, borderRadius: ((...parts: unknown[]) => ClayNode) | undefined, borderWidth: ((...parts: unknown[]) => ClayNode) | undefined, border: ((...parts: unknown[]) => ClayNode) | undefined, overflow: ((...parts: unknown[]) => ClayNode) | undefined, fontSize: ((...parts: unknown[]) => ClayNode) | undefined, letterSpacing: ((...parts: unknown[]) => ClayNode) | undefined, lineHeight: ((...parts: unknown[]) => ClayNode) | undefined, textAlign: ((...parts: unknown[]) => ClayNode) | undefined, whiteSpace: ((...parts: unknown[]) => ClayNode) | undefined, float: ((...parts: unknown[]) => ClayNode) | undefined, image: ((...parts: unknown[]) => ClayNode) | undefined;
/**
 * The styles of a module as C: a `Clay_ElementDeclaration` per export, and a `Clay_TextElementConfig` named
 * `<name>_text` for one that sets text props, for `CLAY(id, name)` and `CLAY_TEXT(s, name_text)`. A state is a whole
 * declaration of its own, `<name>_hover` (`_focus`, `_active`, and `<name>_hover_text`); a theme is a whole set of
 * them again, its name last (`<name>_<theme>`, `<name>_hover_<theme>`, `<name>_text_<theme>`), for every style once
 * the module has a theme, so a page picks a theme by appending its name. The fonts of `fonts()` are an enum, `<name>_<font>`, in their order.
 *
 * @param {Record<string, unknown>} styles the exports of a built module of cssints/clay styles
 * @returns {string} a C header that includes clay.h
 */
export declare const header: (styles: Record<string, unknown>) => string;
//#endregion