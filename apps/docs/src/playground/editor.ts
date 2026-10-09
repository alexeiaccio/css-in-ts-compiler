// The editor: CodeMirror 6 with the JavaScript/TSX mode, coloured by the site's own variables (so the colour mode of the page is
// the editor's), and the engine's errors as lint marks on the offending position.
import { indentWithTab } from "@codemirror/commands";
import { javascript } from "@codemirror/lang-javascript";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { lintGutter, setDiagnostics } from "@codemirror/lint";
import { EditorView, keymap } from "@codemirror/view";
import { tags } from "@lezer/highlight";
import { basicSetup } from "codemirror";

import type { Diagnostic } from "./client.ts";

const theme = EditorView.theme({
  "&": {
    height: "100%",
    color: "var(--color-text)",
    backgroundColor: "var(--color-bg-subtle)",
    fontSize: "13px",
  },
  "&.cm-focused": { outline: "2px solid var(--color-accent)", outlineOffset: "-2px" },
  ".cm-scroller": {
    fontFamily: '"SF Mono", SFMono-Regular, Menlo, Consolas, monospace',
    lineHeight: "1.55",
  },
  ".cm-gutters": {
    backgroundColor: "var(--color-bg-subtle)",
    color: "var(--color-text-low)",
    border: "none",
  },
  ".cm-activeLine, .cm-activeLineGutter": { backgroundColor: "var(--color-bg-muted)" },
  ".cm-selectionBackground, &.cm-focused .cm-selectionBackground": {
    backgroundColor: "var(--color-accent-soft)",
  },
  ".cm-cursor": { borderLeftColor: "var(--color-text)" },
  ".cm-tooltip": {
    backgroundColor: "var(--color-bg)",
    color: "var(--color-text)",
    border: "1px solid var(--color-border)",
  },
});

// light-dark() follows the page's color-scheme, which the site sets with the mode class.
const colours = syntaxHighlighting(
  HighlightStyle.define([
    { tag: [tags.keyword, tags.modifier], color: "light-dark(#7a3ec8, #c4a2ff)" },
    { tag: [tags.string, tags.special(tags.string)], color: "light-dark(#0a6b3c, #8fd9a8)" },
    { tag: [tags.number, tags.bool, tags.null], color: "light-dark(#a04a00, #f0b27a)" },
    { tag: [tags.comment], color: "var(--color-text-low)", fontStyle: "italic" },
    {
      tag: [tags.function(tags.variableName), tags.function(tags.propertyName)],
      color: "light-dark(#1c58c5, #8db4ff)",
    },
    { tag: [tags.propertyName], color: "light-dark(#1c58c5, #8db4ff)" },
    { tag: [tags.typeName, tags.className, tags.tagName], color: "light-dark(#a1264f, #ff9db8)" },
    {
      tag: [tags.angleBracket, tags.punctuation, tags.operator],
      color: "var(--color-text-medium)",
    },
  ]),
);

export interface Editor {
  /** the errors of the last compile, at their positions; none clears them */
  diagnose: (errors: Diagnostic[]) => void;
  set: (text: string) => void;
  destroy: () => void;
}

export const mount = (
  parent: HTMLElement,
  doc: string,
  onChange: (text: string) => void,
): Editor => {
  const view = new EditorView({
    parent,
    doc,
    extensions: [
      basicSetup,
      keymap.of([indentWithTab]),
      javascript({ jsx: true, typescript: true }),
      lintGutter(),
      theme,
      colours,
      EditorView.updateListener.of((u) => u.docChanged && onChange(u.state.doc.toString())),
      EditorView.contentAttributes.of({ "aria-label": "Code" }),
    ],
  });
  return {
    diagnose: (errors) => {
      const { doc } = view.state;
      view.dispatch(
        setDiagnostics(
          view.state,
          errors.map((e) => {
            const line = doc.line(Math.min(Math.max(e.line, 1), doc.lines));
            const from = Math.min(line.from + e.column - 1, line.to);
            // the word at the position, else the rest of the line
            const word =
              /^[\w$]+/.exec(doc.sliceString(from, line.to))?.[0].length ?? line.to - from;
            return {
              from,
              to: Math.max(from + 1, from + word),
              severity: "error" as const,
              message: e.message,
            };
          }),
        ),
      );
    },
    set: (text) => view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: text } }),
    destroy: () => view.destroy(),
  };
};
