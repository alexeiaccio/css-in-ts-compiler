import "./node-CdhAGmF3.mjs";
import "./lib-2OEIfPAE.mjs";
import { CSSStyleValue } from "@cssints/css-grammar/values";
import { Effect } from "effect";
import { DtcgType } from "@cssints/css-grammar/token";
//#region src/theme.d.ts
export declare const createTokens: (...args: unknown[]) => unknown;
export declare const createGlobalTheme: (...args: unknown[]) => Readonly<{
  __done: true;
}>;
//#endregion
//#region src/tui.d.ts
type State = "" | ":hover" | ":focus" | ":active";
type Value = string | number | boolean;
/** One prop: its key, its value (a colour is CSS text, resolved per theme at the site), and the state it is under. */
type Entry = [key: string, value: Value, state: State, colour?: true];
interface TuiNode {
  __tui: Entry[];
}
/**
 * Merges styles in argument order: a later prop wins.
 *
 * @returns {TuiNode} the merged style
 */
export declare const cn: (...styles: unknown[]) => TuiNode;
export declare const hover: (...styles: unknown[]) => TuiNode;
export declare const focus: (...styles: unknown[]) => TuiNode;
export declare const active: (...styles: unknown[]) => TuiNode;
export declare const color: ((...parts: unknown[]) => TuiNode) | undefined, backgroundColor: ((...parts: unknown[]) => TuiNode) | undefined, bg: ((...parts: unknown[]) => TuiNode) | undefined, borderColor: ((...parts: unknown[]) => TuiNode) | undefined, caretColor: ((...parts: unknown[]) => TuiNode) | undefined, fontWeight: ((...parts: unknown[]) => TuiNode) | undefined, fontStyle: ((...parts: unknown[]) => TuiNode) | undefined, textDecoration: ((...parts: unknown[]) => TuiNode) | undefined, textDecorationLine: ((...parts: unknown[]) => TuiNode) | undefined, textAlign: ((...parts: unknown[]) => TuiNode) | undefined, borderStyle: ((...parts: unknown[]) => TuiNode) | undefined, border: ((...parts: unknown[]) => TuiNode) | undefined, padding: ((...parts: unknown[]) => TuiNode) | undefined, p: ((...parts: unknown[]) => TuiNode) | undefined, paddingInline: ((...parts: unknown[]) => TuiNode) | undefined, paddingBlock: ((...parts: unknown[]) => TuiNode) | undefined, paddingTop: ((...parts: unknown[]) => TuiNode) | undefined, paddingRight: ((...parts: unknown[]) => TuiNode) | undefined, paddingBottom: ((...parts: unknown[]) => TuiNode) | undefined, paddingLeft: ((...parts: unknown[]) => TuiNode) | undefined, pt: ((...parts: unknown[]) => TuiNode) | undefined, pr: ((...parts: unknown[]) => TuiNode) | undefined, pb: ((...parts: unknown[]) => TuiNode) | undefined, pl: ((...parts: unknown[]) => TuiNode) | undefined, margin: ((...parts: unknown[]) => TuiNode) | undefined, m: ((...parts: unknown[]) => TuiNode) | undefined, marginInline: ((...parts: unknown[]) => TuiNode) | undefined, marginBlock: ((...parts: unknown[]) => TuiNode) | undefined, marginTop: ((...parts: unknown[]) => TuiNode) | undefined, marginRight: ((...parts: unknown[]) => TuiNode) | undefined, marginBottom: ((...parts: unknown[]) => TuiNode) | undefined, marginLeft: ((...parts: unknown[]) => TuiNode) | undefined, mt: ((...parts: unknown[]) => TuiNode) | undefined, mr: ((...parts: unknown[]) => TuiNode) | undefined, mb: ((...parts: unknown[]) => TuiNode) | undefined, ml: ((...parts: unknown[]) => TuiNode) | undefined, top: ((...parts: unknown[]) => TuiNode) | undefined, right: ((...parts: unknown[]) => TuiNode) | undefined, bottom: ((...parts: unknown[]) => TuiNode) | undefined, left: ((...parts: unknown[]) => TuiNode) | undefined, gap: ((...parts: unknown[]) => TuiNode) | undefined, rowGap: ((...parts: unknown[]) => TuiNode) | undefined, columnGap: ((...parts: unknown[]) => TuiNode) | undefined, width: ((...parts: unknown[]) => TuiNode) | undefined, height: ((...parts: unknown[]) => TuiNode) | undefined, minWidth: ((...parts: unknown[]) => TuiNode) | undefined, maxWidth: ((...parts: unknown[]) => TuiNode) | undefined, minHeight: ((...parts: unknown[]) => TuiNode) | undefined, maxHeight: ((...parts: unknown[]) => TuiNode) | undefined, flexBasis: ((...parts: unknown[]) => TuiNode) | undefined, flexDirection: ((...parts: unknown[]) => TuiNode) | undefined, flexWrap: ((...parts: unknown[]) => TuiNode) | undefined, justifyContent: ((...parts: unknown[]) => TuiNode) | undefined, alignItems: ((...parts: unknown[]) => TuiNode) | undefined, alignSelf: ((...parts: unknown[]) => TuiNode) | undefined, flexGrow: ((...parts: unknown[]) => TuiNode) | undefined, flexShrink: ((...parts: unknown[]) => TuiNode) | undefined, position: ((...parts: unknown[]) => TuiNode) | undefined, overflow: ((...parts: unknown[]) => TuiNode) | undefined, display: ((...parts: unknown[]) => TuiNode) | undefined, opacity: ((...parts: unknown[]) => TuiNode) | undefined, zIndex: ((...parts: unknown[]) => TuiNode) | undefined, cursor: ((...parts: unknown[]) => TuiNode) | undefined, caretShape: ((...parts: unknown[]) => TuiNode) | undefined, caretAnimation: ((...parts: unknown[]) => TuiNode) | undefined;
//#endregion