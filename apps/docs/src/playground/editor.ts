// The editor: Monaco with the TypeScript language service in a worker, the types of cssints and of the plugin packages as extra
// libs of a virtual project (plugin/playground.ts), one model per file. Only what a playground uses is imported (the editor core,
// hover, suggest, parameter hints, brackets, copy and paste, TypeScript), not editor.main with its 80 languages.
// The type errors are asked for here, not by Monaco's own validation: of the open file only, after a pause, with the time it took.
import * as monaco from "monaco-editor/editor/editor.api.js";
import "monaco-editor/editor/browser/coreCommands.js";
import "monaco-editor/editor/contrib/bracketMatching/browser/bracketMatching.js";
import "monaco-editor/editor/contrib/clipboard/browser/clipboard.js";
import "monaco-editor/editor/contrib/comment/browser/comment.js";
import "monaco-editor/editor/contrib/hover/browser/hoverContribution.js";
import "monaco-editor/editor/contrib/parameterHints/browser/parameterHints.js";
import "monaco-editor/editor/contrib/snippet/browser/snippetController2.js";
import "monaco-editor/editor/contrib/suggest/browser/suggestController.js";
import "monaco-editor/languages/definitions/typescript/register.js";
import {
  JsxEmit,
  ModuleKind,
  type ModuleResolutionKind,
  ScriptTarget,
  getTypeScriptWorker,
  typescriptDefaults,
} from "monaco-editor/languages/features/typescript/register.js";
import { files as lib, paths } from "virtual:playground/types";

import type { Diagnostic, Files } from "./client.ts";
import { format as oxfmt, formats } from "./format.ts";

// the workers are modules of their own (ts.worker.ts, editor.worker.ts: one import each), built as the compile worker is
self.MonacoEnvironment = {
  getWorker: (_id, label) =>
    label === "typescript"
      ? new Worker(new URL("./ts.worker.ts", import.meta.url), { type: "module" })
      : new Worker(new URL("./editor.worker.ts", import.meta.url), { type: "module" }),
};

const PAUSE = 400;

typescriptDefaults.setCompilerOptions({
  target: ScriptTarget.ESNext,
  module: ModuleKind.ESNext,
  moduleResolution: 100 as ModuleResolutionKind, // bundler: Monaco's enum names only node and classic
  jsx: JsxEmit.Preserve,
  strict: true,
  noEmit: true,
  skipLibCheck: true,
  allowImportingTsExtensions: true,
  allowNonTsExtensions: true,
  noUncheckedIndexedAccess: true,
  paths,
});
typescriptDefaults.setDiagnosticsOptions({ noSemanticValidation: true, noSyntaxValidation: true });
// the files that are not open are still part of the program
typescriptDefaults.setEagerModelSync(true);
typescriptDefaults.setExtraLibs([
  ...Object.entries(lib).map(([filePath, content]) => ({ content, filePath })),
  {
    // JSX is the playground's own `h`: any element is fine, the types of cssints are what is checked
    filePath: "file:///jsx.d.ts",
    content:
      "declare namespace JSX { type Element = any; interface IntrinsicElements { [tag: string]: any } }",
  },
]);

export interface Editor {
  /** makes the models the files (created, changed, removed) and shows one */
  set: (files: Files, active: string) => void;
  /** the errors of the last compile, at their positions; none clears them */
  diagnose: (errors: Diagnostic[]) => void;
  /** formats the open file (also Shift+Alt+F): one edit, so one undo takes it back */
  format: () => Promise<void>;
  destroy: () => void;
}

interface Chain {
  messageText: string;
  next?: Chain[];
}
const flat = (m: string | Chain): string =>
  typeof m === "string" ? m : [m.messageText, ...(m.next ?? []).map(flat)].join("\n");

const SEVERITY = [
  monaco.MarkerSeverity.Warning,
  monaco.MarkerSeverity.Error,
  monaco.MarkerSeverity.Hint,
  monaco.MarkerSeverity.Info,
];

const dark = () => getComputedStyle(document.documentElement).colorScheme.startsWith("dark");

/**
 * Mounts the editor.
 * @param {HTMLElement} parent where it goes
 * @param {Files} files the files
 * @param {string} active the name of the file shown
 * @param {object} on what happens: `change` after an edit of a file, `checked` after the type check of the open file, `formatted`
 * with what the formatter said when it did not change the file
 * @returns {Editor} the editor
 */
