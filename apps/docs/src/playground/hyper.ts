// What the renderers of an example share: the live `h` of the playground's preview (preview.ts, which runs in its iframe) and
// the static one of the docs pages (plugin/h.ts, at build time). Each function is self-contained, because preview.ts writes its
// source into the document of the iframe, and so does `canvas`, which plugin/docs.ts writes into the page's chunk.

// The page of a frame, in the lowest layer, so a project's own rules win over it: the site's colours and font as custom
// properties of <html> (`canvas` reads them off the site; the system's own colours until they arrive), and a margin.
export const canvasCss =
  "@layer preview{html{background:var(--canvas-bg,Canvas);color:var(--canvas-text,CanvasText);font-family:var(--canvas-font,system-ui,sans-serif);color-scheme:var(--canvas-scheme,light dark)}body{margin:16px;font-size:16px}}";

// What a frame takes from the site it sits in (read where the settings are): the display mode as the class of <html> that a
// project's themes read (dim is dark with a class of its own, settings.ts), and the canvas, from the site's current tokens.
export const canvas = (): Record<string, string> => {
  const c = document.documentElement.classList;
  const cs = getComputedStyle(document.documentElement);
  const token = (name: string, fallback: string) => cs.getPropertyValue(name).trim() || fallback;
  return {
    mode: c.contains("dim")
      ? "dim"
      : c.contains("dark")
        ? "dark"
        : c.contains("light")
          ? "light"
          : "",
    bg: token("--color-bg", cs.backgroundColor),
    text: token("--color-text", cs.color),
    font: getComputedStyle(document.body).fontFamily,
    scheme: cs.colorScheme,
  };
};

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
