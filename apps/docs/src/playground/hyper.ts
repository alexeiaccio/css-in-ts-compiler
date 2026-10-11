// What the two renderers of an example share: the live `h` of the playground's preview (preview.ts, which runs in its iframe) and
// the static one of the docs pages (plugin/h.ts, at build time). Each function is self-contained, because preview.ts writes its
// source into the document of the iframe.

// The attributes of an element: a class (a list is joined), a style (an object becomes text), a flag; handlers and nulls go.
export const attrs = (props: Record<string, unknown>): [string, string][] =>
  Object.entries(props).flatMap(([k, v]): [string, string][] => {
    if (v == null || v === false || typeof v === "function") return [];
    if (k === "className" || k === "class")
      return [["class", Array.isArray(v) ? v.filter(Boolean).join(" ") : String(v as string)]];
    if (k === "style")
      return [
        [
          "style",
          typeof v === "string"
            ? v
            : Object.entries(v as object)
                .map(([p, x]) => `${p.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}:${x}`)
                .join(";"),
        ],
      ];
    return [[k, v === true ? "" : String(v as string)]];
  });

// The component a module shows: its default export, else `App`, else its first function.
export const main = (exports: Record<string, unknown>): unknown =>
  exports["default"] ??
  exports["App"] ??
  Object.values(exports).find((v) => typeof v === "function");
