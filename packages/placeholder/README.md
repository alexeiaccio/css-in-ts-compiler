# @cssints/placeholder

Image placeholders for [cssints](../../README.md): `placeholder(path)` reads an image while the build runs and gives an
`<image>` to paint until the real one loads, either a gradient of the image's colours laid out as the image is
(unpic-placeholder's radial gradients) or the image's [ThumbHash](https://evanw.github.io/thumbhash/) as a tiny PNG data
URL. It is one value member of `cssints/plugin` `scope()`, so it goes into `backgroundImage` (or `maskImage`). No runtime.

```ts
import { backgroundImage, cn, backgroundSize } from "cssints" with { type: "cssints" };
import { placeholder } from "@cssints/placeholder" with { type: "cssints" };

// placeholder(path, { mode? }): the path is relative to the working directory
export const hero = backgroundImage(placeholder("src/hero.jpg"));
export const card = cn(
  backgroundImage(placeholder("src/card.png", { mode: "thumbhash" })),
  backgroundSize("cover"),
);
```

For a PNG of four quadrants (red, blue / green, white):

```css
/* mode "gradient" (the default): a 4 × 3 grid, a radial gradient per cell, brightest on top, over the average colour */
._11mb38d {
  background-image:
    radial-gradient(at 67% 100%, #ffffff, transparent 50%),
    radial-gradient(at 100% 100%, #ffffff, transparent 50%),
    radial-gradient(at 67% 50%, #bcbcff, transparent 50%),
    /* … one per cell, 12 in all … */ radial-gradient(at 100% 0, #0000ff, transparent 50%),
    linear-gradient(#bc96bc, #bc96bc);
}
/* mode "thumbhash": the ThumbHash rendered, 16 px on the long side, about 0.5 kB */
._179cifn {
  background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAM…");
}
```

## Formats

JPEG (baseline and progressive, through [jpeg-js](https://github.com/jpeg-js/jpeg-js)) and PNG (every colour type and bit
depth, through [pngjs](https://github.com/pngjs/pngjs)), both plain JavaScript: nothing to compile, no native binary
(sharp is not used). The format is read from the file's first bytes, not its name. WebP, AVIF, GIF and SVG are build
errors that name the format (`cssints: placeholder: src/hero.webp: a WebP image: JPEG and PNG are read`): give a JPEG or
PNG copy of the image (it can be small; only its colours are read).

## Rules

- **Arguments.** `path` is a string, relative to the working directory (`process.cwd()`, the project root under Vite),
  as the `fs` provider of `@cssints/icons` reads it. `mode` is `"gradient"` (the default) or `"thumbhash"`. Both are
  checked in the types and at build time.
- **`gradient`** averages the image to a grid of 4 × 3 cells (3 × 4 for a portrait image), in linear light and weighted
  by alpha, so a transparent part adds no colour and a cell that straddles red and green is the light's mix, not a muddy
  sRGB average. Each cell is a `radial-gradient(at x y, colour, transparent 50%)` at its place in the image (corners at
  `0` and `100%`), sorted by luminance with the brightest on top (as unpic-placeholder does), over one
  `linear-gradient()` of the whole image's average colour that fills what the gradients leave. A cell that is not opaque
  is `#rrggbbaa`. The value is a list of 13 images, about 0.7 kB.
- **`thumbhash`** encodes the image (averaged to at most 100 px a side first) with ThumbHash, renders the hash, averages
  that to 16 px on the long side and writes it as a deflated PNG: about 0.5 kB, where ThumbHash's own data URL (32 px,
  uncompressed) is about 5 kB. The browser's smooth upscaling does the blur. It keeps the aspect ratio, so pair it with
  `backgroundSize("cover")` or `"100% 100%"`.
- **Deterministic.** The same file gives the same CSS on every build. Results are cached for the process by the SHA-256
  of the file's content and the mode, so an image used from many modules is decoded once.
- **Errors**, at the call: a file that cannot be read (`cssints: placeholder: cannot read src/nope.png (paths are
relative to /app)`), a format it does not read (above), a file that does not decode (`cssints: placeholder:
src/broken.png: …`, the decoder's message), a mode outside the grammar (`placeholder(2).mode: unexpected "blurhash"
…`), and a placeholder where an image does not go (`css.color(placeholder(…))`, an error in the types and at build
  time).

## Limits

- **Not watched in dev.** The engine re-runs a module when its imports change, not when a file it read changes: after
  editing an image, touch the module that calls `placeholder()` or restart the dev server (`@cssints/icons` has the same
  limit for its SVG files).
- The `gradient` value is a list of images, so it fits a property that takes a list (`background-image`, `mask-image`);
  a property that takes one `<image>` (`list-style-image`, `border-image-source`) rejects it at build time: use
  `thumbhash` there.
- No WebP or AVIF decoder (a WASM one would add a few hundred kB to the build); the grid size and the thumbhash size are
  fixed; no blurhash mode.
- The image is decoded whole: a very large JPEG (tens of megapixels) costs its pixels in memory once per build.

```bash
cd packages/placeholder && bun run test        # colour extraction on synthetic pixels, fixtures through the engine (output, errors)
cd packages/placeholder && bun run typecheck   # and the type test, test/types/placeholder.ts
```