export const mount = (
  parent: HTMLElement,
  files: Files,
  active: string,
  on: {
    change: (name: string, text: string) => void;
    checked: (errors: number, ms: number) => void;
    formatted: (note: string) => void;
  },
): Editor => {
  const editor = monaco.editor.create(parent, {
    model: null,
    theme: dark() ? "vs-dark" : "vs",
    automaticLayout: true,
    minimap: { enabled: false },
    fontSize: 13,
    tabSize: 2,
    scrollBeyondLastLine: false,
    fixedOverflowWidgets: true,
    ariaLabel: "Code",
  });
  const models = new Map<string, monaco.editor.ITextModel>();
  const uri = (name: string) => monaco.Uri.parse(`file:///${name}`);
  let quiet = false;
  let run = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const check = async (): Promise<void> => {
    const model = editor.getModel();
    if (!model) return;
    const mine = ++run;
    const t0 = performance.now();
    const name = model.uri.toString();
    let found;
    try {
      const client = await (await getTypeScriptWorker())(model.uri);
      found = [
        ...(await client.getSyntacticDiagnostics(name)),
        ...(await client.getSemanticDiagnostics(name)),
      ];
    } catch {
      // the language service is still being set up (the first model asks for it): again after a pause
      return later();
    }
    if (mine !== run || model.isDisposed()) return;
    monaco.editor.setModelMarkers(
      model,
      "typescript",
      found.flatMap((d) => {
        if (d.start === undefined) return [];
        const from = model.getPositionAt(d.start);
        const to = model.getPositionAt(d.start + (d.length ?? 0));
        return {
          severity: SEVERITY[d.category] ?? monaco.MarkerSeverity.Info,
          message: flat(d.messageText),
          code: String(d.code),
          startLineNumber: from.lineNumber,
          startColumn: from.column,
          endLineNumber: to.lineNumber,
          endColumn: to.column,
        };
      }),
    );
    on.checked(found.filter((d) => d.category === 1).length, Math.round(performance.now() - t0));
  };
  const later = () => {
    clearTimeout(timer);
    timer = setTimeout(() => void check(), PAUSE);
  };

  const watch = new MutationObserver(() => monaco.editor.setTheme(dark() ? "vs-dark" : "vs"));
  watch.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

  const set = (next: Files, name: string) => {
    quiet = true;
    for (const [n, model] of models)
      if (!Object.hasOwn(next, n)) {
        model.dispose();
        models.delete(n);
      }
    for (const [n, text] of Object.entries(next)) {
      let model = models.get(n);
      if (!model) {
        model = monaco.editor.createModel(text, undefined, uri(n));
        models.set(n, model);
        model.onDidChangeContent(() => {
          if (quiet) return;
          on.change(n, model!.getValue());
          later();
        });
      } else if (model.getValue() !== text) model.setValue(text);
    }
    quiet = false;
    const shown = models.get(name);
    if (shown && editor.getModel() !== shown) editor.setModel(shown);
    later();
  };
  set(files, active);

  const format = async () => {
    const model = editor.getModel();
    if (!model) return;
    const before = model.getValue();
    if (!formats(model.uri.path))
      return on.formatted("Format: JavaScript and TypeScript files only");
    let after;
    try {
      after = await oxfmt(before, model.uri.path);
    } catch (e) {
      return on.formatted(`Format: ${e instanceof Error ? e.message : String(e)}`);
    }
    // typed while the formatter ran: leave it
    if (model.isDisposed() || model.getValue() !== before || after === before) return;
    // only the middle changes, so the cursor and the scroll stay where they were
    let from = 0;
    while (from < before.length && before[from] === after[from]) from++;
    let end = 0;
    while (
      end < before.length - from &&
      end < after.length - from &&
      before[before.length - 1 - end] === after[after.length - 1 - end]
    )
      end++;
    editor.pushUndoStop();
    editor.executeEdits("format", [
      {
        range: monaco.Range.fromPositions(
          model.getPositionAt(from),
          model.getPositionAt(before.length - end),
        ),
        text: after.slice(from, after.length - end),
      },
    ]);
    editor.pushUndoStop();
  };
  editor.addAction({
    id: "cssints.format",
    label: "Format file",
    keybindings: [monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyF],
    run: format,
  });

  return {
    set,
    format,
    diagnose: (errors) => {
      for (const [name, model] of models)
        monaco.editor.setModelMarkers(
          model,
          "cssints",
          errors
            .filter((e) => e.file === name)
            .map((e) => {
              const line = Math.min(Math.max(e.line, 1), model.getLineCount());
              const word = model.getWordAtPosition({ lineNumber: line, column: e.column });
              return {
                severity: monaco.MarkerSeverity.Error,
                message: e.message,
                startLineNumber: line,
                startColumn: e.column,
                endLineNumber: line,
                endColumn: word?.endColumn ?? model.getLineMaxColumn(line),
              };
            }),
        );
    },
    destroy: () => {
      clearTimeout(timer);
      watch.disconnect();
      editor.dispose();
      models.forEach((m) => m.dispose());
    },
  };
};
